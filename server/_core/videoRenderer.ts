import { createRequire } from 'module';
import {
  EditApi,
  ApiClient,
  Edit,
  Timeline,
  Track,
  Clip,
  VideoAsset,
  TitleAsset,
  AudioAsset,
  Output,
  Soundtrack
} from 'shotstack-sdk';
import { ENV } from './env';

// @ts-ignore - TextAsset exists but not in TypeScript definitions
const require = createRequire(import.meta.url);
const { TextAsset } = require('shotstack-sdk');

// Configure Shotstack API client
function getConfiguredApi() {
  const defaultClient = ApiClient.instance;
  const DeveloperKey = defaultClient.authentications['DeveloperKey'];
  DeveloperKey.apiKey = ENV.SHOTSTACK_API_KEY;
  defaultClient.basePath = ENV.SHOTSTACK_HOST; // Configurable via SHOTSTACK_HOST env variable
  return new EditApi();
}

interface VideoRenderOptions {
  hook: string;
  script: string;
  videoLength: number; // in seconds
  tone: 'calm' | 'bold' | 'authoritative' | 'warm';
}

interface RenderResult {
  renderId: string;
  status: 'queued' | 'rendering' | 'done' | 'failed';
  url?: string;
  error?: string;
}

/**
 * Generate subtitle timing from script text
 * Splits script into chunks and assigns timing
 */
function generateSubtitleTiming(script: string, duration: number): Array<{text: string, start: number, length: number}> {
  // Split script into sentences or phrases
  const sentences = script
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  if (sentences.length === 0) return [];
  
  // Calculate timing for each sentence
  const timePerSentence = duration / sentences.length;
  
  return sentences.map((text, index) => ({
    text,
    start: index * timePerSentence,
    length: timePerSentence
  }));
}

/**
 * Get stock video URL based on tone
 * In production, this would query Pexels/Unsplash API
 * For now, using placeholder stock footage
 */
function getStockFootageUrl(tone: string): string {
  // These are example stock video URLs - replace with actual stock footage API in production
  const stockVideos = {
    calm: 'https://shotstack-assets.s3.amazonaws.com/footage/beach-sunset.mp4',
    bold: 'https://shotstack-assets.s3.amazonaws.com/footage/city-timelapse.mp4',
    authoritative: 'https://shotstack-assets.s3.amazonaws.com/footage/office-professional.mp4',
    warm: 'https://shotstack-assets.s3.amazonaws.com/footage/home-cozy.mp4'
  };
  
  return stockVideos[tone as keyof typeof stockVideos] || stockVideos.calm;
}

/**
 * Get background music URL based on tone
 */
function getBackgroundMusicUrl(tone: string): string {
  const musicTracks = {
    calm: 'https://shotstack-assets.s3.amazonaws.com/music/ambient-calm.mp3',
    bold: 'https://shotstack-assets.s3.amazonaws.com/music/upbeat-energetic.mp3',
    authoritative: 'https://shotstack-assets.s3.amazonaws.com/music/corporate-professional.mp3',
    warm: 'https://shotstack-assets.s3.amazonaws.com/music/acoustic-warm.mp3'
  };
  
  return musicTracks[tone as keyof typeof musicTracks] || musicTracks.calm;
}

/**
 * Render a vertical video (9:16) with hook, script, subtitles, and background music
 */
