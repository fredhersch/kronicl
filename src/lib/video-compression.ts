/**
 * Basic video compression utility
 * Reduces video file sizes before upload
 */

export interface VideoCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxDuration?: number; // in seconds
  targetBitrate?: number; // in bits per second
}

export interface VideoCompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  duration: number;
  width: number;
  height: number;
}

const defaultVideoOptions: VideoCompressionOptions = {
  maxWidth: 1280,
  maxHeight: 720,
  quality: 0.8,
  maxDuration: 300, // 5 minutes
  targetBitrate: 2000000 // 2 Mbps
};

/**
 * Basic video compression using MediaRecorder API
 * This provides moderate compression for web-compatible formats
 */
export async function compressVideo(
  file: File, 
  options: VideoCompressionOptions = {}
): Promise<VideoCompressionResult> {
  const opts = { ...defaultVideoOptions, ...options };
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.onloadedmetadata = () => {
      try {
        const { videoWidth, videoHeight, duration } = video;
        
        // Check duration limit
        if (opts.maxDuration && duration > opts.maxDuration) {
          reject(new Error(`Video duration (${duration}s) exceeds limit (${opts.maxDuration}s)`));
          return;
        }
        
        // Calculate new dimensions
        let { width, height } = { width: videoWidth, height: videoHeight };
        const aspectRatio = width / height;
        
        if (width > opts.maxWidth!) {
          width = opts.maxWidth!;
          height = width / aspectRatio;
        }
        if (height > opts.maxHeight!) {
          height = opts.maxHeight!;
          width = height * aspectRatio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Calculate target bitrate based on quality
        const targetBitrate = Math.round(opts.targetBitrate! * opts.quality!);
        
        // Start recording
        const stream = canvas.captureStream();
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: targetBitrate
        });
        
        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const compressedBlob = new Blob(chunks, { type: 'video/webm' });
          const compressionRatio = (1 - compressedBlob.size / file.size) * 100;
          
          resolve({
            blob: compressedBlob,
            originalSize: file.size,
            compressedSize: compressedBlob.size,
            compressionRatio,
            duration,
            width: Math.round(width),
            height: Math.round(height)
          });
        };
        
        // Start recording and play video
        mediaRecorder.start();
        video.play();
        
        // Stop recording after video ends
        video.onended = () => mediaRecorder.stop();
        
      } catch (error) {
        reject(error);
      }
    };
    
    video.onerror = () => reject(new Error('Failed to load video'));
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Check if video needs compression based on size and duration
 */
export function shouldCompressVideo(file: File, maxSize: number = 10 * 1024 * 1024): boolean {
  return file.size > maxSize;
}

/**
 * Get optimal video compression options based on file size
 */
export function getOptimalVideoCompressionOptions(fileSize: number): VideoCompressionOptions {
  if (fileSize > 50 * 1024 * 1024) { // > 50MB
    return { 
      maxWidth: 854, 
      maxHeight: 480, 
      quality: 0.6, 
      targetBitrate: 1000000 // 1 Mbps
    };
  } else if (fileSize > 25 * 1024 * 1024) { // > 25MB
    return { 
      maxWidth: 1280, 
      maxHeight: 720, 
      quality: 0.7, 
      targetBitrate: 1500000 // 1.5 Mbps
    };
  } else if (fileSize > 10 * 1024 * 1024) { // > 10MB
    return { 
      maxWidth: 1280, 
      maxHeight: 720, 
      quality: 0.8, 
      targetBitrate: 2000000 // 2 Mbps
    };
  } else {
    return { 
      maxWidth: 1920, 
      maxHeight: 1080, 
      quality: 0.85, 
      targetBitrate: 3000000 // 3 Mbps
    };
  }
}

/**
 * Get video duration from file (basic implementation)
 */
export async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      resolve(video.duration);
    };
    video.onerror = () => reject(new Error('Failed to get video duration'));
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Check if video format is supported for compression
 */
export function isVideoFormatSupported(file: File): boolean {
  const supportedFormats = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo'
  ];
  return supportedFormats.includes(file.type);
}
