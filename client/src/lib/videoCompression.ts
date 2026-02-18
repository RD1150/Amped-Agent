/**
 * Compress video file using browser APIs
 * Reduces file size while maintaining acceptable quality
 */

export interface CompressionOptions {
  maxSizeMB?: number;
  targetSizeMB?: number;
  maxWidthOrHeight?: number;
  videoBitrate?: number;
  onProgress?: (progress: number) => void;
}

export async function compressVideo(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 50,
    targetSizeMB = 35,
    maxWidthOrHeight = 1920,
    videoBitrate = 2500000, // 2.5 Mbps
    onProgress = () => {},
  } = options;

  // Check if compression is needed
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB <= maxSizeMB) {
    onProgress?.(100);
    return file;
  }

  onProgress?.(10);

  try {
    // Create video element to read the file
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = reject;
    });

    onProgress?.(20);

    // Calculate target dimensions
    let width = video.videoWidth;
    let height = video.videoHeight;
    
    if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
      if (width > height) {
        height = Math.round((height * maxWidthOrHeight) / width);
        width = maxWidthOrHeight;
      } else {
        width = Math.round((width * maxWidthOrHeight) / height);
        height = maxWidthOrHeight;
      }
    }

    onProgress?.(30);

    // Create canvas for video frames
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Set up MediaRecorder
    const stream = canvas.captureStream(30); // 30 FPS
    
    // Get audio track from original video
    const audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(video);
    const destination = audioContext.createMediaStreamDestination();
    source.connect(destination);
    source.connect(audioContext.destination);
    
    // Add audio track to stream
    if (destination.stream.getAudioTracks().length > 0) {
      stream.addTrack(destination.stream.getAudioTracks()[0]);
    }

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: videoBitrate,
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    onProgress?.(40);

    // Start recording
    mediaRecorder.start();
    video.play();

    // Draw video frames to canvas
    const duration = video.duration;
    const drawFrame = () => {
      if (video.paused || video.ended) return;
      
      ctx.drawImage(video, 0, 0, width, height);
      
      // Update progress
      const progress = 40 + (video.currentTime / duration) * 50;
      onProgress?.(Math.min(progress, 90));
      
      requestAnimationFrame(drawFrame);
    };
    drawFrame();

    // Wait for video to finish
    await new Promise<void>((resolve) => {
      video.onended = () => {
        mediaRecorder.stop();
        resolve();
      };
    });

    // Wait for recorder to finish
    const compressedBlob = await new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        resolve(new Blob(chunks, { type: mimeType }));
      };
    });

    onProgress?.(95);

    // Clean up
    URL.revokeObjectURL(video.src);
    audioContext.close();

    // Create compressed file
    const compressedFile = new File(
      [compressedBlob],
      file.name.replace(/\.[^.]+$/, '.webm'),
      { type: mimeType }
    );

    onProgress?.(100);

    const compressedSizeMB = compressedFile.size / (1024 * 1024);
    console.log(`Video compressed: ${fileSizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB`);

    return compressedFile;
  } catch (error) {
    console.error('Video compression failed:', error);
    // Return original file if compression fails
    onProgress?.(100);
    return file;
  }
}
