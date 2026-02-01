import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { renderAutoReel, getRenderStatus } from "../_core/videoRenderer";

const inputMethodEnum = z.enum(["bullets", "caption", "blog", "listing"]);
const videoLengthEnum = z.enum(["7", "15", "30"]);
const toneEnum = z.enum(["calm", "bold", "authoritative", "warm"]);

export const autoreelsRouter = router({
  /**
   * Generate hooks, script, and caption for a reel
   */
  generate: protectedProcedure
    .input(z.object({
      inputText: z.string().min(1, "Content is required"),
      inputMethod: inputMethodEnum,
      videoLength: videoLengthEnum,
      tone: toneEnum,
      niche: z.string().default("real estate"),
    }))
    .mutation(async ({ input }) => {
      const { inputText, inputMethod, videoLength, tone, niche } = input;

      // Determine content type description
      const contentTypeDescriptions = {
        bullets: "bullet points",
        caption: "long-form caption",
        blog: "blog post or article",
        listing: "property listing description"
      };

      const toneDescriptions = {
        calm: "calm, soothing, and reassuring",
        bold: "bold, confident, and attention-grabbing",
        authoritative: "authoritative, expert, and trustworthy",
        warm: "warm, friendly, and approachable"
      };

      // Step 1: Generate 3 hook options
      const hooksResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert social media copywriter specializing in ${niche} content. Your job is to create scroll-stopping hooks for short-form vertical videos (Reels, TikTok, Shorts).

A great hook:
- Stops the scroll in the first 2 seconds
- Creates curiosity or urgency
- Is short (under 10 words)
- Speaks directly to the target audience
- Uses power words and emotional triggers

The tone should be: ${toneDescriptions[tone]}`
          },
          {
            role: "user",
            content: `Create 3 different scroll-stopping hooks for a ${videoLength}-second ${niche} video based on these ${contentTypeDescriptions[inputMethod]}:

${inputText}

Return ONLY the 3 hooks, one per line, numbered 1-3. No additional explanation.`
          }
        ]
      });

      const hooksContent = hooksResponse.choices[0].message.content;
      const hooksText = typeof hooksContent === 'string' ? hooksContent : "";
      const hooks = hooksText
        .split("\n")
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, "").trim())
        .filter(line => line.length > 0)
        .slice(0, 3);

      // Step 2: Generate script
      const scriptResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert scriptwriter for short-form vertical videos. Your scripts are:
- Conversational and natural (not robotic)
- Written in short, punchy sentences (perfect for subtitles)
- ${videoLength} seconds when read aloud (approximately ${Math.floor(parseInt(videoLength) * 2.5)} words)
- Engaging and valuable
- Tone: ${toneDescriptions[tone]}

Write scripts that sound like a real person talking, not reading from a teleprompter.`
          },
          {
            role: "user",
            content: `Write a ${videoLength}-second script for a ${niche} video based on this content:

${inputText}

The hook will be: "${hooks[0]}"

Write ONLY the script body (not including the hook). Keep it conversational and perfect for subtitle display. No stage directions or formatting.`
          }
        ]
      });

      const scriptContent = scriptResponse.choices[0].message.content;
      const script = typeof scriptContent === 'string' ? scriptContent.trim() : "";

      // Step 3: Generate caption with CTA
      const captionResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert Instagram caption writer for ${niche} professionals. Your captions are:
- Instagram-ready (2-4 short paragraphs)
- Include relevant emojis (but not excessive)
- End with a clear call-to-action
- Engaging and authentic
- Tone: ${toneDescriptions[tone]}
- NO HASHTAGS (keep it clean)

CTA options to choose from:
- "Follow for more [topic] tips"
- "DM me 'INFO' to learn more"
- "Save this for later"
- "Share this with someone who needs to see it"
- "Comment [word] below for [resource]"`
          },
          {
            role: "user",
            content: `Write an Instagram caption for this ${niche} video:

Hook: "${hooks[0]}"
Script: "${script}"

Original content:
${inputText}

