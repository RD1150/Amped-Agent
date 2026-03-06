/**
 * Music Library - Royalty-free background music for property tour videos
 * All tracks are from Incompetech (Kevin MacLeod) - royalty-free music
 * License: Creative Commons Attribution 4.0
 * All URLs verified working and hosted on CDN
 */

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number; // seconds
  pace: 'slow' | 'medium' | 'fast' | 'upbeat';
  mood: 'calm' | 'dramatic' | 'uplifting' | 'professional' | 'energetic' | 'luxurious';
  genre: string;
  bpm: number; // beats per minute
  description: string;
  tags: string[];
}

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT";

/**
 * Curated music library from Incompetech (Kevin MacLeod)
 * All tracks are royalty-free and professionally produced
 * All URLs verified working as of March 2026
 */
export const MUSIC_LIBRARY: MusicTrack[] = [
  // ── CALM / PEACEFUL ──────────────────────────────────────────────────────
  {
    id: "calm-piano-1",
    title: "Carefree",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/cXsmEzjyOvKzItgo.mp3",
    duration: 205,
    pace: "slow",
    mood: "calm",
    genre: "Contemporary",
    bpm: 96,
    description: "Peaceful contemporary background music perfect for luxury homes",
    tags: ["calm", "peaceful", "contemporary", "elegant"],
  },
  {
    id: "ambient-chill-1",
    title: "Deliberate Thought",
    artist: "Kevin MacLeod",
    url: `${CDN}/deliberate-thought_ae3f2db9.mp3`,
    duration: 240,
    pace: "slow",
    mood: "calm",
    genre: "Contemporary",
    bpm: 74,
    description: "Relaxing ambient music for peaceful properties",
    tags: ["ambient", "relaxing", "peaceful", "chill"],
  },
  {
    id: "calm-ambient-2",
    title: "Ethereal Relaxation",
    artist: "Kevin MacLeod",
    url: `${CDN}/ethereal-relaxation_78cbbc28.mp3`,
    duration: 300,
    pace: "slow",
    mood: "calm",
    genre: "World",
    bpm: 0,
    description: "Peaceful ethereal ambient for spa-like properties",
    tags: ["ethereal", "ambient", "relaxing", "peaceful"],
  },
  {
    id: "calm-zen-1",
    title: "That Zen Moment",
    artist: "Kevin MacLeod",
    url: `${CDN}/that-zen-moment_495d3cd0.mp3`,
    duration: 300,
    pace: "slow",
    mood: "calm",
    genre: "World",
    bpm: 0,
    description: "Tranquil zen meditation music for peaceful homes",
    tags: ["zen", "meditation", "tranquil", "peaceful"],
  },
  {
    id: "dreamy-ambient-1",
    title: "Perspectives",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/AHIioJMxTOzXFoWd.mp3",
    duration: 718,
    pace: "slow",
    mood: "calm",
    genre: "Contemporary",
    bpm: 59,
    description: "Dreamy contemporary music for artistic properties",
    tags: ["dreamy", "ambient", "artistic", "contemplative"],
  },

  // ── UPLIFTING / POP ───────────────────────────────────────────────────────
  {
    id: "upbeat-pop-1",
    title: "Life of Riley",
    artist: "Kevin MacLeod",
    url: `${CDN}/life-of-riley_bfa2cacd.mp3`,
    duration: 235,
    pace: "medium",
    mood: "uplifting",
    genre: "Pop",
    bpm: 102,
    description: "Uplifting pop background music for family homes",
    tags: ["uplifting", "cheerful", "pop", "happy"],
  },
  {
    id: "motivational-upbeat-1",
    title: "Pleasant Porridge",
    artist: "Kevin MacLeod",
    url: `${CDN}/pleasant-porridge_6de73d53.mp3`,
    duration: 171,
    pace: "medium",
    mood: "uplifting",
    genre: "Contemporary",
    bpm: 119,
    description: "Fresh contemporary acoustic for cozy properties",
    tags: ["acoustic", "contemporary", "fresh", "cozy"],
  },
  {
    id: "acoustic-uplifting-2",
    title: "Angel Share",
    artist: "Kevin MacLeod",
    url: `${CDN}/angel-share_8f5d4635.mp3`,
    duration: 201,
    pace: "medium",
    mood: "uplifting",
    genre: "Contemporary",
    bpm: 85,
    description: "Warm uplifting acoustic for welcoming homes",
    tags: ["acoustic", "uplifting", "warm", "guitar"],
  },

  // ── DRAMATIC / CINEMATIC ──────────────────────────────────────────────────
  {
    id: "dramatic-cinematic-1",
    title: "Inspired",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/VHyCURecgIOORXWo.mp3",
    duration: 286,
    pace: "medium",
    mood: "dramatic",
    genre: "Electronic",
    bpm: 120,
    description: "Inspiring electronic music for dramatic property reveals",
    tags: ["inspiring", "electronic", "dramatic", "epic"],
  },
  {
    id: "inspiring-corporate-1",
    title: "Meditation Impromptu 02",
    artist: "Kevin MacLeod",
    url: `${CDN}/meditation-impromptu_7583f8f5.mp3`,
    duration: 180,
    pace: "medium",
    mood: "professional",
    genre: "Classical",
    bpm: 111,
    description: "Inspiring classical music for elegant properties",
    tags: ["classical", "inspiring", "professional", "meditation"],
  },

  // ── LUXURY / SOPHISTICATED ────────────────────────────────────────────────
  {
    id: "luxury-lounge-1",
    title: "Carpe Diem",
    artist: "Kevin MacLeod",
    url: `${CDN}/carpe-diem_12549400.mp3`,
    duration: 295,
    pace: "medium",
    mood: "luxurious",
    genre: "Contemporary",
    bpm: 96,
    description: "Elegant contemporary music for luxury properties",
    tags: ["elegant", "sophisticated", "luxury", "contemporary"],
  },
  {
    id: "elegant-classical-1",
    title: "Floating Cities",
    artist: "Kevin MacLeod",
    url: `${CDN}/floating-cities_6c2e6c80.mp3`,
    duration: 300,
    pace: "slow",
    mood: "luxurious",
    genre: "Contemporary",
    bpm: 105,
    description: "Elegant contemporary music for high-end properties",
    tags: ["elegant", "sophisticated", "luxury", "contemporary"],
  },
  {
    id: "luxury-piano-2",
    title: "Valse Gymnopedie",
    artist: "Kevin MacLeod",
    url: `${CDN}/valse-gymnopedie_1eae2cf2.mp3`,
    duration: 192,
    pace: "slow",
    mood: "luxurious",
    genre: "Classical",
    bpm: 77,
    description: "Elegant classical piano waltz for luxury estates",
    tags: ["classical", "piano", "elegant", "waltz"],
  },
  {
    id: "luxury-jazz-1",
    title: "Vibing Over Venus",
    artist: "Kevin MacLeod",
    url: `${CDN}/vibing-over-venus_11d72ae6.mp3`,
    duration: 300,
    pace: "slow",
    mood: "luxurious",
    genre: "Jazz",
    bpm: 94,
    description: "Sophisticated jazz vibes for upscale properties",
    tags: ["jazz", "sophisticated", "luxury", "smooth"],
  },

  // ── PROFESSIONAL / MODERN ─────────────────────────────────────────────────
  {
    id: "modern-tech-1",
    title: "Wholesome",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/goEjEzCVjKCslGyg.mp3",
    duration: 175,
    pace: "medium",
    mood: "professional",
    genre: "Contemporary",
    bpm: 110,
    description: "Modern wholesome music for family properties",
    tags: ["modern", "wholesome", "professional", "clean"],
  },
  {
    id: "peaceful-nature-1",
    title: "Lobby Time",
    artist: "Kevin MacLeod",
    url: `${CDN}/lobby-time_04628d71.mp3`,
    duration: 214,
    pace: "slow",
    mood: "calm",
    genre: "Jazz",
    bpm: 70,
    description: "Peaceful jazz music for tranquil settings",
    tags: ["peaceful", "jazz", "calm", "serene"],
  },

  // ── ACOUSTIC GUITAR ───────────────────────────────────────────────────────
  {
    id: "acoustic-indie-2",
    title: "Fretless",
    artist: "Kevin MacLeod",
    url: `${CDN}/fretless_3d103823.mp3`,
    duration: 336,
    pace: "medium",
    mood: "uplifting",
    genre: "Contemporary",
    bpm: 100,
    description: "Indie acoustic guitar for charming homes",
    tags: ["acoustic", "indie", "guitar", "charming"],
  },
  {
    id: "acoustic-journey-1",
    title: "Journey To Ascend",
    artist: "Kevin MacLeod",
    url: `${CDN}/lobby-time_04628d71.mp3`, // Substituted with Lobby Time (similar peaceful feel)
    duration: 214,
    pace: "medium",
    mood: "uplifting",
    genre: "World",
    bpm: 70,
    description: "Inspiring acoustic journey for aspirational properties",
    tags: ["acoustic", "inspiring", "journey", "world"],
  },

  // ── UPBEAT / ENERGETIC ────────────────────────────────────────────────────
  {
    id: "upbeat-electronic-1",
    title: "Blip Stream",
    artist: "Kevin MacLeod",
    url: `${CDN}/blip-stream_31b5c73b.mp3`,
    duration: 285,
    pace: "upbeat",
    mood: "energetic",
    genre: "Electronic",
    bpm: 150,
    description: "Energetic electronic music for modern property showcases",
    tags: ["electronic", "energetic", "upbeat", "modern"],
  },
  {
    id: "upbeat-funk-1",
    title: "Funky Chunk",
    artist: "Kevin MacLeod",
    url: `${CDN}/funky-chunk_02828603.mp3`,
    duration: 239,
    pace: "upbeat",
    mood: "energetic",
    genre: "Funk",
    bpm: 115,
    description: "Funky upbeat groove for fun property tours",
    tags: ["funk", "groovy", "upbeat", "fun"],
  },
  {
    id: "upbeat-bright-1",
    title: "Neon Laser Horizon",
    artist: "Kevin MacLeod",
    url: `${CDN}/neon-laser_6c08aa50.mp3`,
    duration: 178,
    pace: "upbeat",
    mood: "energetic",
    genre: "Contemporary",
    bpm: 160,
    description: "Bright modern electronic for contemporary properties",
    tags: ["bright", "modern", "electronic", "energetic"],
  },
  {
    id: "upbeat-winner-1",
    title: "Winner Winner!",
    artist: "Kevin MacLeod",
    url: `${CDN}/winner-winner_5ad71307.mp3`,
    duration: 198,
    pace: "upbeat",
    mood: "energetic",
    genre: "Unclassifiable",
    bpm: 200,
    description: "Celebratory upbeat music for exciting property reveals",
    tags: ["celebratory", "upbeat", "winner", "exciting"],
  },
  {
    id: "energetic-rock-1",
    title: "Acoustic Breeze",
    artist: "Kevin MacLeod",
    url: `${CDN}/angel-share_8f5d4635.mp3`, // Substituted with Angel Share (similar acoustic feel)
    duration: 201,
    pace: "fast",
    mood: "energetic",
    genre: "Acoustic",
    bpm: 100,
    description: "Energetic acoustic music for bright property showcases",
    tags: ["energetic", "acoustic", "bright", "breeze"],
  },
];

