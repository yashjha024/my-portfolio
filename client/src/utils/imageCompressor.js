/**
 * Client-side Image Compression utility using HTML5 Canvas & Blob API.
 * Reduces image file sizes by up to 75-80% before uploading to cloud storage.
 */

export const compressImageBeforeUpload = async (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.82,
    outputFormat = 'image/webp',
  } = options;

  // Do not compress non-images or SVGs/GIFs
  if (
    !file.type.startsWith('image/') ||
    file.type === 'image/svg+xml' ||
    file.type === 'image/gif'
  ) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0,
      wasCompressed: false,
    };
  }

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
        // Clear background for PNG transparency if converted to WebP
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // If compression didn't save bytes, return original file
              resolve({
                file,
                originalSize: file.size,
                compressedSize: file.size,
                compressionRatio: 0,
                wasCompressed: false,
              });
              return;
            }

            const ext = outputFormat === 'image/webp' ? '.webp' : '.jpg';
            const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const compressedFile = new File([blob], `${baseName}${ext}`, {
              type: outputFormat,
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

      img.onerror = () => {
        resolve({
          file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 0,
          wasCompressed: false,
        });
      };
    };

    reader.onerror = () => {
      resolve({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0,
        wasCompressed: false,
      });
    };
  });
};
