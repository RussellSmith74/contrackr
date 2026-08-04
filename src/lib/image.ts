/**
 * Client-side image downscaling.
 *
 * Phone cameras produce 4000px, 4MB files. Uploading those means slow uploads
 * on job-site cell service, and it pushed us past Vercel's image optimization
 * limit. Shrinking before upload fixes both, and means we can serve the
 * originals without an optimizer in front of them.
 *
 * Always fails open: if anything goes wrong (unsupported format, no canvas,
 * decode failure) the original File is returned rather than blocking an upload.
 */

export interface CompressOptions {
  /** Longest edge, in pixels. Images already smaller are left alone. */
  maxDimension: number;
  /** JPEG quality, 0-1. */
  quality: number;
}

export const PHOTO_PRESET: CompressOptions = { maxDimension: 1600, quality: 0.82 };
export const AVATAR_PRESET: CompressOptions = { maxDimension: 512, quality: 0.85 };

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode failed"));
    };
    img.src = url;
  });
}

export async function compressImage(
  file: File,
  { maxDimension, quality }: CompressOptions = PHOTO_PRESET
): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) return file;

  // Animated GIFs would lose their animation, and SVGs don't benefit.
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;

  try {
    const img = await loadImage(file);
    const { width, height } = img;
    if (!width || !height) return file;

    const scale = Math.min(1, maxDimension / Math.max(width, height));
    // Already small enough and already a JPEG — nothing to gain.
    if (scale === 1 && file.type === "image/jpeg") return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // JPEG has no alpha channel — without this, transparent areas of a PNG
    // come out black instead of white.
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) return file;

    // A tiny source can come out larger as re-encoded JPEG. Keep the smaller one.
    if (blob.size >= file.size && scale === 1) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    // HEIC on browsers that can't decode it lands here. Upload the original.
    return file;
  }
}

export async function compressAll(
  files: File[],
  options: CompressOptions = PHOTO_PRESET
): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f, options)));
}
