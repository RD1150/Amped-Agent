/**
 * Music Library - Royalty-free background music for property tour videos
 * All tracks are from Incompetech (Kevin MacLeod) - royalty-free music
 * License: Creative Commons Attribution 4.0
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

/**
 * Curated music library from Incompetech (Kevin MacLeod)
 * All tracks are royalty-free and professionally produced
 */
export const MUSIC_LIBRARY: MusicTrack[] = [
  {
    id: "calm-piano-1",
    title: "Carefree",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/HKZsgPMHFbADDJtw.mp3",
    duration: 205,
    pace: "slow",
    mood: "calm",
    genre: "Contemporary",
    bpm: 96,
    description: "Peaceful contemporary background music perfect for luxury homes",
    tags: ["calm", "peaceful", "contemporary", "elegant"],
  },
  {
    id: "upbeat-pop-1",
    title: "Life of Riley",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/ySbAZKBtQebTVBOw.mp3",
    duration: 235,
    pace: "medium",
    mood: "uplifting",
    genre: "Pop",
    bpm: 102,
    description: "Uplifting pop background music for family homes",
    tags: ["uplifting", "cheerful", "pop", "happy"],
  },
  {
    id: "dramatic-cinematic-1",
    title: "Inspired",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/QqMGPzKEignnPyxt.mp3",
    duration: 286,
    pace: "medium",
    mood: "dramatic",
    genre: "Electronic",
    bpm: 120,
    description: "Inspiring electronic music for dramatic property reveals",
    tags: ["inspiring", "electronic", "dramatic", "epic"],
  },
  {
    id: "luxury-lounge-1",
    title: "Carpe Diem",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/gfeDJolMkMUdfaBA.mp3",
    duration: 295,
    pace: "medium",
    mood: "luxurious",
    genre: "Contemporary",
    bpm: 96,
    description: "Elegant contemporary music for luxury properties",
    tags: ["elegant", "sophisticated", "luxury", "contemporary"],
  },
  {
    id: "modern-tech-1",
    title: "Newer Wave",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/IafPcBCszOgmFkHQ.mp3",
    duration: 175,
    pace: "medium",
    mood: "professional",
    genre: "Electronic",
    bpm: 110,
    description: "Modern electronic music for tech-savvy properties",
    tags: ["modern", "electronic", "innovative", "tech"],
  },
  {
    id: "ambient-chill-1",
    title: "Airship Serenity",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/trCFcRzdNnrhSRIc.mp3",
    duration: 240,
    pace: "slow",
    mood: "calm",
    genre: "Electronic",
    bpm: 74,
    description: "Relaxing ambient music for peaceful properties",
    tags: ["ambient", "relaxing", "peaceful", "chill"],
  },
  {
    id: "inspiring-corporate-1",
    title: "Move Forward",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/JxlpLxEWBfaIxrQt.mp3",
    duration: 69,
    pace: "medium",
    mood: "professional",
    genre: "Electronic",
    bpm: 111,
    description: "Inspiring corporate music for commercial properties",
    tags: ["corporate", "inspiring", "professional", "business"],
  },
  {
    id: "elegant-classical-1",
    title: "Inner Light",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/CrRYIgRzMSSASJRi.mp3",
    duration: 576,
    pace: "slow",
    mood: "luxurious",
    genre: "Contemporary",
    bpm: 105,
    description: "Elegant contemporary music for high-end properties",
    tags: ["elegant", "sophisticated", "luxury", "classical"],
  },
  {
    id: "energetic-rock-1",
    title: "Happy Bee",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/EccowAYxHnomOsEJ.mp3",
    duration: 302,
    pace: "fast",
    mood: "energetic",
    genre: "Rock",
    bpm: 122,
    description: "Energetic rock music for bold property showcases",
    tags: ["energetic", "rock", "powerful", "bold"],
  },
  {
    id: "peaceful-nature-1",
    title: "Dream Culture",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/WhYOYQkbFBjRkeib.mp3",
    duration: 214,
    pace: "slow",
    mood: "calm",
    genre: "Contemporary",
    bpm: 70,
    description: "Peaceful contemporary music for tranquil settings",
    tags: ["peaceful", "nature", "calm", "serene"],
  },
  {
    id: "motivational-upbeat-1",
    title: "Montauk Point",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/tYOuCkIUIYaHraLh.mp3",
    duration: 220,
    pace: "medium",
    mood: "uplifting",
    genre: "Contemporary",
    bpm: 118,
    description: "Motivational contemporary music for inspiring tours",
    tags: ["motivational", "uplifting", "inspiring", "contemporary"],
  },
  {
    id: "dreamy-ambient-1",
    title: "Perspectives",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/tRddSesiQHtESofk.mp3",
    duration: 718,
    pace: "slow",
    mood: "calm",
    genre: "Contemporary",
    bpm: 59,
    description: "Dreamy contemporary music for artistic properties",
    tags: ["dreamy", "ambient", "artistic", "contemplative"],
  },
  // UPBEAT / ENERGETIC
  {
    id: "upbeat-electronic-1",
    title: "Blip Stream",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/SFODCnXUyqbZvQXQ.mp3",
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
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/BwxRNJSWjRfACBjS.mp3",
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
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/lwfAamXAOUYIGDoL.mp3",
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
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/OPTEsifIORjYBgZf.mp3",
    duration: 198,
    pace: "upbeat",
    mood: "energetic",
    genre: "Unclassifiable",
    bpm: 200,
    description: "Celebratory upbeat music for exciting property reveals",
    tags: ["celebratory", "upbeat", "winner", "exciting"],
  },
  // LUXURY / CALM
  {
    id: "luxury-piano-2",
    title: "Valse Gymnopedie",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/DjnCScWztZOSthkN.mp3",
    duration: 192,
    pace: "slow",
    mood: "luxurious",
    genre: "Classical",
    bpm: 77,
    description: "Elegant classical piano waltz for luxury estates",
    tags: ["classical", "piano", "elegant", "waltz"],
  },
  {
    id: "calm-ambient-2",
    title: "Ethereal Relaxation",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/YwvbdqcwyqIjFZzt.mp3",
    duration: 1686,
    pace: "slow",
    mood: "calm",
    genre: "World",
    bpm: 0,
    description: "Peaceful ethereal ambient for spa-like properties",
    tags: ["ethereal", "ambient", "relaxing", "peaceful"],
  },
  {
    id: "luxury-jazz-1",
    title: "Vibing Over Venus",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/IeGkImYJcbAaPurv.mp3",
    duration: 411,
    pace: "slow",
    mood: "luxurious",
    genre: "Jazz",
    bpm: 94,
    description: "Sophisticated jazz vibes for upscale properties",
    tags: ["jazz", "sophisticated", "luxury", "smooth"],
  },
  {
    id: "calm-zen-1",
    title: "That Zen Moment",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/KQVVDJdhelmMmMCA.mp3",
    duration: 602,
    pace: "slow",
    mood: "calm",
    genre: "World",
    bpm: 0,
    description: "Tranquil zen meditation music for peaceful homes",
    tags: ["zen", "meditation", "tranquil", "peaceful"],
  },
  // ACOUSTIC GUITAR
  {
    id: "acoustic-uplifting-2",
    title: "Angel Share",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/LFRqOIeyDkFZkPvD.mp3",
    duration: 201,
    pace: "medium",
    mood: "uplifting",
    genre: "Contemporary",
    bpm: 85,
    description: "Warm uplifting acoustic for welcoming homes",
    tags: ["acoustic", "uplifting", "warm", "guitar"],
  },
  {
    id: "acoustic-fresh-1",
    title: "Pleasant Porridge",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/IrsGKnHMeWCRbvhw.mp3",
    duration: 171,
    pace: "medium",
    mood: "uplifting",
    genre: "Contemporary",
    bpm: 119,
    description: "Fresh contemporary acoustic for cozy properties",
    tags: ["acoustic", "contemporary", "fresh", "cozy"],
  },
  {
    id: "acoustic-indie-2",
    title: "Fretless",
    artist: "Kevin MacLeod",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/LteTaryvyHrrPPLy.mp3",
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
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/SCPqLjkWPWIKzUCG.mp3",
    duration: 219,
    pace: "medium",
    mood: "uplifting",
    genre: "World",
    bpm: 116,
    description: "Inspiring acoustic journey for aspirational properties",
    tags: ["acoustic", "inspiring", "journey", "world"],
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
    luxury: ['calm-piano-1', 'dramatic-cinematic-1', 'elegant-classical-1', 'luxury-lounge-1'],
    family: ['upbeat-pop-1', 'motivational-upbeat-1', 'peaceful-nature-1'],
    modern: ['energetic-rock-1', 'modern-tech-1', 'upbeat-pop-1'],
    commercial: ['inspiring-corporate-1', 'modern-tech-1', 'energetic-rock-1'],
    any: ['upbeat-pop-1', 'calm-piano-1', 'motivational-upbeat-1']
  };

  const trackIds = recommendations[propertyType] || recommendations.any;
  return trackIds.map(id => getTrackById(id)).filter(Boolean) as MusicTrack[];
}
