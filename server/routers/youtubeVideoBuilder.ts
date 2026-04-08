import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import * as credits from "../credits";
import * as rateLimit from "../rateLimit";
import { getDb } from "../db";
import { fullAvatarVideos, customAvatarTwins } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { generateCustomAvatarVideo, waitForHeyGenVideo } from "../lib/heygen-service";
import { storagePut } from "../storage";

// ─── Topic templates ──────────────────────────────────────────────────────────
export const TOPIC_TEMPLATES: Record<
  string,
  { title: string; outline: string; duration: string }
> = {
  market_update: {
    title: "Monthly Market Update",
    outline:
      "1. Hook: surprising stat about your local market\n2. Current inventory levels & what it means for buyers/sellers\n3. Average days on market trend\n4. Median price movement (3-month comparison)\n5. Interest rate impact on affordability\n6. My prediction for next 30-60 days\n7. CTA: free home valuation or buyer consultation",
    duration: "8-10 min",
  },
  buyer_tips: {
    title: "First-Time Buyer's Complete Guide",
    outline:
      "1. Hook: biggest mistake first-time buyers make\n2. Step 1: Get pre-approved (what docs you need)\n3. Step 2: Define your must-haves vs nice-to-haves\n4. Step 3: Understanding the offer process\n5. Step 4: Inspection — what to look for\n6. Step 5: Closing costs breakdown\n7. Q&A: top 5 questions I get from buyers\n8. CTA: free buyer consultation",
    duration: "12-15 min",
  },
  seller_tips: {
    title: "How to Sell Your Home for Top Dollar",
    outline:
      "1. Hook: how much money sellers leave on the table\n2. Pricing strategy: the danger of overpricing\n3. Staging tips that actually move the needle\n4. Photography & video — why it matters\n5. Marketing your home beyond the MLS\n6. Negotiation: how to evaluate offers\n7. Timeline: what to expect from list to close\n8. CTA: free home valuation",
    duration: "12-15 min",
  },
  neighborhood_spotlight: {
    title: "Neighborhood Spotlight",
    outline:
      "1. Hook: why this neighborhood is underrated/trending\n2. Location & commute overview\n3. Schools & ratings\n4. Restaurants, coffee shops & lifestyle\n5. Parks, trails & outdoor amenities\n6. Current home prices & what you get for your money\n7. My honest take: who this neighborhood is perfect for\n8. CTA: schedule a tour",
    duration: "8-10 min",
  },
  investment_tips: {
    title: "Real Estate Investing 101",
    outline:
      "1. Hook: why real estate beats the stock market long-term\n2. Types of investment properties (SFR, multi-family, short-term)\n3. The BRRRR strategy explained simply\n4. How to calculate cash flow & cap rate\n5. Financing options for investors\n6. Common mistakes new investors make\n7. My top 3 markets to watch right now\n8. CTA: free investor consultation",
    duration: "12-15 min",
  },
  agent_story: {
    title: "My Story: Why I Became a Real Estate Agent",
    outline:
      "1. Hook: the moment that changed everything\n2. My background before real estate\n3. Why I chose this market/city\n4. My philosophy: what I believe about buying/selling\n5. A client story that meant the most to me\n6. What I do differently than other agents\n7. My commitment to you\n8. CTA: let's connect",
    duration: "8-10 min",
  },
  faq: {
    title: "Top 10 Real Estate Questions Answered",
    outline:
      "1. Hook: the question I get asked every single week\n2. Q: How long does it take to buy a home?\n3. Q: How much do I need for a down payment?\n4. Q: Should I buy or rent right now?\n5. Q: What's the best time of year to sell?\n6. Q: Do I need a real estate agent?\n7. Q: What is earnest money?\n8. Q: How do I know if a home is priced right?\n9. Q: What happens if the inspection finds problems?\n10. Q: How do you get paid?\n11. CTA: submit your question",
    duration: "12-15 min",
  },
  luxury_market: {
    title: "Luxury Real Estate: What You Need to Know",
    outline:
      "1. Hook: what separates luxury from premium\n2. How the luxury market behaves differently\n3. What luxury buyers are looking for in [city]\n4. The importance of off-market listings\n5. Luxury staging & presentation standards\n6. Negotiation dynamics at the high end\n7. My luxury portfolio & track record\n8. CTA: private consultation for luxury buyers/sellers",
    duration: "10-12 min",
  },
  downsizing: {
    title: "The Smart Downsizer's Guide",
    outline:
      "1. Hook: the emotional side of downsizing nobody talks about\n2. When is the right time to downsize?\n3. What to do with the stuff (practical tips)\n4. Financial benefits of downsizing in today's market\n5. What to look for in a smaller home\n6. 55+ communities vs. traditional neighborhoods\n7. How to time the sale of your current home\n8. CTA: free downsizing consultation",
    duration: "10-12 min",
  },
};

const YOUTUBE_VIDEO_CREDITS = 20;