Write a caption that expands on the video content and includes a strong CTA. NO HASHTAGS.`
          }
        ]
      });

      const captionContent = captionResponse.choices[0].message.content;
      const caption = typeof captionContent === 'string' ? captionContent.trim() : "";

      return {
        hooks,
        script,
        caption,
        selectedHook: hooks[0]
      };
    }),

  /**
   * Regenerate with different parameters (same as generate)
   */
  regenerate: protectedProcedure
    .input(z.object({
      inputText: z.string().min(1),
      inputMethod: inputMethodEnum,
      videoLength: videoLengthEnum,
      tone: toneEnum,
      niche: z.string().default("real estate"),
    }))
    .mutation(async ({ input }) => {
      // Regenerate uses the same logic as generate
      const { inputText, inputMethod, videoLength, tone, niche } = input;

      const contentTypeDescriptions = {
        bullets: "bullet points",
        caption: "long-form caption",
        blog: "blog post or article",
        listing: "property listing description"
      };

      const toneDescriptions = {
        calm: "calm, soothing, and reassuring",
        bold: "bold, confident, and attention-grabbing",
        authoritative: "authoritative, expert, and trustworthy",
        warm: "warm, friendly, and approachable"
      };

      const hooksResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert social media copywriter specializing in ${niche} content. Your job is to create scroll-stopping hooks for short-form vertical videos (Reels, TikTok, Shorts).

A great hook:
- Stops the scroll in the first 2 seconds
- Creates curiosity or urgency
- Is short (under 10 words)
- Speaks directly to the target audience
- Uses power words and emotional triggers

The tone should be: ${toneDescriptions[tone]}`
          },
          {
            role: "user",
            content: `Create 3 different scroll-stopping hooks for a ${videoLength}-second ${niche} video based on these ${contentTypeDescriptions[inputMethod]}:

${inputText}

Return ONLY the 3 hooks, one per line, numbered 1-3. No additional explanation.`
          }
        ]
      });

      const hooksContent = hooksResponse.choices[0].message.content;
      const hooksText = typeof hooksContent === 'string' ? hooksContent : "";
      const hooks = hooksText
        .split("\n")
        .filter((line: string) => line.trim())
        .map((line: string) => line.replace(/^\d+\.\s*/, "").trim())
        .filter((line: string) => line.length > 0)
        .slice(0, 3);

      const scriptResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert scriptwriter for short-form vertical videos. Your scripts are:
- Conversational and natural (not robotic)
- Written in short, punchy sentences (perfect for subtitles)
- ${videoLength} seconds when read aloud (approximately ${Math.floor(parseInt(videoLength) * 2.5)} words)
- Engaging and valuable
- Tone: ${toneDescriptions[tone]}

Write scripts that sound like a real person talking, not reading from a teleprompter.`
          },
          {
            role: "user",
            content: `Write a ${videoLength}-second script for a ${niche} video based on this content:

${inputText}

The hook will be: "${hooks[0]}"

Write ONLY the script body (not including the hook). Keep it conversational and perfect for subtitle display. No stage directions or formatting.`
          }
        ]
      });

      const scriptContent = scriptResponse.choices[0].message.content;
      const script = typeof scriptContent === 'string' ? scriptContent.trim() : "";

      const captionResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert Instagram caption writer for ${niche} professionals. Your captions are:
- Instagram-ready (2-4 short paragraphs)
- Include relevant emojis (but not excessive)
- End with a clear call-to-action
- Engaging and authentic
- Tone: ${toneDescriptions[tone]}
- NO HASHTAGS (keep it clean)

CTA options to choose from:
- "Follow for more [topic] tips"
- "DM me 'INFO' to learn more"
- "Save this for later"
- "Share this with someone who needs to see it"
- "Comment [word] below for [resource]"`
          },
          {
            role: "user",
            content: `Write an Instagram caption for this ${niche} video:

Hook: "${hooks[0]}"
Script: "${script}"

Original content:
${inputText}

Write a caption that expands on the video content and includes a strong CTA. NO HASHTAGS.`
          }
        ]
      });

      const captionContent = captionResponse.choices[0].message.content;
      const caption = typeof captionContent === 'string' ? captionContent.trim() : "";

      return {
        hooks,
        script,
        caption,
        selectedHook: hooks[0]
      };
    }),

  /**
   * Render video with hook, script, and subtitles
   */
  renderVideo: protectedProcedure
    .input(z.object({
      hook: z.string().min(1),
      script: z.string().min(1),
      videoLength: videoLengthEnum,
      tone: toneEnum,
    }))
    .mutation(async ({ input }) => {
      const { hook, script, videoLength, tone } = input;
      
      const result = await renderAutoReel({
        hook,
        script,
        videoLength: parseInt(videoLength),
        tone
      });
      
      return result;
    }),

  /**
   * Check video render status
   */
  checkRenderStatus: protectedProcedure
    .input(z.object({
      renderId: z.string().min(1),
    }))
    .query(async ({ input }) => {
      const { renderId } = input;
      const result = await getRenderStatus(renderId);
      return result;
    }),
});
