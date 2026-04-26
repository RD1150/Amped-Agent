import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "../shared/const";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, authOnlyProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { moderateContent } from "./_core/contentModeration";
import { generateImage } from "./_core/imageGeneration";
import { ENV } from "./_core/env";
import * as db from "./db";
import { marketStatsRouter } from "./routers/marketStats";
import { stripeRouter } from "./routers/stripe";
import { videoRouter } from "./routers/video";
import { facebookRouter } from "./routers/facebook";
import { linkedinRouter } from "./routers/linkedin";
import { socialPostingRouter } from "./routers/socialPosting";
import { autoreelsRouter } from "./routers/autoreels";
import { propertyToursRouter } from "./routers/propertyTours";
import { contentTemplatesRouter } from "./routers/contentTemplates";
import { creditsRouter } from "./routers/credits";
import { rateLimitRouter } from "./routers/rateLimit";
import { adminRouter, ownerRouter } from "./routers/admin";
import { draftsRouter } from "./routers/drafts";
import { reelsRouter } from "./routers/reels";
import { newsletterRouter } from "./routers/newsletter";
import { musicLibraryRouter } from "./routers/musicLibrary";
import { myVideosRouter } from "./routers/myVideos";
import { gbpRouter } from "./routers/gbp";
import { youtubeRouter } from "./routers/youtube";
import { youtubeVideoBuilderRouter } from "./routers/youtubeVideoBuilder";
import { imageLibraryRouter } from "./routers/imageLibrary";
import { listingPresentationRouter } from "./routers/listingPresentation";
import { buyerPresentationRouter } from "./routers/buyerPresentation";
import { repurposeRouter } from "./routers/repurpose";
import { leadMagnetRouter } from "./routers/leadMagnet";
import { cinematicWalkthroughRouter } from "./routers/cinematicWalkthrough";
import { blogBuilderRouter } from "./routers/blogBuilder";
import { brandStoryRouter } from "./routers/brandStory";
import { ghlRouter } from "./routers/ghl";
import { fullAvatarVideoRouter } from "./routers/fullAvatarVideo";
import { liveTourRouter } from "./routers/liveTour";
import { videoScriptBuilderRouter } from "./routers/videoScriptBuilder";
import { generationFeedbackRouter } from "./routers/generationFeedback";
import { getStartedRouter } from "./routers/getStarted";
import { referralRouter } from "./routers/referral";
import { guidesGeneratorRouter } from "./routers/guidesGenerator";
import { prospectingLettersRouter } from "./routers/prospectingLetters";
import { letterPdfRouter } from "./routers/letterPdf";
import { lettersEmailsRouter } from "./routers/lettersEmails";
import { podcastRouter } from "./routers/podcast";
import { listingKitRouter } from "./routers/listingKit";
import { testimonialsRouter } from "./routers/testimonials";
import { openHouseRouter } from "./routers/openHouse";
import { crmRouter } from "./routers/crm";
import { dripRouter } from "./routers/drip";
import { zapierRouter } from "./routers/zapier";
import { videoEditorRouter } from "./routers/videoEditor";
import { brollLibraryRouter } from "./routers/brollLibrary";

