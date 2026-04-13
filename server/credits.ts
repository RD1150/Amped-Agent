import { getDb } from "./db";
import { users, creditTransactions } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { sendLowCreditsNotification, sendPoolExhaustedNotification } from "./emailNotifications";

/**
 * Credit costs for different video types (legacy — kept for compatibility)
 */
export const CREDIT_COSTS = {
  standard_video: 5,
  ai_enhanced_video: 15,
  full_ai_video: 40,
  voiceover: 0, // Always free
  cinematic_authority_reel: 15,
} as const;

// ---------------------------------------------------------------------------
// Monthly free video pool configuration
// ---------------------------------------------------------------------------

/**
 * How many free video slots each subscription tier gets per month.
 * Authority = -1 means unlimited (no pool check needed).
 */
export const MONTHLY_POOL_SIZES: Record<string, number> = {
  starter: 10,
  pro: 25,
  agency: -1, // unlimited
};

/**
 * Slot weight consumed from the monthly pool per video type.
 * Voice-overs always cost 0 (free everywhere).
 */
export const VIDEO_SLOT_WEIGHTS: Record<string, number> = {
  "ken-burns": 1,
  "market-update": 1,
  "ai-enhanced": 2,
  "full-ai": 3,
  "youtube-video": 3,
  voiceover: 0,
};

/**
 * Overage credit cost when the monthly pool is exhausted.
 * These are charged from the user's credit balance.
 */
export const OVERAGE_CREDIT_COSTS: Record<string, number> = {
  "ken-burns": 2,
  "market-update": 2,
  "ai-enhanced": 5,
  "full-ai": 8,
  "youtube-video": 3,
  voiceover: 0,
};

/**
 * Credit packages available for purchase
 */
export const CREDIT_PACKAGES = {
  starter: {
    name: "Starter",
    credits: 100,
    price: 4900, // $49.00 in cents
    priceDisplay: "$49",
  },
  professional: {
    name: "Professional",
    credits: 350,
    price: 14900, // $149.00 in cents
    priceDisplay: "$149",
    bonus: 50,
  },
  agency: {
    name: "Authority",
    credits: 1000,
    price: 39900, // $399.00 in cents
    priceDisplay: "$399",
    bonus: 200,
  },
} as const;

// ---------------------------------------------------------------------------
// Credit helpers
// ---------------------------------------------------------------------------

/**
 * Get user's current credit balance
 */
export async function getCreditBalance(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const [user] = await db
    .select({ creditBalance: users.creditBalance, email: users.email })
    .from(users)
    .where(eq(users.id, userId));

  if (user?.email === "rdshop70@gmail.com") {
    return 999999;
  }

  return user?.creditBalance ?? 0;
}

/**
 * Check if user has sufficient credits
 */
export async function hasCredits(
  userId: number,
  requiredCredits: number
): Promise<boolean> {
  const balance = await getCreditBalance(userId);
  return balance >= requiredCredits;
}

/**
 * Deduct credits from user's balance
 */
export async function deductCredits(params: {
  userId: number;
  amount: number;
  usageType: string;
  description: string;
  relatedResourceId?: number;
  relatedResourceType?: string;
}): Promise<number> {
  const { userId, amount, usageType, description, relatedResourceId, relatedResourceType } = params;

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.email === "rdshop70@gmail.com") {
    await db.insert(creditTransactions).values({
      userId,
      type: "usage",
      amount: -amount,
      balanceAfter: 999999,
      usageType,
      description: `${description} (Owner - Unlimited)`,
      relatedResourceId,
      relatedResourceType,
    });
    return 999999;
  }

  const currentBalance = await getCreditBalance(userId);

  if (currentBalance < amount) {
    throw new Error(
      `Insufficient credits. You have ${currentBalance} credits but need ${amount} credits.`
    );
  }

  const newBalance = currentBalance - amount;

  await db.update(users).set({ creditBalance: newBalance }).where(eq(users.id, userId));

  if (newBalance < 10 && currentBalance >= 10) {
    const [userInfo] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userInfo?.email && userInfo?.name) {
      sendLowCreditsNotification(userInfo.email, userInfo.name, newBalance).catch(console.error);
    }
  }

  await db.insert(creditTransactions).values({
    userId,
    type: "usage",
    amount: -amount,
    balanceAfter: newBalance,
    usageType,
    description,
    relatedResourceId,
    relatedResourceType,
  });

  return newBalance;
}

