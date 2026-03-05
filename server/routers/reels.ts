import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { generateTalkingAvatar } from "../_core/didAi";
import { getDb } from "../db";
import { reelUsage, aiReels } from "../../drizzle/schema";
import { storagePut } from "../storage";
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
        // Calculate expiration date (90 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90);
        
        // Create database record first
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [reelRecord] = await db
          .insert(aiReels)
          .values({
            userId: ctx.user.id,
            script: input.script,
            didVideoUrl: "", // Will update after generation
            avatarUrl: input.avatarUrl,
            voiceId: input.voiceId || "en-US-JennyNeural",
            status: "processing",
            expiresAt,
          })
          .$returningId();
        
        const reelId = reelRecord.id;
        
        try {
          // Generate talking avatar video with D-ID
          const didVideoUrl = await generateTalkingAvatar({
            sourceUrl: input.avatarUrl,
            script: input.script,
            voiceId: input.voiceId || "en-US-JennyNeural",
          });
          
          // Download video from D-ID and upload to S3
          const videoResponse = await fetch(didVideoUrl);
          if (!videoResponse.ok) throw new Error("Failed to download video from D-ID");
          
          const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
          const s3Key = `reels/${ctx.user.id}/${reelId}-${Date.now()}.mp4`;
          
          // Upload to S3 with 90-day lifecycle tag
          const { url: s3Url } = await storagePut(s3Key, videoBuffer, "video/mp4");
          
          // Update record with video URLs
          await db
            .update(aiReels)
            .set({
              didVideoUrl,
              s3Key,
              s3Url,
              status: "completed",
            })
            .where(eq(aiReels.id, reelId));
          
          // Increment usage count
          await incrementReelUsage(ctx.user.id, tier);
          
          // Get updated usage
          const updatedUsage = await getReelUsage(ctx.user.id, tier);
          const limit = tier === "free" ? 3 : 30;
          
          return {
            reelId,
            videoUrl: s3Url,
            needsWatermark: tier === "free",
            expiresAt: expiresAt.toISOString(),
            usage: {
              current: updatedUsage.count,
              limit,
              remaining: Math.max(0, limit - updatedUsage.count),
            },
          };
        } catch (generationError) {
          // Mark reel as failed
          await db
            .update(aiReels)
            .set({ status: "failed" })
            .where(eq(aiReels.id, reelId));
          throw generationError;
        }
      } catch (error) {
        console.error("D-ID generation error:", error);
        throw new Error(`Failed to generate reel: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Delete a reel by ID (only owner can delete)
   */
  deleteReel: protectedProcedure
    .input(z.object({ reelId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const [reel] = await db
        .select()
        .from(aiReels)
        .where(and(eq(aiReels.id, input.reelId), eq(aiReels.userId, ctx.user.id)))
        .limit(1);

      if (!reel) throw new Error("Reel not found or access denied");

      // Delete from database
      await db.delete(aiReels).where(eq(aiReels.id, input.reelId));

      return { success: true };
    }),

  /**
   * List all reels for the authenticated user (not expired)
   */
  listReels: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const reels = await db
      .select()
      .from(aiReels)
      .where(
        and(
          eq(aiReels.userId, ctx.user.id),
          eq(aiReels.status, "completed")
        )
      )
      .orderBy(sql`${aiReels.createdAt} DESC`);
    
    // Filter out expired reels
    const now = new Date();
    const activeReels = reels.filter(reel => new Date(reel.expiresAt) > now);
    
    return activeReels.map(reel => ({
      ...reel,
      daysUntilExpiration: Math.ceil(
        (new Date(reel.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));
  }),
});
