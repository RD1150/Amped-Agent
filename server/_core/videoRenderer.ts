/**
 * AutoReels Video Renderer — powered by Creatomate
 * Replaces the previous Shotstack-based implementation.
 */
import { ENV } from './env';

const CREATOMATE_API_URL = 'https://api.creatomate.com/v1';

interface VideoRenderOptions {
  hook: string;
  script: string;
  videoLength: number; // in seconds
  tone: 'calm' | 'bold' | 'authoritative' | 'warm';
  voiceoverAudioUrl?: string; // Optional ElevenLabs narration track
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
function generateSubtitleTiming(
  script: string,
  duration: number
): Array<{ text: string; start: number; length: number }> {
  const sentences = script
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentences.length === 0) return [];

  const timePerSentence = duration / sentences.length;

  return sentences.map((text, index) => ({
    text,
    start: index * timePerSentence,
    length: timePerSentence,
  }));
}

/**
 * Get background music URL based on tone
 */
function getBackgroundMusicUrl(tone: string): string {
  const musicTracks: Record<string, string> = {
    calm: 'https://shotstack-assets.s3.amazonaws.com/music/ambient-calm.mp3',
    bold: 'https://shotstack-assets.s3.amazonaws.com/music/upbeat-energetic.mp3',
    authoritative: 'https://shotstack-assets.s3.amazonaws.com/music/corporate-professional.mp3',
    warm: 'https://shotstack-assets.s3.amazonaws.com/music/acoustic-warm.mp3',
  };
  return musicTracks[tone] || musicTracks.calm;
}

/**
 * Render a vertical AutoReel video (9:16) using Creatomate RenderScript
 */
export async function renderAutoReel(options: VideoRenderOptions): Promise<RenderResult> {
  const { hook, script, videoLength, tone, voiceoverAudioUrl } = options;

  const apiKey = ENV.CREATOMATE_API_KEY;
  if (!apiKey) {
    return { renderId: '', status: 'failed', error: 'CREATOMATE_API_KEY is not configured.' };
  }

  try {
    const subtitles = generateSubtitleTiming(script, videoLength - 2);
    const musicUrl = getBackgroundMusicUrl(tone);
    const musicVolume = voiceoverAudioUrl ? 0.1 : 0.3;

    // Build Creatomate elements array
    const elements: any[] = [];

    // Background gradient (dark, tone-aware)
    const bgColors: Record<string, string> = {
      calm: '#0f2027',
      bold: '#1a0a2e',
      authoritative: '#0d1b2a',
      warm: '#2d1b00',
    };
    elements.push({
      type: 'shape',
      track: 1,
      time: 0,
      duration: videoLength,
      x: '50%',
      y: '50%',
      width: '100%',
      height: '100%',
      fill_color: bgColors[tone] || bgColors.calm,
    });

    // Hook text (first 2 seconds)
    elements.push({
      type: 'text',
      track: 2,
      time: 0,
      duration: 2,
      text: hook,
      x: '50%',
      y: '50%',
      width: '90%',
      font_family: 'Montserrat',
      font_size: '9 vmin',
      font_weight: '700',
      fill_color: '#ffffff',
      text_align: 'center',
      animations: [
        { time: 'start', duration: 0.4, easing: 'ease-out', type: 'text-slide', direction: 'up' },
        { time: 'end', duration: 0.4, easing: 'ease-in', type: 'fade' },
      ],
    });

    // Subtitle clips (after hook)
    subtitles.forEach((sub, i) => {
      elements.push({
        type: 'text',
        track: 3,
        time: sub.start + 2,
        duration: sub.length,
        text: sub.text,
        x: '50%',
        y: '80%',
        width: '90%',
        font_family: 'Open Sans',
        font_size: '6 vmin',
        font_weight: '600',
        fill_color: '#ffffff',
        text_align: 'center',
        background_color: 'rgba(0,0,0,0.7)',
        background_x_padding: '10%',
        background_y_padding: '5%',
        background_border_radius: '5px',
        animations: [
          { time: 'start', duration: 0.2, easing: 'ease-out', type: 'fade' },
          { time: 'end', duration: 0.2, easing: 'ease-in', type: 'fade' },
        ],
      });
    });

    // Background music
    elements.push({
      type: 'audio',
      track: 4,
      time: 0,
      duration: videoLength,
      source: musicUrl,
      volume: musicVolume,
    });

    // Voiceover narration (optional)
    if (voiceoverAudioUrl) {
      elements.push({
        type: 'audio',
        track: 5,
        time: 0,
        duration: videoLength,
        source: voiceoverAudioUrl,
        volume: 1.0,
      });
    }

    const renderScript = {
      output_format: 'mp4',
      width: 1080,
      height: 1920,
      frame_rate: 30,
      elements,
    };

    console.log('[VideoRenderer] Submitting AutoReel render to Creatomate...');

    const response = await fetch(`${CREATOMATE_API_URL}/renders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: renderScript,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VideoRenderer] Creatomate API error:', response.status, errorText);
      throw new Error(`Creatomate API error: ${response.status} — ${errorText.substring(0, 200)}`);
    }

    const result = await response.json();
    // Creatomate returns an array of renders
    const render = Array.isArray(result) ? result[0] : result;

    if (!render?.id) {
      throw new Error('Invalid response from Creatomate API — missing render ID');
    }

    console.log('[VideoRenderer] Creatomate render queued:', render.id);
    return { renderId: render.id, status: 'queued' };
  } catch (error: any) {
    console.error('[VideoRenderer] AutoReel render error:', error);
    return {
      renderId: '',
      status: 'failed',
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Check render status for an AutoReel (Creatomate)
 */
export async function getRenderStatus(renderId: string): Promise<RenderResult> {
  const apiKey = ENV.CREATOMATE_API_KEY;
  if (!apiKey) {
    return { renderId, status: 'failed', error: 'CREATOMATE_API_KEY is not configured.' };
  }

  try {
    const response = await fetch(`${CREATOMATE_API_URL}/renders/${renderId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Creatomate status check error: ${response.status} — ${errorText.substring(0, 200)}`);
    }

    const render = await response.json();

    // Map Creatomate statuses to legacy interface
    const statusMap: Record<string, RenderResult['status']> = {
      planned: 'queued',
      waiting: 'queued',
      transcribing: 'rendering',
      rendering: 'rendering',
      succeeded: 'done',
      failed: 'failed',
    };

    return {
      renderId,
      status: statusMap[render.status] ?? 'rendering',
      url: render.url || undefined,
      error: render.error_message || undefined,
    };
  } catch (error: any) {
    console.error('[VideoRenderer] Get render status error:', error);
    return { renderId, status: 'failed', error: error.message || 'Unknown error occurred' };
  }
}
