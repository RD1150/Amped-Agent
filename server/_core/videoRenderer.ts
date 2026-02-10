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
  Font,
  Soundtrack
} from 'shotstack-sdk';
import { ENV } from './env';

// Configure Shotstack API client
const defaultClient = ApiClient.instance;
const DeveloperKey = defaultClient.authentications['DeveloperKey'];
DeveloperKey.apiKey = ENV.SHOTSTACK_API_KEY;
defaultClient.basePath = ENV.SHOTSTACK_HOST; // Configurable via SHOTSTACK_HOST env variable

const api = new EditApi();

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
    const hookAsset = new TitleAsset();
    hookAsset.text = hook;
    hookAsset.style = 'blockbuster'; // Bold, attention-grabbing style
    hookAsset.size = 'medium';
    hookAsset.position = 'center';
    
    const hookFont = new Font();
    hookFont.family = 'Montserrat';
    hookFont.color = '#ffffff';
    hookAsset.font = hookFont;
    
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
      const asset = new TitleAsset();
      asset.text = sub.text;
      asset.style = 'subtitle';
      asset.size = 'small';
      asset.position = 'bottom';
      
      const font = new Font();
      font.family = 'Open Sans';
      font.color = '#ffffff';
      font.size = 24;
      asset.font = font;
      
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
    output.resolution = 'sd'; // 1080x1920 for 9:16
    output.aspectRatio = '9:16';
    output.size = {
      width: 1080,
      height: 1920
    };
    output.fps = 30;
    output.quality = 'medium';
    
    edit.timeline = timeline;
    edit.output = output;
    
    // Submit render
    const response = await api.postRender(edit);
    
    if (!response.success || !response.response?.id) {
      throw new Error('Failed to submit render request');
    }
    
    return {
      renderId: response.response.id,
      status: 'queued'
    };
  } catch (error: any) {
    console.error('Video render error:', error);
    return {
      renderId: '',
      status: 'failed',
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Check render status and get video URL when complete
 */
export async function getRenderStatus(renderId: string): Promise<RenderResult> {
  try {
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
    return {
      renderId,
      status: 'failed',
      error: error.message || 'Unknown error occurred'
    };
  }
}
