import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import * as db from "../db";
import { generatePostcardPdf } from "./postcardPdf";

/**
 * Auto-Repurpose Engine Router
 * Takes a single piece of content and generates platform-native versions
 * for LinkedIn, Instagram, Facebook, TikTok, Reel Script, and Postcard.
 * Each platform output is written in that platform's native style, tone,
 * length, and structure — not generic format buckets.
 */

const PLATFORMS = ["linkedin", "instagram", "facebook", "tiktok", "reelScript", "postcard"] as const;
type Platform = typeof PLATFORMS[number];

export const repurposeRouter = router({
  /**
   * Generate platform-native content for selected platforms from a single input.
   * Returns structured content for each selected platform.
   */
  repurposeContent: protectedProcedure
    .input(
      z.object({
        topic: z.string().min(3, "Topic is required"),
        body: z.string().min(10, "Content body is required"),
        platforms: z
          .array(z.enum(["linkedin", "instagram", "facebook", "tiktok", "reelScript", "postcard"]))
          .min(1, "Select at least one platform"),
        // Optional context
        agentName: z.string().optional(),
        city: z.string().optional(),
        targetAudience: z.string().optional(),
        cityIndex: z.number().int().min(0).optional(), // rotation index for multi-city agents
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { topic, body, platforms, agentName, city, targetAudience, cityIndex } = input;

      // Load persona for brand voice context
      const persona = await db.getPersonaByUserId(ctx.user.id);
      const name = agentName || persona?.agentName || "a real estate agent";
      // Use city rotation if no explicit city override is provided
      const location = city || (cityIndex !== undefined
        ? db.pickServiceCity(persona, cityIndex)
        : db.getServiceCitiesLabel(persona));
      const audience = targetAudience || persona?.targetAudience || "home buyers and sellers";
      const voice = persona?.brandVoice || "professional";

      const systemPrompt = `You are a platform-native content strategist for ${name}, a real estate agent in ${location}.
Brand voice: ${voice}. Target audience: ${audience}.

You deeply understand how content performs differently on each platform:
- LinkedIn: Professional thought leadership. Long-form. Personal story + insight + CTA. 3-5 hashtags max. No emojis.
- Instagram: Visual-first. Short punchy hook before "more". Natural emojis. 5-15 hashtags. Conversational.
- Facebook: Community-driven. Conversational tone. Questions drive engagement. Local market angle. Longer posts work.
- TikTok: Ultra-casual. Direct-to-camera. Pattern interrupts every 5-7 seconds. "POV:" and "Story time:" formats. Trending hooks.
- Reel Script: 30-60 second spoken script. Hook in first 3 seconds. Fast-paced. Written for Instagram/TikTok video.
- Postcard: Print-ready direct mail postcard. Bold front headline, short back body (2-3 sentences), clear CTA, agent tagline. Concise and punchy — every word earns its place.

You will only generate content for the platforms requested. Return ONLY valid JSON — no markdown fences, no extra text.`;

      // Build dynamic JSON schema based on selected platforms
      const schemaDescriptions: Record<string, string> = {
        linkedin: `{
    "hook": "Opening line that stops the scroll — bold statement or provocative question (1 sentence)",
    "body": "3-5 short paragraphs. Professional tone. Line breaks between paragraphs. Personal angle. End with a question to drive comments. 1200-1500 chars total.",
    "hashtags": ["#RealEstate", "#Homebuying", "#LocalMarket"]
  }`,
        instagram: `{
    "caption": "Full Instagram caption. Punchy hook first line (before 'more'). Natural emojis throughout. Conversational. End with a question or CTA. 150-300 chars before the fold.",
    "hashtags": ["#realestate", "#homebuying", "#[city]realestate"],
    "altText": "Image alt text description for accessibility (1 sentence)"
  }`,
        facebook: `{
    "post": "Full Facebook post. Conversational tone. Community-driven. Ask a question to spark comments. Local market angle. Can be longer (300-500 words works well here). No hashtag spam.",
    "engagementQuestion": "A standalone question to add as first comment to boost engagement"
  }`,
        tiktok: `{
    "hook": "First 3 seconds — ultra-casual, pattern interrupt (e.g. 'POV: You just lost a bidding war because of this one mistake')",
    "script": "Full TikTok script. Casual, direct-to-camera. Short sentences. Pattern interrupt every 5-7 seconds. Written like you're talking to one person. Include [PAUSE], [POINT TO CAMERA], [TEXT ON SCREEN: ...] cues.",
    "cta": "Closing CTA (e.g. 'Follow for more tips like this')",
    "hashtags": ["#realestate", "#fyp", "#realestatetips"]
  }`,
        reelScript: `{
    "hook": "First 3 seconds spoken hook — creates curiosity or shock",
    "script": "Full 30-60 second reel script with [PAUSE] and [VISUAL: description] cues. Fast-paced. Written for Instagram/TikTok video.",
    "cta": "Closing call to action",
    "captionHook": "First line of the caption to pair with this reel"
  }`,
        postcard: `{
    "headline": "Bold 6-10 word front headline that grabs attention — real estate insight, market stat, or compelling question",
    "subheadline": "1 short supporting line (optional, 8-12 words max)",
    "backBody": "2-3 sentence back-of-card message. Conversational, specific, and compelling. Leads into the CTA.",
    "cta": "Clear call-to-action (e.g. 'Scan to see your home's value', 'Call me today', 'Visit [website]')",
    "agentTagline": "Short memorable tagline for the agent (e.g. 'Your Neighborhood Expert', 'Trusted. Local. Results.')"
  }`,
      };

      const selectedSchemas = platforms
        .map((p) => `  "${p}": ${schemaDescriptions[p]}`)
        .join(",\n");

      const userPrompt = `Topic: "${topic}"
Content: "${body}"

Generate platform-native content for these platforms: ${platforms.join(", ")}.

Return this exact JSON structure (only include the requested platforms):
{
${selectedSchemas}
}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      });

      const raw =
        typeof response.choices[0].message.content === "string"
          ? response.choices[0].message.content
          : JSON.stringify(response.choices[0].message.content);

      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error("AI returned invalid JSON. Please try again.");
      }

      // Save to content_posts as a draft for reference
      await db.createContentPost({
        userId: ctx.user.id,
        title: `Repurposed: ${topic.substring(0, 80)}`,
        content: raw,
        contentType: "custom",
        format: "static_post",
        status: "draft",
        aiGenerated: true,
      });

      return {
        topic,
        platforms,
        linkedin: parsed.linkedin || null,
        instagram: parsed.instagram || null,
        facebook: parsed.facebook || null,
        tiktok: parsed.tiktok || null,
        reelScript: parsed.reelScript || null,
        postcard: parsed.postcard || null,
      };
    }),

  /**
   * Generate a print-ready 4x6 postcard PDF from postcard content.
   */
  generatePostcardPdf: protectedProcedure
    .input(
      z.object({
        headline: z.string().min(3),
        subheadline: z.string().optional(),
        backBody: z.string().min(10),
        cta: z.string().min(3),
        agentTagline: z.string().min(3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const persona = await db.getPersonaByUserId(ctx.user.id);
      const agent = {
        agentName: persona?.agentName || ctx.user.name || "Agent",
        brokerageName: persona?.brokerageName || persona?.brokerage || undefined,
        phoneNumber: persona?.phoneNumber || undefined,
        websiteUrl: persona?.websiteUrl || undefined,
        bookingUrl: persona?.bookingUrl || undefined,
        headshotUrl: persona?.headshotUrl || undefined,
        logoUrl: persona?.logoUrl || undefined,
        primaryCity: persona?.primaryCity || undefined,
        primaryColor: persona?.primaryColor || undefined,
      };
      const url = await generatePostcardPdf(input, agent, ctx.user.id);
      return { url };
    }),

  /**
   * Expand a topic/title into a 2-4 sentence content body for use in repurposing.
   */
  generateBody: protectedProcedure
    .input(
      z.object({
        topic: z.string().min(3, "Topic is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { topic } = input;
      const persona = await db.getPersonaByUserId(ctx.user.id);
      const name = persona?.agentName || "a real estate agent";
      const location = db.getServiceCitiesLabel(persona);
      const voice = persona?.brandVoice || "professional";
      const audience = persona?.targetAudience || "home buyers and sellers";

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a real estate content writer helping ${name} in ${location}. Brand voice: ${voice}. Audience: ${audience}. Write 2-4 sentences expanding a topic into a concise content body for social media repurposing. Be specific, actionable, and engaging. No hashtags, no emojis, no fluff.`,
          },
          {
            role: "user",
            content: `Expand this topic into 2-4 sentences of content body: "${topic}"`,
          },
        ],
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("Failed to generate content body");
      }
      return { body: content.trim() };
    }),
});