export const appRouter = router({
  system: systemRouter,
  credits: creditsRouter,
  rateLimit: rateLimitRouter,
  admin: adminRouter,
  owner: ownerRouter,
  drafts: draftsRouter,
  reels: reelsRouter,
  newsletter: newsletterRouter,
  musicLibrary: musicLibraryRouter,
  myVideos: myVideosRouter,
  gbp: gbpRouter,
  youtube: youtubeRouter,
  youtubeVideoBuilder: youtubeVideoBuilderRouter,
  imageLibrary: imageLibraryRouter,
  listingPresentation: listingPresentationRouter,
  buyerPresentation: buyerPresentationRouter,
  repurpose: repurposeRouter,
  leadMagnet: leadMagnetRouter,
  cinematicWalkthrough: cinematicWalkthroughRouter,
  blogBuilder: blogBuilderRouter,
  brandStory: brandStoryRouter,
  ghl: ghlRouter,
  fullAvatarVideo: fullAvatarVideoRouter,
  liveTour: liveTourRouter,
  videoScriptBuilder: videoScriptBuilderRouter,
  generationFeedback: generationFeedbackRouter,
  getStarted: getStartedRouter,
  referral: referralRouter,
  guidesGenerator: guidesGeneratorRouter,
  prospectingLetters: prospectingLettersRouter,
  letterPdf: letterPdfRouter,
  lettersEmails: lettersEmailsRouter,
  podcast: podcastRouter,
  listingKit: listingKitRouter,
  testimonials: testimonialsRouter,
  openHouse: openHouseRouter,
  crm: crmRouter,
  drip: dripRouter,
  zapier: zapierRouter,
  videoEditor: videoEditorRouter,
  brollLibrary: brollLibraryRouter,

  support: router({
    chat: publicProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        const systemPrompt = `You are Aria, the friendly AI support assistant for Amped Agent — a powerful marketing platform built specifically for real estate agents.

Your job is to help users understand and get the most out of Amped Agent. Be warm, concise, and helpful. Always stay on topic.

Here is what Amped Agent offers:

**Content Creation:**
- Post Builder: Generate Instagram, Facebook, LinkedIn, and X posts in seconds
- Blog Builder: Write full SEO-optimized blog articles
- Market Insights: Pull live local market data and turn it into shareable content
- Expert Hooks: Create attention-grabbing hooks for social media

**Video Tools:**
- Property Tour Videos: Ken Burns-style slideshow videos with music and voiceover
- AI Reels: Short-form video content for Instagram and TikTok
- Full Avatar Video: AI avatar videos with your face and voice
- AI Motion Tour: Cinematic walkthrough-style videos
- Property Slideshow: Professional listing slideshows
- YouTube Builder: Long-form YouTube video creation
- Live Tour: Interactive virtual tour videos

**Lead Generation & Conversion:**
- Lead Magnet: Create downloadable guides and lead magnets
- Newsletter: Build and send email newsletters
- Listing Presentation: Professional listing presentation decks
- Brand Story: Create your personal brand story content

**Social Media:**
- Connect Facebook, Instagram, LinkedIn, and X accounts
- Schedule and auto-post content
- Content calendar for planning

**Market Dominance:**
- Market Dominance Score: Track your local market visibility
- GBP (Google Business Profile) optimization
- Authority Profile: Build your online authority

**Account & Billing:**
- Credits system: each feature uses credits
- Subscription tiers: Starter, Pro, Authority
- Stripe-powered billing
- Settings: manage profile, brand voice, integrations

**Getting Started:**
1. Set up your Authority Profile and brand settings
2. Connect your social media accounts in Integrations
3. Generate your first post using Post Builder
4. Create a property tour video with your listing photos

If a user asks something you don't know, suggest they email hello@mindrocketsystems.com for direct support.

Keep responses concise — 2-4 sentences max unless the user asks for detail. Use a friendly, professional tone.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            ...input.messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
          ],
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : (Array.isArray(rawContent) ? rawContent.map((c: any) => c.text || "").join("") : "I'm sorry, I couldn't process that. Please try again or email hello@mindrocketsystems.com for help.");
        return { content };
      }),
  }),

  auth: router({
    me: publicProcedure.query(opts => {
      const user = opts.ctx.user;
      if (!user) return null;
      return {
        ...user,
        isOwner: Boolean(ENV.ownerOpenId && user.openId === ENV.ownerOpenId),
      };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    updateAvatarImage: authOnlyProcedure
      .input(z.object({ avatarImageUrl: z.string().url() }))
      .mutation(async ({ ctx, input }) => {
        return db.updateUserAvatar(ctx.user.id, input.avatarImageUrl, null);
      }),
    updateAvatarVideo: authOnlyProcedure
      .input(z.object({ avatarVideoUrl: z.string().url() }))
      .mutation(async ({ ctx, input }) => {
        return db.updateUserAvatar(ctx.user.id, null, input.avatarVideoUrl);
      }),
    updateProfile: authOnlyProcedure
      .input(z.object({
        name: z.string().min(1),
        bio: z.string().optional(),
        location: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.updateUserProfile(ctx.user.id, input);
      }),
    uploadHeadshot: authOnlyProcedure
      .input(z.object({
        imageData: z.string(), // base64 encoded image
        fileName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import("./storage");
        
        // Decode base64 image
        const base64Data = input.imageData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `headshots/${ctx.user.id}-${timestamp}-${randomSuffix}.jpg`;
        
        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, "image/jpeg");
        
        // Update user's avatarImageUrl
        await db.updateUserAvatar(ctx.user.id, url, null);
        
        return { url };
      }),
    saveOnboardingStep: authOnlyProcedure
      .input(z.object({ step: z.number().min(1).max(5) }))
      .mutation(async ({ ctx, input }) => {
        return db.saveOnboardingStep(ctx.user.id, input.step);
      }),
    completeOnboarding: authOnlyProcedure
      .mutation(async ({ ctx }) => {
        return db.markOnboardingComplete(ctx.user.id);
      }),
    resetOnboarding: authOnlyProcedure
      .mutation(async ({ ctx }) => {
        return db.resetOnboardingComplete(ctx.user.id);
      }),

    saveOnboarding: authOnlyProcedure
      .input(z.object({
        brokerageName: z.string().min(1).max(255),
        primaryCity: z.string().min(1).max(255),
        primaryState: z.string().min(1).max(100),
        yearsExperience: z.number().int().min(0).max(60),
        serviceCities: z.array(z.object({ city: z.string().min(1).max(255), state: z.string().max(100) })).min(1).max(5).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Save to persona (brokerage, city, state, years)
        await db.upsertPersona(ctx.user.id, {
          brokerageName: input.brokerageName,
          primaryCity: input.primaryCity,
          primaryState: input.primaryState,
          yearsExperience: input.yearsExperience,
          serviceCities: input.serviceCities
            ? JSON.stringify(input.serviceCities)
            : JSON.stringify([{ city: input.primaryCity, state: input.primaryState }]),
        });
        // Mark onboarding complete
        await db.markOnboardingComplete(ctx.user.id);
        return { success: true };
      }),
    acceptTerms: authOnlyProcedure
      .mutation(async ({ ctx }) => {
        return db.acceptTermsOfService(ctx.user.id);
      }),
    getVoicePreference: protectedProcedure.query(async ({ ctx }) => {
      const dbConn = await db.getDb();
      if (!dbConn) return { voiceId: "21m00Tcm4TlvDq8ikWAM", voiceoverStyle: "professional" as const };
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const rows = await dbConn.select({
        preferredVoiceId: users.preferredVoiceId,
        preferredVoiceoverStyle: users.preferredVoiceoverStyle,
      }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const row = rows[0];
      return {
        voiceId: row?.preferredVoiceId || "21m00Tcm4TlvDq8ikWAM",
        voiceoverStyle: (row?.preferredVoiceoverStyle || "professional") as "professional" | "warm" | "luxury" | "casual",
      };
    }),
    saveVoicePreference: protectedProcedure
      .input(z.object({
        voiceId: z.string().min(1),
        voiceoverStyle: z.enum(["professional", "warm", "luxury", "casual"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUser(ctx.user.id, {
          preferredVoiceId: input.voiceId,
          preferredVoiceoverStyle: input.voiceoverStyle,
        });
        return { success: true };
      }),

    // Voice cloning from agent recording
    cloneAgentVoice: protectedProcedure
      .input(z.object({
        audioUrl: z.string().url(), // S3 URL to the recorded audio sample
        voiceName: z.string().min(1).max(64).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { cloneVoice, deleteVoice } = await import("./_core/elevenLabs");
        const dbConn = await db.getDb();
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        // Delete old cloned voice if it exists
        if (dbConn) {
          const rows = await dbConn.select({ clonedVoiceId: users.clonedVoiceId })
            .from(users).where(eq(users.id, ctx.user.id)).limit(1);
          const oldVoiceId = rows[0]?.clonedVoiceId;
          if (oldVoiceId) {
            try { await deleteVoice(oldVoiceId); } catch { /* ignore cleanup errors */ }
          }
        }

        const voiceName = input.voiceName || `${ctx.user.name || "Agent"}'s Voice`;
        const result = await cloneVoice({
          name: voiceName,
          audioUrl: input.audioUrl,
          description: `Cloned voice for real estate agent ${ctx.user.name || ctx.user.id}`,
        });

        await db.updateUser(ctx.user.id, {
          clonedVoiceId: result.voice_id,
          clonedVoiceName: voiceName,
          preferredVoiceId: result.voice_id, // Auto-set as preferred voice
        });

        return { voiceId: result.voice_id, voiceName, success: true };
      }),

    getClonedVoice: protectedProcedure.query(async ({ ctx }) => {
      const dbConn = await db.getDb();
      if (!dbConn) return { clonedVoiceId: null, clonedVoiceName: null };
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const rows = await dbConn.select({
        clonedVoiceId: users.clonedVoiceId,
        clonedVoiceName: users.clonedVoiceName,
      }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const row = rows[0];
      return { clonedVoiceId: row?.clonedVoiceId || null, clonedVoiceName: row?.clonedVoiceName || null };
    }),

    deleteClonedVoice: protectedProcedure.mutation(async ({ ctx }) => {
      const { deleteVoice } = await import("./_core/elevenLabs");
      const dbConn = await db.getDb();
      if (!dbConn) return { success: false };
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const rows = await dbConn.select({ clonedVoiceId: users.clonedVoiceId })
        .from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const voiceId = rows[0]?.clonedVoiceId;
      if (voiceId) {
        try { await deleteVoice(voiceId); } catch { /* ignore */ }
      }
      await db.updateUser(ctx.user.id, {
        clonedVoiceId: null as any,
        clonedVoiceName: null as any,
      });
      return { success: true };
    }),

    // Weekly Email Digest opt-in
    getWeeklyDigest: protectedProcedure.query(async ({ ctx }) => {
      const dbConn = await db.getDb();
      if (!dbConn) return { enabled: false };
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const rows = await dbConn.select({ weeklyDigestEnabled: users.weeklyDigestEnabled })
        .from(users).where(eq(users.id, ctx.user.id)).limit(1);
      return { enabled: rows[0]?.weeklyDigestEnabled ?? false };
    }),

    updateWeeklyDigest: protectedProcedure
      .input(z.object({ enabled: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const dbConn = await db.getDb();
        if (!dbConn) throw new Error('Database unavailable');
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await dbConn.update(users)
          .set({ weeklyDigestEnabled: input.enabled })
          .where(eq(users.id, ctx.user.id));
        return { success: true, enabled: input.enabled };
      }),
  }),

  persona: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getPersonaByUserId(ctx.user.id);
    }),
    
    upsert: protectedProcedure
      .input(z.object({
        agentName: z.string().optional(),
        licenseNumber: z.string().optional(),
        brokerageName: z.string().optional(),
        brokerageDRE: z.string().optional(),
        phoneNumber: z.string().optional(),
        headshotUrl: z.string().optional(),
        businessName: z.string().optional(),
        tagline: z.string().optional(),
        targetAudience: z.string().optional(),
        brandVoice: z.enum(["professional", "friendly", "luxury", "casual", "authoritative"]).optional(),
        primaryColor: z.string().optional(),
        logoUrl: z.string().optional(),
        websiteUrl: z.string().optional(),
        emailAddress: z.string().optional(),
        socialHandles: z.string().optional(),
        isCompleted: z.boolean().optional(),
        klingAvatarHeadshotUrl: z.string().optional(),
        klingAvatarVoiceUrl: z.string().optional(),
        klingAvatarEnabled: z.boolean().optional(),
        elevenlabsVoiceId: z.string().optional(),
        elevenlabsVoiceName: z.string().optional(),
        voiceSampleUrl: z.string().optional(),
        yearsExperience: z.number().int().min(0).max(60).optional(),
        primaryCity: z.string().max(255).optional(),
        primaryState: z.string().max(100).optional(),
        serviceCities: z.string().optional(), // JSON-encoded string[]
        bio: z.string().optional(),
        serviceAreas: z.string().optional(),
        brokerage: z.string().optional(),
        headshotOffsetY: z.number().int().min(0).max(100).optional(),
        headshotZoom: z.number().int().min(100).max(200).optional(),
        targetNeighborhoods: z.string().optional(), // JSON-encoded string[]
        targetZipCodes: z.string().optional(), // JSON-encoded string[]
      }))
      .mutation(async ({ ctx, input }) => {
        return db.upsertPersona(ctx.user.id, input);
      }),
    
    updateAuthorityProfile: protectedProcedure
      .input(z.object({
        customerAvatar: z.string().optional(),
        brandValues: z.string().optional(),
        marketContext: z.string().optional(),
        bookingUrl: z.string().url().optional().or(z.literal("")),
        targetNeighborhoods: z.string().optional(), // JSON-encoded string[]
        targetZipCodes: z.string().optional(), // JSON-encoded string[]
      }))
      .mutation(async ({ ctx, input }) => {
        return db.upsertPersona(ctx.user.id, input);
      }),

    /**
     * Clone the agent's voice using ElevenLabs from a voice sample URL.
     * Saves the voice_id to the persona for use in property tour voiceovers.
     */
    cloneVoice: protectedProcedure
      .input(z.object({
        voiceSampleUrl: z.string().url(),
        voiceName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { cloneVoice } = await import("./_core/elevenLabs");
        const persona = await db.getPersonaByUserId(ctx.user.id);
        const agentName = persona?.agentName || `Agent ${ctx.user.id}`;
        const voiceName = input.voiceName || `${agentName}'s Voice`;

        // If there's an existing cloned voice, delete it first to avoid accumulation
        if (persona?.elevenlabsVoiceId) {
          try {
            const { deleteVoice } = await import("./_core/elevenLabs");
            await deleteVoice(persona.elevenlabsVoiceId);
          } catch (e) {
            console.warn("[VoiceClone] Could not delete old voice:", e);
          }
        }

        const { voice_id } = await cloneVoice({
          name: voiceName,
          audioUrl: input.voiceSampleUrl,
          description: `Voice clone for ${agentName} - Amped Agent`,
        });

        await db.upsertPersona(ctx.user.id, {
          elevenlabsVoiceId: voice_id,
          elevenlabsVoiceName: voiceName,
          voiceSampleUrl: input.voiceSampleUrl,
        });

        return { voice_id, voiceName };
      }),

    /**
     * Delete the agent's cloned voice from ElevenLabs
     */
    deleteVoiceClone: protectedProcedure.mutation(async ({ ctx }) => {
      const persona = await db.getPersonaByUserId(ctx.user.id);
      if (persona?.elevenlabsVoiceId) {
        const { deleteVoice } = await import("./_core/elevenLabs");
        await deleteVoice(persona.elevenlabsVoiceId);
        await db.upsertPersona(ctx.user.id, {
          elevenlabsVoiceId: undefined,
          elevenlabsVoiceName: undefined,
        });
      }
      return { success: true };
    }),
    /**
     * Save the user's default Gamma theme ID for Listing Presentations
     */
    saveGammaThemeId: protectedProcedure
      .input(z.object({ themeId: z.string().nullable() }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertPersona(ctx.user.id, { gammaThemeId: input.themeId ?? undefined });
        return { success: true };
      }),
  }),

  content: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getContentPostsByUserId(ctx.user.id);
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getContentPostById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().optional(),
        content: z.string(),
        contentType: z.enum(["property_listing", "market_report", "trending_news", "tips", "neighborhood", "custom", "carousel", "video"]).optional(),
        status: z.enum(["draft", "scheduled", "published", "expired"]).optional(),
        scheduledAt: z.date().optional(),
        platforms: z.string().optional(),
        imageUrl: z.string().optional(),
        propertyAddress: z.string().optional(),
        propertyPrice: z.number().optional(),
        propertyBedrooms: z.number().optional(),
        propertyBathrooms: z.number().optional(),
        propertySqft: z.number().optional(),
        propertyDescription: z.string().optional(),
        propertyListingType: z.string().optional(),
        aiGenerated: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createContentPost({ ...input, userId: ctx.user.id });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        contentType: z.enum(["property_listing", "market_report", "trending_news", "tips", "neighborhood", "custom", "carousel", "video"]).optional(),
        status: z.enum(["draft", "scheduled", "published", "expired"]).optional(),
        scheduledAt: z.date().optional(),
        publishedAt: z.date().optional(),
        platforms: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateContentPost(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteContentPost(input.id);
        return { success: true };
      }),
    
    generate: protectedProcedure
      .input(z.object({
        topic: z.string(),
        contentType: z.enum(["property_listing", "market_report", "trending_news", "tips", "neighborhood", "custom", "carousel", "video"]),
        format: z.enum(["static_post", "carousel", "reel_script"]).default("static_post"),
        propertyData: z.object({
          address: z.string().optional(),
          price: z.number().optional(),
          bedrooms: z.number().optional(),
          bathrooms: z.number().optional(),
          sqft: z.number().optional(),
          description: z.string().optional(),
        }).optional(),
        tone: z.enum(["professional", "friendly", "luxury", "casual", "authoritative"]).optional(),
        ctaText: z.string().optional(),
        location: z.string().optional(), // For market_report: city/area for real data lookup
      }))
      .mutation(async ({ ctx, input }) => {
        // Moderate input content
        const moderation = await moderateContent(input.topic, true);
        if (!moderation.allowed) {
          throw new Error(`Content moderation: ${moderation.reason}`);
        }
        
        const persona = await db.getPersonaByUserId(ctx.user.id);
        const tone = input.tone || persona?.brandVoice || "professional";

        // Build audience context from customer avatar
        let audienceContext = "";
        if (persona?.customerAvatar) {
          try {
            const avatar = JSON.parse(persona.customerAvatar);
            const audienceLabels: Record<string, string> = {
              "first-time-buyers": "First-Time Home Buyers",
              "luxury-sellers": "Luxury Sellers",
              "investors": "Real Estate Investors",
              "relocators": "Relocating Families",
              "downsizers": "Downsizers/Empty Nesters",
              "move-up-buyers": "Move-Up Buyers",
            };
            const audienceToneGuide: Record<string, string> = {
              "first-time-buyers": "Use encouraging, educational language. Demystify the process. Avoid jargon. Speak to their anxiety and excitement.",
              "luxury-sellers": "Use sophisticated, discreet language. Emphasize exclusivity, track record, and white-glove service. Avoid anything that feels mass-market.",
              "investors": "Use data-driven, ROI-focused language. Lead with numbers, cap rates, and market opportunity. Be direct and analytical.",
              "relocators": "Use warm, reassuring language. Emphasize local expertise, seamless coordination, and making a new place feel like home.",
              "downsizers": "Use empathetic, lifestyle-focused language. Acknowledge the emotional weight of the transition. Emphasize freedom and simplicity.",
              "move-up-buyers": "Use aspirational, strategic language. Speak to equity, timing, and the next chapter. Balance excitement with practical guidance.",
            };
            if (avatar.type) {
              audienceContext = `\n\nTARGET AUDIENCE: ${audienceLabels[avatar.type] || avatar.type}`;
              if (avatar.description) audienceContext += `\nAudience Profile: ${avatar.description}`;
              if (audienceToneGuide[avatar.type]) audienceContext += `\nTone Guidance: ${audienceToneGuide[avatar.type]}`;
            }
          } catch {}
        }

        // Build hyperlocal context from targetNeighborhoods and targetZipCodes
        let hyperlocalContext = "";
        if (persona?.targetNeighborhoods || persona?.targetZipCodes) {
          try {
            const hoods: string[] = persona.targetNeighborhoods ? JSON.parse(persona.targetNeighborhoods) : [];
            const zips: string[] = persona.targetZipCodes ? JSON.parse(persona.targetZipCodes) : [];
            const parts: string[] = [];
            if (hoods.length > 0) parts.push(`Target neighborhoods: ${hoods.join(", ")}`);
            if (zips.length > 0) parts.push(`Target ZIP codes: ${zips.join(", ")}`);
            if (parts.length > 0) {
              hyperlocalContext = `\n\nHYPERLOCAL SEO FOCUS: ${parts.join(". ")}. Naturally weave these specific neighborhood names and ZIP codes into the content wherever relevant to maximize local search visibility. Do NOT force them — use them organically.`;
            }
          } catch {}
        }
        audienceContext += hyperlocalContext;

        // Fetch real market data for market_report content type
        let realMarketData: any = null;
        if (input.contentType === 'market_report') {
          const location = input.location || persona?.serviceAreas?.split(',')[0]?.trim() || input.topic;
          try {
            const { getMarketData } = await import('./marketStatsHelper');
            realMarketData = await getMarketData(location);
            console.log(`[PostBuilder] Fetched real market data for ${location}`);
          } catch (err) {
            console.warn('[PostBuilder] Could not fetch real market data, using LLM estimates:', err);
          }
        }
        
        // Format-specific system prompts
        let systemPrompt = "";
        let userPrompt = "";
        
        if (input.format === "carousel") {
          systemPrompt = `You are a real estate content creator specializing in carousel posts. Create engaging multi-slide content for Instagram/Facebook carousels.
Use a ${tone} tone.${audienceContext}

Format your response as:

📊 CAROUSEL POST: [Catchy Title]

SLIDE 1 (COVER):
🎯 Title: [Eye-catching cover title]
📝 Content: [Brief teaser or hook]

SLIDE 2:
🎯 Title: [Slide title]
📝 Content: [Main content for this slide]

SLIDE 3:
🎯 Title: [Slide title]
📝 Content: [Main content for this slide]

[Continue for 5-10 slides total]

FINAL SLIDE (CTA):
🎯 Title: [Call to action]
📝 Content: [Contact info, next steps, or compelling CTA]

#️⃣ HASHTAGS: [5-10 relevant hashtags]
💡 DESIGN TIP: [Visual suggestion for the carousel]

Make each slide concise (2-3 sentences max), use emojis, and ensure the content flows naturally from slide to slide.`;
        } else if (input.format === "reel_script") {
          systemPrompt = `You are a real estate content creator specializing in short-form video scripts (Reels/TikTok/YouTube Shorts).
Use a ${tone} tone.${audienceContext} Create a 30-60 second video script formatted EXACTLY like this:

🎬 REEL SCRIPT: [Catchy Title]

HOOK (0-3s):
[On-screen: "TEXT HERE"]
"What you say out loud"

SCENE 1 (3-12s):
[Show: What to film]
[On-screen: "TEXT HERE"]
"What you say out loud"

SCENE 2 (12-21s):
[Show: What to film]
[On-screen: "TEXT HERE"]
"What you say out loud"

SCENE 3 (21-28s):
[Show: What to film]
[On-screen: "TEXT HERE"]
"What you say out loud"

CTA (28-30s):
[On-screen: "@YourHandle"]
"What you say out loud"

🎵 MUSIC: [Specific music suggestion]
📱 FORMAT: Vertical 9:16 (1080x1920px)
💡 FILMING TIP: [One helpful tip]
#️⃣ HASHTAGS: [5-10 relevant hashtags]

Use emojis, be specific about what to show on camera, and make the hook IRRESISTIBLE.`;
        } else {
          systemPrompt = `You are a real estate content creator. Create engaging social media content for real estate professionals.
Use a ${tone} tone.${audienceContext} Generate 3 different caption variations without labeling them:
- First variation: long-form and emotional
- Second variation: medium length and value-focused
- Third variation: short and CTA-driven

Format each variation as:

## 1.
[caption text]

## 2.
[caption text]

## 3.
[caption text]

Include relevant hashtags and emojis in each variation. Do NOT include style labels like "Elegant & Evocative" in the output.`;
        }
        
        if (input.contentType === "property_listing" && input.propertyData) {
          const formatInstructions = input.format === "carousel" 
            ? "Create a 7-slide carousel: Slide 1 (cover with property highlight), Slides 2-5 (key features), Slide 6 (neighborhood/lifestyle), Slide 7 (CTA with contact info)."
            : input.format === "reel_script"
            ? "Create a 30-second property tour script with hook, 3 feature highlights, and contact CTA."
            : "Create 3 caption variations highlighting the property's best features.";
          
          userPrompt = `Create an engaging property listing ${input.format === "carousel" ? "carousel" : input.format === "reel_script" ? "reel script" : "post"} for:
Address: ${input.propertyData.address || "Luxury Home"}
Price: ${input.propertyData.price ? `$${input.propertyData.price.toLocaleString()}` : "Contact for price"}
Bedrooms: ${input.propertyData.bedrooms || "N/A"}
Bathrooms: ${input.propertyData.bathrooms || "N/A"}
Square Feet: ${input.propertyData.sqft || "N/A"}
Description: ${input.propertyData.description || input.topic}

${formatInstructions}`;
        } else if (input.contentType === "market_report") {
          const formatInstructions = input.format === "carousel"
            ? "Create a 6-8 slide carousel with market data, trends, and insights. Use charts/stats language."
            : input.format === "reel_script"
            ? "Create a 45-second market update script with key stats and what they mean for buyers/sellers."
            : "Create 3 caption variations with market insights and actionable advice.";
          const marketDataBlock = realMarketData
            ? `\n\nIMPORTANT — Use these REAL market statistics (do not invent numbers):\n- Median Home Price: $${realMarketData.medianPrice.toLocaleString()} (${realMarketData.priceChange > 0 ? '+' : ''}${realMarketData.priceChange}% YoY)\n- Days on Market: ${realMarketData.daysOnMarket} days\n- Active Listings: ${realMarketData.activeListings.toLocaleString()} (${realMarketData.listingsChange > 0 ? '+' : ''}${realMarketData.listingsChange}% YoY)\n- Price per Sq Ft: $${realMarketData.pricePerSqft}\n- Market Temperature: ${realMarketData.marketTemperature === 'hot' ? "Seller's Market" : realMarketData.marketTemperature === 'cold' ? "Buyer's Market" : "Balanced Market"}`
            : '';
          userPrompt = `Create a market report ${input.format === "carousel" ? "carousel" : input.format === "reel_script" ? "reel script" : "post"} about: ${input.topic}${marketDataBlock}
${formatInstructions}
Include the real statistics provided above and explain what they mean for buyers and sellers.`;
        } else if (input.contentType === "trending_news") {
          const formatInstructions = input.format === "carousel"
            ? "Create a 5-slide carousel breaking down the news and its real estate impact."
            : input.format === "reel_script"
            ? "Create a 30-second news breakdown script with hook, explanation, and impact."
            : "Create 3 caption variations explaining the news and its relevance.";
          userPrompt = `Create a trending news ${input.format === "carousel" ? "carousel" : input.format === "reel_script" ? "reel script" : "post"} about: ${input.topic}
${formatInstructions}
Make it relevant to real estate and provide value to your audience.`;
        } else if (input.contentType === "tips") {
          const formatInstructions = input.format === "carousel"
            ? "Create a 6-10 slide carousel with one tip per slide. Cover slide + tips + CTA slide."
            : input.format === "reel_script"
            ? "Create a 45-second tips script covering 3-5 quick tips with on-screen text."
            : "Create 3 caption variations with helpful, actionable tips.";
          userPrompt = `Create a helpful tips ${input.format === "carousel" ? "carousel" : input.format === "reel_script" ? "reel script" : "post"} about: ${input.topic}
${formatInstructions}
Provide actionable advice that homebuyers, sellers, or investors can use.`;
        } else if (input.contentType === "neighborhood") {
          const formatInstructions = input.format === "carousel"
            ? "Create a 7-slide carousel: cover, location, amenities, schools, dining, lifestyle, CTA."
            : input.format === "reel_script"
            ? "Create a 45-second neighborhood tour script highlighting key features and lifestyle."
            : "Create 3 caption variations showcasing the neighborhood's best features.";
          userPrompt = `Create a neighborhood spotlight ${input.format === "carousel" ? "carousel" : input.format === "reel_script" ? "reel script" : "post"} about: ${input.topic}
${formatInstructions}
Highlight the best features, amenities, and lifestyle of the area.`;
        } else {
          const formatInstructions = input.format === "carousel"
            ? "Create a 5-8 slide carousel with engaging, shareable content."
            : input.format === "reel_script"
            ? "Create a 30-45 second video script with hook, content, and CTA."
            : "Create 3 caption variations (long, medium, short).";
          userPrompt = `Create engaging real estate ${input.format === "carousel" ? "carousel" : input.format === "reel_script" ? "reel script" : "content"} about: ${input.topic}
${formatInstructions}`;
        }

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const messageContent = response.choices[0]?.message?.content;
        const generatedContent = typeof messageContent === 'string' ? messageContent : '';
        
        // Generate image for static posts using templates
        let imageUrl: string | undefined;
        if (input.format === "static_post") {
          try {
            // Map contentType to template category
            const categoryMap: Record<string, string> = {
              property_listing: "sellers",
              market_report: "buyers",
              trending_news: "buyers",
              tips: "buyers",
              neighborhood: "buyers",
              custom: "buyers",
            };
            
            const templateCategory = categoryMap[input.contentType] || "buyers";
            
            // Import templates and pick one from the category
            const { TEMPLATE_LIBRARY } = await import("../shared/templates");
            const categoryTemplates = TEMPLATE_LIBRARY.filter(t => t.category === templateCategory);
            const template = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
            
            // Import server-side template renderer
            const { renderTemplate } = await import("./templateRenderer");
            
            // Extract title from generated content (first line or first 50 chars)
            const firstLine = generatedContent.split('\n').find(line => line.trim().length > 0) || input.topic;
            const title = firstLine.replace(/^#+\s*/, '').substring(0, 100);
            
            // Render template with user branding
            imageUrl = await renderTemplate({
              template,
              postText: title,
              headshotUrl: persona?.headshotUrl || undefined,
              primaryColor: persona?.primaryColor || undefined,
              phone: persona?.phoneNumber || undefined,
              agentName: persona?.agentName || undefined,
              licenseNumber: persona?.licenseNumber || undefined,
              brokerageName: persona?.brokerageName || undefined,
              brokerageDRE: persona?.brokerageDRE || undefined,
              ctaText: input.ctaText,
            });
          } catch (error) {
            console.error('Template rendering failed:', error);
            // Continue without image if generation fails
          }
        }
        
        return {
          content: generatedContent,
          contentType: input.contentType,
          imageUrl,
        };
      }),

    bulkGenerateFromCSV: protectedProcedure
      .input(z.object({
        topic: z.string(),
        contentType: z.enum(["property_listing", "market_report", "trending_news", "tips", "neighborhood", "custom", "carousel", "video"]),
        format: z.enum(["static_post", "carousel", "reel_script"]).default("static_post"),
        tone: z.enum(["professional", "friendly", "luxury", "casual", "authoritative"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const persona = await db.getPersonaByUserId(ctx.user.id);
        const tone = input.tone || persona?.brandVoice || "professional";
        
        // Generate content using LLM
        const systemPrompt = `You are a real estate content creator. Create engaging social media content using a ${tone} tone.`;
        const userPrompt = `Create a ${input.contentType} post about: ${input.topic}`;
        
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });
        
        const content = typeof response.choices[0].message.content === 'string' 
          ? response.choices[0].message.content 
          : JSON.stringify(response.choices[0].message.content || "");
        
        // Save to database
        const post = await db.createContentPost({
          userId: ctx.user.id,
          title: input.topic,
          content,
          contentType: input.contentType,
          status: "draft",
          aiGenerated: true,
        });
        
        return post;
      }),

    generateFullMonth: protectedProcedure
      .input(z.object({
        startDate: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        const persona = await db.getPersonaByUserId(ctx.user.id);
        const tone = persona?.brandVoice || "professional";
        
        // Define content mix for 30 days
        const contentTypes: Array<{type: "property_listing" | "market_report" | "trending_news" | "tips" | "neighborhood", topic: string}> = [
          // Week 1
          { type: "tips", topic: "First-time homebuyer tips" },
          { type: "property_listing", topic: "Featured luxury property" },
          { type: "neighborhood", topic: "Local neighborhood spotlight" },
          { type: "tips", topic: "Home staging tips for sellers" },
          { type: "market_report", topic: "Current market trends" },
          { type: "tips", topic: "Mortgage pre-approval advice" },
          { type: "property_listing", topic: "New listing announcement" },
          
          // Week 2
          { type: "tips", topic: "Home maintenance checklist" },
          { type: "neighborhood", topic: "Best local restaurants and amenities" },
          { type: "tips", topic: "Investment property strategies" },
          { type: "market_report", topic: "Price trends and forecasts" },
          { type: "property_listing", topic: "Open house announcement" },
          { type: "tips", topic: "Negotiation tips for buyers" },
          { type: "trending_news", topic: "Real estate market news" },
          
          // Week 3
          { type: "tips", topic: "Home inspection essentials" },
          { type: "property_listing", topic: "Just sold celebration" },
          { type: "neighborhood", topic: "School district highlights" },
          { type: "tips", topic: "Downsizing advice for empty nesters" },
          { type: "market_report", topic: "Inventory levels and demand" },
          { type: "tips", topic: "Curb appeal improvements" },
          { type: "property_listing", topic: "Price reduction alert" },
          
          // Week 4
          { type: "tips", topic: "Closing process explained" },
          { type: "neighborhood", topic: "Parks and recreation spots" },
          { type: "tips", topic: "Home warranty benefits" },
          { type: "market_report", topic: "Days on market statistics" },
          { type: "property_listing", topic: "Coming soon preview" },
          { type: "tips", topic: "Moving day checklist" },
          { type: "trending_news", topic: "Interest rate updates" },
          
          // Extra days
          { type: "tips", topic: "Real estate investment tips" },
          { type: "neighborhood", topic: "Community events" },
        ];

        const createdPosts = [];
        
        for (let i = 0; i < 30; i++) {
          const contentConfig = contentTypes[i % contentTypes.length];
          const postDate = new Date(input.startDate);
          postDate.setDate(postDate.getDate() + i);
          
          // Generate content using AI
          let systemPrompt = `You are a real estate content creator. Create engaging social media content for real estate professionals. 
Use a ${tone} tone. Keep the content concise and suitable for social media platforms like Facebook and Instagram.
Focus on creating compelling, shareable content that drives engagement.`;

          let userPrompt = "";
          
          if (contentConfig.type === "property_listing") {
            userPrompt = `Create an engaging property listing post about: ${contentConfig.topic}. Make it compelling and create urgency.`;
          } else if (contentConfig.type === "market_report") {
            userPrompt = `Create a market report post about: ${contentConfig.topic}. Include relevant statistics and trends.`;
          } else if (contentConfig.type === "trending_news") {
            userPrompt = `Create a trending news post about: ${contentConfig.topic}. Make it relevant to real estate.`;
          } else if (contentConfig.type === "tips") {
            userPrompt = `Create a helpful tips post about: ${contentConfig.topic}. Provide actionable advice.`;
          } else if (contentConfig.type === "neighborhood") {
            userPrompt = `Create a neighborhood spotlight post about: ${contentConfig.topic}. Highlight the best features.`;
          }

          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          });

          const messageContent = response.choices[0]?.message?.content;
          const generatedContent = typeof messageContent === 'string' ? messageContent : '';
          
          // Create the post
          const post = await db.createContentPost({
            userId: ctx.user.id,
            title: contentConfig.topic,
            content: generatedContent,
            contentType: contentConfig.type,
            status: "draft",
            scheduledAt: postDate,
            aiGenerated: true,
          });
          
          createdPosts.push(post);
        }
        
        return {
          success: true,
          postsCreated: createdPosts.length,
          posts: createdPosts,
        };
      }),
  }),

  calendar: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return db.getCalendarEventsByUserId(ctx.user.id, input?.startDate, input?.endDate);
      }),
    
    create: protectedProcedure
      .input(z.object({
        contentPostId: z.number().optional(),
        title: z.string(),
        description: z.string().optional(),
        eventDate: z.date(),
        eventTime: z.string().optional(),
        eventType: z.enum(["post", "reminder", "task"]).optional(),
        isAllDay: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createCalendarEvent({ ...input, userId: ctx.user.id });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        eventDate: z.date().optional(),
        eventTime: z.string().optional(),
        isAllDay: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCalendarEvent(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCalendarEvent(input.id);
        return { success: true };
      }),
  }),

  integrations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getIntegrationsByUserId(ctx.user.id);
    }),
    
    upsert: protectedProcedure
      .input(z.object({
        platform: z.enum(["facebook", "instagram", "linkedin", "twitter"]),
        accountName: z.string().optional(),
        accountId: z.string().optional(),
        isConnected: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { platform, ...data } = input;
        return db.upsertIntegration(ctx.user.id, platform, data);
      }),
  }),

  uploads: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUploadsByUserId(ctx.user.id);
    }),
    
    uploadHeadshot: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import("./storage");
        
        // Convert base64 to buffer
        const base64Data = input.fileData.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique file key
        const timestamp = Date.now();
        const fileExt = input.fileName.split('.').pop();
        const fileKey = `headshots/${ctx.user.id}-${timestamp}.${fileExt}`;
        
        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        // Save to uploads table
        await db.createUpload({
          userId: ctx.user.id,
          fileName: input.fileName,
          fileKey,
          fileUrl: url,
          fileType: input.mimeType,
          fileSize: buffer.length,
          category: "image",
        });
        
        // Persist headshotUrl to persona so it survives page reloads
        await db.upsertPersona(ctx.user.id, { headshotUrl: url });
        
        return { url };
      }),
    
    create: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileKey: z.string(),
        fileUrl: z.string(),
        fileType: z.string().optional(),
        fileSize: z.number().optional(),
        category: z.enum(["image", "document", "csv", "other"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createUpload({ ...input, userId: ctx.user.id });
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteUpload(input.id);
        return { success: true };
      }),
  }),

  importJobs: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getImportJobsByUserId(ctx.user.id);
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getImportJobById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        fileName: z.string().optional(),
        fileUrl: z.string().optional(),
        importType: z.enum(["csv", "google_doc"]),
        settings: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createImportJob({ ...input, userId: ctx.user.id });
      }),
    
    processCSV: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        csvData: z.array(z.object({
          address: z.string().optional(),
          price: z.string().optional(),
          bedrooms: z.string().optional(),
          bathrooms: z.string().optional(),
          sqft: z.string().optional(),
          description: z.string().optional(),
          listingType: z.string().optional(),
        })),
        settings: z.object({
          postsPerWeek: z.number().default(3),
          contentTypes: z.array(z.string()).default(["property_listing", "tips", "market_report"]),
          startDate: z.string(),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        const { jobId, csvData, settings } = input;
        
        await db.updateImportJob(jobId, { 
          status: "processing", 
          totalRows: csvData.length,
          settings: JSON.stringify(settings),
        });
        
        const persona = await db.getPersonaByUserId(ctx.user.id);
        const tone = persona?.brandVoice || "professional";
        const startDate = new Date(settings.startDate);
        const postsPerWeek = settings.postsPerWeek;
        
        let currentDate = new Date(startDate);
        let postsCreated = 0;
        let dayCounter = 0;
        
        for (let i = 0; i < csvData.length; i++) {
          const row = csvData[i];
          
          // Generate content for this property
          const systemPrompt = `You are a real estate content creator. Create engaging social media content. Use a ${tone} tone. Keep it concise for social media.`;
          const userPrompt = `Create an engaging property listing post for:
Address: ${row.address || "Beautiful Home"}
Price: ${row.price || "Contact for price"}
Bedrooms: ${row.bedrooms || "N/A"}
Bathrooms: ${row.bathrooms || "N/A"}
Square Feet: ${row.sqft || "N/A"}
Description: ${row.description || "Stunning property available now"}

Create a compelling social media post.`;

          try {
            const response = await invokeLLM({
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
            });

            const messageContent = response.choices[0]?.message?.content;
            const generatedContent = typeof messageContent === 'string' ? messageContent : '';
            
            // Calculate schedule date
            const scheduleDate = new Date(currentDate);
            scheduleDate.setDate(scheduleDate.getDate() + Math.floor(dayCounter * (7 / postsPerWeek)));
            
            // Create content post
            const post = await db.createContentPost({
              userId: ctx.user.id,
              title: row.address || `Property Listing ${i + 1}`,
              content: generatedContent,
              contentType: "property_listing",
              status: "scheduled",
              scheduledAt: scheduleDate,
              propertyAddress: row.address,
              propertyPrice: row.price ? parseInt(row.price.replace(/[^0-9]/g, "")) : undefined,
              propertyBedrooms: row.bedrooms ? parseInt(row.bedrooms) : undefined,
              propertyBathrooms: row.bathrooms ? parseInt(row.bathrooms) : undefined,
              propertySqft: row.sqft ? parseInt(row.sqft.replace(/[^0-9]/g, "")) : undefined,
              propertyDescription: row.description,
              propertyListingType: row.listingType,
              aiGenerated: true,
            });
            
            // Create calendar event
            await db.createCalendarEvent({
              userId: ctx.user.id,
              contentPostId: post.id,
              title: row.address || `Property Listing ${i + 1}`,
              eventDate: scheduleDate,
              eventTime: "09:00",
              eventType: "post",
            });
            
            postsCreated++;
            dayCounter++;
          } catch (error) {
            console.error("Error generating content for row", i, error);
          }
          
          await db.updateImportJob(jobId, { processedRows: i + 1 });
        }
        
        await db.updateImportJob(jobId, { 
          status: "completed", 
          generatedPosts: postsCreated,
          completedAt: new Date(),
        });
        
        return { success: true, postsCreated };
      }),
  }),

  images: router({
    generate: protectedProcedure
      .input(z.object({
        prompt: z.string(),
        style: z.enum(["realistic", "modern", "luxury", "minimal", "vibrant"]).optional(),
      }))
      .mutation(async ({ input }) => {
        // Moderate image prompt
        const moderation = await moderateContent(input.prompt, false);
        if (!moderation.allowed) {
          throw new Error(`Content moderation: ${moderation.reason}`);
        }
        
        const stylePrompts: Record<string, string> = {
          realistic: "photorealistic, high quality photography",
          modern: "modern, clean, minimalist design",
          luxury: "luxury, premium, high-end aesthetic",
          minimal: "minimalist, simple, elegant",
          vibrant: "vibrant colors, energetic, eye-catching",
        };
        
        const fullPrompt = `${input.prompt}. ${stylePrompts[input.style || "modern"]}. Professional real estate marketing quality.`;
        
        const result = await generateImage({ prompt: fullPrompt });
        return { url: result.url, prompt: fullPrompt };
      }),
    
    generateTemplate: protectedProcedure
      .input(z.object({
        templateType: z.enum(["property_card", "just_listed", "just_sold", "open_house", "market_update", "testimonial"]),
        propertyData: z.object({
          address: z.string().optional(),
          price: z.string().optional(),
          bedrooms: z.string().optional(),
          bathrooms: z.string().optional(),
          sqft: z.string().optional(),
          agentName: z.string().optional(),
        }).optional(),
        brandColor: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const persona = await db.getPersonaByUserId(ctx.user.id);
        const brandColor = input.brandColor || persona?.primaryColor || "#C9A962";
        
        const templatePrompts: Record<string, string> = {
          property_card: `Professional real estate property card design. Elegant layout with space for property photo, address, price, and agent info. ${brandColor} accent colors. Modern, clean design.`,
          just_listed: `"JUST LISTED" real estate social media post design. Bold, attention-grabbing with ${brandColor} accents. Space for property image and details. Professional and exciting.`,
          just_sold: `"JUST SOLD" celebration real estate post. Success-oriented design with ${brandColor} accents. Celebratory but professional. Space for property details.`,
          open_house: `"OPEN HOUSE" real estate invitation design. Welcoming, inviting atmosphere. ${brandColor} accents. Space for date, time, address details.`,
          market_update: `Real estate market update infographic design. Professional charts and statistics aesthetic. ${brandColor} color scheme. Clean, data-focused layout.`,
          testimonial: `Client testimonial real estate post design. Warm, trustworthy feel. ${brandColor} accents. Space for quote and client name. Professional and personal.`,
        };
        
        const prompt = templatePrompts[input.templateType] + " High quality, social media ready, 1080x1080 square format.";
        
        const result = await generateImage({ prompt });
        return { 
          url: result.url, 
          templateType: input.templateType,
          prompt,
        };
      }),
    
    searchStock: protectedProcedure
      .input(z.object({
        query: z.string(),
        category: z.enum(["property", "interior", "exterior", "neighborhood", "people", "abstract"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const categoryPrompts: Record<string, string> = {
          property: "real estate property exterior, professional photography",
          interior: "beautiful home interior, staged, professional real estate photography",
          exterior: "home exterior, curb appeal, professional real estate photography",
          neighborhood: "neighborhood scene, community, lifestyle photography",
          people: "professional real estate agent or happy homeowners, diverse, friendly",
          abstract: "abstract real estate concept, keys, house icons, professional",
        };
        
        const categoryHint = categoryPrompts[input.category || "property"];
        const prompt = `Stock photo style: ${input.query}. ${categoryHint}. High quality, versatile, suitable for real estate marketing.`;
        
        const results = await Promise.all([
          generateImage({ prompt: prompt + " Variation 1." }),
          generateImage({ prompt: prompt + " Variation 2, different angle." }),
          generateImage({ prompt: prompt + " Variation 3, alternative composition." }),
        ]);
        
        return {
          images: results.map((r, i) => ({
            url: r.url,
            query: input.query,
            index: i + 1,
          })),
        };
      }),
  }),


  analytics: router({
    getMetrics: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const records = await db.getAnalyticsByUserId(ctx.user.id, input.startDate, input.endDate);
        
        const totalViews = records.reduce((sum, r) => sum + (r.views || 0), 0);
        const totalLikes = records.reduce((sum, r) => sum + (r.likes || 0), 0);
        const totalComments = records.reduce((sum, r) => sum + (r.comments || 0), 0);
        const totalShares = records.reduce((sum, r) => sum + (r.shares || 0), 0);
        const totalClicks = records.reduce((sum, r) => sum + (r.clicks || 0), 0);
        const avgEngagement = records.length > 0 
          ? records.reduce((sum, r) => sum + (r.engagementRate || 0), 0) / records.length 
          : 0;
        
        return {
          totalViews,
          totalLikes,
          totalComments,
          totalShares,
          totalClicks,
          avgEngagement: avgEngagement / 100,
          totalPosts: records.length,
        };
      }),
    
    getTopPosts: protectedProcedure
      .input(z.object({
        limit: z.number().default(10),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const records = await db.getAnalyticsByUserId(ctx.user.id, input.startDate, input.endDate);
        
        const postMetrics = new Map<number, any>();
        
        for (const record of records) {
          const existing = postMetrics.get(record.contentPostId) || {
            contentPostId: record.contentPostId,
            totalViews: 0,
            totalLikes: 0,
            totalComments: 0,
            totalShares: 0,
            totalClicks: 0,
            avgEngagement: 0,
            platforms: new Set(),
          };
          
          existing.totalViews += record.views || 0;
          existing.totalLikes += record.likes || 0;
          existing.totalComments += record.comments || 0;
          existing.totalShares += record.shares || 0;
          existing.totalClicks += record.clicks || 0;
          existing.platforms.add(record.platform);
          
          postMetrics.set(record.contentPostId, existing);
        }
        
        const topPosts = Array.from(postMetrics.values())
          .map(p => ({
            ...p,
            platforms: Array.from(p.platforms),
            totalEngagement: p.totalLikes + p.totalComments + p.totalShares,
          }))
          .sort((a, b) => b.totalEngagement - a.totalEngagement)
          .slice(0, input.limit);
        
        return topPosts;
      }),
    
    getTrends: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
        groupBy: z.enum(["day", "week", "month"]).default("day"),
      }))
      .query(async ({ ctx, input }) => {
        const records = await db.getAnalyticsByUserId(ctx.user.id, input.startDate, input.endDate);
        
        const trends = records.map(r => ({
          date: r.recordedAt,
          views: r.views || 0,
          likes: r.likes || 0,
          comments: r.comments || 0,
          shares: r.shares || 0,
          engagement: (r.engagementRate || 0) / 100,
          platform: r.platform,
        }));
        
        return trends;
      }),
  }),

  schedules: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getPostingSchedulesByUserId(ctx.user.id);
      }),
    
    getActive: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getActivePostingSchedules(ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        contentType: z.enum(["property_listing", "market_report", "trending_news", "tips", "neighborhood", "custom", "carousel", "video"]),
        frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]),
        dayOfWeek: z.number().min(0).max(6).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        timeOfDay: z.string(),
        platforms: z.array(z.string()).optional(),
        autoGenerate: z.boolean().default(true),
        templateSettings: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const nextRunAt = calculateNextRunTime(
          input.frequency,
          input.timeOfDay,
          input.dayOfWeek,
          input.dayOfMonth
        );
        
        return db.createPostingSchedule({
          userId: ctx.user.id,
          name: input.name,
          contentType: input.contentType,
          frequency: input.frequency,
          dayOfWeek: input.dayOfWeek,
          dayOfMonth: input.dayOfMonth,
          timeOfDay: input.timeOfDay,
          platforms: input.platforms ? JSON.stringify(input.platforms) : null,
          autoGenerate: input.autoGenerate,
          templateSettings: input.templateSettings ? JSON.stringify(input.templateSettings) : null,
          nextRunAt,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        isActive: z.boolean().optional(),
        contentType: z.enum(["property_listing", "market_report", "trending_news", "tips", "neighborhood", "custom", "carousel", "video"]).optional(),
        frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]).optional(),
        dayOfWeek: z.number().min(0).max(6).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        timeOfDay: z.string().optional(),
        platforms: z.array(z.string()).optional(),
        autoGenerate: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const updateData: any = { ...input };
        delete updateData.id;
        
        if (input.platforms) {
          updateData.platforms = JSON.stringify(input.platforms);
        }
        
        if (input.frequency || input.timeOfDay || input.dayOfWeek || input.dayOfMonth) {
          const schedule = await db.getPostingScheduleById(input.id);
          if (schedule) {
            updateData.nextRunAt = calculateNextRunTime(
              input.frequency || schedule.frequency,
              input.timeOfDay || schedule.timeOfDay,
              input.dayOfWeek ?? schedule.dayOfWeek,
              input.dayOfMonth ?? schedule.dayOfMonth
            );
          }
        }
        
        return db.updatePostingSchedule(input.id, updateData);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deletePostingSchedule(input.id);
      }),
  }),

  // Usage tracking and subscription management
  usage: router({
    current: protectedProcedure.query(async ({ ctx }) => {
      const month = new Date().toISOString().slice(0, 7);
      const usage = await db.getUserUsageForMonth(ctx.user.id, month);
      const subscription = await db.getUserSubscription(ctx.user.id);
      const limits = await db.checkUsageLimits(ctx.user.id);
      
      return {
        usage: usage || { postsGenerated: 0, imagesGenerated: 0, aiCallsMade: 0 },
        subscription,
        tier: limits.tier,
        allowed: limits.allowed,
        reason: limits.reason,
      };
    }),
    
    tiers: protectedProcedure.query(async () => {
      return db.getAllSubscriptionTiers();
    }),
    
    alerts: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnacknowledgedAlerts(ctx.user.id);
    }),
  }),

  // Generic webhook handler (GHL removed)
  webhooks: router({
    stripe: publicProcedure
      .input(z.object({
        event: z.string(),
        userId: z.string().optional(),
        email: z.string().optional(),
        name: z.string().optional(),
        tier: z.enum(["basic", "pro", "authority"]).optional(),
        status: z.enum(["active", "cancelled", "suspended", "trial"]).optional(),
        stripeCustomerId: z.string().optional(),
        stripeSubscriptionId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Handle different GHL events
        if (input.event === "user.created" || input.event === "user.subscribed") {
          // Find or create user
          let user = input.email ? await db.getUserByEmail(input.email) : undefined;
          
          if (!user && input.email) {
            // Create new user from GHL
            await db.upsertUser({
              openId: `ghl_${input.userId || input.email}`,
              email: input.email,
              name: input.name,
              loginMethod: "ghl",
            });
            user = await db.getUserByEmail(input.email);
          }
          
          if (user && input.tier) {
            // Get tier ID
            const tier = await db.getSubscriptionTierByName(input.tier);
            if (tier) {
              // Create/update subscription
              await db.upsertUserSubscription({
                userId: user.id,
                tierId: tier.id,
                status: input.status || "active",
                stripeCustomerId: input.stripeCustomerId,
                stripeSubscriptionId: input.stripeSubscriptionId,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              });
            }
          }
          
          return { success: true, message: "User subscription created" };
        }
        
        if (input.event === "user.subscription.updated") {
          const user = input.email ? await db.getUserByEmail(input.email) : undefined;
          
          if (user && input.tier) {
            const tier = await db.getSubscriptionTierByName(input.tier);
            if (tier) {
              await db.upsertUserSubscription({
                userId: user.id,
                tierId: tier.id,
                status: input.status || "active",
                stripeCustomerId: input.stripeCustomerId,
                stripeSubscriptionId: input.stripeSubscriptionId,
              });
            }
          }
          
          return { success: true, message: "Subscription updated" };
        }
        
        if (input.event === "user.subscription.cancelled") {
          const user = input.email ? await db.getUserByEmail(input.email) : undefined;
          
          if (user) {
            const subscription = await db.getUserSubscription(user.id);
            if (subscription) {
              await db.upsertUserSubscription({
                ...subscription,
                status: "cancelled",
                cancelAtPeriodEnd: true,
              });
            }
          }
          
          return { success: true, message: "Subscription cancelled" };
        }
        
        return { success: true, message: "Event received" };
      }),
    ghl: publicProcedure
      .input(z.object({
        event: z.string(),
        userId: z.string().optional(),
        email: z.string().optional(),
        name: z.string().optional(),
        tier: z.enum(["basic", "pro", "authority"]).optional(),
        status: z.enum(["active", "cancelled", "suspended", "trial"]).optional(),
        stripeCustomerId: z.string().optional(),
        stripeSubscriptionId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        if (input.event === "user.created" || input.event === "user.subscribed") {
          let user = input.email ? await db.getUserByEmail(input.email) : undefined;
          if (!user && input.email) {
            await db.upsertUser({
              openId: `ghl_${input.userId || input.email}`,
              email: input.email,
              name: input.name,
              loginMethod: "ghl",
            });
            user = await db.getUserByEmail(input.email);
          }
          if (user && input.tier) {
            const tier = await db.getSubscriptionTierByName(input.tier);
            if (tier) {
              await db.upsertUserSubscription({
                userId: user.id,
                tierId: tier.id,
                status: input.status || "active",
                stripeCustomerId: input.stripeCustomerId,
                stripeSubscriptionId: input.stripeSubscriptionId,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              });
            }
          }
          return { success: true, message: "User subscription created" };
        }
        if (input.event === "user.subscription.updated") {
          const user = input.email ? await db.getUserByEmail(input.email) : undefined;
          if (user && input.tier) {
            const tier = await db.getSubscriptionTierByName(input.tier);
            if (tier) {
              await db.upsertUserSubscription({
                userId: user.id,
                tierId: tier.id,
                status: input.status || "active",
                stripeCustomerId: input.stripeCustomerId,
                stripeSubscriptionId: input.stripeSubscriptionId,
              });
            }
          }
          return { success: true, message: "Subscription updated" };
        }
        if (input.event === "user.subscription.cancelled") {
          const user = input.email ? await db.getUserByEmail(input.email) : undefined;
          if (user) {
            const subscription = await db.getUserSubscription(user.id);
            if (subscription) {
              await db.upsertUserSubscription({
                ...subscription,
                status: "cancelled",
                cancelAtPeriodEnd: true,
              });
            }
          }
          return { success: true, message: "Subscription cancelled" };
        }
        return { success: true, message: "GHL event received" };
      }),
  }),

  // White-label settings
  whiteLabel: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getWhiteLabelSettings(ctx.user.id);
    }),
    
    upsert: protectedProcedure
      .input(z.object({
        appName: z.string().optional(),
        appTagline: z.string().optional(),
        logoUrl: z.string().optional(),
        faviconUrl: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        customDomain: z.string().optional(),
        customCss: z.string().optional(),
        hideOriginalBranding: z.boolean().optional(),
        supportEmail: z.string().optional(),
        supportPhone: z.string().optional(),
        termsUrl: z.string().optional(),
        privacyUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.upsertWhiteLabelSettings({
          userId: ctx.user.id,
          ...input,
        });
      }),
  }),

  // Market Stats Feature
  marketStats: marketStatsRouter,

  // Stripe Billing
  stripe: stripeRouter,

  // Video Conversion
  video: videoRouter,

  // Facebook/Instagram OAuth
  facebook: facebookRouter,

  // LinkedIn OAuth
  linkedin: linkedinRouter,

  // AutoReels Module
  autoreels: autoreelsRouter,

  // Property Tours
  propertyTours: propertyToursRouter,

  // Content Templates (CSV Bulk Upload)
  contentTemplates: contentTemplatesRouter,

  // Hook Engine
  hooks: router({
    list: protectedProcedure
      .input(z.object({
        category: z.enum(["buyer", "seller", "investor", "local", "luxury", "relocation", "general"]).optional(),
        format: z.enum(["video", "email", "social", "carousel"]).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        // Check user subscription tier for premium hooks
        const subscription = await db.getUserSubscription(ctx.user.id);
        const isPremium = subscription?.status === "active" && subscription.tierId !== 1; // Assuming tier 1 is free
        
        if (input?.category) {
          return db.getHooksByCategory(input.category, isPremium ? undefined : false);
        }
        
        if (input?.format) {
          return db.getHooksByFormat(input.format, isPremium ? undefined : false);
        }
        
        return db.getAllHooks(isPremium ? undefined : false);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getHookById(input.id);
      }),
    
    use: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementHookUsage(input.id);
        return { success: true };
      }),

    generateScript: protectedProcedure
      .input(z.object({
        hookText: z.string().min(1),
        prompt: z.string().min(1),
        format: z.enum(["video", "email", "social", "carousel"]).default("social"),
        targetLength: z.enum(["short", "medium", "long"]).default("medium"),
      }))
      .mutation(async ({ ctx, input }) => {
        const persona = await db.getPersonaByUserId(ctx.user.id);
        const agentName = persona?.agentName || "a real estate agent";
        const city = (() => {
          try {
            const mc = persona?.marketContext ? JSON.parse(persona.marketContext) : null;
            return mc?.city || db.getServiceCitiesLabel(persona, "");
          } catch { return db.getServiceCitiesLabel(persona, ""); }
        })();

        // Build hyperlocal context
        let hyperlocalNote = "";
        if (persona?.targetNeighborhoods || persona?.targetZipCodes) {
          try {
            const hoods: string[] = persona.targetNeighborhoods ? JSON.parse(persona.targetNeighborhoods) : [];
            const zips: string[] = persona.targetZipCodes ? JSON.parse(persona.targetZipCodes) : [];
            const parts: string[] = [];
            if (hoods.length > 0) parts.push(`neighborhoods: ${hoods.join(", ")}`);
            if (zips.length > 0) parts.push(`ZIP codes: ${zips.join(", ")}`);
            if (parts.length > 0) hyperlocalNote = `\nHyperlocal SEO: Naturally weave in references to these specific ${parts.join(" and ")} where relevant.`;
          } catch {}
        }

        const lengthGuide: Record<string, string> = {
          short: "30-45 seconds (80-100 words)",
          medium: "60-90 seconds (150-200 words)",
          long: "2-3 minutes (300-450 words)",
        };
        const formatGuide: Record<string, string> = {
          video: "spoken video script with natural pauses and energy cues",
          social: "social media caption with line breaks, emojis, and hashtags",
          email: "email body with subject line, greeting, body, and CTA",
          carousel: "carousel slide-by-slide content (Slide 1: ..., Slide 2: ..., etc.)",
        };

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an expert real estate marketing copywriter. Write compelling, authentic content for real estate agents that builds authority and drives engagement. Keep it conversational and specific.${hyperlocalNote}`,
            },
            {
              role: "user",
              content: `Write a ${formatGuide[input.format] || "social media post"} for a real estate agent.\n\nAgent: ${agentName}${city ? ` in ${city}` : ""}\nOpening hook (use this verbatim as the first line): "${input.hookText}"\nAdditional context / prompt: ${input.prompt}\nTarget length: ${lengthGuide[input.targetLength] || "60-90 seconds"}\n\nImportant: Start with the hook exactly as written. Then expand naturally based on the prompt. Write only the final content — no instructions, no labels, no meta-commentary.`,
            },
          ],
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== "string") throw new Error("No response from AI");
        return { script: content };
      }),
  }),
  betaSignup: router({
    submit: publicProcedure
      .input(z.object({
        name: z.string(),
        brokerage: z.string().optional(),
        email: z.string().email(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Store beta signup in database
        await db.createBetaSignup(input);
        return { success: true };
      }),
  }),

  socialPosting: socialPostingRouter,

  coach: router({
    analyzeVisual: protectedProcedure
      .input(z.object({
        fileData: z.string(), // base64 encoded
        mimeType: z.string(), // image/jpeg, image/png, video/mp4, etc.
        fileName: z.string(),
        analysisType: z.enum(['headshot', 'listing_photo', 'social_post_screenshot', 'video_reel', 'general']).default('general'),
        additionalContext: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Upload file to S3 first
        const { storagePut } = await import("./storage");
        const base64Data = input.fileData.split(',')[1] || input.fileData;
        const buffer = Buffer.from(base64Data, 'base64');
        const fileKey = `coach-uploads/${ctx.user.id}/${Date.now()}-${input.fileName}`;
        const { url: fileUrl } = await storagePut(fileKey, buffer, input.mimeType);

        // Get persona for personalized feedback
        const persona = await db.getPersonaByUserId(ctx.user.id);
        let personaContext = '';
        if (persona) {
          try {
            const brandValues = persona.brandValues ? JSON.parse(persona.brandValues) : [];
            const marketContext = persona.marketContext ? JSON.parse(persona.marketContext) : null;
            if (brandValues.length > 0) personaContext += `\nBrand Values: ${brandValues.join(', ')}`;
            if (marketContext) personaContext += `\nMarket: ${marketContext.city}, ${marketContext.state}`;
          } catch (e) {}
        }

        const analysisPrompts: Record<string, string> = {
          headshot: 'Analyze this professional headshot for a real estate agent. Evaluate: background quality, lighting, attire professionalism, approachability, confidence, and overall brand impression. Give specific, actionable feedback on how to improve authority positioning.',
          listing_photo: 'Analyze this real estate listing photo. Evaluate: composition, lighting, staging quality, what draws the eye, what detracts from the property, and how to make it more compelling for buyers.',
          social_post_screenshot: 'Analyze this social media post screenshot from a real estate agent. Evaluate: visual design, text readability, brand consistency, engagement potential, call-to-action clarity, and overall authority positioning.',
          video_reel: 'Analyze this real estate video/reel. Evaluate: opening hook strength, production quality, agent presence and energy, message clarity, call-to-action, and overall engagement potential. Note specific timestamps if relevant.',
          general: 'Analyze this image or video from a real estate agent perspective. Provide specific, actionable feedback on how it could be improved for better authority positioning and market dominance.',
        };

        const prompt = analysisPrompts[input.analysisType];
        const isVideo = input.mimeType.startsWith('video/');

        const userMessage: any = isVideo
          ? {
              role: 'user' as const,
              content: [
                { type: 'text', text: `${prompt}${input.additionalContext ? `\n\nAdditional context: ${input.additionalContext}` : ''}` },
                { type: 'file_url', file_url: { url: fileUrl, mime_type: input.mimeType as any } },
              ],
            }
          : {
              role: 'user' as const,
              content: [
                { type: 'text', text: `${prompt}${input.additionalContext ? `\n\nAdditional context: ${input.additionalContext}` : ''}` },
                { type: 'image_url', image_url: { url: fileUrl, detail: 'high' as const } },
              ],
            };

        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `You are an expert real estate marketing coach and brand strategist. You provide specific, honest, actionable visual feedback to help real estate agents dominate their market.${personaContext}\n\nFormat your response as JSON with:\n- overallScore (0-100)\n- summary (2-3 sentence overall assessment)\n- strengths (array of 2-3 specific things done well)\n- improvements (array of 3-4 specific, actionable improvements with clear "how to fix" guidance)\n- priorityAction (the single most impactful change to make first)`,
            },
            userMessage,
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'visual_analysis',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  overallScore: { type: 'number' },
                  summary: { type: 'string' },
                  strengths: { type: 'array', items: { type: 'string' } },
                  improvements: { type: 'array', items: { type: 'string' } },
                  priorityAction: { type: 'string' },
                },
                required: ['overallScore', 'summary', 'strengths', 'improvements', 'priorityAction'],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0].message.content;
        return JSON.parse(typeof content === 'string' ? content : '');
      }),

    analyze: protectedProcedure
      .input(z.object({
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get persona data for personalized analysis
        const persona = await db.getPersonaByUserId(ctx.user.id);
        
        let customerAvatar = null;
        let brandValues: string[] = [];
        let marketContext = null;
        
        if (persona) {
          try {
            if (persona.customerAvatar) customerAvatar = JSON.parse(persona.customerAvatar);
            if (persona.brandValues) brandValues = JSON.parse(persona.brandValues);
            if (persona.marketContext) marketContext = JSON.parse(persona.marketContext);
          } catch (e) {
            console.error("Failed to parse persona data", e);
          }
        }
        
        // Build personalized system prompt
        let systemPrompt = `You are a social media performance coach for real estate professionals. Analyze posts and provide actionable feedback.`;
        
        if (customerAvatar || brandValues.length > 0 || marketContext) {
          systemPrompt += `\n\nPERSONALIZED CONTEXT:`;
          
          if (customerAvatar) {
            systemPrompt += `\n- Target Audience: ${customerAvatar.type} - ${customerAvatar.description || ''}`;
          }
          
          if (brandValues.length > 0) {
            systemPrompt += `\n- Brand Values: ${brandValues.join(', ')}`;
          }
          
          if (marketContext) {
            systemPrompt += `\n- Market: ${marketContext.city}, ${marketContext.state} (${marketContext.marketType} market)`;
            if (marketContext.keyTrends && marketContext.keyTrends.length > 0) {
              systemPrompt += `\n- Key Trends: ${marketContext.keyTrends.join(', ')}`;
            }
          }
        }
        
        systemPrompt += `\n\nReturn JSON with:
- overallScore (0-100)
- scores object with engagement, clarity, cta, authority, avatarAlignment, brandAlignment, marketRelevance (each 0-100)
- strengths array (2-3 specific things done well)
- improvements array (2-3 specific actionable suggestions)
- rewriteSuggestion (optimized version of the post)

Score criteria:
- Engagement: Hook strength, emotional appeal, relatability
- Clarity: Readability, structure, message clarity
- CTA: Clear call-to-action, next steps
- Authority: Expertise shown, credibility, local knowledge`;
        
        if (customerAvatar) {
          systemPrompt += `\n- Avatar Alignment: How well does this resonate with ${customerAvatar.type}?`;
        }
        
        if (brandValues.length > 0) {
          systemPrompt += `\n- Brand Alignment: Does this reflect the values: ${brandValues.join(', ')}?`;
        }
        
        if (marketContext) {
          systemPrompt += `\n- Market Relevance: Is this relevant to ${marketContext.city}, ${marketContext.state} market conditions?`;
        }
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: `Analyze this real estate post:\n\n${input.content}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "post_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  overallScore: { type: "number" },
                  scores: {
                    type: "object",
                    properties: {
                      engagement: { type: "number" },
                      clarity: { type: "number" },
                      cta: { type: "number" },
                      authority: { type: "number" },
                      avatarAlignment: { type: "number" },
                      brandAlignment: { type: "number" },
                      marketRelevance: { type: "number" },
                    },
                    required: ["engagement", "clarity", "cta", "authority"],
                    additionalProperties: false,
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                  },
                  improvements: {
                    type: "array",
                    items: { type: "string" },
                  },
                  rewriteSuggestion: { type: "string" },
                },
                required: ["overallScore", "scores", "strengths", "improvements", "rewriteSuggestion"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0].message.content;
        const analysis = JSON.parse(typeof content === 'string' ? content : '');

        return analysis;
      }),

    getActivitySummary: protectedProcedure.query(async ({ ctx }) => {
      const dbInst = await db.getDb();
      if (!dbInst) return {
        postsLast30: 0, videosLast30: 0, blogsLast30: 0,
        totalPosts: 0, totalVideos: 0, totalBlogs: 0,
        profileScore: 0, creditBalance: 0, subscriptionTier: 'free',
        agentName: 'Agent', primaryCity: null,
        hasHeadshot: false, hasBio: false, hasBookingUrl: false,
      };
      const { eq, desc } = await import('drizzle-orm');
      const schema = await import('../drizzle/schema');
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [persona, contentPostsRows, videosRows, blogPostsRows, userRows] = await Promise.all([
        db.getPersonaByUserId(ctx.user.id),
        dbInst.select({ id: schema.contentPosts.id, aiGenerated: schema.contentPosts.aiGenerated, createdAt: schema.contentPosts.createdAt })
          .from(schema.contentPosts)
          .where(eq(schema.contentPosts.userId, ctx.user.id))
          .orderBy(desc(schema.contentPosts.createdAt))
          .limit(100),
        dbInst.select({ id: schema.generatedVideos.id, type: schema.generatedVideos.type, status: schema.generatedVideos.status, createdAt: schema.generatedVideos.createdAt })
          .from(schema.generatedVideos)
          .where(eq(schema.generatedVideos.userId, ctx.user.id))
          .orderBy(desc(schema.generatedVideos.createdAt))
          .limit(50),
        dbInst.select({ id: schema.blogPosts.id, createdAt: schema.blogPosts.createdAt })
          .from(schema.blogPosts)
          .where(eq(schema.blogPosts.userId, ctx.user.id))
          .orderBy(desc(schema.blogPosts.createdAt))
          .limit(50),
        dbInst.select({ creditBalance: schema.users.creditBalance, subscriptionTier: schema.users.subscriptionTier, name: schema.users.name })
          .from(schema.users)
          .where(eq(schema.users.id, ctx.user.id))
          .limit(1),
      ]);
      // 30-day counts
      const postsLast30 = contentPostsRows.filter(p => new Date(p.createdAt) >= thirtyDaysAgo).length;
      const videosLast30 = videosRows.filter(v => new Date(v.createdAt) >= thirtyDaysAgo).length;
      const blogsLast30 = blogPostsRows.filter(b => new Date(b.createdAt) >= thirtyDaysAgo).length;
      // Profile completion score
      const p = persona;
      const profileFields = [
        !!p?.agentName, !!p?.headshotUrl, !!p?.brokerageName, !!p?.phoneNumber,
        !!p?.websiteUrl, !!p?.bio, !!p?.primaryCity, !!p?.tagline,
        !!p?.targetAudience, !!p?.logoUrl,
      ];
      const profileScore = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);
      const userRow = userRows[0];
      return {
        postsLast30,
        videosLast30,
        blogsLast30,
        totalPosts: contentPostsRows.length,
        totalVideos: videosRows.length,
        totalBlogs: blogPostsRows.length,
        profileScore,
        creditBalance: userRow?.creditBalance ?? 0,
        subscriptionTier: userRow?.subscriptionTier || 'free',
        agentName: userRow?.name || p?.agentName || 'Agent',
        primaryCity: p?.primaryCity || null,
        hasHeadshot: !!p?.headshotUrl,
        hasBio: !!p?.bio,
        hasBookingUrl: !!p?.bookingUrl,
      };
    }),

    weeklyDiagnosis: protectedProcedure.query(async ({ ctx }) => {
      // Gather all activity data
      const dbInst = await db.getDb();
      if (!dbInst) throw new Error('Database unavailable');
      const { eq, desc } = await import('drizzle-orm');
      const schema = await import('../drizzle/schema');
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [persona, contentPostsRows, videosRows, blogPostsRows, leadMagnetsRows, userRows, podcastRows] = await Promise.all([
        db.getPersonaByUserId(ctx.user.id),
        dbInst.select({ id: schema.contentPosts.id, createdAt: schema.contentPosts.createdAt })
          .from(schema.contentPosts).where(eq(schema.contentPosts.userId, ctx.user.id))
          .orderBy(desc(schema.contentPosts.createdAt)).limit(200),
        dbInst.select({ id: schema.generatedVideos.id, type: schema.generatedVideos.type, createdAt: schema.generatedVideos.createdAt })
          .from(schema.generatedVideos).where(eq(schema.generatedVideos.userId, ctx.user.id))
          .orderBy(desc(schema.generatedVideos.createdAt)).limit(100),
        dbInst.select({ id: schema.blogPosts.id, createdAt: schema.blogPosts.createdAt })
          .from(schema.blogPosts).where(eq(schema.blogPosts.userId, ctx.user.id))
          .orderBy(desc(schema.blogPosts.createdAt)).limit(100),
        dbInst.select({ id: schema.leadMagnets.id, createdAt: schema.leadMagnets.createdAt })
          .from(schema.leadMagnets).where(eq(schema.leadMagnets.userId, ctx.user.id))
          .orderBy(desc(schema.leadMagnets.createdAt)).limit(50),
        dbInst.select({ creditBalance: schema.users.creditBalance, subscriptionTier: schema.users.subscriptionTier, name: schema.users.name })
          .from(schema.users).where(eq(schema.users.id, ctx.user.id)).limit(1),
        dbInst.select({ id: schema.podcastEpisodes.id, createdAt: schema.podcastEpisodes.createdAt })
          .from(schema.podcastEpisodes).where(eq(schema.podcastEpisodes.userId, ctx.user.id))
          .orderBy(desc(schema.podcastEpisodes.createdAt)).limit(50),
      ]);

      const postsLast7 = contentPostsRows.filter(p => new Date(p.createdAt) >= sevenDaysAgo).length;
      const postsLast30 = contentPostsRows.filter(p => new Date(p.createdAt) >= thirtyDaysAgo).length;
      const videosLast30 = videosRows.filter(v => new Date(v.createdAt) >= thirtyDaysAgo).length;
      const blogsTotal = blogPostsRows.length;
      const blogsLast30 = blogPostsRows.filter(b => new Date(b.createdAt) >= thirtyDaysAgo).length;
      const leadMagnetsTotal = leadMagnetsRows.length;
      const podcastsTotal = podcastRows.length;
      const userRow = userRows[0];
      const agentName = userRow?.name || persona?.agentName || 'Agent';
      const primaryCity = persona?.primaryCity || 'your market';
      const hasHeadshot = !!persona?.headshotUrl;
      const hasBio = !!persona?.bio;
      const hasBookingUrl = !!persona?.bookingUrl;
      const profileScore = (() => {
        const fields = [!!persona?.agentName, hasHeadshot, !!persona?.brokerageName, !!persona?.phoneNumber, !!persona?.websiteUrl, hasBio, !!persona?.primaryCity, !!persona?.tagline, !!persona?.targetAudience, !!persona?.logoUrl];
        return Math.round((fields.filter(Boolean).length / fields.length) * 100);
      })();

      const activitySummary = [
        `Posts created (last 7 days): ${postsLast7}`,
        `Posts created (last 30 days): ${postsLast30}`,
        `Total posts ever: ${contentPostsRows.length}`,
        `Videos generated (last 30 days): ${videosLast30}`,
        `Total videos ever: ${videosRows.length}`,
        `Blog posts total: ${blogsTotal} (${blogsLast30} in last 30 days)`,
        `Lead magnets created: ${leadMagnetsTotal}`,
        `Podcast episodes created: ${podcastsTotal}`,
        `Profile completion: ${profileScore}%`,
        `Has professional headshot: ${hasHeadshot}`,
        `Has bio: ${hasBio}`,
        `Has booking URL: ${hasBookingUrl}`,
        `Primary market: ${primaryCity}`,
        `Subscription tier: ${userRow?.subscriptionTier || 'free'}`,
      ].join('\n');

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `You are a decisive real estate business strategist. You analyze agent activity data and produce a weekly diagnosis — not suggestions, but directives. Be blunt, specific, and urgent. Every insight must include: what is happening, why it matters, and exactly what to do about it. Do not hedge. Do not say "consider" or "you might want to". Say "Do this" and "Fix this".`,
          },
          {
            role: 'user',
            content: `Agent: ${agentName} | Market: ${primaryCity}\n\nACTIVITY DATA:\n${activitySummary}\n\nGenerate a weekly diagnosis with:\n1. One critical issue (the single biggest problem holding them back right now)\n2. Two missed opportunities (high-leverage things they are not doing that would move the needle)\n3. Three priority actions (specific, executable tasks to do THIS WEEK, in order of impact)\n4. One leverage insight (a pattern in their data that reveals an untapped opportunity)\n5. Weekly focus statement (one bold sentence that captures what they should be laser-focused on this week)`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'weekly_diagnosis',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                criticalIssue: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    whatIsHappening: { type: 'string' },
                    consequence: { type: 'string' },
                    action: { type: 'string' },
                  },
                  required: ['title', 'whatIsHappening', 'consequence', 'action'],
                  additionalProperties: false,
                },
                missedOpportunities: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      insight: { type: 'string' },
                      action: { type: 'string' },
                    },
                    required: ['title', 'insight', 'action'],
                    additionalProperties: false,
                  },
                },
                priorityActions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      rank: { type: 'number' },
                      action: { type: 'string' },
                      tool: { type: 'string' },
                      href: { type: 'string' },
                    },
                    required: ['rank', 'action', 'tool', 'href'],
                    additionalProperties: false,
                  },
                },
                leverageInsight: { type: 'string' },
                weeklyFocus: { type: 'string' },
              },
              required: ['criticalIssue', 'missedOpportunities', 'priorityActions', 'leverageInsight', 'weeklyFocus'],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      return JSON.parse(typeof content === 'string' ? content : '{}');
    }),

    marketIntelligence: protectedProcedure.query(async ({ ctx }) => {
      const persona = await db.getPersonaByUserId(ctx.user.id);
      const primaryCity = persona?.primaryCity || 'the United States';

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'You are a real estate market intelligence analyst. Generate a concise, actionable market insight for today. Be specific, data-informed, and translate every stat into a client-facing talking point.',
          },
          {
            role: 'user',
            content: `Generate today\'s market intelligence snapshot for a real estate agent in ${primaryCity}. Include a specific market stat or trend, what it means for buyers and sellers, and exactly what the agent should say to clients about it today.`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'market_intelligence',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                headline: { type: 'string' },
                snapshot: { type: 'string' },
                whatItMeans: { type: 'string' },
                whatToSay: { type: 'string' },
                urgency: { type: 'string', enum: ['high', 'medium', 'low'] },
              },
              required: ['headline', 'snapshot', 'whatItMeans', 'whatToSay', 'urgency'],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      return JSON.parse(typeof content === 'string' ? content : '{}');
    }),

    dominanceChat: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const { eq, desc } = await import('drizzle-orm');
        const schema = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const dbInst = await getDb();
        if (!dbInst) throw new Error('Database unavailable');

        const [recentTransactions, recentGuides, recentPresentations, persona, user] = await Promise.all([
          dbInst.select().from(schema.creditTransactions)
            .where(eq(schema.creditTransactions.userId, ctx.user.id))
            .orderBy(desc(schema.creditTransactions.createdAt))
            .limit(20),
          dbInst.select().from(schema.generatedGuides)
            .where(eq(schema.generatedGuides.userId, ctx.user.id))
            .orderBy(desc(schema.generatedGuides.createdAt))
            .limit(10),
          dbInst.select().from(schema.listingPresentations)
            .where(eq(schema.listingPresentations.userId, ctx.user.id))
            .orderBy(desc(schema.listingPresentations.createdAt))
            .limit(5),
          db.getPersonaByUserId(ctx.user.id),
            dbInst.select().from(schema.users).where(eq(schema.users.id, ctx.user.id)).limit(1),
        ]);
        const userRow = (user as unknown as { id: number; name: string | null; credits: number | null; subscriptionTier?: string | null }[])[0] ?? null;
        const usageActivities = (recentTransactions as { type: string; usageType: string | null; createdAt: Date }[])
          .filter(t => t.type === 'usage' && t.usageType)
          .map(t => `${t.usageType} (${new Date(t.createdAt).toLocaleDateString()})`);
        const guidesSummary = (recentGuides as { guideType: string; cityArea: string | null; createdAt: Date }[]).map(g =>
          `${g.guideType === 'sellers_manual' ? "Seller's Manual" : "Buyer's Guide"} for ${g.cityArea || 'unknown area'} (${new Date(g.createdAt).toLocaleDateString()})`
        );
        const presentationsSummary = (recentPresentations as { propertyAddress?: string | null; createdAt: Date }[]).map(p =>
          `Listing Presentation for ${p.propertyAddress || 'unknown property'} (${new Date(p.createdAt).toLocaleDateString()})`
        );
        let personaContext = '';
        if (persona) {
          try {
            const marketCtx = persona.marketContext ? JSON.parse(persona.marketContext) : null;
            const brandVals = persona.brandValues ? JSON.parse(persona.brandValues) : [];
            if (marketCtx) personaContext += `\nMarket: ${marketCtx.city}, ${marketCtx.state}`;
            if (brandVals.length > 0) personaContext += `\nBrand Values: ${brandVals.join(', ')}`;
          } catch (e) {}
        }
        const agentName = userRow?.name || 'the agent';
        const creditBalance = userRow?.credits ?? 0;
        const subscriptionTier = userRow?.subscriptionTier || 'free';

        const activityContext = [
          usageActivities.length > 0
            ? `Recent tool usage (last 30 days): ${usageActivities.slice(0, 10).join('; ')}`
            : 'No recent tool usage recorded.',
          guidesSummary.length > 0
            ? `Guides generated: ${guidesSummary.join('; ')}`
            : 'No guides generated yet.',
          presentationsSummary.length > 0
            ? `Presentations created: ${presentationsSummary.join('; ')}`
            : 'No presentations created yet.',
          `Current credit balance: ${creditBalance} credits`,
          `Subscription tier: ${subscriptionTier}`,
        ].join('\n');

        const systemPrompt = `You are the Market Dominance Coach for Amped Agent. You are not a helpful assistant. You are a decisive, opinionated strategist who tells agents exactly what to do to win listings and dominate their market.

You are talking to ${agentName}.${personaContext}

Here is what they have been working on in the platform:
${activityContext}

RULES:
- Never say "consider" or "you might want to" — say "Do this" and "Here's what to say"
- Every response must include: (1) a direct strategic assessment, (2) specific talk tracks or scripts, (3) 2-3 executable action steps
- Reference their actual activity data. Call out gaps bluntly.
- If they haven't used a tool that would help them, tell them to use it and explain exactly why
- Think like a coach who has seen 1,000 agents fail and knows exactly what separates the top 1%
- Lead with your opinion: "Here's what I'd focus on if I were you this week..."
- End every response with one bold directive: the single most important thing they should do in the next 24 hours`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            ...input.messages,
          ],
        });

        return { reply: response.choices[0].message.content || '' };
      }),
  }),

  thumbnail: router({
    generate: protectedProcedure
      .input(z.object({
        mainText: z.string().optional(),
        subText: z.string().optional(),
        topic: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // If topic provided, use AI to generate thumbnail text
        let finalMainText = input.mainText || "";
        let finalSubText = input.subText || "";

        if (input.topic && !input.mainText) {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are a YouTube thumbnail text expert. Generate catchy, short thumbnail text (3-5 words max for main text, 2-4 words for subtitle). Return JSON with mainText and subText fields.",
              },
              {
                role: "user",
                content: `Generate thumbnail text for: ${input.topic}`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "thumbnail_text",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    mainText: { type: "string" },
                    subText: { type: "string" },
                  },
                  required: ["mainText", "subText"],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = response.choices[0].message.content;
          const generated = JSON.parse(typeof content === 'string' ? content : '');
          finalMainText = generated.mainText;
          finalSubText = generated.subText;
        }

        // Generate thumbnail image with text overlay
        const prompt = `Professional YouTube thumbnail design, high contrast, bold typography. Main text: "${finalMainText}". Subtitle: "${finalSubText}". Real estate themed, luxury aesthetic, eye-catching colors, optimized for mobile viewing. 16:9 aspect ratio, 1280x720px.`;

        const result = await generateImage({ prompt });

        if (!result.url) {
          throw new Error("Failed to generate thumbnail image");
        }

        return {
          imageUrl: result.url,
          mainText: finalMainText,
          subText: finalSubText,
        };
      }),
  }),
});

function calculateNextRunTime(
  frequency: string,
  timeOfDay: string,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null
): Date {
  const now = new Date();
  const [hours, minutes] = timeOfDay.split(":").map(Number);
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);
  
  if (frequency === "daily") {
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
  } else if (frequency === "weekly" && dayOfWeek !== null && dayOfWeek !== undefined) {
    const currentDay = next.getDay();
    const daysUntil = (dayOfWeek - currentDay + 7) % 7;
    next.setDate(next.getDate() + (daysUntil === 0 && next <= now ? 7 : daysUntil));
  } else if (frequency === "biweekly" && dayOfWeek !== null && dayOfWeek !== undefined) {
    const currentDay = next.getDay();
    const daysUntil = (dayOfWeek - currentDay + 7) % 7;
    next.setDate(next.getDate() + (daysUntil === 0 && next <= now ? 14 : daysUntil));
  } else if (frequency === "monthly" && dayOfMonth !== null && dayOfMonth !== undefined) {
    next.setDate(dayOfMonth);
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }
  }
  
  return next;
}

export type AppRouter = typeof appRouter;
