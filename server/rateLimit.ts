import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendRateLimitNotification } from "./emailNotifications";

const DAILY_VIDEO_LIMIT = 10;

/**
 * Check if user has exceeded daily video generation limit
 * Returns { allowed: boolean, remaining: number, resetTime: Date }
 */
export async function checkDailyVideoLimit(userId: number): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  current: number;
}> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [user] = await db
    .select({
      dailyVideoCount: users.dailyVideoCount,
      lastDailyReset: users.lastDailyReset,
      subscriptionTier: users.subscriptionTier,
      subscriptionStatus: users.subscriptionStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  // Check if we need to reset the counter (new day in UTC)
  const now = new Date();
  const lastReset = new Date(user.lastDailyReset);
  const daysSinceReset = Math.floor(
    (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24)
  );

  let currentCount = user.dailyVideoCount;

  if (daysSinceReset >= 1) {
    // Reset counter for new day
    await db
      .update(users)
      .set({
        dailyVideoCount: 0,
        lastDailyReset: now,
      })
      .where(eq(users.id, userId));

    currentCount = 0;
  }

  // Calculate next reset time (midnight UTC tomorrow)
  const resetTime = new Date(now);
  resetTime.setUTCHours(24, 0, 0, 0);

  // Check if user has paid subscription (unlimited videos)
  const isPaidUser = 
    user.subscriptionStatus === 'active' && 
    (user.subscriptionTier === 'pro' || user.subscriptionTier === 'premium');

  if (isPaidUser) {
    // Paid users have unlimited videos
    return {
      allowed: true,
      remaining: -1, // -1 indicates unlimited
      resetTime,
      current: currentCount,
    };
  }

  // Free trial users have 10/day limit
  const allowed = currentCount < DAILY_VIDEO_LIMIT;
  const remaining = Math.max(0, DAILY_VIDEO_LIMIT - currentCount);

  // Send email notification if user just hit the limit
  if (!allowed && currentCount === DAILY_VIDEO_LIMIT) {
    // Get user email and name
    const [userInfo] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userInfo?.email && userInfo?.name) {
      // Send notification asynchronously (don't wait)
      sendRateLimitNotification(userInfo.email, userInfo.name).catch(console.error);
    }
  }

  return {
    allowed,
    remaining,
    resetTime,
    current: currentCount,
  };
}

/**
 * Increment user's daily video count
 */
export async function incrementDailyVideoCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // First check and reset if needed
  await checkDailyVideoLimit(userId);

  // Increment the counter
  const [user] = await db
    .select({ dailyVideoCount: users.dailyVideoCount })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  const newCount = user.dailyVideoCount + 1;

  await db
    .update(users)
    .set({ dailyVideoCount: newCount })
    .where(eq(users.id, userId));

  return newCount;
}

/**
 * Get user's current daily video usage
 */
export async function getDailyVideoUsage(userId: number): Promise<{
  used: number;
  limit: number;
  remaining: number;
  resetTime: Date;
  isUnlimited: boolean;
}> {
  const status = await checkDailyVideoLimit(userId);

  return {
    used: status.current,
    limit: status.remaining === -1 ? -1 : DAILY_VIDEO_LIMIT,
    remaining: status.remaining,
    resetTime: status.resetTime,
    isUnlimited: status.remaining === -1,
  };
}
