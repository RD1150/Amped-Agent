import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Video generation limits per subscription tier
 */
export const VIDEO_LIMITS = {
  starter: {
    standard: 5,
    aiEnhanced: 2,
    fullAi: 0,
  },
  pro: {
    standard: 20,
    aiEnhanced: 10,
    fullAi: 3,
  },
  premium: {
    standard: 999, // Effectively unlimited
    aiEnhanced: 25,
    fullAi: 10,
  },
} as const;

export type VideoMode = "standard" | "ai-enhanced" | "full-ai";
export type SubscriptionTier = "starter" | "pro" | "premium";

/**
 * Check if user has reached their monthly video limit for a specific mode
 */
export async function hasReachedVideoLimit(
  userId: number,
  videoMode: VideoMode
): Promise<{ allowed: boolean; current: number; limit: number; tier: SubscriptionTier }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  // Reset counters if it's a new month
  await resetCountersIfNeeded(userId, user.lastVideoCountReset);

  // Get current usage
  const [updatedUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!updatedUser) {
    throw new Error("User not found after reset");
  }

  const tier = (updatedUser.subscriptionTier || "starter") as SubscriptionTier;
  const limits = VIDEO_LIMITS[tier];

  let current: number;
  let limit: number;

  switch (videoMode) {
    case "standard":
      current = updatedUser.standardVideosThisMonth || 0;
      limit = limits.standard;
      break;
    case "ai-enhanced":
      current = updatedUser.aiEnhancedVideosThisMonth || 0;
      limit = limits.aiEnhanced;
      break;
    case "full-ai":
      current = updatedUser.fullAiVideosThisMonth || 0;
      limit = limits.fullAi;
      break;
  }

  const allowed = current < limit;

  return { allowed, current, limit, tier };
}

/**
 * Increment video generation counter for a user
 */
export async function incrementVideoCount(userId: number, videoMode: VideoMode): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  // Reset counters if needed
  await resetCountersIfNeeded(userId, user.lastVideoCountReset);

  // Increment the appropriate counter
  switch (videoMode) {
    case "standard":
      await db
        .update(users)
        .set({ standardVideosThisMonth: (user.standardVideosThisMonth || 0) + 1 })
        .where(eq(users.id, userId));
      break;
    case "ai-enhanced":
      await db
        .update(users)
        .set({ aiEnhancedVideosThisMonth: (user.aiEnhancedVideosThisMonth || 0) + 1 })
        .where(eq(users.id, userId));
      break;
    case "full-ai":
      await db
        .update(users)
        .set({ fullAiVideosThisMonth: (user.fullAiVideosThisMonth || 0) + 1 })
        .where(eq(users.id, userId));
      break;
  }

  console.log(`[VideoUsage] Incremented ${videoMode} count for user ${userId}`);
}

/**
 * Reset video counters if it's a new month
 */
async function resetCountersIfNeeded(userId: number, lastReset: Date | null): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (!lastReset) {
    // First time, just update the reset date
    await db
      .update(users)
      .set({ lastVideoCountReset: new Date() })
      .where(eq(users.id, userId));
    return;
  }

  const now = new Date();
  const lastResetDate = new Date(lastReset);

  // Check if we're in a new month
  const isNewMonth =
    now.getMonth() !== lastResetDate.getMonth() || now.getFullYear() !== lastResetDate.getFullYear();

  if (isNewMonth) {
    console.log(`[VideoUsage] Resetting counters for user ${userId} (new month)`);
    await db
      .update(users)
      .set({
        standardVideosThisMonth: 0,
        aiEnhancedVideosThisMonth: 0,
        fullAiVideosThisMonth: 0,
        lastVideoCountReset: now,
      })
      .where(eq(users.id, userId));
  }
}

/**
 * Get video usage summary for a user
 */
export async function getVideoUsageSummary(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  // Reset if needed
  await resetCountersIfNeeded(userId, user.lastVideoCountReset);

  // Get updated counts
  const [updatedUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!updatedUser) {
    throw new Error("User not found after reset");
  }

  const tier = (updatedUser.subscriptionTier || "starter") as SubscriptionTier;
  const limits = VIDEO_LIMITS[tier];

  return {
    tier,
    standard: {
      used: updatedUser.standardVideosThisMonth || 0,
      limit: limits.standard,
      remaining: Math.max(0, limits.standard - (updatedUser.standardVideosThisMonth || 0)),
    },
    aiEnhanced: {
      used: updatedUser.aiEnhancedVideosThisMonth || 0,
      limit: limits.aiEnhanced,
      remaining: Math.max(0, limits.aiEnhanced - (updatedUser.aiEnhancedVideosThisMonth || 0)),
    },
    fullAi: {
      used: updatedUser.fullAiVideosThisMonth || 0,
      limit: limits.fullAi,
      remaining: Math.max(0, limits.fullAi - (updatedUser.fullAiVideosThisMonth || 0)),
    },
  };
}
