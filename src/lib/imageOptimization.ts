/**
 * Client-Side Image Compression & WebP Optimization Engine
 * Converts incoming PNG, JPEG, and bitmap files to crisp, optimized WebP format
 * without server overhead or extra heavy dependencies.
 */

export interface ImageOptimizationResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  reductionPercent: number;
  width: number;
  height: number;
}

export async function optimizeImageToWebP(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<ImageOptimizationResult> {
  const { maxWidth = 1024, maxHeight = 1024, quality = 0.88 } = options;
  const originalSize = file.size;

  // SVG files are already pure vector graphics, return as is
  if (file.type === 'image/svg+xml') {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      reductionPercent: 0,
      width: 512,
      height: 512,
    };
  }

  // Ensure file is an image
  if (!file.type.startsWith('image/')) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      reductionPercent: 0,
      width: 0,
      height: 0,
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file.'));

    reader.onload = (event) => {
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to load image for compression.'));

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate aspect-ratio preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Draw onto HTML5 Canvas with high quality bicubic interpolation
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original file if canvas 2D context unavailable
          return resolve({
            file,
            originalSize,
            compressedSize: originalSize,
            reductionPercent: 0,
            width,
            height,
          });
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve({
                file,
                originalSize,
                compressedSize: originalSize,
                reductionPercent: 0,
                width,
                height,
              });
            }

            const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const webpFileName = `${baseName.replace(/[^a-zA-Z0-9_-]/g, '_')}.webp`;

            const optimizedFile = new File([blob], webpFileName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });

            const compressedSize = optimizedFile.size;
            const reductionPercent = Math.max(
              0,
              Math.round(((originalSize - compressedSize) / originalSize) * 100)
            );

            resolve({
              file: optimizedFile,
              originalSize,
              compressedSize,
              reductionPercent,
              width,
              height,
            });
          },
          'image/webp',
          quality
        );
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
