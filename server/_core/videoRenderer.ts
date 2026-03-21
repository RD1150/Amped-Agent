/**
 * AutoReels Video Renderer — powered by Creatomate
 * Produces professional 9:16 vertical reels with REAL background images.
 *
 * IMAGE BACKGROUND REBUILD (Mar 2026):
 * - Background images (from template library or agent-uploaded) cycle every ~5s
 * - Ken Burns zoom effect on each image for cinematic feel
 * - Semi-transparent dark scrim over images so text is always readable
 * - Subtitle chunks stay on screen minimum 2s each
 * - Hook text is large and prominent (top half of screen)
 * - Subtitles appear in lower third with pill background
 */
import { ENV } from './env';

const CREATOMATE_API_URL = 'https://api.creatomate.com/v1';

// Default background images from the template library (manuscripts CDN)
// These are AI-generated real estate lifestyle images we own
const DEFAULT_REEL_BACKGROUNDS: Record<string, string[]> = {
  buyers: [
    'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/bIBrluRIyfWvdiIL.png',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/mqHrktUlHhZnVQSc.png',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/KbZYPlDNAgRaPCtc.png',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/WjCfdrmFebClPHmg.png',
  ],
  sellers: [
    'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/AxbwYavTXsvBNXzM.jpg',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/UHVHptFEUfPHbUwO.jpg',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/GRKuKQfMKTkCGEEu.jpg',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/KcABQUZvkFiZmyzW.jpg',
  ],
  luxury: [
    'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/TjrudQDjJgekgJas.png',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/VXvEFFSUgKermTWt.png',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/zPqNaTvVpQhtpDri.png',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/mUGRhdniPYYhZPtV.png',
  ],
  investors: [
    'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/TnKhZDZDgGQmXMZZ.png',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/MdDPnpsRfrmQcJPZ.png',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/ptYTDxyqYOZJUuPT.png',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/YzPlwfwteovlJJcb.png',
  ],
};

export interface VideoRenderOptions {
  hook: string;
  script: string;
  videoLength: number; // in seconds
  tone: 'calm' | 'bold' | 'authoritative' | 'warm';
  voiceoverAudioUrl?: string;
  backgroundImages?: string[]; // agent-uploaded photos (optional)
  backgroundCategory?: string; // 'buyers' | 'sellers' | 'luxury' | 'investors'
}

interface RenderResult {
  renderId: string;
  status: 'queued' | 'rendering' | 'done' | 'failed';
  url?: string;
  error?: string;
}

/**
 * Split script into subtitle chunks.
 * Each chunk is 5-8 words and stays on screen at least 2 seconds.
 */
function generateSubtitleTiming(
  script: string,
  startAt: number,
  totalDuration: number
): Array<{ text: string; start: number; length: number }> {
  const words = script.split(/\s+/).filter(w => w.length > 0);
  const chunks: string[] = [];
  const chunkSize = 6; // 6 words per chunk = readable pace
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }

  if (chunks.length === 0) return [];

  const availableTime = totalDuration - startAt;
  const timePerChunk = Math.max(2.0, availableTime / chunks.length); // min 2s per chunk

  return chunks.map((text, index) => ({
    text,
    start: startAt + index * timePerChunk,
    length: timePerChunk + 0.1, // slight overlap to prevent gap
  }));
}

/**
 * Pick background images: use agent-uploaded photos if provided,
 * otherwise use the template library images for the given category.
 * Returns 3-4 images to cycle through.
 */
function pickBackgroundImages(options: VideoRenderOptions): string[] {
  if (options.backgroundImages && options.backgroundImages.length > 0) {
    // Use agent's own photos, up to 4
    return options.backgroundImages.slice(0, 4);
  }

  // Map tone to a default category
  const toneToCategory: Record<string, string> = {
    calm:          'buyers',
    bold:          'sellers',
    authoritative: 'investors',
    warm:          'luxury',
  };
  const category = options.backgroundCategory || toneToCategory[options.tone] || 'buyers';
  const pool = DEFAULT_REEL_BACKGROUNDS[category] || DEFAULT_REEL_BACKGROUNDS.buyers;

  // Return 3 images
  return pool.slice(0, 3);
}

/**
 * Render a vertical AutoReel video (9:16) using Creatomate.
 * Uses real background images with Ken Burns zoom effect.
 */
