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
import { adminRouter } from "./routers/admin";
import { draftsRouter } from "./routers/drafts";
import { reelsRouter } from "./routers/reels";
import { newsletterRouter } from "./routers/newsletter";
import { musicLibraryRouter } from "./routers/musicLibrary";
import { myVideosRouter } from "./routers/myVideos";
import { gbpRouter } from "./routers/gbp";
import { youtubeRouter } from "./routers/youtube";
import { youtubeVideoBuilderRouter } from "./routers/youtubeVideoBuilder";
import { repurposeRouter } from "./routers/repurpose";
import { leadMagnetRouter } from "./routers/leadMagnet";
import { cinematicWalkthroughRouter } from "./routers/cinematicWalkthrough";
import { blogBuilderRouter } from "./routers/blogBuilder";
import { brandStoryRouter } from "./routers/brandStory";
import { ghlRouter } from "./routers/ghl";
import { fullAvatarVideoRouter } from "./routers/fullAvatarVideo";
import { liveTourRouter } from "./routers/liveTour";

export const appRouter = router({
  system: systemRouter,
  credits: creditsRouter,
  rateLimit: rateLimitRouter,
  admin: adminRouter,
  drafts: draftsRouter,
  reels: reelsRouter,
  newsletter: newsletterRouter,
  musicLibrary: musicLibraryRouter,
  myVideos: myVideosRouter,
  gbp: gbpRouter,
  youtube: youtubeRouter,
  youtubeVideoBuilder: youtubeVideoBuilderRouter,
  repurpose: repurposeRouter,
  leadMagnet: leadMagnetRouter,
  cinematicWalkthrough: cinematicWalkthroughRouter,
  blogBuilder: blogBuilderRouter,
  brandStory: brandStoryRouter,
  ghl: ghlRouter,
  fullAvatarVideo: fullAvatarVideoRouter,
  liveTour: liveTourRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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

    saveOnboarding: authOnlyProcedure
      .input(z.object({
        brokerageName: z.string().min(1).max(255),
        primaryCity: z.string().min(1).max(255),
        primaryState: z.string().min(1).max(100),
        yearsExperience: z.number().int().min(0).max(60),
      }))
      .mutation(async ({ ctx, input }) => {
        // Save to persona (brokerage, city, state, years)
        await db.upsertPersona(ctx.user.id, {
          brokerageName: input.brokerageName,
          primaryCity: input.primaryCity,
          primaryState: input.primaryState,
          yearsExperience: input.yearsExperience,
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
        bio: z.string().optional(),
        serviceAreas: z.string().optional(),
        brokerage: z.string().optional(),
        headshotOffsetY: z.number().int().min(0).max(100).optional(),
        headshotZoom: z.number().int().min(100).max(200).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.upsertPersona(ctx.user.id, input);
      }),
    
    updateAuthorityProfile: protectedProcedure
      .input(z.object({
        customerAvatar: z.string().optional(),
        brandValues: z.string().optional(),
        marketContext: z.string().optional(),
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
          description: `Voice clone for ${agentName} - Authority Content`,
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
Use a ${tone} tone.

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
Use a ${tone} tone. Create a 30-60 second video script formatted EXACTLY like this:

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
Use a ${tone} tone. Generate 3 different caption variations without labeling them:
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
        tier: z.enum(["basic", "pro", "agency"]).optional(),
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
        tier: z.enum(["basic", "pro", "agency"]).optional(),
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
