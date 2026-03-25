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

// Luxury real estate background images — Thousand Oaks / Conejo Valley aesthetic ($1.2M+ properties)
// AI-generated, owned by Authority Content. All 9:16 vertical for Reels.
const DEFAULT_REEL_BACKGROUNDS: Record<string, string[]> = {
  // calm tone → buyers category: welcoming exteriors and interiors
  buyers: [
    'https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/luxury-buyers-1-grJnxLAwCzBPkv9nF4Gezq.png',  // Mediterranean estate, golden hour
    'https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/luxury-buyers-2-LoaeCgGWjstVA4wtip3x4t.png',  // Open-concept living room, hills view
    'https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/luxury-warm-1-QSWa5T3q83LLZUDVoPAPfm.png',     // Master bedroom, Conejo Valley view
    'https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/luxury-market-1-SRcyURdL6TVfVhysVKugwM.png',   // Aerial Thousand Oaks neighborhood
  ],
  // bold tone → sellers category: striking exteriors and curb appeal
  sellers: [
    'https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/luxury-sellers-1-QpUjJ2pMpHBNFNDh64rfu5.png',  // Contemporary stone home, Conejo hills
    'https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/luxury-sellers-2-GDpNAm28pmgVDzwEGnsUQV.png',  // Resort-style pool, outdoor kitchen
    'https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/luxury-buyers-1-grJnxLAwCzBPkv9nF4Gezq.png',  // Mediterranean estate
    'https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/luxury-market-1-SRcyURdL6TVfVhysVKugwM.png',   // Aerial neighborhood
  ],
  // warm tone → luxury category: aspirational interiors and lifestyle
  luxury: [
    'https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/luxury-warm-2-m3HL2nmQKNbD9S7geitD7J.png',     // Family dining, oak tree views
    'https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/luxury-warm-1-QSWa5T3q83LLZUDVoPAPfm.png',     // Master suite, balcony, hills
    'https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/luxury-sellers-2-GDpNAm28pmgVDzwEGnsUQV.png',  // Resort pool at sunset
    'https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/luxury-buyers-2-LoaeCgGWjstVA4wtip3x4t.png',  // Living room, floor-to-ceiling windows
  ],
  // authoritative tone → investors/market category: professional and market-authority visuals
  investors: [
    'https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/luxury-market-1-SRcyURdL6TVfVhysVKugwM.png',   // Aerial Thousand Oaks neighborhood
    'https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/luxury-authoritative-1-VHWFSp8CKot2n9JJtVEong.png', // Chef's kitchen, Conejo hills view
    'https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/luxury-authoritative-2-kaDp9j4vs49dGtWFBmEsR2.png', // Agent with clients, $1.3M listing
    'https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/luxury-sellers-1-QpUjJ2pMpHBNFNDh64rfu5.png',  // Contemporary home, stone facade
  ],
};

export interface MarketUpdateRenderOptions {
  location: string;
  medianPrice: number;
  priceChange: number;       // YoY %
  daysOnMarket: number;
  activeListings: number;
  pricePerSqft: number;
  marketTemperature: 'hot' | 'balanced' | 'cold';
  voiceoverAudioUrl?: string;
  agentName?: string;
  brokerageName?: string;
  headshotUrl?: string;
  headshotOffsetY?: number;
  headshotZoom?: number;
}

export interface VideoRenderOptions {
  hook: string;
  script: string;
  videoLength: number; // in seconds
  tone: 'calm' | 'bold' | 'authoritative' | 'warm';
  voiceoverAudioUrl?: string;
  voiceAlignment?: Array<{ word: string; start: number; end: number }>; // ElevenLabs word timestamps
  backgroundImages?: string[]; // agent-uploaded photos (optional)
  backgroundCategory?: string; // 'buyers' | 'sellers' | 'luxury' | 'investors'
  captionsEnabled?: boolean;   // default true
  captionSize?: 'normal' | 'large'; // default 'normal'
  captionStyle?: 'white' | 'yellow' | 'gold' | 'none'; // default 'white'
  // Agent branding watermark
  headshotUrl?: string;       // Agent headshot URL for watermark circle
  headshotOffsetY?: number;   // Vertical position 0-100 (50 = center)
  headshotZoom?: number;      // Zoom 100-200 (100 = no zoom)
  agentName?: string;         // Agent display name
  brokerageName?: string;     // Brokerage name
}

