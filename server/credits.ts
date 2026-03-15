import { getDb } from "./db";
import { users, creditTransactions } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { sendLowCreditsNotification } from "./emailNotifications";

/**
 * Credit costs for different video types
 */
export const CREDIT_COSTS = {
  standard_video: 5, // Standard Ken Burns video
  ai_enhanced_video: 15, // AI-Enhanced (3-5 hero shots with Luma AI)
  full_ai_video: 40, // Full AI Cinematic (all photos with Kling AI pro mode, 1080p/30fps)
  voiceover: 5, // AI voiceover narration add-on
  cinematic_authority_reel: 15, // Cinematic Authority Reel with Runway B-roll
} as const;

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
    bonus: 50, // Bonus credits
  },
  agency: {
    name: "Agency",
    credits: 1000,
    price: 39900, // $399.00 in cents
    priceDisplay: "$399",
    bonus: 200, // Bonus credits
  },
} as const;

/**
 * Get user's current credit balance
 */
export async function getCreditBalance(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const [user] = await db.select({ creditBalance: users.creditBalance, email: users.email }).from(users).where(eq(users.id, userId));
  
  // Owner gets unlimited credits
  if (user?.email === 'rdshop70@gmail.com') {
    return 999999;
  }
  
  return user?.creditBalance ?? 0;
}

/**
 * Check if user has sufficient credits
 */
export async function hasCredits(userId: number, requiredCredits: number): Promise<boolean> {
  const balance = await getCreditBalance(userId);
  return balance >= requiredCredits;
}

/**
 * Deduct credits from user's balance
 * Returns new balance or throws error if insufficient credits
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

  // Check if user is owner - owners get unlimited credits
  const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  if (user?.email === 'rdshop70@gmail.com') {
    // Owner gets unlimited credits - just record the transaction without deducting
    await db.insert(creditTransactions).values({
      userId,
      type: "usage",
      amount: -amount,
      balanceAfter: 999999, // Show large number for owner
      usageType,
      description: `${description} (Owner - Unlimited)`,
      relatedResourceId,
      relatedResourceType,
    });
    return 999999; // Return large number to indicate unlimited
  }

  // Get current balance
  const currentBalance = await getCreditBalance(userId);

  if (currentBalance < amount) {
    throw new Error(`Insufficient credits. You have ${currentBalance} credits but need ${amount} credits.`);
  }

  const newBalance = currentBalance - amount;

  // Update user's balance
  await db.update(users).set({ creditBalance: newBalance }).where(eq(users.id, userId));

  // Send low credits notification if balance falls below 10
  if (newBalance < 10 && currentBalance >= 10) {
    // Get user email and name
    const [userInfo] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userInfo?.email && userInfo?.name) {
      // Send notification asynchronously (don't wait)
      sendLowCreditsNotification(userInfo.email, userInfo.name, newBalance).catch(console.error);
    }
  }

  // Record transaction
  await db.insert(creditTransactions).values({
    userId,
    type: "usage",
    amount: -amount, // Negative for deduction
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

  // Get current balance
  const currentBalance = await getCreditBalance(userId);
  const newBalance = currentBalance + amount;

  // Update user's balance
  await db.update(users).set({ creditBalance: newBalance }).where(eq(users.id, userId));

  // Record transaction
  await db.insert(creditTransactions).values({
    userId,
    type,
    amount, // Positive for addition
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
 * Calculate credit cost for a property tour video
 */
export function calculateVideoCost(params: {
  videoMode: "standard";
  enableVoiceover: boolean;
}): { totalCredits: number; breakdown: { item: string; credits: number }[] } {
  const { enableVoiceover } = params;

  const breakdown: { item: string; credits: number }[] = [];

  // Base video cost — Ken Burns (Standard)
  const videoCredits = CREDIT_COSTS.standard_video;
  breakdown.push({ item: "Property Tour Video (Ken Burns)", credits: videoCredits });

  let totalCredits = videoCredits;

  // Add voiceover cost if enabled
  if (enableVoiceover) {
    totalCredits += CREDIT_COSTS.voiceover;
    breakdown.push({ item: "AI Voiceover Narration", credits: CREDIT_COSTS.voiceover });
  }

  return { totalCredits, breakdown };
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
  const { userId, amount, reason, relatedResourceId, relatedResourceType } = params;

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
