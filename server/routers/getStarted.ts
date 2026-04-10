import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getWatchedVideoIds, markVideoWatched, unmarkVideoWatched } from "../db";

export const getStartedRouter = router({
  /** Get all video IDs the current user has marked as watched */
  getWatched: protectedProcedure.query(async ({ ctx }) => {
    return getWatchedVideoIds(ctx.user.id);
  }),

  /** Mark a video as watched (toggle on) */
  markWatched: protectedProcedure
    .input(z.object({ videoId: z.string().max(64) }))
    .mutation(async ({ ctx, input }) => {
      await markVideoWatched(ctx.user.id, input.videoId);
      return { success: true };
    }),

  /** Unmark a video as watched (toggle off) */
  unmarkWatched: protectedProcedure
    .input(z.object({ videoId: z.string().max(64) }))
    .mutation(async ({ ctx, input }) => {
      await unmarkVideoWatched(ctx.user.id, input.videoId);
      return { success: true };
    }),
});