interface RenderResult {
  renderId: string;
  status: 'queued' | 'rendering' | 'done' | 'failed';
  url?: string;
  error?: string;
}

/**
 * Build subtitle timing from ElevenLabs word-level alignment data.
 * Groups words into chunks of 4-5 words, using the real spoken start/end
 * times so subtitles appear and disappear in perfect sync with the voice.
 *
 * Each chunk starts at the first word's spoken start time and ends at the
 * last word's spoken end time, with a minimum display of 2.5s so short
 * phrases don't flash.
 */
function buildSubtitleTimingsFromAlignment(
  alignment: Array<{ word: string; start: number; end: number }>,
  hookWordCount: number, // number of hook words to skip (already shown as hook overlay)
  totalDuration: number
): Array<{ text: string; start: number; length: number }> {
  if (alignment.length === 0) return [];

  // Skip hook words — they are already displayed as the hook overlay text
  const scriptWords = alignment.slice(hookWordCount);
  if (scriptWords.length === 0) return [];

  const CHUNK_SIZE = 5;
  const MIN_CHUNK_DURATION = 3.0; // hard floor: no card disappears in under 3s
  const result: Array<{ text: string; start: number; length: number }> = [];

  for (let i = 0; i < scriptWords.length; i += CHUNK_SIZE) {
    const chunk = scriptWords.slice(i, i + CHUNK_SIZE);
    const text = chunk.map(w => w.word).join(' ');
    // Timestamps are already wall-clock seconds from audio start
    const start = chunk[0].start;
    const naturalEnd = chunk[chunk.length - 1].end;
    // Extend duration all the way to the next chunk's start — zero gap between chunks
    const nextStart = scriptWords[i + CHUNK_SIZE]?.start;
    // Hold until next chunk begins (no gap), or hold 1s after last word for final chunk
    const holdEnd = nextStart ?? (naturalEnd + 1.0);
    const length = Math.max(MIN_CHUNK_DURATION, holdEnd - start);

    if (start + length > totalDuration + 1.0) break;

    result.push({ text, start, length });
  }

  return result;
}

/**
 * Fallback: split script into subtitle chunks timed to match natural speech pace.
 * Used only when ElevenLabs word timestamps are not available.
 */
