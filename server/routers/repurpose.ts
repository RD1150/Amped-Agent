import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import * as db from "../db";

/**
 * Auto-Repurpose Engine Router
 * Takes a single piece of content (topic + body) and generates 5 platform-optimized
 * formats simultaneously: carousel slides, reel script, newsletter section,
 * Google Business Profile post, and LinkedIn article intro.
 */

export const repurposeRouter = router({
  /**
   * Generate all 5 repurposed formats from a single input.
   * Returns structured content for each format.
   */
  repurposeContent: protectedProcedure
    .input(
      z.object({
        topic: z.string().min(3, "Topic is required"),
        body: z.string().min(10, "Content body is required"),
        // Optional context
        agentName: z.string().optional(),
        city: z.string().optional(),
        targetAudience: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { topic, body, agentName, city, targetAudience } = input;

      // Load persona for brand voice context
      const persona = await db.getPersonaByUserId(ctx.user.id);
      const name = agentName || persona?.agentName || "your agent";
      const location = city || persona?.primaryCity || "your area";
      const audience = targetAudience || persona?.targetAudience || "home buyers and sellers";
      const voice = persona?.brandVoice || "professional";

      const systemPrompt = `You are a real estate content strategist helping ${name}, a real estate agent in ${location}. 
Their brand voice is ${voice}. Their target audience is ${audience}.
You will repurpose a single piece of content into 5 platform-optimized formats.
Return ONLY valid JSON matching the exact schema provided — no markdown fences, no extra text.`;

      const userPrompt = `Topic: "${topic}"
Content: "${body}"

Repurpose this into 5 formats. Return this exact JSON structure:
{
  "carousel": {
    "slides": [
      { "slideNumber": 1, "headline": "Cover slide headline (max 8 words)", "body": "1-2 sentences of content" },
      { "slideNumber": 2, "headline": "...", "body": "..." },
      { "slideNumber": 3, "headline": "...", "body": "..." },
      { "slideNumber": 4, "headline": "...", "body": "..." },
      { "slideNumber": 5, "headline": "...", "body": "..." },
      { "slideNumber": 6, "headline": "...", "body": "..." },
      { "slideNumber": 7, "headline": "CTA slide headline", "body": "Call to action text" }
    ],
    "caption": "Instagram/Facebook caption with hook + 3-5 hashtags"
  },
  "reelScript": {
    "hook": "First 3 seconds spoken hook (creates curiosity or shock)",
    "script": "Full 30-60 second reel script with [PAUSE] and [VISUAL: description] cues",
    "cta": "Closing call to action"
  },
  "newsletter": {
    "subjectLine": "Email subject line (max 60 chars, curiosity-driven)",
    "previewText": "Preview text (max 90 chars)",
    "body": "2-3 paragraph newsletter section in a conversational tone. Include a personal angle and end with a soft CTA."
  },
  "gbpPost": {
    "text": "Google Business Profile post (max 1500 chars). Professional, local, includes a clear CTA and contact prompt.",
    "callToAction": "CALL | BOOK | LEARN_MORE | SIGN_UP | ORDER | SHOP | GET_OFFER"
  },
  "linkedin": {
    "hook": "Opening line that stops the scroll (question or bold statement)",
    "body": "3-5 short paragraphs. Professional tone. Use line breaks. End with a question to drive comments.",
    "hashtags": ["#RealEstate", "#Homebuying", "#LocalMarket"]
  }
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
        carousel: parsed.carousel,
        reelScript: parsed.reelScript,
        newsletter: parsed.newsletter,
        gbpPost: parsed.gbpPost,
        linkedin: parsed.linkedin,
      };
    }),
});
