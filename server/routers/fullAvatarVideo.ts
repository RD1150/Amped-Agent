import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { fullAvatarVideos, customAvatarTwins, users } from "../../drizzle/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { storagePut } from "../storage";
import { mixBgmIntoVideo } from "../lib/audioMixer";
import { invokeLLM } from "../_core/llm";
import {
  generateStockAvatarVideo,
  generateCustomAvatarVideo,
  createPhotoAvatarFromUrl,
  getCustomAvatarStatus,
  triggerAvatarTraining,
  waitForHeyGenVideo,
  listHeyGenVoices,
  getAvatarPreviewImage,
} from "../lib/heygen-service";

/** Estimate video duration from word count (avg 130 words/min speaking pace) */
function estimateDuration(script: string): number {
  const words = script.trim().split(/\s+/).length;
  return Math.ceil((words / 130) * 60);
}

// ── Server-side voice cache (30 min TTL) ────────────────────────────────────
let _voiceCache: { id: string; name: string; gender: "male" | "female"; previewUrl: string | null }[] | null = null;
let _voiceCacheAt = 0;
const VOICE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export const fullAvatarVideoRouter = router({
  /**
   * Fetch English voices from HeyGen for the voice picker (cached 30 min)
   */
  getVoices: protectedProcedure
    .query(async () => {
      // Return cached result if still fresh
      if (_voiceCache && Date.now() - _voiceCacheAt < VOICE_CACHE_TTL) {
        return _voiceCache;
      }
      const apiKey = process.env.HEYGEN_API_KEY;
      if (!apiKey) throw new Error("Avatar API key not configured");
      const res = await fetch("https://api.heygen.com/v2/voices", {
        headers: { "X-Api-Key": apiKey },
        signal: AbortSignal.timeout(15000), // 15s timeout
      });
      if (!res.ok) throw new Error(`Voice list fetch failed: ${res.status}`);
      const data = await res.json() as { data?: { voices?: Array<{ voice_id: string; name: string; gender: string; language: string; preview_audio?: string }> } };
      const voices = (data.data?.voices ?? []) as Array<{ voice_id: string; name: string; gender: string; language: string; preview_audio?: string }>;
      const result = voices
        .filter((v) => v.language === "English" && v.name?.trim())
        .map((v) => ({
          id: v.voice_id,
          name: v.name.trim(),
          gender: v.gender as "male" | "female",
          previewUrl: v.preview_audio ?? null,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      // Store in cache
      _voiceCache = result;
      _voiceCacheAt = Date.now();
      return result;
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
        city: z.string().optional(), // For market_update: pull live market data
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch live market data for market_update scripts
      let marketDataBlock = "";
      if (input.contentType === "market_update" && input.city) {
        try {
          const { getMarketData } = await import("../marketStatsHelper");
          const md = await getMarketData(input.city);
          marketDataBlock = `\n\nLIVE MARKET DATA for ${md.location} (use these exact numbers — do not invent statistics):
- Median Home Price: $${md.medianPrice.toLocaleString()} (${md.priceChange > 0 ? "+" : ""}${md.priceChange}% YoY)
- Days on Market: ${md.daysOnMarket} days
- Active Listings: ${md.activeListings.toLocaleString()} (${md.listingsChange > 0 ? "+" : ""}${md.listingsChange}% YoY)
- Price per Sq Ft: $${md.pricePerSqft}
- Market Condition: ${md.marketTemperature === "hot" ? "Seller's Market" : md.marketTemperature === "cold" ? "Buyer's Market" : "Balanced Market"}`;
          console.log(`[FullAvatarVideo] Fetched live market data for ${input.city}`);
        } catch (err) {
          console.warn("[FullAvatarVideo] Could not fetch market data, using key points only:", err);
        }
      }

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
${input.keyPoints}${marketDataBlock}

Requirements:
- Direct-to-camera delivery tone (not a voiceover)
- Conversational but professional${marketDataBlock ? "\n- Use the LIVE MARKET DATA numbers above — do not invent or round statistics" : ""}
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
   * Fetch stock avatars from HeyGen for the avatar picker
   */
  getAvatars: protectedProcedure
    .query(async () => {
      const apiKey = process.env.HEYGEN_API_KEY;
      if (!apiKey) throw new Error("Avatar API key not configured");
      const res = await fetch("https://api.heygen.com/v2/avatars", {
        headers: { "X-Api-Key": apiKey, accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Avatar list fetch failed: ${res.status}`);
      // HeyGen /v2/avatars returns two separate arrays:
      //   data.avatars       → true stock avatars (use type:"avatar" + avatar_id)
      //   data.talking_photos → photo-based avatars (require image dimensions — NOT supported here)
      // We ONLY use data.avatars to avoid the "missing image dimensions" error.
      const data = await res.json() as {
        data?: {
          avatars?: Array<{
            avatar_id: string;
            avatar_name: string;
            gender: string;
            preview_image_url: string;
            preview_video_url?: string;
            premium: boolean;
            type?: string | null;
          }>;
          talking_photos?: unknown[];
        };
      };
      // Strictly use data.avatars — never talking_photos
      const avatars = data.data?.avatars ?? [];
      // Return only free (non-premium) stock avatars
      return avatars
        .filter((a) => !a.premium && a.avatar_id)
        .map((a) => ({
          id: a.avatar_id,
          name: a.avatar_name,
          gender: a.gender as "male" | "female",
          previewImageUrl: a.preview_image_url,
          previewVideoUrl: a.preview_video_url ?? null,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }),

  /**
   * Generate a full talking-head video using HeyGen stock avatar
   */
  generate: protectedProcedure
    .input(
      z.object({
        script: z.string().min(20).max(5000),
        avatarId: z.string().min(1),           // HeyGen stock avatar_id
        avatarPreviewUrl: z.string().url().optional(), // for display in DB
        voiceId: z.string().optional().default("1bd001e7e50f421d891986aad5158bc8"),
        title: z.string().max(255).optional(),
        landscape: z.boolean().optional().default(false),
        captionsEnabled: z.boolean().optional().default(false), // Burn CC captions into video
        visualPrompt: z.string().max(2000).optional(), // Visual direction / B-roll notes (stored for reference)
        backgroundUrl: z.string().url().optional(), // Background scene image URL
        musicUrl: z.string().url().optional(), // Custom BGM track URL (S3)
        bgmVolume: z.number().min(5).max(25).optional(), // BGM volume percent (default 12)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // ── Premium gate ────────────────────────────────────────────────────────
      const [userRow] = await db.select({ tier: users.subscriptionTier }).from(users).where(eq(users.id, ctx.user.id));
      const tier = userRow?.tier ?? "starter";
      if (tier !== "agency" && tier !== "pro") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Full Avatar Video is a Premium feature. Please upgrade your plan to access this feature.",
        });
      }

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
          avatarUrl: input.avatarPreviewUrl || null,
          avatarType: "v2_photo",
          voiceId: input.voiceId,
          duration,
          status: "processing",
          expiresAt,
        })
        .$returningId();

      const videoId = record.id;

      try {
            // Submit video generation job using stock avatar_id
        const heygenVideoId = await generateStockAvatarVideo({
          avatarId: input.avatarId,
          script: input.script,
          voiceId: input.voiceId,
          title: input.title,
          landscape: input.landscape,
          caption: input.captionsEnabled,
          backgroundUrl: input.backgroundUrl,
        });
        // Save HeyGen video ID for reference
        await db
          .update(fullAvatarVideos)
          .set({ didTalkId: heygenVideoId })
          .where(eq(fullAvatarVideos.id, videoId));
        // Poll until complete (up to 10 minutes for long scripts)
        const { videoUrl: heygenVideoUrl, captionVideoUrl } = await waitForHeyGenVideo(heygenVideoId, 600_000, 5_000);
        // When captions are enabled, prefer the captioned version of the video
        const finalVideoUrl = (input.captionsEnabled && captionVideoUrl) ? captionVideoUrl : heygenVideoUrl;
        // Download and re-host on S3 for permanence
        const videoRes = await fetch(finalVideoUrl);
        if (!videoRes.ok) throw new Error("Failed to download generated video");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let videoBuffer: any = Buffer.from(await videoRes.arrayBuffer());
        // ── BGM mixing (optional) ────────────────────────────────────────────
        if (input.musicUrl) {
          try {
            const musicRes = await fetch(input.musicUrl);
            if (musicRes.ok) {
              const musicBuffer = Buffer.from(await musicRes.arrayBuffer());
              const vol = (input.bgmVolume ?? 12) / 100;
              videoBuffer = await mixBgmIntoVideo(videoBuffer, musicBuffer, vol);
            }
          } catch (mixErr) {
            // BGM mixing is best-effort — don't fail the whole generation
            console.warn("BGM mixing failed, using video without music:", mixErr);
          }
        }
        const s3Key = `full-avatar-videos/${ctx.user.id}/${videoId}-${Date.now()}.mp4`;
        const { url: s3Url } = await storagePut(s3Key, videoBuffer, "video/mp4");
        await db
          .update(fullAvatarVideos)
          .set({ videoUrl: s3Url, s3Key, status: "completed" })
          .where(eq(fullAvatarVideos.id, videoId));
        return { videoId, videoUrl: s3Url, duration, expiresAt: expiresAt.toISOString() };;
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
        photoUrl: z.string().url(),   // S3 URL of the uploaded headshot photo
        thumbnailUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Photo Avatar flow — works on Individual Creator plan (no Enterprise required)
      // Downloads the photo from S3, uploads to HeyGen, creates an avatar group
      const avatarId = await createPhotoAvatarFromUrl(
        input.photoUrl,
        `${ctx.user.name || "Agent"}'s Photo Avatar`
      );

      // Immediately check if the avatar is already ready (photo avatars complete instantly)
      let initialStatus: "training" | "ready" = "training";
      let previewUrl = input.thumbnailUrl || input.photoUrl;
      try {
        const check = await getCustomAvatarStatus(avatarId);
        if (check.status === "completed") {
          initialStatus = "ready";
          previewUrl = check.previewImageUrl || previewUrl;
        }
      } catch {
        // Non-blocking — default to training so polling can pick it up
      }

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
            trainingVideoUrl: input.photoUrl,
            thumbnailUrl: previewUrl,
            status: initialStatus,
            trainedAt: initialStatus === "ready" ? new Date() : null,
          })
          .where(eq(customAvatarTwins.userId, ctx.user.id));
      } else {
        await db.insert(customAvatarTwins).values({
          userId: ctx.user.id,
          didAvatarId: avatarId,
          trainingVideoUrl: input.photoUrl,
          thumbnailUrl: previewUrl,
          status: initialStatus,
          trainedAt: initialStatus === "ready" ? new Date() : null,
        });
      }

      return { avatarId, status: initialStatus };
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
        const { status, previewImageUrl, invalidGroup } = await getCustomAvatarStatus(twin.didAvatarId);
        if (invalidGroup || status === "failed") {
          // Group doesn't exist on HeyGen (404) or failed — mark as failed so UI shows delete/retry
          await db
            .update(customAvatarTwins)
            .set({ status: "failed" })
            .where(eq(customAvatarTwins.userId, ctx.user.id));
          return { ...twin, status: "failed" as const, invalidGroup: true };
        } else if (status === "completed") {
          await db
            .update(customAvatarTwins)
            .set({
              status: "ready",
              trainedAt: new Date(),
              thumbnailUrl: previewImageUrl || twin.thumbnailUrl,
            })
            .where(eq(customAvatarTwins.userId, ctx.user.id));
          return { ...twin, status: "ready" as const, trainedAt: new Date() };
        }
      } catch {
        // Non-blocking — return cached status
      }
    }

    return twin;
  }),

  /**
   * Retry / kick-start training for a stuck avatar (pending state)
   */
  retryAvatarTraining: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [twin] = await db
      .select()
      .from(customAvatarTwins)
      .where(eq(customAvatarTwins.userId, ctx.user.id))
      .limit(1);
    if (!twin) throw new TRPCError({ code: "NOT_FOUND", message: "No avatar found" });
    if (twin.status === "ready") return { status: "ready" };
    // Re-trigger training on HeyGen
    await triggerAvatarTraining(twin.didAvatarId);
    // Reset status to training so polling resumes
    await db
      .update(customAvatarTwins)
      .set({ status: "training" })
      .where(eq(customAvatarTwins.userId, ctx.user.id));
    return { status: "training" };
  }),

  /**
   * Delete the user's custom avatar twin so they can retrain from scratch
   */
  deleteCustomAvatar: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db
      .delete(customAvatarTwins)
      .where(eq(customAvatarTwins.userId, ctx.user.id));
    return { success: true };
  }),

  /**
   * Directly set / update the HeyGen avatar ID for the current user's default avatar.
   * Useful when a user has already created their avatar on HeyGen and just needs to link it.
   */
  setAvatarId: protectedProcedure
    .input(z.object({ avatarId: z.string().min(10).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [existing] = await db
        .select()
        .from(customAvatarTwins)
        .where(and(eq(customAvatarTwins.userId, ctx.user.id), eq(customAvatarTwins.isDefault, true)))
        .limit(1);

      if (existing) {
        await db
          .update(customAvatarTwins)
          .set({ didAvatarId: input.avatarId, status: "ready", trainedAt: new Date() })
          .where(eq(customAvatarTwins.id, existing.id));
      } else {
        await db.insert(customAvatarTwins).values({
          userId: ctx.user.id,
          didAvatarId: input.avatarId,
          trainingVideoUrl: null,
          status: "ready",
          trainedAt: new Date(),
          isDefault: true,
        });
      }

      return { success: true, avatarId: input.avatarId };
    }),

  /** List all avatars for the current user */
  listAvatars: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db
      .select()
      .from(customAvatarTwins)
      .where(eq(customAvatarTwins.userId, ctx.user.id))
      .orderBy(customAvatarTwins.createdAt);
  }),

  /** Add a new avatar to the user's library by pasting an avatar ID */
  addAvatar: protectedProcedure
    .input(z.object({
      avatarId: z.string().min(10).max(255),
      nickname: z.string().max(100).optional(),
      setAsDefault: z.boolean().optional().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db
        .select({ id: customAvatarTwins.id })
        .from(customAvatarTwins)
        .where(eq(customAvatarTwins.userId, ctx.user.id));
      const isFirst = existing.length === 0;

      if (input.setAsDefault || isFirst) {
        await db.update(customAvatarTwins).set({ isDefault: false }).where(eq(customAvatarTwins.userId, ctx.user.id));
      }

      // Try to fetch preview thumbnail from HeyGen (best-effort, non-blocking)
      let thumbnailUrl: string | null = null;
      try {
        thumbnailUrl = await getAvatarPreviewImage(input.avatarId);
      } catch {
        // silently ignore — thumbnail is optional
      }

      const [inserted] = await db.insert(customAvatarTwins).values({
        userId: ctx.user.id,
        didAvatarId: input.avatarId,
        nickname: input.nickname || null,
        trainingVideoUrl: null,
        thumbnailUrl: thumbnailUrl || null,
        status: "ready",
        trainedAt: new Date(),
        isDefault: isFirst || input.setAsDefault,
      }).$returningId();

      return { success: true, id: inserted.id, thumbnailUrl };
    }),

  /** Update nickname for an avatar */
  updateAvatarNickname: protectedProcedure
    .input(z.object({ avatarId: z.number().int().positive(), nickname: z.string().max(100) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(customAvatarTwins)
        .set({ nickname: input.nickname })
        .where(and(eq(customAvatarTwins.id, input.avatarId), eq(customAvatarTwins.userId, ctx.user.id)));
      return { success: true };
    }),

  /** Set a specific avatar as the default */
  setDefaultAvatar: protectedProcedure
    .input(z.object({ avatarId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(customAvatarTwins).set({ isDefault: false }).where(eq(customAvatarTwins.userId, ctx.user.id));
      await db
        .update(customAvatarTwins)
        .set({ isDefault: true })
        .where(and(eq(customAvatarTwins.id, input.avatarId), eq(customAvatarTwins.userId, ctx.user.id)));
      return { success: true };
    }),

  /** Delete a specific avatar by DB id */
  deleteAvatarById: protectedProcedure
    .input(z.object({ avatarId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .delete(customAvatarTwins)
        .where(and(eq(customAvatarTwins.id, input.avatarId), eq(customAvatarTwins.userId, ctx.user.id)));
      return { success: true };
    }),

  /** Generate an avatar intro/outro clip for a property tour (returns HeyGen video URL) */
  generatePropertyIntroClip: protectedProcedure
    .input(z.object({
      avatarId: z.number().int().positive(), // DB id of the twin to use
      script: z.string().min(10).max(2000),
      landscape: z.boolean().optional().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [twin] = await db
        .select()
        .from(customAvatarTwins)
        .where(and(eq(customAvatarTwins.id, input.avatarId), eq(customAvatarTwins.userId, ctx.user.id)))
        .limit(1);

      if (!twin || twin.status !== "ready") throw new TRPCError({ code: "BAD_REQUEST", message: "Avatar not ready" });

      const heygenVideoId = await generateCustomAvatarVideo({
        avatarId: twin.didAvatarId,
        script: input.script,
        voiceId: "en-US-JennyNeural",
        landscape: input.landscape,
        caption: false,
      });

      const { videoUrl } = await waitForHeyGenVideo(heygenVideoId, 600_000, 5_000);

      // Re-host on S3
      const res = await fetch(videoUrl);
      if (!res.ok) throw new Error("Failed to download HeyGen clip");
      const buf = Buffer.from(await res.arrayBuffer());
      const key = `property-tour-intros/${ctx.user.id}/${Date.now()}.mp4`;
      const { url: s3Url } = await storagePut(key, buf, "video/mp4");

      return { videoUrl: s3Url };
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
        captionsEnabled: z.boolean().optional().default(false), // Burn CC captions into video
        visualPrompt: z.string().max(2000).optional(), // Visual direction / B-roll notes (stored for reference)
        backgroundUrl: z.string().url().optional(), // Background scene image URL
        musicUrl: z.string().url().optional(), // Custom BGM track URL (S3)
        bgmVolume: z.number().min(5).max(25).optional(), // BGM volume percent (default 12)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // ── Premium gate ────────────────────────────────────────────────────────
      const [userRow2] = await db.select({ tier: users.subscriptionTier }).from(users).where(eq(users.id, ctx.user.id));
      const tier2 = userRow2?.tier ?? "starter";
      if (tier2 !== "agency" && tier2 !== "pro") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Full Avatar Video is a Premium feature. Please upgrade your plan to access this feature.",
        });
      }

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
          caption: input.captionsEnabled,
          backgroundUrl: input.backgroundUrl,
        });

        await db
          .update(fullAvatarVideos)
          .set({ didTalkId: heygenVideoId })
          .where(eq(fullAvatarVideos.id, videoId));

          const { videoUrl: heygenVideoUrl2, captionVideoUrl: captionVideoUrl2 } = await waitForHeyGenVideo(heygenVideoId, 600_000, 5_000);
        // When captions are enabled, prefer the captioned version of the video
        const finalVideoUrl2 = (input.captionsEnabled && captionVideoUrl2) ? captionVideoUrl2 : heygenVideoUrl2;
        // Download and re-host on S3
        const videoRes = await fetch(finalVideoUrl2);
        if (!videoRes.ok) throw new Error("Failed to download generated video");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let videoBuffer: any = Buffer.from(await videoRes.arrayBuffer());
        // ── BGM mixing (optional) ────────────────────────────────────────────
        if (input.musicUrl) {
          try {
            const musicRes = await fetch(input.musicUrl);
            if (musicRes.ok) {
              const musicBuffer = Buffer.from(await musicRes.arrayBuffer());
              const vol = (input.bgmVolume ?? 12) / 100;
              videoBuffer = await mixBgmIntoVideo(videoBuffer, musicBuffer, vol);
            }
          } catch (mixErr) {
            console.warn("BGM mixing failed, using video without music:", mixErr);
          }
        }
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

  /**
   * Get this month's Full Avatar Video count and plan limit for the current user
   */
  getMonthlyUsage: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch user tier
    const [userRow] = await db
      .select({ tier: users.subscriptionTier })
      .from(users)
      .where(eq(users.id, ctx.user.id));
    const tier = userRow?.tier ?? "starter";

    // Count avatar videos created this month (all statuses except deleted)
    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(fullAvatarVideos)
      .where(
        and(
          eq(fullAvatarVideos.userId, ctx.user.id),
          gte(fullAvatarVideos.createdAt, monthStart)
        )
      );

    const used = Number(countRow?.count ?? 0);
    // Premium/Pro = unlimited (-1); Starter = blocked (0 limit)
    const limit = tier === "agency" || tier === "pro" ? -1 : 0;
    const tierLabel =
      tier === "agency" ? "Agency" : tier === "pro" ? "Pro" : "Starter";

    return { used, limit, tier: tierLabel };
  }),

  /**
   * Generate a short 5-second test clip to verify an avatar is working correctly.
   * Uses a fixed test script and returns the video URL.
   */
  testAvatar: protectedProcedure
    .input(z.object({
      avatarId: z.number().int().positive(), // DB id of the avatar to test
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [twin] = await db
        .select()
        .from(customAvatarTwins)
        .where(and(eq(customAvatarTwins.id, input.avatarId), eq(customAvatarTwins.userId, ctx.user.id)))
        .limit(1);

      if (!twin || twin.status !== "ready") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Avatar not ready" });
      }

      const testScript = "Hi, this is a quick test to confirm my avatar is working correctly. Everything looks great!";

      const heygenVideoId = await generateCustomAvatarVideo({
        avatarId: twin.didAvatarId,
        script: testScript,
        voiceId: "en-US-JennyNeural",
        landscape: false,
        caption: false,
      });

      const { videoUrl } = await waitForHeyGenVideo(heygenVideoId, 300_000, 5_000);

      // Re-host on S3 so the URL is stable
      const res = await fetch(videoUrl);
      if (!res.ok) throw new Error("Failed to download test clip");
      const buf = Buffer.from(await res.arrayBuffer());
      const key = `avatar-tests/${ctx.user.id}/${input.avatarId}-${Date.now()}.mp4`;
      const { url: s3Url } = await storagePut(key, buf, "video/mp4");

      return { videoUrl: s3Url };
    }),
});