function generateSubtitleTiming(
  script: string,
  startAt: number,
  totalDuration: number
): Array<{ text: string; start: number; length: number }> {
  const words = script.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return [];

  const CHUNK_SIZE = 5;
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += CHUNK_SIZE) {
    chunks.push(words.slice(i, i + CHUNK_SIZE).join(' '));
  }

  const SECS_PER_WORD = 60 / 130; // ≈ 0.462s at 130 wpm
  // No inter-chunk pause — chunks are contiguous so there is never a blank frame
  const MIN_CHUNK_DURATION = 3.0;

  const result: Array<{ text: string; start: number; length: number }> = [];
  let cursor = startAt;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkWords = chunk.split(/\s+/).length;
    const speechDuration = chunkWords * SECS_PER_WORD;
    const displayDuration = Math.max(MIN_CHUNK_DURATION, speechDuration);

    if (cursor + displayDuration > totalDuration + 0.5) break;

    result.push({ text: chunk, start: cursor, length: displayDuration });
    // Next chunk starts exactly when this one ends — zero gap
    cursor += displayDuration;
  }

  return result;
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
  const { hook, script, tone, voiceoverAudioUrl } = options;
  // Caption settings
  const captionsEnabled = options.captionsEnabled !== false; // default true
  const captionSize = options.captionSize ?? 'normal';
  const captionStyle = options.captionStyle ?? 'white';
  // Enforce minimum 30-second duration
  const videoLength = Math.max(30, options.videoLength);
  // Only show subtitles for videos at or above the minimum readable duration
  const SUBTITLE_MIN_DURATION = 30;
  const enableSubtitles = captionsEnabled && videoLength >= SUBTITLE_MIN_DURATION;

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
      fill_color: '#C9A962',
    });

    // ── Hook text — luxury serif, dark reduced-opacity band ────────────────
    elements.push({
      type: 'text',
      track: trackNum++,
      time: 0,
      duration: 3.2,
      text: hook,
      x: '50%',
      y: '38%',
      width: '82%',
      font_family: 'Cormorant Garamond',
      font_size: '9 vmin',
      font_weight: '600',
      fill_color: '#FFFFFF',
      text_align: 'center',
      line_height: '1.3',
      shadow_color: 'rgba(0,0,0,0.75)',
      shadow_blur: '8px',
      shadow_x: '0px',
      shadow_y: '3px',
      background_color: 'rgba(8,8,8,0.58)',
      background_x_padding: '5%',
      background_y_padding: '3%',
      border_radius: '4px',
      animations: [
        { time: 'start', duration: 0.6, easing: 'ease-out', type: 'text-slide', direction: 'up', scope: 'word' },
        { time: 'end',   duration: 0.4, easing: 'ease-in',  type: 'fade' },
      ],
    });

    // ── Subtitle chunks — lower third, luxury Montserrat style ──────────────
    // Prefer real ElevenLabs word timestamps for perfect sync; fall back to
    // estimated speech-rate timing when timestamps are not available.
    const HOOK_DURATION = 3.2; // fallback only (no-timestamps path)
    const hookWordCount = hook.split(/\s+/).filter(Boolean).length;
    const subtitles = enableSubtitles
      ? (options.voiceAlignment && options.voiceAlignment.length > 0
          ? buildSubtitleTimingsFromAlignment(options.voiceAlignment, hookWordCount, videoLength - 0.5)
          : generateSubtitleTiming(script, HOOK_DURATION, videoLength - 0.5))
      : [];
    subtitles.forEach((sub) => {
      elements.push({
        type: 'text',
        track: trackNum,
        time: sub.start,
        duration: sub.length,
        text: sub.text,
        x: '50%',
        y: '87%',
        width: '84%',
        font_family: 'Montserrat',
        font_size: captionSize === 'large' ? '7.5 vmin' : '6 vmin',
        font_weight: '500',
        fill_color: captionStyle === 'yellow' ? '#FBBF24' :
                    captionStyle === 'gold'   ? '#C9A962' :
                    '#F5F0E8',
        text_align: 'center',
        ...(captionStyle !== 'none' ? {
          background_color: captionStyle === 'yellow' ? 'rgba(8,8,8,0.72)' :
                            captionStyle === 'gold'   ? 'rgba(8,8,8,0.60)' :
                            'rgba(8,8,8,0.72)',
          background_x_padding: '4%',
          background_y_padding: '2%',
          border_radius: '4px',
        } : {}),
        shadow_color: 'rgba(0,0,0,0.9)',
        shadow_blur: captionStyle === 'none' ? '12px' : '6px',
        shadow_x: '0px',
        shadow_y: '2px',
        // No fade-in/fade-out animations — they cause a visible blink between
        // consecutive subtitle chunks. Text appears and disappears instantly,
        // which reads as a smooth word-by-word update rather than a flash.
      });
    });
    trackNum++;

    // ── Branding watermark (subtle, bottom center) ────────────────────────
    elements.push({
      type: 'text',
      track: trackNum++,
      time: 0,
      duration: videoLength,
      text: 'AuthorityContent.co',
      x: '50%',
      y: '95%',
      width: '80%',
      font_family: 'Montserrat',
      font_size: '2.8 vmin',
      font_weight: '400',
      fill_color: 'rgba(201,169,98,0.45)',
      text_align: 'center',
    });

    // ── Agent headshot watermark circle (bottom-left) ─────────────────────────
    if (options.headshotUrl) {
      const offsetY = options.headshotOffsetY ?? 50;  // 0=top, 100=bottom, 50=center
      const zoom = options.headshotZoom ?? 100;        // 100=fit, 200=2x
      // Creatomate image element inside a circle clip
      elements.push({
        type: 'image',
        track: trackNum++,
        time: 0,
        duration: videoLength,
        source: options.headshotUrl,
        x: '12%',
        y: '91%',
        width: '14%',
        height: '7%',
        fit: 'cover',
        // object_position maps offsetY (0-100) to CSS-style "50% {offsetY}%"
        object_position: `50% ${offsetY}%`,
        x_scale: zoom / 100,
        y_scale: zoom / 100,
        border_radius: '50%',
        border_width: '2px',
        border_color: '#C9A962',
      });
      // Agent name and brokerage text next to the circle
      if (options.agentName || options.brokerageName) {
        const nameLines = [options.agentName, options.brokerageName].filter(Boolean).join('\n');
        elements.push({
          type: 'text',
          track: trackNum++,
          time: 0,
          duration: videoLength,
          text: nameLines,
          x: '38%',
          y: '91%',
          width: '48%',
          font_family: 'Montserrat',
          font_size: '2.4 vmin',
          font_weight: '600',
          fill_color: '#FFFFFF',
          text_align: 'left',
          line_height: '1.3',
          shadow_color: 'rgba(0,0,0,0.8)',
          shadow_blur: '4px',
          shadow_x: '0px',
          shadow_y: '1px',
        });
      }
    }

    // ── Background music ──────────────────────────────────────────────────────
    const musicTracks: Record<string, string> = {
      calm:          'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3',
      bold:          'https://cdn.pixabay.com/audio/2022/01/18/audio_d0c6ff1c23.mp3',
      authoritative: 'https://cdn.pixabay.com/audio/2022/08/04/audio_2dde668d05.mp3',
      warm:          'https://cdn.pixabay.com/audio/2021/11/25/audio_91b32e02f9.mp3',
    };
    const musicUrl = musicTracks[tone] || musicTracks.calm;
    const musicVolume = voiceoverAudioUrl ? '7%' : '22%';

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
        duration: 'media', // use full audio length, not clipped to videoLength
        source: voiceoverAudioUrl,
        volume: '100%',
        audio_fade_out: 0.5,
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
 * Render a Market Update reel (9:16) with real stat callouts.
 * Layout: intro slide → 4 stat slides (price, DOM, inventory, $/sqft) → CTA slide.
 * Each slide is 4 seconds. Total: 24 seconds.
 */
