import { router, protectedProcedure } from "../_core/trpc";
import * as rateLimit from "../rateLimit";

export const rateLimitRouter = router({
  /**
   * Get current daily video usage for the authenticated user
   */
  getDailyUsage: protectedProcedure.query(async ({ ctx }) => {
    const usage = await rateLimit.getDailyVideoUsage(ctx.user.id);
    return usage;
  }),
});
