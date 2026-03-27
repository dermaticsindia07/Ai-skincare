// Simple Express + Mongoose API for storing leads
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import crypto from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

dotenv.config();

// S3 client + bucket
const s3 = new S3Client({ region: process.env.AWS_REGION });
const S3_BUCKET = process.env.AWS_S3_BUCKET;
if (!S3_BUCKET) {
  console.error('Missing AWS_S3_BUCKET');
  process.exit(1);
}

// Multer (in-memory) + validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB/file
  fileFilter: (_req, file, cb) => {
    const okTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    const ok = okTypes.includes(file.mimetype);
    cb(ok ? null : new Error('Only JPEG/PNG/WEBP/HEIC images are allowed'), ok);
  },
});

const app = express();
app.use(express.json());

// CORS: allow configured origins (comma-separated). If none, reflect origin (true) for dev.
const corsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean) : [];
app.use(cors({
  origin: corsOrigins.length ? corsOrigins : true,
}));

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('Missing MONGODB_URI');
  process.exit(1);
}

const mongoOptions = process.env.MONGODB_DB ? { dbName: process.env.MONGODB_DB } : undefined;

mongoose
  .connect(mongoUri, mongoOptions)
  .then(() => console.log(`MongoDB connected${process.env.MONGODB_DB ? ` (db: ${process.env.MONGODB_DB})` : ''}`))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Lead schema/model
const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 1 },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true }
  },
  { timestamps: true }
);

const Lead = mongoose.model('Lead', leadSchema);

// Image metadata model
const imageSchema = new mongoose.Schema(
  {
    originalName: String,
    s3Key: String,
    mimeType: String,
    size: Number,
    userId: String,
    context: String,
  },
  { timestamps: true }
);
const ImageAsset = mongoose.model('ImageAsset', imageSchema);

function generateS3Key(originalName) {
  const dot = originalName.lastIndexOf('.');
  const ext = dot >= 0 ? originalName.slice(dot) : '';
  const unique = crypto.randomBytes(16).toString('hex');
  return `uploads/analysis/${Date.now()}-${unique}${ext}`;
}

// Upload images to S3
app.post('/images', upload.array('images', 5), async (req, res) => {
  try {
    const userId = req.header('x-user-id') || null;
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ message: 'No files uploaded' });

    console.log(`Using S3 bucket: ${S3_BUCKET}`);

    const saved = [];
    for (const file of files) {
      const key = generateS3Key(file.originalname);
      console.log(`Uploading ${file.originalname} to ${S3_BUCKET}/${key}...`);
      await s3.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );
      console.log(`Successfully uploaded ${file.originalname}`);
      const doc = await ImageAsset.create({
        originalName: file.originalname,
        s3Key: key,
        mimeType: file.mimetype,
        size: file.size,
        userId,
        context: 'analysis-input',
      });
      saved.push(doc);
    }

    res.status(201).json(saved);
  } catch (err) {
    console.error('Upload error:', err);
    const msg = err?.message || String(err);
    if (err?.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large (15MB max)' });
    }
    if (msg.includes('Only') && msg.includes('images')) {
      return res.status(400).json({ message: 'Only JPEG/PNG/WEBP/HEIC images are allowed' });
    }
    return res.status(500).json({ message: 'Upload failed', error: msg });
  }
});

// Get a short-lived signed URL to view an image
app.get('/images/:id/signed-url', async (req, res) => {
  try {
    const image = await ImageAsset.findById(req.params.id);
    if (!image) return res.status(404).json({ message: 'Not found' });

    // Ownership enforcement if userId is set on the image
    const requester = req.header('x-user-id') || null;
    if (image.userId && requester && image.userId !== requester) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const cmd = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: image.s3Key,
      ResponseContentType: image.mimeType,
    });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 }); // 60 seconds

    res.json({ url });
  } catch (err) {
    console.error('Signed URL error:', err);
    res.status(500).json({ message: 'Failed to generate URL' });
  }
});

// List images for the current user
app.get('/images', async (req, res) => {
  try {
    const userId = req.header('x-user-id');
    if (!userId) return res.status(400).json({ message: 'x-user-id header is required' });

    const images = await ImageAsset.find({ userId }).sort({ createdAt: -1 }).lean();
    res.json(images);
  } catch (err) {
    console.error('List images error:', err);
    res.status(500).json({ message: 'Failed to list images' });
  }
});

// Delete an image (S3 + metadata) if owned by the requester
app.delete('/images/:id', async (req, res) => {
  try {
    const userId = req.header('x-user-id');
    if (!userId) return res.status(400).json({ message: 'x-user-id header is required' });

    const image = await ImageAsset.findById(req.params.id);
    if (!image) return res.status(404).json({ message: 'Not found' });
    if (image.userId && image.userId !== userId) return res.status(403).json({ message: 'Forbidden' });

    // Delete from S3 first
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: image.s3Key }));
    } catch (s3err) {
      console.warn('S3 delete warning (continuing):', s3err?.message || s3err);
    }

    // Remove metadata
    await ImageAsset.deleteOne({ _id: image._id });
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete image error:', err);
    res.status(500).json({ message: 'Failed to delete image' });
  }
});

app.get('/', (_req, res) => res.json({ ok: true }));

app.post('/leads', async (req, res) => {
  try {
    const { name, age, gender, phone, email } = req.body || {};
    if (!name || !age || !gender || !phone || !email) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const lead = await Lead.create({ name, age, gender, phone, email });
    res.status(201).json({ id: lead._id, createdAt: lead.createdAt });
  } catch (err) {
    console.error('Create lead error:', err);
    // Surface validation errors clearly
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation failed', details: err.errors });
    }
    res.status(500).json({ message: 'Failed to create lead' });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`API listening on http://0.0.0.0:${port}`);
});