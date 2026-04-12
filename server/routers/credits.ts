import { z } from "zod";
import { router, protectedProcedure, authOnlyProcedure } from "../_core/trpc";
import * as credits from "../credits";

export const creditsRouter = router({
  /**
   * Get current credit balance
   */
  getBalance: authOnlyProcedure.query(async ({ ctx }) => {
    const balance = await credits.getCreditBalance(ctx.user.id);
    return { balance };
  }),

  /**
   * Get credit transaction history
   */
  getHistory: authOnlyProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(50),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const transactions = await credits.getCreditHistory(ctx.user.id, input?.limit);
      return transactions;
    }),

  /**
   * Calculate cost for a video
   */
  calculateCost: protectedProcedure
    .input(
      z.object({
        videoMode: z.enum(["standard", "ai-enhanced", "cinematic"]),
        enableVoiceover: z.boolean(),
      })
    )
    .query(({ input }) => {
      return credits.calculateVideoCost(input);
    }),

  /**
   * Get available credit packages
   */
  getPackages: protectedProcedure.query(() => {
    return Object.entries(credits.CREDIT_PACKAGES).map(([key, pkg]) => ({
      id: key,
      ...pkg,
      totalCredits: pkg.credits + ('bonus' in pkg ? pkg.bonus : 0),
    }));
  }),

  /**
   * Get monthly video pool status for the current user
   */
  getVideoPoolStatus: authOnlyProcedure.query(async ({ ctx }) => {
    return await credits.getVideoPoolStatus(ctx.user.id);
  }),

  /**
   * Get slot weights and overage costs (for UI display)
   */
  getPoolConfig: protectedProcedure.query(() => {
    return {
      slotWeights: credits.VIDEO_SLOT_WEIGHTS,
      overageCosts: credits.OVERAGE_CREDIT_COSTS,
      poolSizes: credits.MONTHLY_POOL_SIZES,
    };
  }),
});
