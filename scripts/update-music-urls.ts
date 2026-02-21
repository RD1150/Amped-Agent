import { db } from '../server/db';
import { musicTracks } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * This script updates music track URLs with working royalty-free music from Free Music Archive.
 * These are actual working MP3 URLs from Kevin MacLeod (incompetech.com) - royalty-free with attribution.
 */

// Free royalty-free music URLs from Free Music Archive (Kevin MacLeod)
// These are actual working URLs that can be used for testing
const musicSamples = [
  {
    id: 'luxury-piano',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Kevin_MacLeod/Impact/Kevin_MacLeod_-_Wallpaper.mp3',
  },
  {
    id: 'upbeat-corporate',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Kevin_MacLeod/Impact/Kevin_MacLeod_-_Deliberate_Thought.mp3',
  },
  {
    id: 'cinematic-drama',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Kevin_MacLeod/Impact/Kevin_MacLeod_-_Oppressive_Gloom.mp3',
  },
  {
    id: 'modern-tech',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Kevin_MacLeod/Impact/Kevin_MacLeod_-_Pixel_Peeker_Polka_-_Faster.mp3',
  },
  {
    id: 'calm-ambient',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Kevin_MacLeod/Impact/Kevin_MacLeod_-_Meditation_Impromptu_02.mp3',
  },
  {
    id: 'energetic-upbeat',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Kevin_MacLeod/Impact/Kevin_MacLeod_-_Pamgaea.mp3',
  },
  {
    id: 'dramatic-strings',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Kevin_MacLeod/Impact/Kevin_MacLeod_-_Oppressive_Gloom.mp3',
  },
  {
    id: 'uplifting-acoustic',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Kevin_MacLeod/Impact/Kevin_MacLeod_-_Deliberate_Thought.mp3',
  },
  {
    id: 'professional-corporate',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Kevin_MacLeod/Impact/Kevin_MacLeod_-_Wallpaper.mp3',
  },
  {
    id: 'energetic-electronic',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Kevin_MacLeod/Impact/Kevin_MacLeod_-_Pixel_Peeker_Polka_-_Faster.mp3',
  },
  {
    id: 'luxurious-elegant',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Kevin_MacLeod/Impact/Kevin_MacLeod_-_Wallpaper.mp3',
  },
  {
    id: 'fast-upbeat',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Kevin_MacLeod/Impact/Kevin_MacLeod_-_Pamgaea.mp3',
  },
];

async function updateMusicUrls() {
  console.log('🎵 Updating music track URLs with working Free Music Archive links...\n');

  for (const sample of musicSamples) {
    try {
      console.log(`Processing: ${sample.id}...`);
      
      // Update the database with the working URL
      await db
        .update(musicTracks)
        .set({ url: sample.url })
        .where(eq(musicTracks.id, sample.id));

      console.log(`✅ Updated ${sample.id}\n`);
    } catch (error: any) {
      console.error(`❌ Error updating ${sample.id}:`, error.message, '\n');
    }
  }

  console.log('✨ Music URL update complete!');
  console.log('📝 Note: These tracks are from Kevin MacLeod (incompetech.com) - royalty-free with attribution');
  process.exit(0);
}

updateMusicUrls().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
