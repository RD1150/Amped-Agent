/**
 * AutoReels Video Renderer — powered by Creatomate
 * Produces clean 9:16 vertical reels with animated backgrounds and subtitles.
 */
import { ENV } from './env';

const CREATOMATE_API_URL = 'https://api.creatomate.com/v1';

interface VideoRenderOptions {
  hook: string;
  script: string;
  videoLength: number; // in seconds
  tone: 'calm' | 'bold' | 'authoritative' | 'warm';
  voiceoverAudioUrl?: string;
}

interface RenderResult {
  renderId: string;
  status: 'queued' | 'rendering' | 'done' | 'failed';
  url?: string;
  error?: string;
}

/**
 * Split script into subtitle chunks for display timing
 */
function generateSubtitleTiming(
  script: string,
  duration: number
): Array<{ text: string; start: number; length: number }> {
  // Split into short phrases of ~6-8 words for readable subtitles
  const words = script.split(/\s+/).filter(w => w.length > 0);
  const chunks: string[] = [];
  const chunkSize = 6;
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }

  if (chunks.length === 0) return [];

  const timePerChunk = duration / chunks.length;
  return chunks.map((text, index) => ({
    text,
    start: index * timePerChunk,
    length: timePerChunk,
  }));
}

/**
 * Tone-based gradient colors for animated background
 */
function getToneColors(tone: string): { from: string; to: string } {
  const palettes: Record<string, { from: string; to: string }> = {
    calm:          { from: '#0f2027', to: '#203a43' },
    bold:          { from: '#1a0a2e', to: '#3d1a6e' },
    authoritative: { from: '#0d1b2a', to: '#1b3a5c' },
    warm:          { from: '#2d1b00', to: '#7b4f00' },
  };
  return palettes[tone] || palettes.calm;
}

/**
 * Render a vertical AutoReel video (9:16) using Creatomate
 */
export async function renderAutoReel(options: VideoRenderOptions): Promise<RenderResult> {
  const { hook, script, videoLength, tone, voiceoverAudioUrl } = options;

  const apiKey = ENV.CREATOMATE_API_KEY;
  if (!apiKey) {
    return { renderId: '', status: 'failed', error: 'CREATOMATE_API_KEY is not configured.' };
  }

  try {
    const { from, to } = getToneColors(tone);
    const subtitles = generateSubtitleTiming(script, videoLength - 2.5);
    const musicVolume = voiceoverAudioUrl ? 0.08 : 0.25;

    const elements: any[] = [];

    // ── Background: animated gradient rectangle ──────────────────────────────
    elements.push({
      type: 'shape',
      track: 1,
      time: 0,
      duration: videoLength,
      x: '50%',
      y: '50%',
      width: '100%',
      height: '100%',
      fill_color: [
        { time: 0,           value: from },
        { time: videoLength, value: to   },
      ],
    });

    // ── Decorative accent bar (top) ───────────────────────────────────────────
    elements.push({
      type: 'shape',
      track: 2,
      time: 0,
      duration: videoLength,
      x: '50%',
      y: '4%',
      width: '20%',
      height: '0.5%',
      fill_color: '#d4af37',
    });

    // ── Hook text (first 2.5 seconds) ─────────────────────────────────────────
    elements.push({
      type: 'text',
      track: 3,
      time: 0,
      duration: 2.5,
      text: hook,
      x: '50%',
      y: '45%',
      width: '88%',
      font_family: 'Montserrat',
      font_size: '8.5 vmin',
      font_weight: '800',
      fill_color: '#ffffff',
      text_align: 'center',
      line_height: '130%',
      animations: [
        { time: 'start', duration: 0.5, easing: 'ease-out', type: 'text-slide', direction: 'up', scope: 'word' },
        { time: 'end',   duration: 0.4, easing: 'ease-in',  type: 'fade' },
      ],
    });

    // ── Subtitle chunks (after hook) ──────────────────────────────────────────
    subtitles.forEach((sub) => {
      elements.push({
        type: 'text',
        track: 4,
        time: sub.start + 2.5,
        duration: sub.length,
        text: sub.text,
        x: '50%',
        y: '78%',
        width: '90%',
        font_family: 'Open Sans',
        font_size: '6.5 vmin',
        font_weight: '700',
        fill_color: '#ffffff',
        text_align: 'center',
        background_color: 'rgba(0,0,0,0.65)',
        background_x_padding: '8%',
        background_y_padding: '6%',
        background_border_radius: '8px',
        animations: [
          { time: 'start', duration: 0.15, easing: 'ease-out', type: 'fade' },
          { time: 'end',   duration: 0.15, easing: 'ease-in',  type: 'fade' },
        ],
      });
    });

    // ── Background music (royalty-free, reliable CDN) ─────────────────────────
    // Using Pixabay/free CDN tracks that are publicly accessible
    const musicTracks: Record<string, string> = {
      calm:          'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3',
      bold:          'https://cdn.pixabay.com/audio/2022/01/18/audio_d0c6ff1c23.mp3',
      authoritative: 'https://cdn.pixabay.com/audio/2022/08/04/audio_2dde668d05.mp3',
      warm:          'https://cdn.pixabay.com/audio/2021/11/25/audio_91b32e02f9.mp3',
    };
    const musicUrl = musicTracks[tone] || musicTracks.calm;

    elements.push({
      type: 'audio',
      track: 5,
      time: 0,
      duration: videoLength,
      source: musicUrl,
      volume: musicVolume,
      audio_fade_in: 0.5,
      audio_fade_out: 1.0,
    });

    // ── Voiceover (optional) ──────────────────────────────────────────────────
    if (voiceoverAudioUrl) {
      elements.push({
        type: 'audio',
        track: 6,
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
      body: JSON.stringify({ source: renderScript }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VideoRenderer] Creatomate API error:', response.status, errorText);
      throw new Error(`Creatomate API error: ${response.status} — ${errorText.substring(0, 300)}`);
    }

    const result = await response.json();
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

    const statusMap: Record<string, RenderResult['status']> = {
      planned:      'queued',
      waiting:      'queued',
      transcribing: 'rendering',
      rendering:    'rendering',
      succeeded:    'done',
      failed:       'failed',
    };

    return {
      renderId,
      status: statusMap[render.status] ?? 'rendering',
      url:    render.url           || undefined,
      error:  render.error_message || undefined,
    };
  } catch (error: any) {
    console.error('[VideoRenderer] Get render status error:', error);
    return { renderId, status: 'failed', error: error.message || 'Unknown error occurred' };
  }
}
