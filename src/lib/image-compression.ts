/**
 * Client-side image compression utility
 * Reduces file sizes significantly before upload
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  maintainAspectRatio?: boolean;
}

export interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

const defaultOptions: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'jpeg',
  maintainAspectRatio: true
};

/**
 * Compress an image file using HTML5 Canvas
 */
export async function compressImage(
  file: File, 
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...defaultOptions, ...options };
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate new dimensions
        let { width, height } = img;
        const aspectRatio = width / height;
        
        if (opts.maintainAspectRatio) {
          if (width > opts.maxWidth!) {
            width = opts.maxWidth!;
            height = width / aspectRatio;
          }
          if (height > opts.maxHeight!) {
            height = opts.maxHeight!;
            width = height * aspectRatio;
          }
        } else {
          width = Math.min(width, opts.maxWidth!);
          height = Math.min(height, opts.maxHeight!);
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        ctx!.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with specified quality and format
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            const compressionRatio = (1 - blob.size / file.size) * 100;
            
            resolve({
              blob,
              originalSize: file.size,
              compressedSize: blob.size,
              compressionRatio,
              width: Math.round(width),
              height: Math.round(height)
            });
          },
          `image/${opts.format}`,
          opts.quality
        );
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compress multiple images in parallel
 */
export async function compressImages(
  files: File[], 
  options: CompressionOptions = {}
): Promise<CompressionResult[]> {
  const compressionPromises = files.map(file => {
    if (file.type.startsWith('image/')) {
      return compressImage(file, options);
    } else {
      // Return original file for non-images
      return Promise.resolve({
        blob: file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0,
        width: 0,
        height: 0
      });
    }
  });
  
  return Promise.all(compressionPromises);
}

/**
 * Get optimal compression options based on file size
 */
export function getOptimalCompressionOptions(fileSize: number): CompressionOptions {
  if (fileSize > 10 * 1024 * 1024) { // > 10MB
    return { maxWidth: 1280, maxHeight: 720, quality: 0.7, format: 'jpeg' };
  } else if (fileSize > 5 * 1024 * 1024) { // > 5MB
    return { maxWidth: 1600, maxHeight: 900, quality: 0.75, format: 'jpeg' };
  } else if (fileSize > 2 * 1024 * 1024) { // > 2MB
    return { maxWidth: 1920, maxHeight: 1080, quality: 0.8, format: 'jpeg' };
  } else {
    return { maxWidth: 2560, maxHeight: 1440, quality: 0.85, format: 'jpeg' };
  }
}

/**
 * Check if image needs compression based on size and dimensions
 */
export function shouldCompressImage(file: File, maxSize: number = 2 * 1024 * 1024): boolean {
  return file.size > maxSize;
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
