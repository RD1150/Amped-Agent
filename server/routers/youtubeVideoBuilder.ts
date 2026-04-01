/**
 * YouTube Video Builder Router
 * Generates long-form (5–15 min) avatar videos for YouTube distribution,
 * then auto-clips them into short-form Reels/Shorts segments.
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users, fullAvatarVideos, customAvatarTwins } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import {
  generateCustomAvatarVideo,
  waitForHeyGenVideo,
} from "../lib/heygen-service";
import { storagePut } from "../storage";

// ─── Topic categories for YouTube content ────────────────────────────────────
export const YOUTUBE_TOPICS = [
  { id: "market_update", label: "Monthly Market Update", emoji: "📊", description: "Local market stats, trends, and what it means for buyers/sellers" },
  { id: "buyer_guide", label: "Buyer's Guide", emoji: "🏠", description: "Step-by-step guide for first-time or repeat buyers" },
  { id: "seller_guide", label: "Seller's Guide", emoji: "💰", description: "How to prep, price, and sell your home for top dollar" },
  { id: "neighborhood_spotlight", label: "Neighborhood Spotlight", emoji: "📍", description: "Deep dive into a specific city or neighborhood" },
  { id: "investment_tips", label: "Investment Tips", emoji: "📈", description: "Real estate investing strategies for your local market" },
  { id: "mortgage_explainer", label: "Mortgage Explainer", emoji: "🏦", description: "Rates, types, and how to qualify — explained simply" },
  { id: "faq", label: "Real Estate FAQ", emoji: "❓", description: "Answer the top 10 questions clients always ask you" },
  { id: "year_in_review", label: "Year in Review", emoji: "🗓️", description: "Annual market recap and what to expect next year" },
  { id: "custom", label: "Custom Topic", emoji: "✏️", description: "Write your own topic and key points" },
] as const;

export type YouTubeTopic = typeof YOUTUBE_TOPICS[number]["id"];

// ─── Duration targets ─────────────────────────────────────────────────────────
const DURATION_TARGETS = {
  "5min": { label: "5 min", words: 700, seconds: 300 },
  "8min": { label: "8 min", words: 1100, seconds: 480 },
  "10min": { label: "10 min", words: 1400, seconds: 600 },
  "15min": { label: "15 min", words: 2100, seconds: 900 },
} as const;

type DurationTarget = keyof typeof DURATION_TARGETS;

function estimateDuration(script: string): number {
  const words = script.trim().split(/\s+/).length;
  return Math.round((words / 140) * 60); // ~140 wpm for on-camera delivery
}

export const youtubeVideoBuilderRouter = router({
  /**
   * Generate a long-form YouTube script using AI
   */
  generateScript: protectedProcedure
    .input(
      z.object({
        topic: z.string(),
        city: z.string().max(100).optional(),
        keyPoints: z.string().max(2000).optional(),
        agentName: z.string().max(100).optional(),
        targetDuration: z.enum(["5min", "8min", "10min", "15min"]).default("8min"),
        tone: z.enum(["professional", "conversational", "educational", "energetic"]).default("conversational"),
      })
    )
    .mutation(async ({ input }) => {
      const target = DURATION_TARGETS[input.targetDuration as DurationTarget];
      const cityContext = input.city ? ` in ${input.city}` : "";
      const agentName = input.agentName || "your local real estate expert";

      const systemPrompt = `You are a professional real estate YouTube scriptwriter specializing in long-form educational content.
Write scripts that are engaging, informative, and optimized for YouTube watch time.
The script should be delivered directly to camera by a real estate agent — conversational, warm, authoritative, and hyperlocal.
Structure the content with a strong hook (first 30 seconds), clear sections, and a compelling CTA at the end.
Do NOT include stage directions, scene descriptions, [PAUSE] markers, or section headers in the script.
Write ONLY the spoken words. Keep sentences short and natural for on-camera delivery.
The agent will be speaking directly to their audience — write in first person as the agent.`;

      const userPrompt = `Write a YouTube video script for a real estate agent named ${agentName}${cityContext}.

Topic: ${input.topic}
Target length: approximately ${target.words} words (${target.label} at on-camera delivery pace)
Tone: ${input.tone}
${input.keyPoints ? `Key points to cover:\n${input.keyPoints}` : ""}

Requirements:
- Open with a strong hook that grabs attention in the first 15 seconds (tease the value, not a generic greeting)
- Cover the topic thoroughly with specific, actionable insights${input.city ? ` for the ${input.city} market` : ""}
- Use natural transitions between points — no numbered lists, just flowing speech
- Include 2–3 moments where you directly address viewer pain points or questions
- End with a clear call to action (subscribe, comment, book a call, etc.)
- No hashtags, emojis, or stage directions — just the spoken words
- Write approximately ${target.words} words`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const script = response.choices?.[0]?.message?.content as string;
      if (!script) throw new Error("Script generation failed");

      const trimmed = script.trim();
      const wordCount = trimmed.split(/\s+/).length;
      const estimatedSeconds = estimateDuration(trimmed);

      return {
        script: trimmed,
        wordCount,
        estimatedSeconds,
        estimatedLabel: `~${Math.round(estimatedSeconds / 60)} min`,
      };
    }),

  /**
   * Generate SEO metadata (title, description, tags) for the YouTube video
   */
  generateSEO: protectedProcedure
    .input(
      z.object({
        script: z.string().min(100),
        city: z.string().max(100).optional(),
        topic: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const cityContext = input.city ? ` in ${input.city}` : "";

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a YouTube SEO expert specializing in real estate content. Generate optimized metadata that maximizes discoverability.",
          },
          {
            role: "user",
            content: `Generate YouTube SEO metadata for this real estate video${cityContext} about: ${input.topic}

Script excerpt (first 500 chars):
${input.script.slice(0, 500)}

Return JSON with:
- title: compelling YouTube title (max 70 chars, include city if provided)
- description: full YouTube description (300-500 words, include timestamps placeholder, links section, and hashtags at end)
- tags: array of 15 relevant tags (mix of broad and specific)
- chapters: array of {time: "0:00", title: "..."} for 4-6 chapter markers

Return ONLY valid JSON, no markdown.`,
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

      const content = response.choices?.[0]?.message?.content as string;
      if (!content) throw new Error("SEO generation failed");

      try {
        return JSON.parse(content);
      } catch {
        throw new Error("Failed to parse SEO metadata");
      }
    }),

  /**
   * Generate auto-clip timestamps for short-form redistribution
   */
  generateClipTimestamps: protectedProcedure
    .input(
      z.object({
        script: z.string().min(200),
        estimatedSeconds: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a video editor specializing in repurposing long-form content into short viral clips for social media.",
          },
          {
            role: "user",
            content: `Analyze this ${Math.round(input.estimatedSeconds / 60)}-minute real estate YouTube script and identify 4-5 segments that would make great standalone short-form clips (30–60 seconds each) for Instagram Reels, TikTok, and YouTube Shorts.

Script:
${input.script}

For each clip, identify:
- The exact opening sentence (so we can find it in the script)
- A compelling short-form title/hook
- Why it works as a standalone clip
- Estimated position in the video (as a percentage 0-100)

Return JSON array of clips. Return ONLY valid JSON.`,
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
                      openingSentence: { type: "string" },
                      title: { type: "string" },
                      reason: { type: "string" },
                      positionPercent: { type: "number" },
                    },
                    required: ["openingSentence", "title", "reason", "positionPercent"],
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

      const content = response.choices?.[0]?.message?.content as string;
      if (!content) throw new Error("Clip analysis failed");

      try {
        const parsed = JSON.parse(content);
        return parsed.clips as Array<{
          openingSentence: string;
          title: string;
          reason: string;
          positionPercent: number;
        }>;
      } catch {
        throw new Error("Failed to parse clip timestamps");
      }
    }),

  /**
   * Generate the full YouTube avatar video using HeyGen
   */
  generateVideo: protectedProcedure
    .input(
      z.object({
        script: z.string().min(100).max(15000),
        title: z.string().max(255).optional(),
        voiceId: z.string().optional().default("en-US-JennyNeural"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Premium gate
      const [userRow] = await db.select({ tier: users.subscriptionTier }).from(users).where(eq(users.id, ctx.user.id));
      const tier = userRow?.tier ?? "starter";
      if (tier !== "premium" && tier !== "pro") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "YouTube Video Builder is a Premium feature. Please upgrade to access this feature.",
        });
      }

      // Require trained custom avatar
      const [twin] = await db
        .select()
        .from(customAvatarTwins)
        .where(eq(customAvatarTwins.userId, ctx.user.id))
        .limit(1);

      if (!twin || twin.status !== "ready") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: twin
            ? twin.status === "training"
              ? "Your custom avatar is still training. Please wait a few minutes and try again."
              : "Your custom avatar training failed. Please retrain your digital twin."
            : "No custom avatar found. Please train your digital twin first in the Full Avatar Video section.",
        });
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);
      const duration = estimateDuration(input.script);

      // Store record
      const [record] = await db
        .insert(fullAvatarVideos)
        .values({
          userId: ctx.user.id,
          title: input.title || "YouTube Video",
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
        // Generate using HeyGen — landscape for YouTube
        const heygenVideoId = await generateCustomAvatarVideo({
          avatarId: twin.didAvatarId,
          script: input.script,
          voiceId: input.voiceId,
          title: input.title,
          landscape: true, // Always landscape for YouTube
        });

        await db
          .update(fullAvatarVideos)
          .set({ didTalkId: heygenVideoId })
          .where(eq(fullAvatarVideos.id, videoId));

        // Long timeout for long-form videos (30 min max)
        const heygenVideoUrl = await waitForHeyGenVideo(heygenVideoId, 1_800_000, 10_000);

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

        return {
          videoId,
          videoUrl: s3Url,
          duration,
          expiresAt: expiresAt.toISOString(),
        };
      } catch (err) {
        await db
          .update(fullAvatarVideos)
          .set({ status: "failed" })
          .where(eq(fullAvatarVideos.id, videoId));
        throw new Error(
          `YouTube video generation failed: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }),

  /**
   * List past YouTube videos for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select()
      .from(fullAvatarVideos)
      .where(eq(fullAvatarVideos.userId, ctx.user.id))
      .orderBy(desc(fullAvatarVideos.createdAt))
      .limit(20);
    // Filter to YouTube videos (landscape, longer duration)
    return rows
      .filter((r) => r.duration && r.duration > 240) // > 4 min = YouTube
      .map((r) => ({
        id: r.id,
        title: r.title,
        videoUrl: r.videoUrl,
        duration: r.duration,
        status: r.status,
        createdAt: r.createdAt,
        expiresAt: r.expiresAt,
      }));
  }),
});
