import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { generatedVideos } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

export const myVideosRouter = router({
  // List all videos for the current user
  list: protectedProcedure
    .input(
      z.object({
        type: z.enum(['property_tour', 'authority_reel', 'market_stats', 'all']).optional().default('all'),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;
      const typeFilter = input?.type ?? 'all';

      const rows = await db!
        .select()
        .from(generatedVideos)
        .where(
          typeFilter === 'all'
            ? eq(generatedVideos.userId, userId)
            : and(
                eq(generatedVideos.userId, userId),
                eq(generatedVideos.type, typeFilter)
              )
        )
        .orderBy(desc(generatedVideos.createdAt));

      return rows;
    }),

  // Save a new video record (called after render is queued)
  save: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        type: z.enum(['property_tour', 'authority_reel', 'market_stats']),
        renderId: z.string().optional(),
        videoUrl: z.string().url().optional(),
        thumbnailUrl: z.string().url().optional(),
        durationSeconds: z.number().int().positive().optional(),
        hasVoiceover: z.boolean().optional().default(false),
        creditsCost: z.number().int().min(0).optional().default(0),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const [result] = await db!.insert(generatedVideos).values({
        userId: ctx.user.id,
        title: input.title,
        type: input.type,
        renderId: input.renderId,
        videoUrl: input.videoUrl,
        thumbnailUrl: input.thumbnailUrl,
        status: input.videoUrl ? 'completed' : 'rendering',
        durationSeconds: input.durationSeconds,
        hasVoiceover: input.hasVoiceover ?? false,
        creditsCost: input.creditsCost ?? 0,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      });
      return { id: (result as any).insertId as number, success: true };
    }),

  // Update video status and URL when render completes
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(['rendering', 'completed', 'failed']),
        videoUrl: z.string().url().optional(),
        thumbnailUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      await db!
        .update(generatedVideos)
        .set({
          status: input.status,
          videoUrl: input.videoUrl,
          thumbnailUrl: input.thumbnailUrl,
        })
        .where(
          and(
            eq(generatedVideos.id, input.id),
            eq(generatedVideos.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  // Delete a video record (does not delete from S3)
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      await db!
        .delete(generatedVideos)
        .where(
          and(
            eq(generatedVideos.id, input.id),
            eq(generatedVideos.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),
});
