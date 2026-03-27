// Client-side image service for S3-backed API
// Uses VITE_API_URL and optional x-user-id for ownership

const API_URL = import.meta.env.VITE_API_URL as string;

if (!API_URL) {
  // eslint-disable-next-line no-console
  console.warn("VITE_API_URL is not set. Set it in your project .env (e.g., VITE_API_URL=http://localhost:8080)");
}

export type ImageAsset = {
  _id: string;
  originalName: string;
  s3Key: string;
  mimeType: string;
  size: number;
  userId?: string | null;
  context?: string;
  createdAt: string;
  updatedAt: string;
};

export async function uploadImages(files: File[], userId?: string): Promise<ImageAsset[]> {
  const fd = new FormData();
  files.forEach((f) => fd.append("images", f));
  const res = await fetch(`${API_URL}/images`, {
    method: "POST",
    body: fd,
    headers: userId ? { "x-user-id": userId } : undefined,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export async function getSignedUrl(id: string, userId?: string): Promise<string> {
  const res = await fetch(`${API_URL}/images/${id}/signed-url`, {
    headers: userId ? { "x-user-id": userId } : undefined,
  });
  if (!res.ok) throw new Error(`Signed URL failed: ${res.status}`);
  const data = await res.json();
  return data.url as string;
}

export async function listImages(userId: string): Promise<ImageAsset[]> {
  const res = await fetch(`${API_URL}/images`, {
    headers: { "x-user-id": userId },
  });
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return res.json();
}

export async function deleteImage(id: string, userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/images/${id}`, {
    method: "DELETE",
    headers: { "x-user-id": userId },
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
}