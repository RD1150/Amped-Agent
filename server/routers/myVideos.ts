import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { generatedVideos, propertyTours, aiReels, cinematicJobs, fullAvatarVideos, liveTourJobs, personas } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

export type UnifiedVideo = {
  id: string;
  source: 'listing_video' | 'cinematic_tour' | 'ai_reel' | 'avatar_video' | 'authority_reel' | 'live_tour';
  title: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  status: 'processing' | 'completed' | 'failed' | 'rendering';
  durationSeconds: number | null;
  createdAt: Date;
  city?: string | null; // Market/city badge for the video card
  metadata?: Record<string, unknown>;
};

export const myVideosRouter = router({
  // Unified list across all video tables
  listAll: protectedProcedure
    .input(
      z.object({
        source: z.enum(['all', 'listing_video', 'cinematic_tour', 'ai_reel', 'avatar_video', 'live_tour']).optional().default('all'),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;
      const src = input?.source ?? 'all';
      const results: UnifiedVideo[] = [];

      // Helper: extract city from an address string (last 1-2 parts before zip/state)
      const cityFromAddress = (addr: string | null | undefined): string | null => {
        if (!addr) return null;
        // Try to extract city from "123 Main St, Austin, TX 78701" → "Austin, TX"
        const parts = addr.split(',').map(s => s.trim());
        if (parts.length >= 3) return `${parts[parts.length - 2]}, ${parts[parts.length - 1].replace(/\s*\d{5}.*/, '').trim()}`;
        if (parts.length === 2) return parts[1].replace(/\s*\d{5}.*/, '').trim();
        return null;
      };

      // Fetch persona for agent's primary city (used for non-address videos)
      const personaRows = await db!.select().from(personas).where(eq(personas.userId, userId)).limit(1);
      const agentCityLabel = (() => {
        const p = personaRows[0];
        if (!p) return null;
        try {
          const sc = p.serviceCities ? JSON.parse(p.serviceCities as string) : null;
          if (Array.isArray(sc) && sc.length > 0) {
            const first = sc[0];
            if (typeof first === 'string') return first;
            if (first?.city) return `${first.city}${first.state ? ', ' + first.state : ''}`;
          }
        } catch {}
        return p.primaryCity ? `${p.primaryCity}${p.primaryState ? ', ' + p.primaryState : ''}` : null;
      })();

      // 1. Listing Videos (property_tours table)
      if (src === 'all' || src === 'listing_video') {
        const rows = await db!
          .select()
          .from(propertyTours)
          .where(eq(propertyTours.userId, userId))
          .orderBy(desc(propertyTours.createdAt));
        for (const r of rows) {
          if (!r.videoUrl) continue; // skip if never generated
          // Use address as title if available; fall back to city tag or generic label
          const listingTitle = r.address ?? r.city ?? 'Property Tour';
          // City badge: extract from address, or use the explicit city tag
          const listingCity = cityFromAddress(r.address) ?? r.city ?? null;
          results.push({
            id: `listing_${r.id}`,
            source: 'listing_video',
            title: listingTitle,
            videoUrl: r.videoUrl,
            thumbnailUrl: (r as any).thumbnailUrl ?? null,
            status: r.status === 'completed' ? 'completed' : r.status === 'failed' ? 'failed' : 'processing',
            durationSeconds: null,
            createdAt: r.createdAt,
            city: listingCity,
          });
        }
      }

      // 2. Cinematic Tours (cinematic_jobs table)
      if (src === 'all' || src === 'cinematic_tour') {
        const rows = await db!
          .select()
          .from(cinematicJobs)
          .where(eq(cinematicJobs.userId, userId))
          .orderBy(desc(cinematicJobs.createdAt));
        for (const r of rows) {
          if (!r.videoUrl && r.status !== 'done') continue;
          let snap: Record<string, unknown> = {};
          try { snap = r.inputSnapshot ? JSON.parse(r.inputSnapshot) : {}; } catch {}
          const cinAddr = (snap.address as string) ?? (snap.propertyAddress as string) ?? null;
          results.push({
            id: `cinematic_${r.id}`,
            source: 'cinematic_tour',
            title: cinAddr ?? 'Cinematic Tour',
            videoUrl: r.videoUrl ?? null,
            thumbnailUrl: null,
            status: r.status === 'done' ? 'completed' : r.status === 'failed' ? 'failed' : 'processing',
            durationSeconds: null,
            createdAt: r.createdAt,
            city: cityFromAddress(cinAddr),
            metadata: { jobId: r.id },
          });
        }
      }

      // 3. AI Reels (ai_reels table)
      if (src === 'all' || src === 'ai_reel') {
        const rows = await db!
          .select()
          .from(aiReels)
          .where(eq(aiReels.userId, userId))
          .orderBy(desc(aiReels.createdAt));
        for (const r of rows) {
          const videoUrl = r.s3Url ?? r.shotstackRenderUrl ?? r.didVideoUrl ?? null;
          if (!videoUrl) continue;
          results.push({
            id: `reel_${r.id}`,
            source: r.reelType === 'authority_reel' ? 'authority_reel' : 'ai_reel',
            title: r.title ?? 'AI Reel',
            videoUrl,
            thumbnailUrl: null,
            status: r.status === 'completed' ? 'completed' : r.status === 'failed' ? 'failed' : 'processing',
            durationSeconds: null,
            createdAt: r.createdAt,
            city: agentCityLabel,
          });
        }
      }

      // 4. Full Avatar Videos (full_avatar_videos table)
      if (src === 'all' || src === 'avatar_video') {
        const rows = await db!
          .select()
          .from(fullAvatarVideos)
          .where(eq(fullAvatarVideos.userId, userId))
          .orderBy(desc(fullAvatarVideos.createdAt));
        for (const r of rows) {
          if (!r.videoUrl) continue;
          results.push({
            id: `avatar_${r.id}`,
            source: 'avatar_video',
            title: r.title ?? 'Avatar Video',
            videoUrl: r.videoUrl,
            thumbnailUrl: null,
            status: r.status === 'completed' ? 'completed' : r.status === 'failed' ? 'failed' : 'processing',
            durationSeconds: r.duration ?? null,
            createdAt: r.createdAt,
            city: agentCityLabel,
          });
        }
      }

      // 5. Live Tour Jobs
      if (src === 'all' || src === 'live_tour') {
        const rows = await db!
          .select()
          .from(liveTourJobs)
          .where(eq(liveTourJobs.userId, userId))
          .orderBy(desc(liveTourJobs.createdAt));
        for (const r of rows) {
          if (!r.videoUrl && r.status !== 'completed') continue;
          results.push({
            id: `livetour_${r.id}`,
            source: 'live_tour',
            title: r.propertyAddress ?? 'Live Tour',
            videoUrl: r.videoUrl ?? null,
            thumbnailUrl: r.thumbnailUrl ?? null,
            status: r.status === 'completed' ? 'completed' : r.status === 'failed' ? 'failed' : 'processing',
            durationSeconds: null,
            createdAt: r.createdAt,
            city: cityFromAddress(r.propertyAddress),
          });
        }
      }

      // Sort all results by createdAt descending
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return results;
    }),

  // List all videos for the current user (legacy — generatedVideos table only)
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
      const insertResult = await db!.insert(generatedVideos).values({
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
      }).returning();
      return { id: (result as any)?.id as number, success: true };
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

  // Delete a unified video by composite ID (e.g. "listing_42", "cinematic_abc", "reel_7", "avatar_3")
  deleteUnified: protectedProcedure
    .input(z.object({ compositeId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;
      const { compositeId } = input;

      if (compositeId.startsWith('listing_')) {
        const numId = parseInt(compositeId.replace('listing_', ''), 10);
        if (isNaN(numId)) throw new Error('Invalid video ID');
        await db!
          .delete(propertyTours)
          .where(and(eq(propertyTours.id, numId), eq(propertyTours.userId, userId)));
      } else if (compositeId.startsWith('cinematic_')) {
        const jobId = compositeId.replace('cinematic_', '');
        await db!
          .delete(cinematicJobs)
          .where(and(eq(cinematicJobs.id, jobId), eq(cinematicJobs.userId, userId)));
      } else if (compositeId.startsWith('reel_')) {
        const numId = parseInt(compositeId.replace('reel_', ''), 10);
        if (isNaN(numId)) throw new Error('Invalid video ID');
        await db!
          .delete(aiReels)
          .where(and(eq(aiReels.id, numId), eq(aiReels.userId, userId)));
      } else if (compositeId.startsWith('avatar_')) {
        const numId = parseInt(compositeId.replace('avatar_', ''), 10);
        if (isNaN(numId)) throw new Error('Invalid video ID');
        await db!
          .delete(fullAvatarVideos)
          .where(and(eq(fullAvatarVideos.id, numId), eq(fullAvatarVideos.userId, userId)));
      } else if (compositeId.startsWith('livetour_')) {
        const jobId = compositeId.replace('livetour_', '');
        await db!
          .delete(liveTourJobs)
          .where(and(eq(liveTourJobs.id, jobId), eq(liveTourJobs.userId, userId)));
      } else {
        throw new Error('Unknown video type');
      }

      return { success: true };
    }),
});