/**
 * Add credits to user's balance
 */
export async function addCredits(params: {
  userId: number;
  amount: number;
  type: "purchase" | "bonus" | "refund" | "trial";
  description: string;
  stripePaymentIntentId?: string;
  packageName?: string;
  amountPaid?: number;
}): Promise<number> {
  const { userId, amount, type, description, stripePaymentIntentId, packageName, amountPaid } = params;

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const currentBalance = await getCreditBalance(userId);
  const newBalance = currentBalance + amount;

  await db.update(users).set({ creditBalance: newBalance }).where(eq(users.id, userId));

  await db.insert(creditTransactions).values({
    userId,
    type,
    amount,
    balanceAfter: newBalance,
    description,
    stripePaymentIntentId,
    packageName,
    amountPaid,
  });

  return newBalance;
}

/**
 * Get user's credit transaction history
 */
export async function getCreditHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit);
}

/**
 * Calculate credit cost for a property tour video (legacy helper kept for UI)
 */
export function calculateVideoCost(params: {
  videoMode: "standard" | "ai-enhanced" | "full-ai" | "cinematic";
  enableVoiceover: boolean;
}): { totalCredits: number; breakdown: { item: string; credits: number }[] } {
  const { videoMode, enableVoiceover } = params;

  const breakdown: { item: string; credits: number }[] = [];

  let videoCredits: number;
  let videoLabel: string;
  if (videoMode === "ai-enhanced") {
    videoCredits = CREDIT_COSTS.ai_enhanced_video;
    videoLabel = "Property Tour Video (AI-Enhanced)";
  } else if (videoMode === "full-ai") {
    videoCredits = CREDIT_COSTS.full_ai_video;
    videoLabel = "Property Tour Video (Full AI Cinematic)";
  } else if (videoMode === "cinematic") {
    videoCredits = 7;
    videoLabel = "Property Tour Video (Cinematic)";
  } else {
    videoCredits = CREDIT_COSTS.standard_video;
    videoLabel = "Property Tour Video (Ken Burns)";
  }
  breakdown.push({ item: videoLabel, credits: videoCredits });

  if (enableVoiceover) {
    breakdown.push({ item: "AI Voiceover Narration", credits: 0 });
  }

  return { totalCredits: videoCredits, breakdown };
}

/**
 * Refund credits to user (e.g., for failed video generation)
 */
export async function refundCredits(params: {
  userId: number;
  amount: number;
  reason: string;
  relatedResourceId?: number;
  relatedResourceType?: string;
}): Promise<number> {
  const { userId, amount, reason } = params;

  return await addCredits({
    userId,
    amount,
    type: "refund",
    description: `Refund: ${reason}`,
  });
}

/**
 * Grant trial credits to new user
 */
export async function grantTrialCredits(userId: number): Promise<number> {
  const TRIAL_CREDITS = 50;

  return await addCredits({
    userId,
    amount: TRIAL_CREDITS,
    type: "trial",
    description: "Welcome! 50 free trial credits",
  });
}

// ---------------------------------------------------------------------------
// Monthly video pool helpers
// ---------------------------------------------------------------------------

/**
 * Get the user's subscription tier key (starter / pro / agency).
 */
async function getUserTier(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) return "starter";

  const [user] = await db
    .select({ email: users.email, subscriptionTier: users.subscriptionTier })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.email === "rdshop70@gmail.com") return "authority";

  const tier = (user?.subscriptionTier ?? "starter").toLowerCase();
  if (tier.includes("authority")) return "authority";
  if (tier.includes("pro")) return "pro";
  return "starter";
}

/**
 * Check whether the monthly pool reset date has passed and reset if needed.
 * Returns the current slotsUsed after any reset.
 */
