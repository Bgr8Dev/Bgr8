/**
 * Compresses an image file to be under the specified max size (in bytes)
 * Uses Canvas API to resize and compress the image
 * 
 * @param file - The image file to compress
 * @param maxSizeBytes - Maximum file size in bytes (default: 5MB)
 * @param maxWidth - Maximum width in pixels (default: 1920)
 * @param maxHeight - Maximum height in pixels (default: 1920)
 * @returns Promise<File> - The compressed image file
 */
export async function compressImage(
  file: File,
  maxSizeBytes: number = 5 * 1024 * 1024, // 5MB default
  maxWidth: number = 1920,
  maxHeight: number = 1920
): Promise<File> {
  return new Promise((resolve, reject) => {
    // If file is already under the max size, return it as-is
    if (file.size <= maxSizeBytes) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels until we get under the max size
        const tryCompress = (quality: number): void => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              // If we're under the max size or quality is too low, we're done
              if (blob.size <= maxSizeBytes || quality <= 0.1) {
                const compressedFile = new File(
                  [blob],
                  file.name,
                  {
                    type: file.type || 'image/jpeg',
                    lastModified: Date.now()
                  }
                );
                resolve(compressedFile);
              } else {
                // Try lower quality (reduce by 0.1 each time)
                tryCompress(Math.max(0.1, quality - 0.1));
              }
            },
            file.type || 'image/jpeg',
            quality
          );
        };

        // Start with 0.9 quality (90%)
        tryCompress(0.9);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('Failed to read file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