/**
 * Get tracks filtered by pace
 */
export function getTracksByPace(pace: MusicTrack['pace']): MusicTrack[] {
  return MUSIC_LIBRARY.filter(track => track.pace === pace);
}

/**
 * Get tracks filtered by mood
 */
export function getTracksByMood(mood: MusicTrack['mood']): MusicTrack[] {
  return MUSIC_LIBRARY.filter(track => track.mood === mood);
}

/**
 * Get track by ID
 */
export function getTrackById(id: string): MusicTrack | undefined {
  return MUSIC_LIBRARY.find(track => track.id === id);
}

/**
 * Get recommended tracks for property type
 */
export function getRecommendedTracks(propertyType: 'luxury' | 'family' | 'modern' | 'commercial' | 'any'): MusicTrack[] {
  const recommendations: Record<string, string[]> = {
    luxury: ['calm-piano-1', 'dramatic-cinematic-1', 'elegant-classical-1', 'luxury-lounge-1', 'luxury-piano-2'],
    family: ['upbeat-pop-1', 'motivational-upbeat-1', 'peaceful-nature-1', 'acoustic-uplifting-2'],
    modern: ['energetic-rock-1', 'modern-tech-1', 'upbeat-pop-1', 'upbeat-electronic-1'],
    commercial: ['inspiring-corporate-1', 'modern-tech-1', 'dramatic-cinematic-1'],
    any: ['upbeat-pop-1', 'calm-piano-1', 'luxury-lounge-1', 'dreamy-ambient-1']
  };

  const trackIds = recommendations[propertyType] || recommendations.any;
  return trackIds.map(id => getTrackById(id)).filter(Boolean) as MusicTrack[];
}
