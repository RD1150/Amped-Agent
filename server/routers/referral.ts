/**
 * referral.ts
 * tRPC procedures for the referral incentive system.
 *
 * - getStats: returns the user's referral code, link, count, and credits earned
 * - applyCode: called during registration to apply a referral code
 */
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const referralRouter = router({
  /**
   * Get the current user's referral stats.
   * Generates a referral code if they don't have one yet.
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Ensure the user has a referral code
    const userRow = await db.getUserByOpenId(ctx.user.openId);
    if (!userRow) throw new Error("User not found");

    if (!userRow.referralCode) {
      await db.generateReferralCode(userId);
    }

    const stats = await db.getReferralStats(userId);
    return stats;
  }),

  /**
   * Apply a referral code for a newly registered user.
   * Awards 25 credits to both the new user and the referrer.
   * This is called server-side during registration, but exposed as a
   * protected procedure so the frontend can also trigger it post-login
   * if the ref query param was captured.
   */
  applyCode: protectedProcedure
    .input(z.object({ code: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const newUserId = ctx.user.id;

      // Check if already referred
      const userRow = await db.getUserByOpenId(ctx.user.openId);
      if (!userRow) throw new Error("User not found");
      if (userRow.referredBy !== null) {
        return { success: false, message: "Referral already applied." };
      }

      const referrer = await db.getUserByReferralCode(input.code);
      if (!referrer) {
        return { success: false, message: "Invalid referral code." };
      }
      if (referrer.id === newUserId) {
        return { success: false, message: "You cannot use your own referral code." };
      }

      await db.applyReferral(newUserId, referrer.id);
      return { success: true, message: "25 bonus credits added to your account!" };
    }),
});
