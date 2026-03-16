import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { users, propertyTours, creditTransactions, apiUsageLogs } from "../../drizzle/schema";
import { sql, eq, and, gte } from "drizzle-orm";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const adminRouter = router({
  /**
   * Get platform analytics (admin only)
   */
  getAnalytics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Total users
    const [totalUsersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const totalUsers = totalUsersResult?.count || 0;

    // New users today
    const [newUsersTodayResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.createdAt, todayStart));
    const newUsersToday = newUsersTodayResult?.count || 0;

    // Daily active users (logged in today)
    const [dauResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.lastSignedIn, todayStart));
    const dailyActiveUsers = dauResult?.count || 0;

    // Total videos
    const [totalVideosResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(propertyTours)
      .where(eq(propertyTours.status, "completed"));
    const totalVideos = totalVideosResult?.count || 0;

    // Videos today
    const [videosTodayResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(propertyTours)
      .where(
        and(
          eq(propertyTours.status, "completed"),
          gte(propertyTours.createdAt, todayStart)
        )
      );
    const videosToday = videosTodayResult?.count || 0;

    // Videos by tier
    const [standardResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(propertyTours)
      .where(
        and(
          eq(propertyTours.status, "completed"),
          eq(propertyTours.videoMode, "standard")
        )
      );
    const standardVideos = standardResult?.count || 0;

    const [aiEnhancedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(propertyTours)
      .where(
        and(
          eq(propertyTours.status, "completed"),
          eq(propertyTours.videoMode, "ai-enhanced")
        )
      );
    const aiEnhancedVideos = aiEnhancedResult?.count || 0;

    const [fullAiResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(propertyTours)
      .where(
        and(
          eq(propertyTours.status, "completed"),
          eq(propertyTours.videoMode, "full-ai")
        )
      );
    const fullAiVideos = fullAiResult?.count || 0;

    // Credit purchases
    const [creditPurchasesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(creditTransactions)
      .where(eq(creditTransactions.usageType, "credit_purchase"));
    const creditPurchases = creditPurchasesResult?.count || 0;

    // Total revenue (sum of credit purchase amounts)
    const creditPurchaseTransactions = await db
      .select({ amount: creditTransactions.amount })
      .from(creditTransactions)
      .where(eq(creditTransactions.usageType, "credit_purchase"));
    
    // Calculate revenue: $49/100 credits, $149/350 credits, $399/1000 credits
    const totalRevenue = creditPurchaseTransactions.reduce((sum, t) => {
      const credits = t.amount;
      let price = 0;
      if (credits === 100) price = 49;
      else if (credits === 350) price = 149;
      else if (credits === 1000) price = 399;
      return sum + price;
    }, 0);

    // Rate limit hits (users who hit 10/day limit today)
    const [rateLimitHitsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          gte(users.dailyVideoCount, 10),
          gte(users.lastDailyReset, todayStart)
        )
      );
    const rateLimitHits = rateLimitHitsResult?.count || 0;

    // Subscription distribution
    const [freeUsersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.subscriptionTier, "starter"));
    const freeUsers = freeUsersResult?.count || 0;

    const [proUsersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.subscriptionTier, "pro"));
    const proUsers = proUsersResult?.count || 0;

    const [premiumUsersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.subscriptionTier, "premium"));
    const premiumUsers = premiumUsersResult?.count || 0;

    return {
      totalUsers,
      newUsersToday,
      dailyActiveUsers,
      totalVideos,
      videosToday,
      standardVideos,
      aiEnhancedVideos,
      fullAiVideos,
      creditPurchases,
      totalRevenue,
      rateLimitHits,
      freeUsers,
      proUsers,
      premiumUsers,
    };
  }),

  /**
   * Get AI spend analytics (admin only)
   */
  getSpendAnalytics: adminProcedure
    .input(z.object({ months: z.number().min(1).max(12).default(3) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const since = new Date();
      since.setMonth(since.getMonth() - input.months);

      // Total spend by service
      const byService = await db
        .select({
          service: apiUsageLogs.service,
          totalCost: sql<number>`SUM(CAST(${apiUsageLogs.estimatedCostUsd} AS DECIMAL(10,6)))`,
          totalUnits: sql<number>`SUM(CAST(${apiUsageLogs.units} AS DECIMAL(10,4)))`,
          callCount: sql<number>`COUNT(*)`,
        })
        .from(apiUsageLogs)
        .where(gte(apiUsageLogs.createdAt, since))
        .groupBy(apiUsageLogs.service);

      // Total spend by feature
      const byFeature = await db
        .select({
          feature: apiUsageLogs.feature,
          service: apiUsageLogs.service,
          totalCost: sql<number>`SUM(CAST(${apiUsageLogs.estimatedCostUsd} AS DECIMAL(10,6)))`,
          callCount: sql<number>`COUNT(*)`,
        })
        .from(apiUsageLogs)
        .where(gte(apiUsageLogs.createdAt, since))
        .groupBy(apiUsageLogs.feature, apiUsageLogs.service)
        .orderBy(sql`SUM(CAST(${apiUsageLogs.estimatedCostUsd} AS DECIMAL(10,6))) DESC`);

      // Monthly spend totals (last N months)
      const monthlySpend = await db
        .select({
          month: sql<string>`DATE_FORMAT(${apiUsageLogs.createdAt}, '%Y-%m')`,
          service: apiUsageLogs.service,
          totalCost: sql<number>`SUM(CAST(${apiUsageLogs.estimatedCostUsd} AS DECIMAL(10,6)))`,
        })
        .from(apiUsageLogs)
        .where(gte(apiUsageLogs.createdAt, since))
        .groupBy(sql`DATE_FORMAT(${apiUsageLogs.createdAt}, '%Y-%m')`, apiUsageLogs.service)
        .orderBy(sql`DATE_FORMAT(${apiUsageLogs.createdAt}, '%Y-%m') ASC`);

      // Grand total
      const [totalResult] = await db
        .select({
          total: sql<number>`SUM(CAST(${apiUsageLogs.estimatedCostUsd} AS DECIMAL(10,6)))`,
        })
        .from(apiUsageLogs)
        .where(gte(apiUsageLogs.createdAt, since));

      return {
        byService,
        byFeature,
        monthlySpend,
        totalCost: totalResult?.total ?? 0,
        periodMonths: input.months,
      };
    }),

  /**
   * Update welcome video URL for onboarding modal
   */
  updateWelcomeVideo: adminProcedure
    .input(z.object({ videoUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Update admin user's avatarVideoUrl
      await db
        .update(users)
        .set({ avatarVideoUrl: input.videoUrl })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),
});
