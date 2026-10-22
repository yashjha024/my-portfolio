/**
 * Client-side Image Compression utility using HTML5 Canvas & Blob API.
 * Reduces image file sizes by up to 75-80% before uploading to cloud storage.
 */
import { needsOpaqueBackground, resolveCompressedOutput } from './mediaFiles.js';

// Raster formats the canvas can decode and the server accepts
const COMPRESSIBLE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

const unchanged = (file) => ({
  file,
  originalSize: file.size,
  compressedSize: file.size,
  compressionRatio: 0,
  wasCompressed: false,
});

export const compressImageBeforeUpload = async (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.82,
    outputFormat = 'image/webp',
  } = options;

  // Leave PDFs and unsupported formats untouched (the upload pre-check rejects the latter)
  if (!COMPRESSIBLE_TYPES.has(file.type)) return unchanged(file);

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio bounded dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // Keep transparency for WebP/PNG; only JPEG (no alpha channel) gets a white background
        if (needsOpaqueBackground(outputFormat)) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            // The browser may encode a different type than requested (e.g. PNG instead of WebP)
            const output =
              blob && resolveCompressedOutput({ blobType: blob.type, originalName: file.name });
            if (!blob || !output || blob.size >= file.size) {
              // Unusable output or no savings: upload the original file
              resolve(unchanged(file));
              return;
            }

            const compressedFile = new File([blob], output.name, {
              type: output.type,
              lastModified: Date.now(),
            });

            const ratio = ((1 - blob.size / file.size) * 100).toFixed(1);

            resolve({
              file: compressedFile,
              originalSize: file.size,
              compressedSize: blob.size,
              compressionRatio: Number(ratio),
              wasCompressed: true,
            });
          },
          outputFormat,
          quality
        );
      };

      img.onerror = () => resolve(unchanged(file));
    };

    reader.onerror = () => resolve(unchanged(file));
  });
};
