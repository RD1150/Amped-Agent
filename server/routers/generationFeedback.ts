import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { generationFeedback } from "../../drizzle/schema";
import { desc, avg, count, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const generationFeedbackRouter = router({
  // Submit a rating after a generation completes
  submit: protectedProcedure
    .input(
      z.object({
        toolType: z.enum([
          "full_avatar_video",
          "ai_reels",
          "property_tour",
          "post_builder",
          "blog_builder",
          "youtube_builder",
          "newsletter",
          "lead_magnet",
          "market_insights",
          "expert_hooks",
          "listing_presentation",
          "other",
        ]),
        rating: z.number().int().min(1).max(5),
        referenceId: z.number().int().optional(),
        referenceTable: z.string().max(100).optional(),
        note: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(generationFeedback).values({
        userId: ctx.user.id,
        toolType: input.toolType,
        rating: input.rating,
        referenceId: input.referenceId,
        referenceTable: input.referenceTable,
        note: input.note,
      });
      return { success: true };
    }),

  // Owner-only: get aggregated stats per tool
  ownerStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const stats = await db
      .select({
        toolType: generationFeedback.toolType,
        avgRating: avg(generationFeedback.rating),
        totalRatings: count(generationFeedback.id),
        oneStars: sql<number>`SUM(CASE WHEN ${generationFeedback.rating} = 1 THEN 1 ELSE 0 END)`,
        twoStars: sql<number>`SUM(CASE WHEN ${generationFeedback.rating} = 2 THEN 1 ELSE 0 END)`,
        threeStars: sql<number>`SUM(CASE WHEN ${generationFeedback.rating} = 3 THEN 1 ELSE 0 END)`,
        fourStars: sql<number>`SUM(CASE WHEN ${generationFeedback.rating} = 4 THEN 1 ELSE 0 END)`,
        fiveStars: sql<number>`SUM(CASE WHEN ${generationFeedback.rating} = 5 THEN 1 ELSE 0 END)`,
      })
      .from(generationFeedback)
      .groupBy(generationFeedback.toolType)
      .orderBy(desc(avg(generationFeedback.rating)));

    return stats;
  }),

  // Owner-only: get recent individual ratings with notes
  ownerRecent: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const recent = await db
        .select()
        .from(generationFeedback)
        .orderBy(desc(generationFeedback.createdAt))
        .limit(input.limit);

      return recent;
    }),
});