export async function renderAutoReel(options: VideoRenderOptions): Promise<RenderResult> {
  const { hook, script, videoLength, tone, voiceoverAudioUrl } = options;

  const apiKey = ENV.CREATOMATE_API_KEY;
  if (!apiKey) {
    return { renderId: '', status: 'failed', error: 'CREATOMATE_API_KEY is not configured.' };
  }

  try {
    const bgImages = pickBackgroundImages(options);
    const numImages = bgImages.length;
    const timePerImage = videoLength / numImages;

    const elements: any[] = [];
    let trackNum = 1;

    // ── Background images with Ken Burns zoom effect ──────────────────────────
    // Each image fills the full frame for its time slice, with a slow zoom-in
    bgImages.forEach((imageUrl, idx) => {
      const imgStart = idx * timePerImage;
      const imgDuration = timePerImage + 0.3; // slight overlap to prevent flash between images
      elements.push({
        type: 'image',
        track: trackNum,
        time: imgStart,
        duration: imgDuration,
        source: imageUrl,
        x: '50%',
        y: '50%',
        width: '100%',
        height: '100%',
        fit: 'cover',
        // Ken Burns: slow zoom from 100% to 110%
        x_scale: [
          { time: 'start', value: '100%' },
          { time: 'end',   value: '108%' },
        ],
        y_scale: [
          { time: 'start', value: '100%' },
          { time: 'end',   value: '108%' },
        ],
        animations: idx > 0 ? [
          { time: 'start', duration: 0.4, easing: 'ease-in-out', type: 'fade' },
        ] : [],
      });
    });
    trackNum++;

    // ── Dark scrim overlay — makes text readable over any background ──────────
    elements.push({
      type: 'shape',
      track: trackNum++,
      time: 0,
      duration: videoLength,
      x: '50%',
      y: '50%',
      width: '100%',
      height: '100%',
      fill_color: 'rgba(0,0,0,0.45)',
    });

    // ── Gold accent bar (top) ─────────────────────────────────────────────────
    elements.push({
      type: 'shape',
      track: trackNum++,
      time: 0,
      duration: videoLength,
      x: '50%',
      y: '5%',
      width: '25%',
      height: '0.4%',
      fill_color: '#d4af37',
    });

    // ── Hook text — large, centered, top half of screen ───────────────────────
    elements.push({
      type: 'text',
      track: trackNum++,
      time: 0,
      duration: 3.0,
      text: hook,
      x: '50%',
      y: '38%',
      width: '85%',
      font_family: 'Montserrat',
      font_size: '9 vmin',
      font_weight: '800',
      fill_color: '#ffffff',
      text_align: 'center',
      line_height: '1.25',
      shadow_color: 'rgba(0,0,0,0.6)',
      shadow_blur: '4px',
      shadow_x: '2px',
      shadow_y: '2px',
      animations: [
        { time: 'start', duration: 0.6, easing: 'ease-out', type: 'text-slide', direction: 'up', scope: 'word' },
        { time: 'end',   duration: 0.4, easing: 'ease-in',  type: 'fade' },
      ],
    });

    // ── Subtitle chunks — lower third, pill background ────────────────────────
    const subtitles = generateSubtitleTiming(script, 3.2, videoLength - 0.5);
    subtitles.forEach((sub) => {
      elements.push({
        type: 'text',
        track: trackNum,
        time: sub.start,
        duration: sub.length,
        text: sub.text,
        x: '50%',
        y: '80%',
        width: '88%',
        font_family: 'Open Sans',
        font_size: '7 vmin',
        font_weight: '700',
        fill_color: '#ffffff',
        text_align: 'center',
        background_color: 'rgba(0,0,0,0.60)',
        background_x_padding: '10%',
        background_y_padding: '8%',
        background_border_radius: '50%',
        shadow_color: 'rgba(0,0,0,0.5)',
        shadow_blur: '3px',
        animations: [
          { time: 'start', duration: 0.15, easing: 'ease-out', type: 'fade' },
          { time: 'end',   duration: 0.15, easing: 'ease-in',  type: 'fade' },
        ],
      });
    });
    trackNum++;

    // ── Branding watermark (subtle, bottom center) ────────────────────────────
    elements.push({
      type: 'text',
      track: trackNum++,
      time: 0,
      duration: videoLength,
      text: 'AuthorityContent.co',
      x: '50%',
      y: '94%',
      width: '80%',
      font_family: 'Open Sans',
      font_size: '3 vmin',
      font_weight: '400',
      fill_color: 'rgba(255,255,255,0.40)',
      text_align: 'center',
    });

    // ── Background music ──────────────────────────────────────────────────────
    const musicTracks: Record<string, string> = {
      calm:          'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3',
      bold:          'https://cdn.pixabay.com/audio/2022/01/18/audio_d0c6ff1c23.mp3',
      authoritative: 'https://cdn.pixabay.com/audio/2022/08/04/audio_2dde668d05.mp3',
      warm:          'https://cdn.pixabay.com/audio/2021/11/25/audio_91b32e02f9.mp3',
    };
    const musicUrl = musicTracks[tone] || musicTracks.calm;
    const musicVolume = voiceoverAudioUrl ? 0.07 : 0.22;

    elements.push({
      type: 'audio',
      track: trackNum++,
      time: 0,
      duration: videoLength,
      source: musicUrl,
      volume: musicVolume,
      audio_fade_in: 0.8,
      audio_fade_out: 1.2,
    });

    // ── Voiceover (optional) ──────────────────────────────────────────────────
    if (voiceoverAudioUrl) {
      elements.push({
        type: 'audio',
        track: trackNum++,
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

    console.log('[VideoRenderer] Submitting AutoReel render to Creatomate with', numImages, 'background images...');

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
