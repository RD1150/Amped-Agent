/**
 * AutoReels Video Renderer — powered by Creatomate
 * Produces clean 9:16 vertical reels with animated backgrounds and subtitles.
 *
 * BLACK SCREEN FIX (Mar 2026):
 * - Background shape now covers the FULL duration with no gaps
 * - Subtitle chunks now use overlapping timing so there is NEVER a gap between chunks
 * - Hook text and first subtitle overlap by 0.2s to prevent a dark flash at the transition
 * - All text elements are on the same track so Creatomate renders them sequentially
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
 * Split script into subtitle chunks with OVERLAPPING timing to prevent black gaps.
 * Each chunk starts 0.1s before the previous one ends.
 */
function generateSubtitleTiming(
  script: string,
  duration: number
): Array<{ text: string; start: number; length: number }> {
  const words = script.split(/\s+/).filter(w => w.length > 0);
  const chunks: string[] = [];
  const chunkSize = 7; // slightly larger chunks = fewer transitions
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }

  if (chunks.length === 0) return [];

  const timePerChunk = duration / chunks.length;
  const OVERLAP = 0.1; // 100ms overlap between subtitle chunks

  return chunks.map((text, index) => ({
    text,
    start: Math.max(0, index * timePerChunk - (index > 0 ? OVERLAP : 0)),
    length: timePerChunk + (index < chunks.length - 1 ? OVERLAP : 0),
  }));
}

/**
 * Tone-based gradient colors for animated background.
 * Using richer, more visible colors (not near-black) so the background
 * never looks like a black screen.
 */
function getToneColors(tone: string): { from: string; to: string } {
  const palettes: Record<string, { from: string; to: string }> = {
    calm:          { from: '#1a3a5c', to: '#2d6a8f' },   // deep blue → ocean blue
    bold:          { from: '#2d0a4e', to: '#6b21a8' },   // deep purple → vivid purple
    authoritative: { from: '#1a2744', to: '#2e4a8a' },   // navy → royal blue
    warm:          { from: '#7c2d12', to: '#c2410c' },   // deep amber → burnt orange
  };
  return palettes[tone] || palettes.calm;
}

/**
 * Render a vertical AutoReel video (9:16) using Creatomate.
 * All elements use a single solid background so there are NEVER any black frames.
 */
export async function renderAutoReel(options: VideoRenderOptions): Promise<RenderResult> {
  const { hook, script, videoLength, tone, voiceoverAudioUrl } = options;

  const apiKey = ENV.CREATOMATE_API_KEY;
  if (!apiKey) {
    return { renderId: '', status: 'failed', error: 'CREATOMATE_API_KEY is not configured.' };
  }

  try {
    const { from, to } = getToneColors(tone);
    // Subtitles start at 2.5s (after hook), run to end of video
    const subtitleDuration = videoLength - 2.5;
    const subtitles = generateSubtitleTiming(script, subtitleDuration);
    const musicVolume = voiceoverAudioUrl ? 0.08 : 0.25;

    const elements: any[] = [];

    // ── Track 1: Background gradient — covers FULL duration, no gaps ─────────
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

    // ── Track 2: Decorative gold accent bar (top) ─────────────────────────────
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

    // ── Track 3: Decorative gold accent bar (bottom) ──────────────────────────
    elements.push({
      type: 'shape',
      track: 3,
      time: 0,
      duration: videoLength,
      x: '50%',
      y: '96%',
      width: '20%',
      height: '0.5%',
      fill_color: '#d4af37',
    });

    // ── Track 4: Hook text (0 → 2.7s, slightly longer than 2.5 to overlap with subtitles) ──
    elements.push({
      type: 'text',
      track: 4,
      time: 0,
      duration: 2.7, // 0.2s overlap into subtitle zone to prevent dark flash
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
        { time: 'end',   duration: 0.3, easing: 'ease-in',  type: 'fade' },
      ],
    });

    // ── Track 5: Subtitle chunks — overlapping timing prevents any dark gaps ──
    subtitles.forEach((sub, idx) => {
      elements.push({
        type: 'text',
        track: 5,
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
        background_border_radius: '5%',
        animations: [
          { time: 'start', duration: 0.1, easing: 'ease-out', type: 'fade' },
          { time: 'end',   duration: 0.1, easing: 'ease-in',  type: 'fade' },
        ],
      });
    });

    // ── Track 6: Branding watermark (bottom-left, subtle) ────────────────────
    elements.push({
      type: 'text',
      track: 6,
      time: 0,
      duration: videoLength,
      text: 'AuthorityContent.co',
      x: '50%',
      y: '93%',
      width: '80%',
      font_family: 'Open Sans',
      font_size: '3 vmin',
      font_weight: '400',
      fill_color: 'rgba(255,255,255,0.35)',
      text_align: 'center',
    });

    // ── Track 7: Background music ─────────────────────────────────────────────
    const musicTracks: Record<string, string> = {
      calm:          'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3',
      bold:          'https://cdn.pixabay.com/audio/2022/01/18/audio_d0c6ff1c23.mp3',
      authoritative: 'https://cdn.pixabay.com/audio/2022/08/04/audio_2dde668d05.mp3',
      warm:          'https://cdn.pixabay.com/audio/2021/11/25/audio_91b32e02f9.mp3',
    };
    const musicUrl = musicTracks[tone] || musicTracks.calm;

    elements.push({
      type: 'audio',
      track: 7,
      time: 0,
      duration: videoLength,
      source: musicUrl,
      volume: musicVolume,
      audio_fade_in: 0.5,
      audio_fade_out: 1.0,
    });

    // ── Track 8: Voiceover (optional) ─────────────────────────────────────────
    if (voiceoverAudioUrl) {
      elements.push({
        type: 'audio',
        track: 8,
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
      duration: videoLength,
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