export async function renderAutoReel(options: VideoRenderOptions): Promise<RenderResult> {
  const { hook, script, videoLength, tone } = options;
  
  try {
    // Create edit
    const edit = new Edit();
    const timeline = new Timeline();
    
    // Track 1: Background video
    const videoTrack = new Track();
    const videoClip = new Clip();
    const videoAsset = new VideoAsset();
    videoAsset.src = getStockFootageUrl(tone);
    videoAsset.trim = 0;
    videoClip.asset = videoAsset;
    videoClip.start = 0;
    videoClip.length = videoLength;
    videoClip.fit = 'cover'; // Fill the frame
    videoTrack.clips = [videoClip];
    
    // Track 2: Hook title (first 2 seconds)
    const hookTrack = new Track();
    const hookClip = new Clip();
    const hookAsset = new (TextAsset as any)();
    hookAsset.type = 'text';
    hookAsset.text = hook;
    hookAsset.width = 900;
    hookAsset.height = 200;
    hookAsset.font = {
      family: 'Montserrat',
      color: '#ffffff',
      size: 48,
      weight: 700
    };
    hookAsset.alignment = {
      horizontal: 'center',
      vertical: 'center'
    };
    
    hookClip.asset = hookAsset;
    hookClip.start = 0;
    hookClip.length = 2;
    hookClip.transition = { in: 'fade', out: 'fade' };
    hookTrack.clips = [hookClip];
    
    // Track 3: Script subtitles (after hook)
    const subtitleTrack = new Track();
    const subtitles = generateSubtitleTiming(script, videoLength - 2);
    
    const subtitleClips = subtitles.map(sub => {
      const clip = new Clip();
      const asset = new (TextAsset as any)();
      asset.type = 'text';
      asset.text = sub.text;
      asset.width = 900;
      asset.height = 100;
      asset.font = {
        family: 'Open Sans',
        color: '#ffffff',
        size: 32,
        weight: 600
      };
      asset.alignment = {
        horizontal: 'center',
        vertical: 'bottom'
      };
      asset.background = {
        color: '#000000',
        opacity: 0.7,
        padding: 10,
        borderRadius: 5
      };
      
      clip.asset = asset;
      clip.start = sub.start + 2; // Start after hook
      clip.length = sub.length;
      
      return clip;
    });
    
    subtitleTrack.clips = subtitleClips;
    
    // Track 4: Background music
    const audioTrack = new Track();
    const audioClip = new Clip();
    const audioAsset = new AudioAsset();
    audioAsset.src = getBackgroundMusicUrl(tone);
    audioAsset.volume = 0.3; // Low volume for background
    audioClip.asset = audioAsset;
    audioClip.start = 0;
    audioClip.length = videoLength;
    audioTrack.clips = [audioClip];
    
    // Add all tracks to timeline (order matters - bottom to top)
    timeline.tracks = [
      subtitleTrack,  // Top layer
      hookTrack,
      audioTrack,
      videoTrack      // Bottom layer
    ];
    
    // Configure output - 9:16 vertical format
    const output = new Output();
    output.format = 'mp4';
    output.resolution = 'hd'; // Use 'hd' for 1080x1920
    output.aspectRatio = '9:16';
    output.fps = 30;
    output.quality = 'medium';
    
    edit.timeline = timeline;
    edit.output = output;
    
    // Submit render
    console.log('[VideoRenderer] Submitting render to Shotstack...');
    console.log('[VideoRenderer] API Key configured:', !!ENV.SHOTSTACK_API_KEY);
    console.log('[VideoRenderer] Host:', ENV.SHOTSTACK_HOST);
    
    const api = getConfiguredApi();
    const response = await api.postRender(edit);
    
    if (!response.success || !response.response?.id) {
      throw new Error('Failed to submit render request');
    }
    
    return {
      renderId: response.response.id,
      status: 'queued'
    };
  } catch (error: any) {
    console.error('[VideoRenderer] Video render error:', error);
    console.error('[VideoRenderer] Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });
    
    // Provide more specific error messages
    let errorMessage = 'Unknown error occurred';
    
    if (error.message?.includes('API key') || error.message?.includes('authentication')) {
      errorMessage = 'Shotstack API key is missing or invalid. Please configure SHOTSTACK_API_KEY in Settings → Secrets.';
    } else if (error.message?.includes('network') || error.message?.includes('ENOTFOUND')) {
      errorMessage = 'Network error connecting to Shotstack API. Please check your internet connection.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      renderId: '',
      status: 'failed',
      error: errorMessage
    };
  }
}

/**
 * Check render status and get video URL when complete
 */
export async function getRenderStatus(renderId: string): Promise<RenderResult> {
  try {
    const api = getConfiguredApi();
    const response = await api.getRender(renderId);
    
    if (!response.success || !response.response) {
      throw new Error('Failed to get render status');
    }
    
    const render = response.response;
    
    return {
      renderId,
      status: render.status as RenderResult['status'],
      url: render.url,
      error: render.error
    };
  } catch (error: any) {
    console.error('Get render status error:', error);
    
    let errorMessage = 'Unknown error occurred';
    
    if (error.message?.includes('API key') || error.message?.includes('authentication')) {
      errorMessage = 'Shotstack API key is missing or invalid.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      renderId,
      status: 'failed',
      error: errorMessage
    };
  }
}
