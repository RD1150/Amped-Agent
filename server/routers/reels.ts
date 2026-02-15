import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { generateTalkingAvatar } from "../_core/didAi";
import { getDb } from "../db";
import { reelUsage } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Get or create reel usage record for current month
 */
async function getReelUsage(userId: number, tier: "free" | "pro") {
  const month = getCurrentMonth();
  
  // Try to find existing record
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select()
    .from(reelUsage)
    .where(and(eq(reelUsage.userId, userId), eq(reelUsage.month, month)))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  // Create new record for this month
  const [newRecord] = await db
    .insert(reelUsage)
    .values({
      userId,
      month,
      count: 0,
      tier,
    })
    .$returningId();
  
  return {
    id: newRecord.id,
    userId,
    month,
    count: 0,
    tier,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Check if user has reached their monthly reel limit
 */
async function checkReelLimit(userId: number, tier: "free" | "pro"): Promise<{ allowed: boolean; current: number; limit: number }> {
  const usage = await getReelUsage(userId, tier);
  const limit = tier === "free" ? 3 : 30;
  
  return {
    allowed: usage.count < limit,
    current: usage.count,
    limit,
  };
}

/**
 * Increment reel usage count
 */
async function incrementReelUsage(userId: number, tier: "free" | "pro") {
  const month = getCurrentMonth();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(reelUsage)
    .set({
      count: sql`${reelUsage.count} + 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(reelUsage.userId, userId), eq(reelUsage.month, month)));
}

export const reelsRouter = router({
  /**
   * Get current reel usage for the authenticated user
   */
  getUsage: protectedProcedure.query(async ({ ctx }) => {
    // TODO: Get user's actual tier from subscription
    const tier = "free"; // Hardcoded for now
    const usage = await getReelUsage(ctx.user.id, tier);
    const limit = tier === "free" ? 3 : 30;
    
    return {
      current: usage.count,
      limit,
      tier,
      remaining: Math.max(0, limit - usage.count),
      month: usage.month,
    };
  }),

  /**
   * Generate a talking avatar reel from script
   */
  generate: protectedProcedure
    .input(
      z.object({
        script: z.string().min(10).max(1000), // ~150-180 words for 60 seconds
        avatarUrl: z.string().url(),
        voiceId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Get user's actual tier from subscription
      const tier = "free"; // Hardcoded for now
      
      // Check usage limit
      const limitCheck = await checkReelLimit(ctx.user.id, tier);
      if (!limitCheck.allowed) {
        throw new Error(
          `Monthly reel limit reached (${limitCheck.current}/${limitCheck.limit}). ${
            tier === "free" ? "Upgrade to Pro for 30 reels per month." : "Please wait until next month."
          }`
        );
      }
      
      try {
        // Generate talking avatar video with D-ID
        const videoUrl = await generateTalkingAvatar({
          sourceUrl: input.avatarUrl,
          script: input.script,
          voiceId: input.voiceId || "en-US-JennyNeural",
        });
        
        // Increment usage count
        await incrementReelUsage(ctx.user.id, tier);
        
        // Get updated usage
        const updatedUsage = await getReelUsage(ctx.user.id, tier);
        const limit = tier === "free" ? 3 : 30;
        
        return {
          videoUrl,
          needsWatermark: tier === "free",
          usage: {
            current: updatedUsage.count,
            limit,
            remaining: Math.max(0, limit - updatedUsage.count),
          },
        };
      } catch (error) {
        console.error("D-ID generation error:", error);
        throw new Error(`Failed to generate reel: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),
});
