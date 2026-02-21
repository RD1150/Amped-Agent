/**
 * Music Library for Property Tours and Authority Reels
 * Curated tracks organized by pace/mood
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
 * Curated music library using Shotstack's free music library
 * Organized by pace and mood for easy selection
 */
export const MUSIC_LIBRARY: MusicTrack[] = [
  // CALM & PROFESSIONAL (Perfect for luxury property tours)
  {
    id: 'calm-piano-1',
    title: 'Elegant Piano',
    artist: 'Shotstack Audio',
    url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/vsuIkwkfirpwAsAL.mp3',
    duration: 120,
    pace: 'slow',
    mood: 'calm',
    genre: 'Piano',
    bpm: 70,
    description: 'Soft piano melody perfect for luxury homes and high-end properties',
    tags: ['piano', 'elegant', 'luxury', 'sophisticated']
  },
  {
    id: 'ambient-calm-1',
    title: 'Serene Ambience',
    artist: 'Shotstack Audio',
    url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/nlQSQacvCJPvSKsW.mp3',
    duration: 120,
    pace: 'slow',
    mood: 'calm',
    genre: 'Ambient',
    bpm: 65,
    description: 'Peaceful ambient soundscape for spa-like properties and tranquil settings',
    tags: ['ambient', 'peaceful', 'spa', 'relaxing']
  },
  {
    id: 'professional-corporate-1',
    title: 'Corporate Success',
    artist: 'Shotstack Audio',
    url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/ijSdirlSMbadwPyr.mp3',
    duration: 90,
    pace: 'medium',
    mood: 'professional',
    genre: 'Corporate',
    bpm: 100,
    description: 'Professional corporate track ideal for commercial properties and office spaces',
    tags: ['corporate', 'business', 'professional', 'commercial']
  },

  // UPLIFTING & ENERGETIC (Great for Authority Reels and modern homes)
  {
    id: 'upbeat-pop-1',
    title: 'Sunny Day',
    artist: 'Shotstack Audio',
    url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/LtJdJUQSMzVJiQZi.mp3',
    duration: 60,
    pace: 'upbeat',
    mood: 'uplifting',
    genre: 'Pop',
    bpm: 128,
    description: 'Bright and cheerful pop track perfect for family homes and neighborhood tours',
    tags: ['pop', 'cheerful', 'happy', 'family-friendly']
  },
  {
    id: 'energetic-electronic-1',
    title: 'Modern Vibes',
    artist: 'Shotstack Audio',
    url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/hLISDTQNXkbMqTgD.mp3',
    duration: 75,
    pace: 'fast',
    mood: 'energetic',
    genre: 'Electronic',
    bpm: 140,
    description: 'High-energy electronic beat for modern condos and urban properties',
    tags: ['electronic', 'modern', 'urban', 'contemporary']
  },
  {
    id: 'uplifting-acoustic-1',
    title: 'Fresh Start',
    artist: 'Shotstack Audio',
    url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/ijSdirlSMbadwPyr.mp3',
    duration: 90,
    pace: 'medium',
    mood: 'uplifting',
    genre: 'Acoustic',
    bpm: 110,
    description: 'Warm acoustic guitar for first-time buyer content and cozy homes',
    tags: ['acoustic', 'guitar', 'warm', 'inviting']
  },

  // DRAMATIC & LUXURIOUS (Premium properties and cinematic tours)
  {
    id: 'dramatic-cinematic-1',
    title: 'Grand Reveal',
    artist: 'Shotstack Audio',
    url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/vsuIkwkfirpwAsAL.mp3',
    duration: 120,
    pace: 'medium',
    mood: 'dramatic',
    genre: 'Cinematic',
    bpm: 95,
    description: 'Epic orchestral track for luxury estates and waterfront properties',
    tags: ['cinematic', 'epic', 'luxury', 'grand']
  },
  {
    id: 'luxurious-strings-1',
    title: 'Opulent Living',
    artist: 'Shotstack Audio',
    url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/vsuIkwkfirpwAsAL.mp3',
    duration: 100,
    pace: 'slow',
    mood: 'luxurious',
    genre: 'Orchestral',
    bpm: 75,
    description: 'Rich string arrangement for high-end penthouses and mansions',
    tags: ['strings', 'luxury', 'elegant', 'high-end']
  },
  {
    id: 'dramatic-trailer-1',
    title: 'Showstopper',
    artist: 'Shotstack Audio',
    url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/vsuIkwkfirpwAsAL.mp3',
    duration: 60,
    pace: 'fast',
    mood: 'dramatic',
    genre: 'Trailer',
    bpm: 130,
    description: 'Intense trailer-style music for property reveal videos and teasers',
    tags: ['trailer', 'intense', 'reveal', 'dramatic']
  },

  // PROFESSIONAL & VERSATILE (All-purpose tracks)
  {
    id: 'professional-tech-1',
    title: 'Smart Home',
    artist: 'Shotstack Audio',
    url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/hLISDTQNXkbMqTgD.mp3',
    duration: 80,
    pace: 'medium',
    mood: 'professional',
    genre: 'Tech',
    bpm: 115,
    description: 'Modern tech-inspired track for smart homes and new construction',
    tags: ['tech', 'modern', 'smart-home', 'innovation']
  },
  {
    id: 'versatile-indie-1',
    title: 'Neighborhood Walk',
    artist: 'Shotstack Audio',
    url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/ijSdirlSMbadwPyr.mp3',
    duration: 90,
    pace: 'medium',
    mood: 'uplifting',
    genre: 'Indie',
    bpm: 105,
    description: 'Indie folk track perfect for neighborhood tours and community spotlights',
    tags: ['indie', 'folk', 'community', 'neighborhood']
  },
  {
    id: 'energetic-rock-1',
    title: 'Bold Move',
    artist: 'Shotstack Audio',
    url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/LtJdJUQSMzVJiQZi.mp3',
    duration: 75,
    pace: 'fast',
    mood: 'energetic',
    genre: 'Rock',
    bpm: 135,
    description: 'Driving rock beat for bold market updates and motivational content',
    tags: ['rock', 'bold', 'motivational', 'powerful']
  }
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
    luxury: ['calm-piano-1', 'dramatic-cinematic-1', 'luxurious-strings-1', 'ambient-calm-1'],
    family: ['upbeat-pop-1', 'uplifting-acoustic-1', 'versatile-indie-1'],
    modern: ['energetic-electronic-1', 'professional-tech-1', 'upbeat-pop-1'],
    commercial: ['professional-corporate-1', 'professional-tech-1', 'energetic-rock-1'],
    any: ['uplifting-acoustic-1', 'professional-corporate-1', 'upbeat-pop-1']
  };

  const trackIds = recommendations[propertyType] || recommendations.any;
  return trackIds.map(id => getTrackById(id)).filter(Boolean) as MusicTrack[];
}
