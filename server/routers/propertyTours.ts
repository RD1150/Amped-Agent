import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import * as credits from "../credits";
import * as rateLimit from "../rateLimit";
import { generatePropertyTourVideo, checkRenderStatus } from "../videoGenerator";
import { storagePut } from "../storage";
import { fetchPropertyData } from "../rapidapi";
import { getDb } from "../db";
import { users, propertyTours, customAvatarTwins } from "../../drizzle/schema";
import { eq, and, gte, sql, inArray } from "drizzle-orm";
import * as fs from "fs";

function bgLog(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.appendFileSync("/home/ubuntu/luxestate/.manus-logs/videogen.log", line); } catch {}
  console.log(msg);
}

export const propertyToursRouter = router({
  /**
   * Create a new property tour (without video generation yet)
   */
  create: protectedProcedure
    .input(
      z.object({
        address: z.string().min(1, "Address is required"),
        price: z.string().optional(),
        beds: z.number().int().min(0).optional(),
        baths: z.number().min(0).optional(),
        sqft: z.number().int().min(0).optional(),
        propertyType: z.string().optional(),
        description: z.string().optional(),
        features: z.array(z.string()).optional(),
        imageUrls: z.array(z.string().url()).min(1, "At least one image is required"),
        template: z.enum(["modern", "luxury", "cozy"]).default("modern"),
        duration: z.number().int().min(15).max(120).default(25),
        includeBranding: z.boolean().default(true),
        aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
        musicTrack: z.string().optional(),
        cardTemplate: z.enum(["modern", "luxury", "bold", "classic", "contemporary"]).default("modern"),
        includeIntroVideo: z.boolean().default(false),
        videoMode: z.enum(["standard", "ai-enhanced", "cinematic"]).default("standard"),
        enableVoiceover: z.boolean().default(false),
        voiceId: z.string().optional(),
        customCameraPrompt: z.string().optional(),
        voiceoverScript: z.string().optional(),
        perPhotoMovements: z.array(z.string().nullable().transform(v => v ?? "auto")).optional(),
        movementSpeed: z.enum(["slow", "fast"]).default("slow"),
        enableAvatarOverlay: z.boolean().default(false),
        avatarOverlayPosition: z.enum(["bottom-left", "bottom-right"]).default("bottom-left"),
        avatarTwinId: z.number().int().positive().optional(), // DB id of the avatar twin to use for intro/outro
        avatarIntroScript: z.string().max(2000).optional(), // Script for the avatar intro clip
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tour = await db.createPropertyTour({
        userId: ctx.user.id,
        address: input.address,
        price: input.price,
        beds: input.beds,
        baths: input.baths ? input.baths.toString() : undefined,
        sqft: input.sqft,
        propertyType: input.propertyType,
        description: input.description,
        features: input.features ? JSON.stringify(input.features) : undefined,
        imageUrls: JSON.stringify(input.imageUrls),
        template: input.template,
        duration: input.duration,
        includeBranding: input.includeBranding,
        aspectRatio: input.aspectRatio,
        musicTrack: input.musicTrack,
        cardTemplate: input.cardTemplate,
        includeIntroVideo: input.includeIntroVideo || (input.avatarTwinId ? true : false),
        videoMode: input.videoMode,
        enableVoiceover: input.enableVoiceover,
        voiceId: input.voiceId,
        customCameraPrompt: input.customCameraPrompt,
        voiceoverScript: input.voiceoverScript,
        perPhotoMovements: input.perPhotoMovements ? JSON.stringify(input.perPhotoMovements) : undefined,
        movementSpeed: input.movementSpeed,
        enableAvatarOverlay: input.enableAvatarOverlay,
        avatarOverlayPosition: input.avatarOverlayPosition,
        avatarTwinId: input.avatarTwinId,
        avatarIntroScript: input.avatarIntroScript,
        status: "pending",
      });

      return tour;
    }),

  /**
   * Generate video for a property tour
   */
  generateVideo: protectedProcedure
    .input(z.object({ tourId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      // Get the tour
      const tour = await db.getPropertyTourById(input.tourId);
      if (!tour) {
        throw new Error("Property tour not found");
      }

      // Verify ownership
      if (tour.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // Check if already processing or completed
      if (tour.status === "processing") {
        throw new Error("Video is already being generated");
      }
      if (tour.status === "completed" && tour.videoUrl) {
        return { videoUrl: tour.videoUrl, thumbnailUrl: tour.thumbnailUrl };
      }

      // Check daily rate limit
      const rateLimitStatus = await rateLimit.checkDailyVideoLimit(ctx.user.id);
      if (!rateLimitStatus.allowed) {
        const resetTime = rateLimitStatus.resetTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: 'UTC'
        });
        throw new Error(
          `Daily video limit reached (${rateLimitStatus.current}/${10}). You can generate more videos after ${resetTime} UTC. Upgrade for unlimited videos.`
        );
      }

      // Check monthly Cinematic limit for full-ai mode (unlimited for rdshop70@gmail.com)
      if (tour.videoMode === 'ai-enhanced' && ctx.user.email !== 'rdshop70@gmail.com') {
        const dbConn = await getDb();
        if (!dbConn) throw new Error("Database not available");
        const [user] = await dbConn.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
        
        const now = new Date();
        const lastReset = user?.lastCinematicCountReset || new Date(0);
        const isNewMonth = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
        if (isNewMonth) {
          await dbConn.update(users)
            .set({ cinematicPropertyToursThisMonth: 0, lastCinematicCountReset: now })
            .where(eq(users.id, ctx.user.id));
        }
        
        const cinematicCount = isNewMonth ? 0 : (user?.cinematicPropertyToursThisMonth || 0);
        const CINEMATIC_MONTHLY_LIMIT = 2;
        if (cinematicCount >= CINEMATIC_MONTHLY_LIMIT) {
          throw new Error(
            `Monthly Full Cinematic limit reached (${cinematicCount}/${CINEMATIC_MONTHLY_LIMIT}). You can generate more Full Cinematic Property Tours next month. Use Standard tier instead.`
          );
        }
        await dbConn.update(users)
          .set({ cinematicPropertyToursThisMonth: cinematicCount + 1 })
          .where(eq(users.id, ctx.user.id));
      }

      // Calculate credit cost
      const costBreakdown = credits.calculateVideoCost({
        videoMode: (tour.videoMode as "standard" | "ai-enhanced" | "cinematic") || "standard",
        enableVoiceover: tour.enableVoiceover || false,
      });

      // Check if user has sufficient credits
      const hasEnoughCredits = await credits.hasCredits(ctx.user.id, costBreakdown.totalCredits);
      if (!hasEnoughCredits) {
        const currentBalance = await credits.getCreditBalance(ctx.user.id);
        throw new Error(
          `Insufficient credits. You need ${costBreakdown.totalCredits} credits but only have ${currentBalance}. Please purchase more credits to continue.`
        );
      }

      // Deduct credits BEFORE starting generation
      await credits.deductCredits({
        userId: ctx.user.id,
        amount: costBreakdown.totalCredits,
        usageType: `${tour.videoMode}_video${tour.enableVoiceover ? '_with_voiceover' : ''}`,
        description: `Generated ${tour.videoMode} video for "${tour.address}"`,
        relatedResourceId: input.tourId,
        relatedResourceType: "property_tour",
      });

      // Mark as processing immediately so the UI can start polling
      await db.updatePropertyTour(input.tourId, {
        status: "processing",
        processingStage: "preparing",
      });

      // ─── FIRE AND FORGET ──────────────────────────────────────────────────────
      // The heavy work (Kling AI clip generation, ElevenLabs voiceover, Creatomate
      // submission) runs in a detached background task so this mutation returns
      // immediately. The frontend polls checkRenderStatus for progress.
      // ─────────────────────────────────────────────────────────────────────────
      const tourId = input.tourId;
      const userId = ctx.user.id;

      setImmediate(async () => {
        bgLog(`[PropertyTours] 🚀 Background job STARTED for tour ${tourId} (mode: ${tour.videoMode})`);
        try {
          const imageUrls = JSON.parse(tour.imageUrls) as string[];
          bgLog(`[PropertyTours] Image URLs (${imageUrls.length}): ${JSON.stringify(imageUrls)}`);

          // Stage 1: Fetch persona data
          await db.updatePropertyTour(tourId, { processingStage: "preparing" });
          bgLog(`[PropertyTours] Stage: preparing`);
          const { getPersonaByUserId } = await import("../db");
          const persona = await getPersonaByUserId(userId);
          bgLog(`[PropertyTours] Persona fetched: ${persona ? 'yes' : 'no'}`);

          // Stage 2a: Generate avatar intro clip (if avatarTwinId is set)
          let avatarIntroVideoUrl: string | undefined = tour.avatarIntroVideoUrl || undefined;
          if (tour.avatarTwinId && !avatarIntroVideoUrl) {
            bgLog(`[PropertyTours] Stage: generating_avatar_intro (HeyGen)`);
            await db.updatePropertyTour(tourId, { processingStage: "generating_avatar_intro" });
            try {
              const dbConn = await getDb();
              if (dbConn) {
                const [twin] = await dbConn.select().from(customAvatarTwins).where(eq(customAvatarTwins.id, tour.avatarTwinId)).limit(1);
                if (twin && twin.status === "ready") {
                  const script = tour.avatarIntroScript || `Hi, I'm your agent and I'm excited to show you this beautiful property at ${tour.address}. Let's take a look inside!`;
                  const { generateCustomAvatarVideo, waitForHeyGenVideo } = await import("../lib/heygen-service");
                  const heygenVideoId = await generateCustomAvatarVideo({
                    avatarId: twin.didAvatarId,
                    script,
                    voiceId: "en-US-JennyNeural",
                    landscape: true,
                    caption: false,
                  });
                  const { videoUrl: heygenUrl } = await waitForHeyGenVideo(heygenVideoId, 600_000, 5_000);
                  // Re-host on S3
                  const res = await fetch(heygenUrl);
                  if (res.ok) {
                    const buf = Buffer.from(await res.arrayBuffer());
                    const key = `property-tour-intros/${userId}/${tourId}-${Date.now()}.mp4`;
                    const { url: s3Url } = await storagePut(key, buf, "video/mp4");
                    avatarIntroVideoUrl = s3Url;
                    await db.updatePropertyTour(tourId, { avatarIntroVideoUrl: s3Url });
                    bgLog(`[PropertyTours] Avatar intro clip generated: ${s3Url}`);
                  }
                }
              }
            } catch (introErr) {
              bgLog(`[PropertyTours] ⚠️ Avatar intro generation failed (non-fatal): ${introErr instanceof Error ? introErr.message : String(introErr)}`);
              // Non-fatal: continue without intro clip
            }
          }

          // Stage 2b: Generate voiceover (if enabled) — this is fast, ~5s
          if (tour.enableVoiceover) {
            await db.updatePropertyTour(tourId, { processingStage: "generating_voiceover" });
          }

          // Stage 3: For AI Walkthrough, show generating_ai_clips stage BEFORE calling generatePropertyTourVideo
          // This stage stays visible during the entire Kling AI wait (~5-10 min)
          // For standard mode, show submitting_to_renderer immediately
          if (tour.videoMode === "ai-enhanced") {
            await db.updatePropertyTour(tourId, { processingStage: "generating_ai_clips" });
            bgLog(`[PropertyTours] Stage: generating_ai_clips (Kling AI will run inside generatePropertyTourVideo)`);
          } else {
            await db.updatePropertyTour(tourId, { processingStage: "submitting_to_renderer" });
            bgLog(`[PropertyTours] Stage: submitting_to_renderer`);
          }

          bgLog(`[PropertyTours] Calling generatePropertyTourVideo...`);
          const { renderId } = await generatePropertyTourVideo({
            imageUrls,
            propertyDetails: {
              address: tour.address,
              price: tour.price || undefined,
              beds: tour.beds || undefined,
              baths: tour.baths ? parseFloat(tour.baths) : undefined,
              sqft: tour.sqft || undefined,
              propertyType: tour.propertyType || undefined,
              description: tour.description || undefined,
            },
            template: (tour.template as "modern" | "luxury" | "cozy") || "modern",
            duration: tour.duration || 30,
            includeBranding: tour.includeBranding ?? true,
            userId,
            aspectRatio: (tour.aspectRatio as "16:9" | "9:16" | "1:1") || "16:9",
            musicTrack: tour.musicTrack || undefined,
            cardTemplate: (tour.cardTemplate as "modern" | "luxury" | "bold" | "classic" | "contemporary") || "modern",
            includeIntroVideo: tour.includeIntroVideo ?? false,
            videoMode: (tour.videoMode as "standard" | "ai-enhanced" | "cinematic") || "standard",
            enableVoiceover: tour.enableVoiceover || false,
            customCameraPrompt: tour.customCameraPrompt || undefined,
            voiceoverScript: tour.voiceoverScript || undefined,
            perPhotoMovements: tour.perPhotoMovements ? JSON.parse(tour.perPhotoMovements) : undefined,
            movementSpeed: (tour.movementSpeed as "slow" | "fast") || "slow",
            enableAvatarOverlay: tour.enableAvatarOverlay ?? false,
            avatarOverlayPosition: (tour.avatarOverlayPosition as "bottom-left" | "bottom-right") || "bottom-left",
            agentHeadshotUrl: persona?.klingAvatarHeadshotUrl || undefined,
            agentVoiceUrl: persona?.klingAvatarVoiceUrl || undefined,
            voiceId: persona?.elevenlabsVoiceId || tour.voiceId || undefined,
            avatarIntroVideoUrl: avatarIntroVideoUrl || undefined,
          });

          // Store renderId in videoUrl field for polling
          await db.updatePropertyTour(tourId, {
            videoUrl: renderId,
            status: "processing",
            processingStage: "rendering",
          });

          // Increment daily video count
          await rateLimit.incrementDailyVideoCount(userId);

          bgLog(`[PropertyTours] Background job complete for tour ${tourId}. Creatomate renderId: ${renderId}`);
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : "Unknown error";
          bgLog(`[PropertyTours] ❌ Background job FAILED for tour ${tourId}: ${errMsg}`);
          bgLog(`[PropertyTours] Error stack: ${error instanceof Error ? error.stack : ''}`);
          console.error(`[PropertyTours] Background job FAILED for tour ${tourId}:`, errMsg);

          await db.updatePropertyTour(tourId, {
            status: "failed",
            errorMessage: errMsg,
            processingStage: null,
          });

          // Refund credits
          const costBreakdown = credits.calculateVideoCost({
            videoMode: "standard",
            enableVoiceover: tour.enableVoiceover || false,
          });
          await credits.refundCredits({
            userId,
            amount: costBreakdown.totalCredits,
            reason: `Video generation failed: ${errMsg}`,
            relatedResourceId: tourId,
            relatedResourceType: "property_tour",
          });
        }
      });
      // ─── END FIRE AND FORGET ──────────────────────────────────────────────────

      // Return immediately — frontend will poll checkRenderStatus
      return { queued: true };
    }),

  /**
   * Check render status and update tour when complete
   */
  checkRenderStatus: protectedProcedure
    .input(z.object({ tourId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tour = await db.getPropertyTourById(input.tourId);
      if (!tour) {
        throw new Error("Property tour not found");
      }

      // Verify ownership
      if (tour.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // If already completed or failed, return current status
      if (tour.status === "completed" || tour.status === "failed") {
        return {
          status: tour.status,
          videoUrl: tour.videoUrl,
          thumbnailUrl: tour.thumbnailUrl,
          error: tour.errorMessage,
          processingStage: tour.processingStage,
        };
      }

      // Background job still running (no renderId yet — AI clips or voiceover in progress)
      if (tour.status === "processing" && !tour.videoUrl) {
        return {
          status: "processing" as const,
          processingStage: tour.processingStage || "preparing",
        };
      }

      // Check Creatomate render status (renderId is stored in videoUrl temporarily)
      if (tour.status === "processing" && tour.videoUrl) {
        // Detect if videoUrl looks like a Creatomate renderId (UUID) vs a real URL
        const isRenderId = /^[0-9a-f-]{36}$/i.test(tour.videoUrl);
        
        if (isRenderId) {
          const renderId = tour.videoUrl;
          const renderStatus = await checkRenderStatus(renderId);

          if (renderStatus.status === "done" && renderStatus.url) {
            const thumbnailUrl = renderStatus.poster || renderStatus.thumbnail;
            await db.updatePropertyTour(input.tourId, {
              videoUrl: renderStatus.url,
              thumbnailUrl,
              status: "completed",
              processingStage: null,
            });
            return {
              status: "completed" as const,
              videoUrl: renderStatus.url,
              thumbnailUrl,
              processingStage: null,
            };
          } else if (renderStatus.status === "failed") {
            await db.updatePropertyTour(input.tourId, {
              status: "failed",
              errorMessage: renderStatus.error || "Video generation failed",
              processingStage: null,
            });
            return {
              status: "failed" as const,
              error: renderStatus.error,
              processingStage: null,
            };
          }

          // Map Creatomate status to a processingStage for the UI
          const renderStage = renderStatus.status === "rendering" ? "rendering"
            : renderStatus.status === "saving" ? "saving"
            : renderStatus.status === "fetching" ? "fetching_assets"
            : "rendering";

          return {
            status: "processing" as const,
            processingStage: renderStage,
          };
        }
      }

      return {
        status: tour.status as any,
        processingStage: tour.processingStage,
      };
    }),

  /**
   * Get all property tours for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const tours = await db.getPropertyToursByUserId(ctx.user.id);
    return tours;
  }),

  /**
   * Get a single property tour by ID
   */
  getById: protectedProcedure
    .input(z.object({ tourId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tour = await db.getPropertyTourById(input.tourId);
      if (!tour) {
        throw new Error("Property tour not found");
      }

      // Verify ownership
      if (tour.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      return tour;
    }),

  /**
   * Delete a property tour
   */
  delete: protectedProcedure
    .input(z.object({ tourId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const tour = await db.getPropertyTourById(input.tourId);
      if (!tour) {
        throw new Error("Property tour not found");
      }

      // Verify ownership
      if (tour.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // Refund credits if video was processing or failed (user shouldn't lose credits)
      if (tour.status === "processing" || tour.status === "failed") {
        const costBreakdown = credits.calculateVideoCost({
          videoMode: "standard",
          enableVoiceover: tour.enableVoiceover || false,
        });
        
        await credits.refundCredits({
          userId: ctx.user.id,
          amount: costBreakdown.totalCredits,
          reason: `Video cancelled/deleted while ${tour.status}`,
          relatedResourceId: input.tourId,
          relatedResourceType: "property_tour",
        });
      }

      await db.deletePropertyTour(input.tourId);
      return { success: true, creditsRefunded: tour.status === "processing" || tour.status === "failed" };
    }),

  /**
   * Bulk delete multiple property tours by ID (must belong to the authenticated user)
   */
  bulkDelete: protectedProcedure
    .input(z.object({ tourIds: z.array(z.number().int().positive()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      // Only delete tours that belong to this user
      await database
        .delete(propertyTours)
        .where(
          and(
            inArray(propertyTours.id, input.tourIds),
            eq(propertyTours.userId, ctx.user.id)
          )
        );

      return { success: true, deleted: input.tourIds.length };
    }),

  /**
   * Upload property images to S3
   */
  uploadImages: protectedProcedure
    .input(
      z.object({
        images: z.array(
          z.object({
            filename: z.string(),
            data: z.string(), // base64 encoded image data
            mimeType: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const uploadedUrls: string[] = [];

      for (const image of input.images) {
        // Decode base64
        const buffer = Buffer.from(image.data, "base64");

        // Generate unique key
        const ext = image.filename.split(".").pop() || "jpg";
        const key = `property-tours/${ctx.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        // Upload to S3
        const { url } = await storagePut(key, buffer, image.mimeType);
        uploadedUrls.push(url);
      }

      return { urls: uploadedUrls };
    }),

  /**
   * Fetch property data from RapidAPI by MLS ID
   */
  fetchPropertyData: protectedProcedure
    .input(
      z.object({
        mlsId: z.string().min(1, "MLS ID is required"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const propertyData = await fetchPropertyData(input.mlsId);
        return propertyData;
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to fetch property data. Please check the MLS ID and try again."
        );
      }
    }),

  /**
   * Generate a voiceover script for a property tour using LLM
   * Called from the frontend before video generation so users can review/edit
   */
  generateVoiceoverScript: protectedProcedure
    .input(
      z.object({
        address: z.string().min(1),
        price: z.string().optional(),
        beds: z.number().optional(),
        baths: z.number().optional(),
        sqft: z.number().optional(),
        propertyType: z.string().optional(),
        description: z.string().optional(),
        duration: z.number().int().min(10).max(120).default(30),
        style: z.enum(["professional", "warm", "luxury", "casual"]).default("professional"),
      })
    )
    .mutation(async ({ input }) => {
      const { generatePropertyTourScript, estimateScriptDuration } = await import("../scriptGenerator");

      const script = await generatePropertyTourScript({
        propertyDetails: {
          address: input.address,
          price: input.price ? parseFloat(input.price.replace(/[^0-9.]/g, "")) : undefined,
          bedrooms: input.beds,
          bathrooms: input.baths,
          squareFeet: input.sqft,
          description: input.description,
        },
        duration: input.duration,
        style: input.style,
      });

      return {
        script,
        estimatedDuration: estimateScriptDuration(script),
        wordCount: script.split(/\s+/).length,
      };
    }),

  /**
   * Preview a voice by generating a short ElevenLabs sample clip
   * Returns an S3 URL to the audio file for in-browser playback
   */
  previewVoice: protectedProcedure
    .input(
      z.object({
        voiceId: z.string().min(1),
        sampleText: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { textToSpeech } = await import("../_core/elevenLabs");
      const { storagePut } = await import("../storage");

      const text =
        input.sampleText ||
        "Welcome to this stunning property. I'm excited to take you on a tour of this beautiful home.";

      const audioBuffer = await textToSpeech({
        text,
        voice_id: input.voiceId,
        stability: 0.5,
        similarity_boost: 0.75,
        use_speaker_boost: true,
      });

      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error("ElevenLabs returned empty audio buffer for voice preview.");
      }

      const key = `property-tours/voice-previews/${input.voiceId}-${Date.now()}.mp3`;
      const { url } = await storagePut(key, audioBuffer, "audio/mpeg");

      return { url, voiceId: input.voiceId };
    }),

  /**
   * Get monthly video generation usage by tier
   */
  getMonthlyUsage: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get user's subscription tier
    const [user] = await db
      .select({ tier: users.subscriptionTier })
      .from(users)
      .where(eq(users.id, ctx.user.id));

    const tier = user?.tier || "starter";

    // Count videos by mode this month
    const [standardResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(propertyTours)
      .where(
        and(
          eq(propertyTours.userId, ctx.user.id),
          eq(propertyTours.videoMode, "standard"),
          gte(propertyTours.createdAt, monthStart)
        )
      );

    const [fullAiResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(propertyTours)
      .where(
        and(
          eq(propertyTours.userId, ctx.user.id),
          eq(propertyTours.videoMode, "standard"),
          gte(propertyTours.createdAt, monthStart)
        )
      );

    const standardUsed = standardResult?.count || 0;
    const fullAiUsed = fullAiResult?.count || 0;

    // Determine limits based on tier
    let standardLimit = -1; // -1 means unlimited
    let fullAiLimit = -1;

    if (tier === "starter") {
      // Free tier: limited by credits only, but show reasonable limits
      standardLimit = 20;
      fullAiLimit = 5;
    }
    // Professional and Agency tiers have unlimited

    return {
      tier: tier === "starter" ? "Starter" : tier === "pro" ? "Professional" : "Agency",
      standardUsed,
      fullAiUsed,
      standardLimit,
      fullAiLimit,
    };
  }),

  /**
   * Retry a failed property tour video generation
   * Resets the tour status to pending and re-triggers the background job
   */
  retryVideo: protectedProcedure
    .input(z.object({ tourId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const tour = await db.getPropertyTourById(input.tourId);
      if (!tour) throw new Error("Property tour not found");
      if (tour.userId !== ctx.user.id) throw new Error("Unauthorized");
      if (tour.status !== "failed") throw new Error("Only failed tours can be retried");

      // Apply normal daily rate limit
      const rateLimitStatus = await rateLimit.checkDailyVideoLimit(ctx.user.id);
      if (!rateLimitStatus.allowed) {
        throw new Error(`Daily video limit reached. Try again after ${rateLimitStatus.resetTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC.`);
      }

      // Check and deduct credits
      const costBreakdown = credits.calculateVideoCost({
        videoMode: "standard",
        enableVoiceover: tour.enableVoiceover || false,
      });
      const hasEnoughCredits = await credits.hasCredits(ctx.user.id, costBreakdown.totalCredits);
      if (!hasEnoughCredits) {
        const currentBalance = await credits.getCreditBalance(ctx.user.id);
        throw new Error(`Insufficient credits. Need ${costBreakdown.totalCredits} but have ${currentBalance}.`);
      }
      await credits.deductCredits({
        userId: ctx.user.id,
        amount: costBreakdown.totalCredits,
        usageType: `${tour.videoMode}_video_retry`,
        description: `Retried ${tour.videoMode} video for "${tour.address}"`,
        relatedResourceId: input.tourId,
        relatedResourceType: "property_tour",
      });

      // Reset tour status
      await db.updatePropertyTour(input.tourId, {
        status: "processing",
        errorMessage: null,
        videoUrl: null,
        thumbnailUrl: null,
        processingStage: "preparing",
      });

      const tourId = input.tourId;
      const userId = ctx.user.id;

      setImmediate(async () => {
        bgLog(`[PropertyTours] 🔄 RETRY background job STARTED for tour ${tourId}`);
        try {
          const imageUrls = JSON.parse(tour.imageUrls) as string[];
          const { getPersonaByUserId } = await import("../db");
          const persona = await getPersonaByUserId(userId);

          await db.updatePropertyTour(tourId, { processingStage: "submitting_to_renderer" });

          const { renderId } = await generatePropertyTourVideo({
            imageUrls,
            propertyDetails: {
              address: tour.address,
              price: tour.price || undefined,
              beds: tour.beds || undefined,
              baths: tour.baths ? parseFloat(tour.baths) : undefined,
              sqft: tour.sqft || undefined,
              propertyType: tour.propertyType || undefined,
              description: tour.description || undefined,
            },
            template: (tour.template as "modern" | "luxury" | "cozy") || "modern",
            duration: tour.duration || 30,
            includeBranding: tour.includeBranding ?? true,
            userId,
            aspectRatio: (tour.aspectRatio as "16:9" | "9:16" | "1:1") || "16:9",
            musicTrack: tour.musicTrack || undefined,
            cardTemplate: (tour.cardTemplate as "modern" | "luxury" | "bold" | "classic" | "contemporary") || "modern",
            includeIntroVideo: tour.includeIntroVideo ?? false,
            videoMode: "standard",
            enableVoiceover: tour.enableVoiceover || false,
            customCameraPrompt: tour.customCameraPrompt || undefined,
            voiceoverScript: tour.voiceoverScript || undefined,
            perPhotoMovements: tour.perPhotoMovements ? JSON.parse(tour.perPhotoMovements) : undefined,
            movementSpeed: (tour.movementSpeed as "slow" | "fast") || "slow",
            enableAvatarOverlay: tour.enableAvatarOverlay ?? false,
            avatarOverlayPosition: (tour.avatarOverlayPosition as "bottom-left" | "bottom-right") || "bottom-left",
            agentHeadshotUrl: persona?.klingAvatarHeadshotUrl || undefined,
            agentVoiceUrl: persona?.klingAvatarVoiceUrl || undefined,
            voiceId: persona?.elevenlabsVoiceId || tour.voiceId || undefined,
            avatarIntroVideoUrl: tour.avatarIntroVideoUrl || undefined,
          });

          await db.updatePropertyTour(tourId, {
            videoUrl: renderId,
            status: "processing",
            processingStage: "rendering",
          });

          await rateLimit.incrementDailyVideoCount(userId);
          bgLog(`[PropertyTours] 🔄 RETRY complete for tour ${tourId}. renderId: ${renderId}`);
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : "Unknown error";
          bgLog(`[PropertyTours] ❌ RETRY FAILED for tour ${tourId}: ${errMsg}`);
          await db.updatePropertyTour(tourId, {
            status: "failed",
            errorMessage: errMsg,
            processingStage: null,
          });
          await credits.refundCredits({
            userId,
            amount: costBreakdown.totalCredits,
            reason: `Retry failed: ${errMsg}`,
            relatedResourceId: tourId,
            relatedResourceType: "property_tour",
          });
        }
      });

      return { queued: true };
    }),

  /**
   * Generate YouTube SEO metadata for a completed property tour video
   */
  generateYouTubeSEO: protectedProcedure
    .input(z.object({ tourId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const tour = await db.getPropertyTourById(input.tourId);
      if (!tour) throw new Error("Property tour not found");
      if (tour.userId !== ctx.user.id) throw new Error("Unauthorized");

      const { invokeLLM } = await import("../_core/llm");

      // Build property summary for the LLM
      const propDetails = [
        tour.address,
        tour.price ? `Priced at ${tour.price}` : null,
        tour.beds ? `${tour.beds} beds` : null,
        tour.baths ? `${tour.baths} baths` : null,
        tour.sqft ? `${tour.sqft} sqft` : null,
        tour.propertyType || null,
        tour.description ? `Description: ${tour.description}` : null,
      ].filter(Boolean).join(", ");

      const systemPrompt = `You are a YouTube SEO expert specializing in real estate video content. 
Your goal is to maximize organic search visibility for property tour videos on YouTube.
Always output valid JSON matching the schema exactly.`;

      const userPrompt = `Generate YouTube SEO metadata for this property tour video:
${propDetails}

Return JSON with this exact structure:
{
  "title": "string (max 100 chars, include address, price, key features, and 'Property Tour' or 'Home Tour' — make it compelling and searchable)",
  "description": "string (500-800 chars, start with the most important info, include full address, price, beds/baths/sqft, key features, neighborhood, agent CTA, and relevant hashtags at the end)",
  "tags": ["array of 15-20 keyword strings, mix of specific (address, city) and general (real estate, home tour, property tour, buying a home, etc.)"],
  "timestamps": [
    { "time": "0:00", "label": "Introduction" },
    { "time": "0:10", "label": "Exterior & Curb Appeal" },
    { "time": "0:25", "label": "Main Living Areas" },
    { "time": "0:45", "label": "Kitchen & Dining" },
    { "time": "1:00", "label": "Bedrooms" },
    { "time": "1:20", "label": "Bathrooms" },
    { "time": "1:35", "label": "Backyard & Outdoor Space" },
    { "time": "1:50", "label": "Contact & Next Steps" }
  ]
}
Adjust timestamps to match the video duration of ${tour.duration || 60} seconds. Make all content specific to this property.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "youtube_seo",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                tags: { type: "array", items: { type: "string" } },
                timestamps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      time: { type: "string" },
                      label: { type: "string" },
                    },
                    required: ["time", "label"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["title", "description", "tags", "timestamps"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices[0]?.message?.content;
      const raw = typeof rawContent === "string" ? rawContent : "{}";
      const seo = JSON.parse(raw) as {
        title: string;
        description: string;
        tags: string[];
        timestamps: { time: string; label: string }[];
      };

      // Save to DB
      await db.updatePropertyTour(input.tourId, {
        youtubeTitle: seo.title,
        youtubeDescription: seo.description,
        youtubeTags: JSON.stringify(seo.tags),
        youtubeTimestamps: JSON.stringify(seo.timestamps),
      });

      return {
        title: seo.title,
        description: seo.description,
        tags: seo.tags,
        timestamps: seo.timestamps,
      };
    }),

  /**
   * Generate an AI avatar intro script based on property details
   */
  generateAvatarIntroScript: protectedProcedure
    .input(z.object({
      address: z.string().min(1),
      price: z.string().optional(),
      beds: z.string().optional(),
      baths: z.string().optional(),
      sqft: z.string().optional(),
      agentName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { invokeLLM } = await import("../_core/llm");
      // Get agent name from profile if not provided
      let agentName = input.agentName;
      if (!agentName) {
        const dbConn = await getDb();
        if (dbConn) {
          const [userRow] = await dbConn.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
          agentName = (userRow as any)?.displayName || (userRow as any)?.name || "your agent";
        }
      }
      const details = [
        input.address,
        input.price ? `listed at ${input.price}` : null,
        input.beds ? `${input.beds} bed` : null,
        input.baths ? `${input.baths} bath` : null,
        input.sqft ? `${input.sqft} sq ft` : null,
      ].filter(Boolean).join(", ");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a real estate video script writer. Write a short, warm, professional intro script (2–3 sentences, under 25 words) for a real estate agent named ${agentName} to say at the start of a property tour video. Sound excited but not over the top. Do not include stage directions or quotation marks. Just the spoken words.`,
          },
          {
            role: "user",
            content: `Property details: ${details}`,
          },
        ],
      });
      const rawContent = response.choices?.[0]?.message?.content;
      const script = typeof rawContent === "string" ? rawContent.trim() : "";
      return { script };
    }),

  /**
   * Save manually edited YouTube SEO metadata
   */
  saveYouTubeSEO: protectedProcedure
    .input(z.object({
      tourId: z.number().int().positive(),
      title: z.string().max(100),
      description: z.string(),
      tags: z.array(z.string()),
      timestamps: z.array(z.object({ time: z.string(), label: z.string() })),
    }))
    .mutation(async ({ ctx, input }) => {
      const tour = await db.getPropertyTourById(input.tourId);
      if (!tour) throw new Error("Property tour not found");
      if (tour.userId !== ctx.user.id) throw new Error("Unauthorized");

      await db.updatePropertyTour(input.tourId, {
        youtubeTitle: input.title,
        youtubeDescription: input.description,
        youtubeTags: JSON.stringify(input.tags),
        youtubeTimestamps: JSON.stringify(input.timestamps),
      });

      return { success: true };
    }),
});
