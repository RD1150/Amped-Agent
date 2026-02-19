import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { MUSIC_LIBRARY, getTracksByPace, getTracksByMood, getTrackById, getRecommendedTracks } from "../musicLibrary";

/**
 * Music Library Router
 * Provides access to curated music tracks for Property Tours and Authority Reels
 */

export const musicLibraryRouter = router({
  /**
   * Get all music tracks
   */
  getAllTracks: publicProcedure.query(() => {
    return MUSIC_LIBRARY;
  }),

  /**
   * Get tracks filtered by pace
   */
  getByPace: publicProcedure
    .input(z.object({
      pace: z.enum(['slow', 'medium', 'fast', 'upbeat'])
    }))
    .query(({ input }) => {
      return getTracksByPace(input.pace);
    }),

  /**
   * Get tracks filtered by mood
   */
  getByMood: publicProcedure
    .input(z.object({
      mood: z.enum(['calm', 'dramatic', 'uplifting', 'professional', 'energetic', 'luxurious'])
    }))
    .query(({ input }) => {
      return getTracksByMood(input.mood);
    }),

  /**
   * Get track by ID
   */
  getById: publicProcedure
    .input(z.object({
      id: z.string()
    }))
    .query(({ input }) => {
      const track = getTrackById(input.id);
      if (!track) {
        throw new Error(`Track not found: ${input.id}`);
      }
      return track;
    }),

  /**
   * Get recommended tracks for property type
   */
  getRecommended: publicProcedure
    .input(z.object({
      propertyType: z.enum(['luxury', 'family', 'modern', 'commercial', 'any'])
    }))
    .query(({ input }) => {
      return getRecommendedTracks(input.propertyType);
    }),
});
