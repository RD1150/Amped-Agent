import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { fullAvatarVideos, customAvatarTwins } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { storagePut } from "../storage";
import { invokeLLM } from "../_core/llm";
import {
  createPhotoAvatarFromUrl,
  generateTalkingPhotoVideo,
  generateCustomAvatarVideo,
  createCustomAvatar,
  getCustomAvatarStatus,
  waitForHeyGenVideo,
} from "../lib/heygen-service";

/** Estimate video duration from word count (avg 130 words/min speaking pace) */
function estimateDuration(script: string): number {
  const words = script.trim().split(/\s+/).length;
  return Math.ceil((words / 130) * 60);
}

export const fullAvatarVideoRouter = router({
  /**
   * Fetch English voices from HeyGen for the voice picker
   */
  getVoices: protectedProcedure
    .query(async () => {
      const apiKey = process.env.HEYGEN_API_KEY;
      if (!apiKey) throw new Error("HeyGen API key not configured");
      const res = await fetch("https://api.heygen.com/v2/voices", {
        headers: { "X-Api-Key": apiKey },
      });
      if (!res.ok) throw new Error(`HeyGen voices fetch failed: ${res.status}`);
      const data = await res.json() as { data?: { voices?: Array<{ voice_id: string; name: string; gender: string; language: string; preview_audio?: string }> } };
      const voices = (data.data?.voices ?? []) as Array<{ voice_id: string; name: string; gender: string; language: string; preview_audio?: string }>;
      return voices
        .filter((v) => v.language === "English" && v.name?.trim())
        .map((v) => ({
          id: v.voice_id,
          name: v.name.trim(),
          gender: v.gender as "male" | "female",
          previewUrl: v.preview_audio ?? null,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }),

  /**
   * Generate a camera-ready script for a full avatar video using AI
   */
  generateAvatarScript: protectedProcedure
    .input(
      z.object({
        contentType: z.enum([
          "market_update",
          "listing_pitch",
          "just_sold",
          "tips_advice",
          "testimonial_request",
          "open_house",
          "custom",
        ]),
        keyPoints: z.string().max(1000),
        agentName: z.string().optional(),
        targetLength: z.enum(["30s", "60s", "90s", "2min"]).default("60s"),
      })
    )
    .mutation(async ({ input }) => {
      const lengthGuide = {
        "30s": "65–80 words (30 seconds at camera pace)",
        "60s": "130–150 words (60 seconds at camera pace)",
        "90s": "200–220 words (90 seconds at camera pace)",
        "2min": "260–280 words (2 minutes at camera pace)",
      }[input.targetLength];

      const contentTypeLabel = {
        market_update: "Real Estate Market Update",
        listing_pitch: "New Listing Announcement",
        just_sold: "Just Sold Announcement",
        tips_advice: "Real Estate Tips & Advice",
        testimonial_request: "Client Testimonial Request",
        open_house: "Open House Invitation",
        custom: "Custom Video",
      }[input.contentType];

      const agentName = input.agentName || "your real estate agent";

      const systemPrompt = `You are a professional real estate video scriptwriter. 
Write camera-ready scripts that sound natural when spoken directly to camera — conversational, warm, and authoritative. 
No stage directions, no scene descriptions, no [PAUSE] markers. Just the words the agent will speak.
Write in first person as the agent. Keep sentences short and punchy for video delivery.
Do NOT start with "Hey guys" or generic openers. Start with something specific and engaging.`;

      const userPrompt = `Write a ${contentTypeLabel} script for a real estate agent named ${agentName}.

Target length: ${lengthGuide}

Key points to cover:
${input.keyPoints}

Requirements:
- Direct-to-camera delivery tone (not a voiceover)
- Conversational but professional
- End with a clear call to action
- No hashtags, no emojis, no stage directions
- Just the spoken words`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const script = response.choices?.[0]?.message?.content as string;
      if (!script) throw new Error("Script generation failed");

      return { script: script.trim() };
    }),

  /**
   * Generate a full talking-head video using HeyGen (photo-based, no training)
   */
  generate: protectedProcedure
    .input(
      z.object({
        script: z.string().min(20).max(5000),
        avatarUrl: z.string().url(),
        voiceId: z.string().optional().default("en-US-JennyNeural"),
        title: z.string().max(255).optional(),
        landscape: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);
      const duration = estimateDuration(input.script);

      // Create DB record immediately so we can track it
      const [record] = await db
        .insert(fullAvatarVideos)
        .values({
          userId: ctx.user.id,
          title: input.title || null,
          script: input.script,
          avatarUrl: input.avatarUrl,
          avatarType: "v2_photo",
          voiceId: input.voiceId,
          duration,
          status: "processing",
          expiresAt,
        })
        .$returningId();

      const videoId = record.id;

      try {
        // Step 1: Upload photo to HeyGen to get a talking_photo_id
        const photoAvatarId = await createPhotoAvatarFromUrl(input.avatarUrl);

        // Step 2: Submit video generation job
        const heygenVideoId = await generateTalkingPhotoVideo({
          photoAvatarId,
          script: input.script,
          voiceId: input.voiceId,
          title: input.title,
        });

        // Save HeyGen video ID for reference
        await db
          .update(fullAvatarVideos)
          .set({ didTalkId: heygenVideoId })
          .where(eq(fullAvatarVideos.id, videoId));

        // Step 3: Poll until complete (up to 10 minutes for long scripts)
        const heygenVideoUrl = await waitForHeyGenVideo(heygenVideoId, 600_000, 5_000);

        // Step 4: Download and re-host on S3 for permanence
        const videoRes = await fetch(heygenVideoUrl);
        if (!videoRes.ok) throw new Error("Failed to download HeyGen video");
        const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
        const s3Key = `full-avatar-videos/${ctx.user.id}/${videoId}-${Date.now()}.mp4`;
        const { url: s3Url } = await storagePut(s3Key, videoBuffer, "video/mp4");

        await db
          .update(fullAvatarVideos)
          .set({ videoUrl: s3Url, s3Key, status: "completed" })
          .where(eq(fullAvatarVideos.id, videoId));

        return { videoId, videoUrl: s3Url, duration, expiresAt: expiresAt.toISOString() };
      } catch (err) {
        await db
          .update(fullAvatarVideos)
          .set({ status: "failed" })
          .where(eq(fullAvatarVideos.id, videoId));
        throw new Error(
          `Avatar video generation failed: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }),

  /**
   * List all full avatar videos for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const videos = await db
      .select()
      .from(fullAvatarVideos)
      .where(eq(fullAvatarVideos.userId, ctx.user.id))
      .orderBy(desc(fullAvatarVideos.createdAt));

    const now = new Date();
    return videos
      .filter((v) => v.status !== "failed" && new Date(v.expiresAt) > now)
      .map((v) => ({
        ...v,
        daysUntilExpiration: Math.ceil(
          (new Date(v.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ),
      }));
  }),

  /**
   * Delete a full avatar video
   */
  delete: protectedProcedure
    .input(z.object({ videoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(fullAvatarVideos)
        .where(
          and(
            eq(fullAvatarVideos.id, input.videoId),
            eq(fullAvatarVideos.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  // ─── Custom Avatar Twin (HeyGen trained avatar) ──────────────────────────

  /**
   * Start training a custom HeyGen avatar from a video clip
   */
  trainCustomAvatar: protectedProcedure
    .input(
      z.object({
        trainingVideoUrl: z.string().url(),
        thumbnailUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { avatarId, status } = await createCustomAvatar({
        trainingVideoUrl: input.trainingVideoUrl,
        name: `${ctx.user.name || "Agent"}'s Digital Twin`,
      });

      // Upsert the twin record (one per user)
      const existing = await db
        .select()
        .from(customAvatarTwins)
        .where(eq(customAvatarTwins.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(customAvatarTwins)
          .set({
            didAvatarId: avatarId,
            trainingVideoUrl: input.trainingVideoUrl,
            thumbnailUrl: input.thumbnailUrl || null,
            status: "training",
            trainedAt: null,
          })
          .where(eq(customAvatarTwins.userId, ctx.user.id));
      } else {
        await db.insert(customAvatarTwins).values({
          userId: ctx.user.id,
          didAvatarId: avatarId,
          trainingVideoUrl: input.trainingVideoUrl,
          thumbnailUrl: input.thumbnailUrl || null,
          status: "training",
        });
      }

      return { avatarId, status };
    }),

  /**
   * Check training status of the user's custom avatar twin
   */
  getCustomAvatarStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [twin] = await db
      .select()
      .from(customAvatarTwins)
      .where(eq(customAvatarTwins.userId, ctx.user.id))
      .limit(1);

    if (!twin) return null;

    // If still training, poll HeyGen for latest status
    if (twin.status === "training") {
      try {
        const { status, previewImageUrl } = await getCustomAvatarStatus(twin.didAvatarId);
        if (status === "completed") {
          await db
            .update(customAvatarTwins)
            .set({
              status: "ready",
              trainedAt: new Date(),
              thumbnailUrl: previewImageUrl || twin.thumbnailUrl,
            })
            .where(eq(customAvatarTwins.userId, ctx.user.id));
          return { ...twin, status: "ready" as const, trainedAt: new Date() };
        } else if (status === "failed") {
          await db
            .update(customAvatarTwins)
            .set({ status: "failed" })
            .where(eq(customAvatarTwins.userId, ctx.user.id));
          return { ...twin, status: "failed" as const };
        }
      } catch {
        // Non-blocking — return cached status
      }
    }

    return twin;
  }),

  /**
   * Generate a full video using the trained custom avatar
   */
  generateWithCustomAvatar: protectedProcedure
    .input(
      z.object({
        script: z.string().min(20).max(5000),
        voiceId: z.string().optional().default("en-US-JennyNeural"),
        title: z.string().max(255).optional(),
        landscape: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [twin] = await db
        .select()
        .from(customAvatarTwins)
        .where(eq(customAvatarTwins.userId, ctx.user.id))
        .limit(1);

      if (!twin || twin.status !== "ready") {
        throw new Error(
          twin
            ? twin.status === "training"
              ? "Your custom avatar is still training. Please wait a few minutes and try again."
              : "Your custom avatar training failed. Please retrain."
            : "No custom avatar found. Please train your digital twin first."
        );
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);
      const duration = estimateDuration(input.script);

      const [record] = await db
        .insert(fullAvatarVideos)
        .values({
          userId: ctx.user.id,
          title: input.title || null,
          script: input.script,
          avatarType: "v3_custom",
          customAvatarId: twin.didAvatarId,
          voiceId: input.voiceId,
          duration,
          status: "processing",
          expiresAt,
        })
        .$returningId();

      const videoId = record.id;

      try {
        // Generate using HeyGen custom avatar
        const heygenVideoId = await generateCustomAvatarVideo({
          avatarId: twin.didAvatarId,
          script: input.script,
          voiceId: input.voiceId,
          title: input.title,
          landscape: input.landscape,
        });

        await db
          .update(fullAvatarVideos)
          .set({ didTalkId: heygenVideoId })
          .where(eq(fullAvatarVideos.id, videoId));

        const heygenVideoUrl = await waitForHeyGenVideo(heygenVideoId, 600_000, 5_000);

        // Download and re-host on S3
        const videoRes = await fetch(heygenVideoUrl);
        if (!videoRes.ok) throw new Error("Failed to download HeyGen video");
        const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
        const s3Key = `full-avatar-videos/${ctx.user.id}/${videoId}-custom-${Date.now()}.mp4`;
        const { url: s3Url } = await storagePut(s3Key, videoBuffer, "video/mp4");

        await db
          .update(fullAvatarVideos)
          .set({ videoUrl: s3Url, s3Key, status: "completed" })
          .where(eq(fullAvatarVideos.id, videoId));

        return { videoId, videoUrl: s3Url, duration, expiresAt: expiresAt.toISOString() };
      } catch (err) {
        await db
          .update(fullAvatarVideos)
          .set({ status: "failed" })
          .where(eq(fullAvatarVideos.id, videoId));
        throw new Error(
          `Custom avatar video generation failed: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }),
});
