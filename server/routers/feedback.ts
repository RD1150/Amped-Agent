import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { feedbackRatings } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const feedbackRouter = router({
  /**
   * Submit a 1-3 rating + optional quote after generating a post
   */
  submit: protectedProcedure
    .input(
      z.object({
        rating: z.number().int().min(1).max(3),
        quote: z.string().max(500).optional(),
        source: z.string().default("post_builder"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const userId = ctx.user.id;

      // Build agent title from user data
      const agentTitle = ctx.user.name ? `Agent` : "Real Estate Agent";

      await db.insert(feedbackRatings).values({
        userId,
        rating: input.rating,
        quote: input.quote ?? null,
        agentName: ctx.user.name ?? "Anonymous",
        agentTitle,
        source: input.source,
        approved: false,
      });

      return { success: true };
    }),

  /**
   * Check if the current user has already submitted feedback (to avoid duplicate prompts)
   */
  hasSubmitted: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { submitted: false };

    const existing = await db
      .select({ id: feedbackRatings.id })
      .from(feedbackRatings)
      .where(eq(feedbackRatings.userId, ctx.user.id))
      .limit(1);

    return { submitted: existing.length > 0 };
  }),

  /**
   * Admin: list all submitted feedback
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(feedbackRatings)
      .orderBy(desc(feedbackRatings.createdAt));
  }),

  /**
   * Admin: approve a feedback entry to show on landing page
   */
  approve: protectedProcedure
    .input(z.object({ id: z.number(), approved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(feedbackRatings)
        .set({
          approved: input.approved,
          approvedAt: input.approved ? new Date() : null,
        })
        .where(eq(feedbackRatings.id, input.id));

      return { success: true };
    }),

  /**
   * Public: list approved feedback for landing page
   */
  listApproved: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select({
        id: feedbackRatings.id,
        rating: feedbackRatings.rating,
        quote: feedbackRatings.quote,
        agentName: feedbackRatings.agentName,
        agentTitle: feedbackRatings.agentTitle,
        approvedAt: feedbackRatings.approvedAt,
      })
      .from(feedbackRatings)
      .where(eq(feedbackRatings.approved, true))
      .orderBy(desc(feedbackRatings.approvedAt));
  }),
});
