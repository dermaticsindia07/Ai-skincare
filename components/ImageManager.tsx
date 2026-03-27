import React, { useEffect, useState } from "react";
import { deleteImage, getSignedUrl, listImages, uploadImages, type ImageAsset } from "../services/imagesService";

// Simple image manager UI: upload, list with thumbnails (signed URLs), and delete
export default function ImageManager() {
  const [userId, setUserId] = useState<string>("user123");
  const [files, setFiles] = useState<File[]>([]);
  const [items, setItems] = useState<Array<ImageAsset & { previewUrl?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!userId) return;
    setError(null);
    setLoading(true);
    try {
      const images = await listImages(userId);
      const withPreviews = await Promise.all(
        images.map(async (img) => ({ ...img, previewUrl: await getSignedUrl(img._id, userId) }))
      );
      setItems(withPreviews);
    } catch (e: any) {
      setError(e.message || "Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files ? Array.from(e.target.files) : [];
    setFiles(f);
  };

  const onUpload = async () => {
    if (!files.length || !userId) return;
    setLoading(true);
    setError(null);
    try {
      await uploadImages(files, userId);
      setFiles([]);
      await refresh();
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      await deleteImage(id, userId);
      await refresh();
    } catch (e: any) {
      setError(e.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={{ padding: 6, border: "1px solid #ddd", borderRadius: 6 }}
        />
        <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple onChange={onSelect} />
        <button onClick={onUpload} disabled={loading || !files.length || !userId}>
          {loading ? "Please wait..." : `Upload ${files.length ? `(${files.length})` : ""}`}
        </button>
        <button onClick={refresh} disabled={loading || !userId}>Reload</button>
      </div>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 180px)", gap: 12 }}>
        {items.map((it) => (
          <div key={it._id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 8 }}>
            {it.previewUrl ? (
              <img src={it.previewUrl} alt={it.originalName} style={{ width: "100%", height: 140, objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: 140, background: "#f5f5f5" }} />
            )}
            <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
              <small title={it.originalName} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {it.originalName}
              </small>
              <button onClick={() => onDelete(it._id)} disabled={loading} style={{ color: "#b00020" }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}