async function ensurePoolFresh(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const [user] = await db
    .select({
      monthlyVideoSlotsUsed: users.monthlyVideoSlotsUsed,
      slotsResetAt: users.slotsResetAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return 0;

  const resetAt = user.slotsResetAt ? new Date(user.slotsResetAt) : new Date(0);
  const now = new Date();
  const daysSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceReset >= 30) {
    await db
      .update(users)
      .set({ monthlyVideoSlotsUsed: 0, slotsResetAt: now })
      .where(eq(users.id, userId));
    return 0;
  }

  return user.monthlyVideoSlotsUsed ?? 0;
}

export type VideoPoolResult =
  | { allowed: true; chargedSlots: number; chargedCredits: number; usedPool: boolean }
  | { allowed: false; reason: string; slotsUsed: number; poolSize: number; overageCost: number };

/**
 * Check the monthly free video pool and deduct slots (or overage credits).
 *
 * Returns:
 *  - allowed: true  → generation can proceed
 *  - allowed: false → generation blocked; show "Add Credits" CTA
 *
 * Voice-overs always pass through free.
 */
export async function checkAndDeductVideoPool(
  userId: number,
  videoType: string
): Promise<VideoPoolResult> {
  if (videoType === "voiceover") {
    return { allowed: true, chargedSlots: 0, chargedCredits: 0, usedPool: false };
  }

  const db = await getDb();
  if (!db) {
    return { allowed: true, chargedSlots: 0, chargedCredits: 0, usedPool: false };
  }

  const tier = await getUserTier(userId);
  const poolSize = MONTHLY_POOL_SIZES[tier] ?? 10;
  const slotWeight = VIDEO_SLOT_WEIGHTS[videoType] ?? 1;
  const overageCost = OVERAGE_CREDIT_COSTS[videoType] ?? 2;

  // Authority = unlimited
  if (poolSize === -1) {
    return { allowed: true, chargedSlots: 0, chargedCredits: 0, usedPool: false };
  }

  const slotsUsed = await ensurePoolFresh(userId);
  const slotsRemaining = poolSize - slotsUsed;

  if (slotsRemaining >= slotWeight) {
    await db
      .update(users)
      .set({ monthlyVideoSlotsUsed: slotsUsed + slotWeight })
      .where(eq(users.id, userId));

    return { allowed: true, chargedSlots: slotWeight, chargedCredits: 0, usedPool: true };
  }

  // Pool exhausted — try overage credits
  const creditBalance = await getCreditBalance(userId);
  if (creditBalance >= overageCost) {
    await deductCredits({
      userId,
      amount: overageCost,
      usageType: "video_overage",
      description: `Overage: ${videoType} video (pool exhausted)`,
    });
    return { allowed: true, chargedSlots: 0, chargedCredits: overageCost, usedPool: false };
  }

  // Neither pool nor credits available — fire exhaustion notification (non-blocking)
  try {
    const [userInfo] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (userInfo?.email && userInfo?.name) {
      sendPoolExhaustedNotification(userInfo.email, userInfo.name, poolSize, overageCost).catch(console.error);
    }
  } catch {
    // notification failure must never block the response
  }

  return {
    allowed: false,
    reason: `You've used all ${poolSize} free videos this month. Add credits to continue (${overageCost} credits needed).`,
    slotsUsed,
    poolSize,
    overageCost,
  };
}

/**
 * Get the current pool status for a user (for UI display).
 */
export async function getVideoPoolStatus(userId: number): Promise<{
  tier: string;
  poolSize: number;
  slotsUsed: number;
  slotsRemaining: number;
  resetAt: Date | null;
  unlimited: boolean;
}> {
  const db = await getDb();
  if (!db) {
    return { tier: "starter", poolSize: 10, slotsUsed: 0, slotsRemaining: 10, resetAt: null, unlimited: false };
  }

  const tier = await getUserTier(userId);
  const poolSize = MONTHLY_POOL_SIZES[tier] ?? 10;

  if (poolSize === -1) {
    return { tier, poolSize: -1, slotsUsed: 0, slotsRemaining: -1, resetAt: null, unlimited: true };
  }

  const slotsUsed = await ensurePoolFresh(userId);

  const [user] = await db
    .select({ slotsResetAt: users.slotsResetAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return {
    tier,
    poolSize,
    slotsUsed,
    slotsRemaining: Math.max(0, poolSize - slotsUsed),
    resetAt: user?.slotsResetAt ? new Date(user.slotsResetAt) : null,
    unlimited: false,
  };
}
