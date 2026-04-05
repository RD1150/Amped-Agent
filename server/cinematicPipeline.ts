/**
 * Cinematic Pipeline — Proper cinematic rendering for Property Slideshow
 *
 * This is DISTINCT from Ken Burns. Key differences:
 * - Faster, more aggressive motion (2.5–3.5s per photo vs 4–6s)
 * - Dramatic directional pans with diagonal feel
 * - Hard cuts / flash transitions instead of soft crossfades
 * - Cinematic color grade (warm teal-orange) on every clip
 * - Dark vignette overlay throughout
 * - Cinematic letterbox bars (2.39:1)
 * - Beat-synced timing (photos cut on music beats)
 */

export interface CinematicClipOptions {
  imageUrls: string[];
  aspectRatio: "16:9" | "9:16" | "1:1";
  musicBpm?: number; // BPM of the music track for beat-sync (default 120)
  movementSpeed?: "slow" | "fast"; // "fast" = 2.5s/photo, "slow" = 3.5s/photo
}

export interface CinematicClip {
  asset: { type: "image"; src: string };
  start: number;
  length: number;
  fit: "cover" | "contain";
  effect: string;
  filter?: string;
  transition?: { in?: string; out?: string };
}

/**
 * Cinematic motion effects — more aggressive than Ken Burns
 * These cycle in a pattern that creates visual variety and energy
 */
const CINEMATIC_EFFECTS = [
  "zoomIn",        // Dramatic push-in
  "slideLeft",     // Fast pan left
  "zoomOut",       // Pull-back reveal
  "slideRight",    // Fast pan right
  "zoomIn",        // Push-in again (most cinematic)
  "slideUp",       // Vertical reveal
  "zoomIn",        // Push-in
  "slideDown",     // Vertical drop
];

/**
 * Cinematic color grade filter
 * "warm" = teal shadows + warm highlights (classic cinematic look)
 */
const CINEMATIC_FILTER = "warm";

/**
 * Calculate beat-synced clip duration based on BPM
 * Snaps clip length to the nearest beat interval
 */
function getBeatSyncedDuration(bpm: number, targetSeconds: number): number {
  const beatInterval = 60 / bpm; // seconds per beat
  const beatsPerClip = Math.max(2, Math.round(targetSeconds / beatInterval));
  return beatsPerClip * beatInterval;
}

/**
 * Build cinematic image clips with aggressive motion, color grade, and hard cuts
 */
export function buildCinematicClips(options: CinematicClipOptions): {
  clips: CinematicClip[];
  totalDuration: number;
} {
  const { imageUrls, aspectRatio, musicBpm = 120, movementSpeed = "fast" } = options;

  // Cinematic timing: fast = 2.5s, slow = 3.5s per photo
  const baseSecondsPerPhoto = movementSpeed === "fast" ? 2.5 : 3.5;
  const durationPerPhoto = getBeatSyncedDuration(musicBpm, baseSecondsPerPhoto);

  const fitMode = aspectRatio === "9:16" ? "contain" : "cover";

  // Hard cut transition — very short flash (0.1s) instead of Ken Burns 0.8s crossfade
  // This is the key visual differentiator: cinematic = cuts, Ken Burns = dissolves
  const HARD_CUT_DURATION = 0.1;

  const clips: CinematicClip[] = imageUrls.map((url, index) => {
    const clipStart = index * durationPerPhoto;
    const effect = CINEMATIC_EFFECTS[index % CINEMATIC_EFFECTS.length];

    // First clip: no in-transition (starts clean)
    // Last clip: no out-transition (ends clean)
    const hasTransIn = index > 0;
    const hasTransOut = index < imageUrls.length - 1;

    const clip: CinematicClip = {
      asset: { type: "image", src: url },
      start: clipStart,
      length: durationPerPhoto + (hasTransIn ? HARD_CUT_DURATION : 0) + (hasTransOut ? HARD_CUT_DURATION : 0),
      fit: fitMode,
      effect,
      filter: CINEMATIC_FILTER,
    };

    // Hard cut transitions — "zoom" in = flash/cut feel, much faster than "fade"
    if (hasTransIn || hasTransOut) {
      clip.transition = {
        ...(hasTransIn && { in: "zoom" }),
        ...(hasTransOut && { out: "zoom" }),
      };
    }

    return clip;
  });

  const totalDuration = imageUrls.length * durationPerPhoto;
  return { clips, totalDuration };
}

/**
 * Build cinematic vignette overlay — dark edges throughout entire video
 */