// ─── Router ───────────────────────────────────────────────────────────────────
export const youtubeVideoBuilderRouter = router({
  /**
   * Get all available topic templates
   */
  getTopicTemplates: protectedProcedure.query(() => {
    return Object.entries(TOPIC_TEMPLATES).map(([key, val]) => ({
      key,
      title: val.title,
      outline: val.outline,
      duration: val.duration,
    }));
  }),

  /**
   * Generate a full long-form YouTube script from a topic + outline
   */
  generateScript: protectedProcedure
    .input(
      z.object({
        topic: z.string().min(1),
        outline: z.string().min(1),
        agentName: z.string().optional(),
        city: z.string().optional(),
        targetDuration: z.enum(["5min", "8min", "12min", "15min"]).default("8min"),
        tone: z.enum(["professional", "conversational", "authoritative", "warm"]).default("professional"),
      })
    )
    .mutation(async ({ input }) => {
      const wordTargets: Record<string, number> = {
        "5min": 750,
        "8min": 1200,
        "12min": 1800,
        "15min": 2250,
      };
      const wordTarget = wordTargets[input.targetDuration] ?? 1200;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a professional real estate content creator specializing in long-form YouTube scripts for real estate agents. 
Write scripts that feel natural when spoken aloud — conversational but authoritative. 
Use short sentences. Vary sentence length. Include natural pauses marked with [PAUSE].
Add [B-ROLL: description] cues where relevant visuals would help.
Format: plain paragraphs with section headers in ALL CAPS. No bullet points in the script itself.
Target approximately ${wordTarget} words (spoken at ~150 wpm = ${Math.round(wordTarget / 150)} minutes).`,
          },
          {
            role: "user",
            content: `Write a complete YouTube script for a real estate agent.

Agent name: ${input.agentName || "your agent"}
City/market: ${input.city || "your local market"}
Topic: ${input.topic}
Tone: ${input.tone}
Target length: ~${wordTarget} words

Follow this outline:
${input.outline}

Write the full script now. Start with a strong hook. End with a clear CTA. Include [B-ROLL] cues and [PAUSE] markers throughout.`,
          },
        ],
      });

      const script = (response.choices[0]?.message?.content as string) ?? "";
      const wordCount = script.split(/\s+/).length;
      const estimatedMinutes = Math.round(wordCount / 150);

      return { script, wordCount, estimatedMinutes };
    }),

  /**
   * Generate SEO metadata for the YouTube video
   */
  generateSEO: protectedProcedure
    .input(
      z.object({
        topic: z.string(),
        script: z.string(),
        city: z.string().optional(),
        agentName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a YouTube SEO expert for real estate content. Return JSON only.",
          },
          {
            role: "user",
            content: `Generate YouTube SEO metadata for this real estate video.

Topic: ${input.topic}
Agent: ${input.agentName || "real estate agent"}
City: ${input.city || "local market"}

Script excerpt (first 500 chars):
${input.script.substring(0, 500)}

Return JSON with:
{
  "title": "compelling YouTube title under 60 chars",
  "description": "full YouTube description 200-300 words with keywords, timestamps placeholder, and CTA",
  "tags": ["array", "of", "15-20", "relevant", "tags"],
  "chapters": [
    {"time": "0:00", "title": "Introduction"},
    {"time": "1:30", "title": "Section title"}
  ]
}`,
          },
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
                chapters: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      time: { type: "string" },
                      title: { type: "string" },
                    },
                    required: ["time", "title"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["title", "description", "tags", "chapters"],
              additionalProperties: false,
            },
          },
        },
      });

      const raw = (response.choices[0]?.message?.content as string) ?? "{}";
      return JSON.parse(raw) as {
        title: string;
        description: string;
        tags: string[];
        chapters: { time: string; title: string }[];
      };
    }),

  /**
   * Generate a HeyGen avatar video from the script (long-form, landscape 16:9)
   */
  generateVideo: protectedProcedure
    .input(
      z.object({
        script: z.string().min(50),
        voiceId: z.string().optional(),
        title: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Rate limit check
      const rateLimitStatus = await rateLimit.checkDailyVideoLimit(ctx.user.id);
      if (!rateLimitStatus.allowed) {
        throw new Error(
          `Daily video limit reached. Resets at ${rateLimitStatus.resetTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC.`
        );
      }

      // Credit check
      const hasEnough = await credits.hasCredits(ctx.user.id, YOUTUBE_VIDEO_CREDITS);
      if (!hasEnough) {
        const balance = await credits.getCreditBalance(ctx.user.id);
        throw new Error(
          `Insufficient credits. YouTube videos cost ${YOUTUBE_VIDEO_CREDITS} credits. You have ${balance}.`
        );
      }

      // Get user's custom avatar twin
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const twins = await db
        .select()
        .from(customAvatarTwins)
        .where(eq(customAvatarTwins.userId, ctx.user.id))
        .orderBy(desc(customAvatarTwins.createdAt))
        .limit(1);

      if (!twins.length || twins[0].status !== "ready") {
        throw new Error(
          "No trained digital twin found. Please train your avatar in Full Avatar Video first."
        );
      }

      const twin = twins[0];

      // Deduct credits
      await credits.deductCredits({
        userId: ctx.user.id,
        amount: YOUTUBE_VIDEO_CREDITS,
        usageType: "youtube_video",
        description: "YouTube Video Builder — long-form avatar video",
      });

      // Save record
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      const wordCount = input.script.split(/\s+/).length;
      const duration = Math.ceil((wordCount / 130) * 60);

      const [record] = await db
        .insert(fullAvatarVideos)
        .values({
          userId: ctx.user.id,
          title: input.title || "YouTube Video",
          script: input.script,
          avatarType: "v3_custom",
          customAvatarId: twin.didAvatarId,
          voiceId: input.voiceId ?? "en-US-JennyNeural",
          duration,
          status: "processing",
          expiresAt,
        })
        .$returningId();

      const videoId = record.id;

      // Fire and forget — HeyGen generation
      setImmediate(async () => {
        try {
          const heygenVideoId = await generateCustomAvatarVideo({
            avatarId: twin.didAvatarId,
            script: input.script,
            voiceId: input.voiceId,
            title: input.title,
            landscape: true, // 16:9 for YouTube
          });

          await db
            .update(fullAvatarVideos)
            .set({ didTalkId: heygenVideoId })
            .where(eq(fullAvatarVideos.id, videoId));

          const { videoUrl: heygenVideoUrl } = await waitForHeyGenVideo(heygenVideoId, 30 * 60 * 1000, 10_000);

          // Download and re-host on S3
          const videoRes = await fetch(heygenVideoUrl);
          if (!videoRes.ok) throw new Error("Failed to download HeyGen video");
          const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
          const s3Key = `youtube-videos/${ctx.user.id}/${videoId}-${Date.now()}.mp4`;
          const { url: s3Url } = await storagePut(s3Key, videoBuffer, "video/mp4");

          await db
            .update(fullAvatarVideos)
            .set({ videoUrl: s3Url, s3Key, status: "completed" })
            .where(eq(fullAvatarVideos.id, videoId));
        } catch (err: any) {
          await db
            .update(fullAvatarVideos)
            .set({ status: "failed" })
            .where(eq(fullAvatarVideos.id, videoId));
        }
      });

      return { videoId };
    }),

  /**
   * Poll video generation status
   */
  getVideoStatus: protectedProcedure
    .input(z.object({ videoId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const rows = await db
        .select()
        .from(fullAvatarVideos)
        .where(eq(fullAvatarVideos.id, input.videoId))
        .limit(1);

      if (!rows.length || rows[0].userId !== ctx.user.id) {
        throw new Error("Video not found");
      }

      const v = rows[0];
      return {
        status: v.status,
        videoUrl: v.videoUrl ?? null,
        errorMessage: null as string | null,
      };
    }),

  /**
   * Identify clip moments for Reels/Shorts redistribution
   */
  generateClipTimestamps: protectedProcedure
    .input(
      z.object({
        script: z.string().min(50),
        estimatedMinutes: z.number().int().min(1).max(30),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a social media content strategist specializing in repurposing long-form video into short clips. Return JSON only.",
          },
          {
            role: "user",
            content: `Analyze this YouTube script and identify the 4-5 best moments to extract as 30-60 second Reels/Shorts clips.

Script (${input.estimatedMinutes} min total):
${input.script.substring(0, 3000)}

For each clip, identify the most shareable, standalone moments with a strong hook or surprising fact.

Return JSON:
{
  "clips": [
    {
      "title": "Short clip title for Reels",
      "hook": "First sentence / hook for the clip",
      "scriptExcerpt": "The exact 3-5 sentences from the script to use",
      "estimatedSeconds": 45,
      "suggestedCaption": "Instagram/TikTok caption with hashtags"
    }
  ]
}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "clip_timestamps",
            strict: true,
            schema: {
              type: "object",
              properties: {
                clips: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      hook: { type: "string" },
                      scriptExcerpt: { type: "string" },
                      estimatedSeconds: { type: "number" },
                      suggestedCaption: { type: "string" },
                    },
                    required: [
                      "title",
                      "hook",
                      "scriptExcerpt",
                      "estimatedSeconds",
                      "suggestedCaption",
                    ],
                    additionalProperties: false,
                  },
                },
              },
              required: ["clips"],
              additionalProperties: false,
            },
          },
        },
      });

      const raw = (response.choices[0]?.message?.content as string) ?? '{"clips":[]}';
      return JSON.parse(raw) as {
        clips: {
          title: string;
          hook: string;
          scriptExcerpt: string;
          estimatedSeconds: number;
          suggestedCaption: string;
        }[];
      };
    }),
});
