import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb, promoteUserToAdmin } from "../db";
import { users, propertyTours, creditTransactions, apiUsageLogs, inviteCodes } from "../../drizzle/schema";
import { sql, eq, and, gte, lte, desc, isNotNull } from "drizzle-orm";
import { sdk } from "../_core/sdk";
import { notifyOwner } from "../_core/notification";
import { ENV } from "../_core/env";

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

    const [agencyUsersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.subscriptionTier, "authority"));
    const premiumUsers = agencyUsersResult?.count || 0;

    // Trial conversion metrics
    const [trialingUsersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.subscriptionStatus, "trialing"));
    const trialingUsers = trialingUsersResult?.count || 0;

    // Users whose trial ends in the next 3 days (at-risk of churning)
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const [trialEndingSoonResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          eq(users.subscriptionStatus, "trialing"),
          isNotNull(users.trialEndsAt),
          lte(users.trialEndsAt, threeDaysFromNow),
          gte(users.trialEndsAt, now)
        )
      );
    const trialEndingSoon = trialEndingSoonResult?.count || 0;

    // Users who converted from trial to active (have trialEndsAt set AND are now active)
    const [convertedFromTrialResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          eq(users.subscriptionStatus, "active"),
          isNotNull(users.trialEndsAt)
        )
      );
    const convertedFromTrial = convertedFromTrialResult?.count || 0;

    // Users who had a trial but are now inactive (churned)
    const [churnedAfterTrialResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          eq(users.subscriptionStatus, "inactive"),
          isNotNull(users.trialEndsAt)
        )
      );
    const churnedAfterTrial = churnedAfterTrialResult?.count || 0;

    const totalTrialUsers = trialingUsers + convertedFromTrial + churnedAfterTrial;
    const trialConversionRate = totalTrialUsers > 0
      ? Math.round((convertedFromTrial / totalTrialUsers) * 100)
      : 0;

    // Trial source breakdown: group all users who have ever trialed by trialSource
    const trialSourceRows = await db
      .select({
        source: users.trialSource,
        count: sql<number>`count(*)`,
      })
      .from(users)
      .where(isNotNull(users.trialEndsAt))
      .groupBy(users.trialSource);
    const trialSourceBreakdown: Record<string, number> = {};
    for (const row of trialSourceRows) {
      const key = row.source ?? 'organic';
      trialSourceBreakdown[key] = (trialSourceBreakdown[key] || 0) + (row.count || 0);
    }

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
      // Trial conversion metrics
      trialingUsers,
      trialEndingSoon,
      convertedFromTrial,
      churnedAfterTrial,
      trialConversionRate,
      trialSourceBreakdown,
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
   * Get all registered users with signup date, email, tier, and last active
   */
  getAllUsers: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(50),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const offset = (input.page - 1) * input.limit;
      const results = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          subscriptionTier: users.subscriptionTier,
          subscriptionStatus: users.subscriptionStatus,
          trialEndsAt: users.trialEndsAt,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
          loginMethod: users.loginMethod,
        })
        .from(users)
        .orderBy(sql`${users.createdAt} DESC`)
        .limit(input.limit)
        .offset(offset);
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);
      return {
        users: results,
        total: countResult?.count ?? 0,
        page: input.page,
        limit: input.limit,
      };
    }),

  /**
   * Impersonate a user — creates a short-lived session token for the target user (admin only)
   */
  impersonateUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [target] = await db
        .select({ id: users.id, openId: users.openId, name: users.name, email: users.email, role: users.role })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      if (target.role === "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot impersonate another admin" });
      }
      // Create a 4-hour session token for the target user
      const sessionToken = await sdk.createSessionToken(target.openId, {
        name: target.name ?? "",
        expiresInMs: 1000 * 60 * 60 * 4,
      });
      return { sessionToken, user: { id: target.id, name: target.name, email: target.email } };
    }),

  /**
   * Export all users as raw data for CSV download
   */
  exportUsers: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        subscriptionTier: users.subscriptionTier,
        subscriptionStatus: users.subscriptionStatus,
        trialEndsAt: users.trialEndsAt,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
        loginMethod: users.loginMethod,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
    return { users: allUsers };
  }),

  /**
   * Send a manual notification blast to users (admin only)
   */
  emailBlast: adminProcedure
    .input(z.object({
      subject: z.string().min(1).max(200),
      message: z.string().min(1).max(5000),
      tier: z.enum(["all", "starter", "pro", "authority"]).default("all"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      let baseQuery = db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users);
      const targets = input.tier === "all"
        ? await baseQuery
        : await baseQuery.where(eq(users.subscriptionTier, input.tier));
      // Log blast as owner notification
      await notifyOwner({
        title: `[Email Blast Sent] ${input.subject}`,
        content: `Sent to ${targets.length} user(s) (tier: ${input.tier}).\n\nMessage:\n${input.message}`,
      });
      return { sent: targets.length, tier: input.tier };
    }),

  /**
   * Update welcome video URL for onboarding modal
   */
  updateWelcomeVideo: adminProcedure
    .input(z.object({ videoUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(users)
        .set({ avatarVideoUrl: input.videoUrl })
        .where(eq(users.id, ctx.user.id));
      return { success: true };
    }),

  // ─── Beta Invite Codes ──────────────────────────────────────────────────────

  generateInviteCodes: adminProcedure
    .input(z.object({
      count: z.number().int().min(1).max(50).default(10),
      label: z.string().max(200).optional(),
      expiresInDays: z.number().int().min(1).max(365).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { randomBytes } = await import("crypto");
      const codes: string[] = [];
      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 86400000)
        : undefined;
      for (let i = 0; i < input.count; i++) {
        const code = randomBytes(6).toString("hex").toUpperCase();
        await db.insert(inviteCodes).values({
          code,
          label: input.label ?? `Beta Invite ${i + 1}`,
          createdByAdminId: ctx.user.id,
          ...(expiresAt ? { expiresAt } : {}),
          isRevoked: false,
        });
        codes.push(code);
      }
      return { codes };
    }),

  listInviteCodes: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const rows = await db
      .select({
        id: inviteCodes.id,
        code: inviteCodes.code,
        label: inviteCodes.label,
        usedByUserId: inviteCodes.usedByUserId,
        usedAt: inviteCodes.usedAt,
        expiresAt: inviteCodes.expiresAt,
        createdAt: inviteCodes.createdAt,
        isRevoked: inviteCodes.isRevoked,
        usedByName: users.name,
        usedByEmail: users.email,
      })
      .from(inviteCodes)
      .leftJoin(users, eq(inviteCodes.usedByUserId, users.id))
      .orderBy(desc(inviteCodes.createdAt));
    return rows;
  }),

  revokeInviteCode: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(inviteCodes)
        .set({ isRevoked: true })
        .where(eq(inviteCodes.id, input.id));
      return { success: true };
    }),

  deleteInviteCode: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(inviteCodes).where(eq(inviteCodes.id, input.id));
      return { success: true };
    }),

  /**
   * Promote any user to admin by user ID (admin only).
   */
  promoteUserToAdmin: adminProcedure
    .input(z.object({ userId: z.number().int() }))
    .mutation(async ({ input }) => {
      await promoteUserToAdmin(input.userId);
      return { success: true };
    }),

  /**
   * List all users with basic info (admin only).
   */
  listUsers: adminProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(200).default(50),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          subscriptionTier: users.subscriptionTier,
          subscriptionStatus: users.subscriptionStatus,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      return rows;
    }),
});

/**
 * ownerRouter — procedures that only the platform owner can call,
 * even before they have the admin role in the database.
 * Used for the one-time self-promotion flow.
 */
export const ownerRouter = router({
  /**
   * Promote the calling user to admin.
   * Only works if the caller's openId matches OWNER_OPEN_ID env var.
   */
  selfPromoteToAdmin: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ENV.ownerOpenId || ctx.user.openId !== ENV.ownerOpenId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the platform owner can use this action." });
    }
    if (ctx.user.role === "admin") {
      return { success: true, alreadyAdmin: true };
    }
    await promoteUserToAdmin(ctx.user.id);
    return { success: true, alreadyAdmin: false };
  }),
});