export function buildCinematicVignette(
  aspectRatio: "16:9" | "9:16" | "1:1",
  totalDuration: number
): any {
  const width = aspectRatio === "9:16" ? 1080 : 1920;
  const height = aspectRatio === "9:16" ? 1920 : 1080;

  return {
    asset: {
      type: "html",
      html: `<div style="width:${width}px;height:${height}px;background:radial-gradient(ellipse at center,transparent 0%,transparent 40%,rgba(0,0,0,0.35) 65%,rgba(0,0,0,0.75) 100%);"></div>`,
      css: "body{margin:0;padding:0;overflow:hidden;background:transparent}",
      width,
      height,
    },
    start: 0,
    length: totalDuration,
    opacity: 0.9,
    position: "center",
  };
}

/**
 * Build cinematic letterbox bars — 2.39:1 aspect ratio black bars
 * Only applies to 16:9 videos (letterbox doesn't make sense for vertical)
 */
export function buildCinematicLetterbox(
  aspectRatio: "16:9" | "9:16" | "1:1",
  totalDuration: number
): any | null {
  if (aspectRatio !== "16:9") return null;

  // 2.39:1 in a 1920x1080 frame = 452px bars top and bottom
  // (1080 - 1920/2.39) / 2 = (1080 - 803) / 2 ≈ 138px per bar
  const barHeight = 138;
  const width = 1920;
  const height = 1080;

  const html = `<div style="width:${width}px;height:${height}px;position:relative;">
    <div style="position:absolute;top:0;left:0;width:100%;height:${barHeight}px;background:#000;"></div>
    <div style="position:absolute;bottom:0;left:0;width:100%;height:${barHeight}px;background:#000;"></div>
  </div>`;

  return {
    asset: {
      type: "html",
      html,
      css: "body{margin:0;padding:0;overflow:hidden;background:transparent}",
      width,
      height,
    },
    start: 0,
    length: totalDuration,
    opacity: 1,
    position: "center",
  };
}

/**
 * Build luxury animated lower-third for cinematic mode
 * Shows address and price with a gold accent bar
 */
export function buildCinematicLowerThird(
  address: string,
  detailsText: string,
  aspectRatio: "16:9" | "9:16" | "1:1",
  startTime: number,
  holdDuration: number
): any[] {
  const width = aspectRatio === "9:16" ? 1080 : 1920;
  const height = aspectRatio === "9:16" ? 1920 : 1080;
  const fontSize = aspectRatio === "9:16" ? 38 : 46;
  const subFontSize = aspectRatio === "9:16" ? 28 : 32;
  const bottomOffset = aspectRatio === "9:16" ? 0.20 : 0.15;

  const html = `<div style="
    width:${width}px;
    height:${height}px;
    display:flex;
    align-items:flex-end;
    justify-content:flex-start;
    padding-bottom:${Math.round(height * bottomOffset)}px;
    padding-left:${Math.round(width * 0.05)}px;
    box-sizing:border-box;
  ">
    <div style="
      background:linear-gradient(90deg,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.65) 75%,transparent 100%);
      padding:20px 48px 20px 28px;
      border-left:5px solid #C9A962;
      max-width:72%;
    ">
      <div style="
        color:#FFFFFF;
        font-family:'Montserrat',sans-serif;
        font-size:${fontSize}px;
        font-weight:700;
        line-height:1.2;
        letter-spacing:0.5px;
        text-shadow:0 2px 10px rgba(0,0,0,0.7);
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      ">${address}</div>
      ${detailsText ? `<div style="
        color:#C9A962;
        font-family:'Montserrat',sans-serif;
        font-size:${subFontSize}px;
        font-weight:500;
        margin-top:8px;
        letter-spacing:2px;
        text-transform:uppercase;
      ">${detailsText}</div>` : ""}
    </div>
  </div>`;

  return [
    {
      asset: {
        type: "html",
        html,
        css: "body{margin:0;padding:0;overflow:hidden;background:transparent}",
        width,
        height,
      },
      start: startTime,
      length: holdDuration,
      opacity: 1,
      position: "center",
      transition: {
        in: "slideLeft",
        out: "fade",
      },
    },
  ];
}

/**
 * Detect approximate BPM from a music track URL
 * Returns a default BPM if detection is not possible
 * (For now uses genre-based defaults; can be enhanced with audio analysis)
 */
export function getTrackBpm(musicTrackId?: string): number {
  // BPM defaults by track genre/mood
  // These are approximate values that produce good beat-sync results
  const trackBpmMap: Record<string, number> = {
    "cinematic-epic": 85,
    "cinematic-dramatic": 90,
    "luxury-ambient": 72,
    "upbeat-modern": 128,
    "soft-piano": 76,
    "corporate-inspire": 110,
    "emotional-strings": 80,
  };

  if (musicTrackId && trackBpmMap[musicTrackId]) {
    return trackBpmMap[musicTrackId];
  }

  // Default: 90 BPM — common for cinematic real estate music
  // At 90 BPM: beat = 0.67s, 4 beats = 2.67s per photo (perfect cinematic pacing)
  return 90;
}