export async function renderMarketUpdateReel(options: MarketUpdateRenderOptions): Promise<RenderResult> {
  const apiKey = ENV.CREATOMATE_API_KEY;
  if (!apiKey) {
    return { renderId: '', status: 'failed', error: 'CREATOMATE_API_KEY is not configured.' };
  }

  try {
    const { location, medianPrice, priceChange, daysOnMarket, activeListings, pricePerSqft, marketTemperature, voiceoverAudioUrl, agentName } = options;

    const priceDir = priceChange > 0 ? '↑' : priceChange < 0 ? '↓' : '→';
    const priceChangeAbs = Math.abs(priceChange).toFixed(1);
    const tempLabel = marketTemperature === 'hot' ? "🔥 Seller's Market" : marketTemperature === 'cold' ? "❄️ Buyer's Market" : '⚖️ Balanced Market';
    const tempColor = marketTemperature === 'hot' ? '#ff6b35' : marketTemperature === 'cold' ? '#4fc3f7' : '#66bb6a';

    // 6 slides × 4s each = 24s total
    const SLIDE_DUR = 4.0;
    const TOTAL = 6 * SLIDE_DUR;

    const slides = [
      // Slide 0 — Intro
      { headline: location, subline: 'Real Estate Market Update', accent: '#d4af37' },
      // Slide 1 — Median Price
      { headline: `$${(medianPrice / 1000).toFixed(0)}K`, subline: `Median Home Price  ${priceDir} ${priceChangeAbs}% YoY`, accent: '#d4af37' },
      // Slide 2 — Days on Market
      { headline: `${daysOnMarket}`, subline: 'Avg. Days on Market', accent: '#d4af37' },
      // Slide 3 — Active Listings
      { headline: `${activeListings.toLocaleString()}`, subline: 'Active Listings', accent: '#d4af37' },
      // Slide 4 — Price per Sqft
      { headline: `$${pricePerSqft}`, subline: 'Price per Sq Ft', accent: '#d4af37' },
      // Slide 5 — Market Temp + CTA
      { headline: tempLabel, subline: agentName ? `Questions? Contact ${agentName}` : 'Follow for weekly market updates', accent: tempColor },
    ];

    // Background images — use authoritative/investors pool
    const bgPool = DEFAULT_REEL_BACKGROUNDS.investors;
    const elements: any[] = [];
    let trackNum = 1;

    // ── Background images — one per slide, Ken Burns ──────────────────────────
    slides.forEach((_, idx) => {
      const bgUrl = bgPool[idx % bgPool.length];
      elements.push({
        type: 'image',
        track: trackNum,
        time: idx * SLIDE_DUR,
        duration: SLIDE_DUR + 0.3,
        source: bgUrl,
        x: '50%', y: '50%', width: '100%', height: '100%', fit: 'cover',
        x_scale: [{ time: 'start', value: '100%' }, { time: 'end', value: '107%' }],
        y_scale: [{ time: 'start', value: '100%' }, { time: 'end', value: '107%' }],
        animations: idx > 0 ? [{ time: 'start', duration: 0.35, easing: 'ease-in-out', type: 'fade' }] : [],
      });
    });
    trackNum++;

    // ── Dark gradient scrim — heavier at top and bottom for text contrast ──────
    elements.push({ type: 'shape', track: trackNum++, time: 0, duration: TOTAL, x: '50%', y: '50%', width: '100%', height: '100%', fill_color: 'rgba(0,0,0,0.48)' });

    // ── Per-slide content ─────────────────────────────────────────────────────
    slides.forEach((slide, idx) => {
      const t = idx * SLIDE_DUR;
      const isStatSlide = idx >= 1 && idx <= 4;

      // Thin gold horizontal rule — luxury divider
      elements.push({ type: 'shape', track: trackNum, time: t + 0.2, duration: SLIDE_DUR - 0.3, x: '50%', y: '22%', width: '28%', height: '0.4%', fill_color: '#C9A962' });

      // Headline — large stat number (Cormorant Garamond for elegance) or location title
      elements.push({
        type: 'text', track: trackNum + 1, time: t, duration: SLIDE_DUR - 0.1,
        text: slide.headline,
        x: '50%', y: isStatSlide ? '44%' : '40%', width: '88%',
        font_family: isStatSlide ? 'Cormorant Garamond' : 'Cormorant Garamond',
        font_size: isStatSlide ? '24 vmin' : '10 vmin',
        font_weight: isStatSlide ? '600' : '600',
        fill_color: '#FFFFFF',
        text_align: 'center',
        shadow_color: 'rgba(0,0,0,0.8)', shadow_blur: '8px', shadow_x: '0px', shadow_y: '3px',
        animations: [
          { time: 'start', duration: 0.55, easing: 'ease-out', type: 'text-slide', direction: 'up', scope: 'element' },
          { time: 'end',   duration: 0.3, easing: 'ease-in',  type: 'fade' },
        ],
      });

      // Subline — label in Montserrat, gold for stat slides
      elements.push({
        type: 'text', track: trackNum + 2, time: t + 0.35, duration: SLIDE_DUR - 0.45,
        text: slide.subline,
        x: '50%', y: isStatSlide ? '63%' : '56%', width: '82%',
        font_family: 'Montserrat', font_size: '5.5 vmin', font_weight: '500',
        fill_color: isStatSlide ? '#C9A962' : '#F5F0E8', text_align: 'center',
        shadow_color: 'rgba(0,0,0,0.7)', shadow_blur: '4px', shadow_x: '0px', shadow_y: '2px',
        animations: [
          { time: 'start', duration: 0.4, easing: 'ease-out', type: 'fade' },
          { time: 'end',   duration: 0.3, easing: 'ease-in',  type: 'fade' },
        ],
      });

      // Second gold rule below subline on stat slides
      if (isStatSlide) {
        elements.push({ type: 'shape', track: trackNum + 3, time: t + 0.4, duration: SLIDE_DUR - 0.5, x: '50%', y: '72%', width: '18%', height: '0.3%', fill_color: '#C9A962' });
      }
    });
    trackNum += 4;

    // ── Branding watermark ──────────────────────────────────────────────────────
    elements.push({
      type: 'text', track: trackNum++, time: 0, duration: TOTAL,
      text: 'AuthorityContent.co',
      x: '50%', y: '95%', width: '80%',
      font_family: 'Montserrat', font_size: '2.8 vmin', font_weight: '400',
      fill_color: 'rgba(201,169,98,0.45)', text_align: 'center',
    });

    // ── Agent headshot watermark circle (bottom-left) ─────────────────────────
    if (options.headshotUrl) {
      const offsetY = options.headshotOffsetY ?? 50;
      const zoom = options.headshotZoom ?? 100;
      elements.push({
        type: 'image', track: trackNum++, time: 0, duration: TOTAL,
        source: options.headshotUrl,
        x: '12%', y: '91%', width: '14%', height: '7%',
        fit: 'cover',
        object_position: `50% ${offsetY}%`,
        x_scale: zoom / 100, y_scale: zoom / 100,
        border_radius: '50%', border_width: '2px', border_color: '#C9A962',
      });
      if (options.agentName || options.brokerageName) {
        const nameLines = [options.agentName, options.brokerageName].filter(Boolean).join('\n');
        elements.push({
          type: 'text', track: trackNum++, time: 0, duration: TOTAL,
          text: nameLines,
          x: '38%', y: '91%', width: '48%',
          font_family: 'Montserrat', font_size: '2.4 vmin', font_weight: '600',
          fill_color: '#FFFFFF', text_align: 'left', line_height: '1.3',
          shadow_color: 'rgba(0,0,0,0.8)', shadow_blur: '4px', shadow_x: '0px', shadow_y: '1px',
        });
      }
    }

    // ── Background music (authoritative) ─────────────────────────────────────────────
    const musicVolume = voiceoverAudioUrl ? '6%' : '20%';
    elements.push({
      type: 'audio', track: trackNum++, time: 0, duration: TOTAL,
      source: 'https://cdn.pixabay.com/audio/2022/08/04/audio_2dde668d05.mp3',
      volume: musicVolume, audio_fade_in: 0.8, audio_fade_out: 1.2,
    });
    // ── Voiceover (optional) ──────────────────────────────────────────────────
    if (voiceoverAudioUrl) {
      elements.push({
        type: 'audio', track: trackNum++, time: 0, duration: 'media',
        source: voiceoverAudioUrl, volume: '100%', audio_fade_out: 0.5,
      });
    }

    const renderScript = {
      output_format: 'mp4',
      width: 1080,
      height: 1920,
      frame_rate: 30,
      duration: TOTAL,
      elements,
    };

    console.log('[VideoRenderer] Submitting MarketUpdate render to Creatomate for', location);

    const response = await fetch(`${CREATOMATE_API_URL}/renders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: renderScript }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Creatomate API error: ${response.status} — ${errorText.substring(0, 300)}`);
    }

    const result = await response.json();
    const render = Array.isArray(result) ? result[0] : result;
    if (!render?.id) throw new Error('Invalid response from Creatomate API — missing render ID');

    console.log('[VideoRenderer] MarketUpdate render queued:', render.id);
    return { renderId: render.id, status: 'queued' };
  } catch (error: any) {
    console.error('[VideoRenderer] MarketUpdate render error:', error);
    return { renderId: '', status: 'failed', error: error.message || 'Unknown error occurred' };
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
