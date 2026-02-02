import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { renderAutoReel, getRenderStatus } from "../_core/videoRenderer";
import { generateAvatarIntro, getRemainingCredits } from "../lib/did-service";
import * as db from "../db";

const inputMethodEnum = z.enum(["bullets", "caption", "blog", "listing"]);
const videoLengthEnum = z.enum(["7", "15", "30"]);
const toneEnum = z.enum(["calm", "bold", "authoritative", "warm"]);

export const autoreelsRouter = router({
  /**
   * Generate content based on a topic/prompt using Authority Profile
   */
  generateContent: protectedProcedure
    .input(z.object({
      topic: z.string().min(1, "Topic is required"),
      inputMethod: inputMethodEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      const { topic, inputMethod } = input;
      
      // Get user's persona/authority profile
      const persona = await db.getPersonaByUserId(ctx.user.id);
      
      // Build context from Authority Profile
      let contextPrompt = "";
      if (persona) {
        if (persona.customerAvatar) {
          contextPrompt += `\nTarget Audience: ${persona.customerAvatar}`;
        }
        if (persona.brandValues) {
          contextPrompt += `\nBrand Values: ${persona.brandValues}`;
        }
        if (persona.marketContext) {
          contextPrompt += `\nMarket Context: ${persona.marketContext}`;
        }
      }
      
      // Generate content based on input method
      const contentTypeInstructions = {
        bullets: "Create 3-5 bullet points that can be used for a reel script. Each bullet should be a key point or tip.",
        caption: "Write a long-form caption (150-250 words) suitable for a social media post that will be turned into a reel.",
        blog: "Write a short blog-style paragraph (200-300 words) that explains the topic in depth.",
        listing: "Write a property listing-style description that highlights key features and benefits."
      };
      
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a real estate content strategist helping agents create authentic, authority-building content.${contextPrompt}\n\nCreate content that aligns with their target audience, brand values, and market context.`
          },
          {
            role: "user",
            content: `Topic: ${topic}\n\n${contentTypeInstructions[inputMethod]}\n\nMake it specific, valuable, and aligned with the agent's authority profile.`
          }
        ]
      });
      
      const content = response.choices[0].message.content;
      return { content: typeof content === 'string' ? content : "" };
    }),

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
        tone,
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

  /**
   * Generate AI avatar intro video
   */
  generateAvatarIntro: protectedProcedure
    .input(z.object({
      avatarImageUrl: z.string().url("Valid avatar image URL required"),
      introScript: z.string().min(1, "Intro script is required"),
      voiceId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { avatarImageUrl, introScript, voiceId } = input;
      
      try {
        const videoUrl = await generateAvatarIntro(
          avatarImageUrl,
          introScript,
          voiceId
        );
        
        return {
          success: true,
          videoUrl,
        };
      } catch (error: any) {
        throw new Error(`Failed to generate avatar intro: ${error.message}`);
      }
    }),

  /**
   * Get remaining D-ID credits
   */
  getDidCredits: protectedProcedure
    .query(async () => {
      try {
        const credits = await getRemainingCredits();
        return { credits };
      } catch (error: any) {
        throw new Error(`Failed to fetch D-ID credits: ${error.message}`);
      }
    }),

  /**
   * Get user's custom prompt templates
   */
  getCustomTemplates: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getCustomPromptTemplatesByUserId(ctx.user.id);
    }),

  /**
   * Create a new custom prompt template
   */
  createCustomTemplate: protectedProcedure
    .input(z.object({
      label: z.string().min(1, "Label is required").max(100),
      prompt: z.string().min(1, "Prompt is required"),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.createCustomPromptTemplate({
        userId: ctx.user.id,
        label: input.label,
        prompt: input.prompt,
      });
    }),

  /**
   * Update a custom prompt template
   */
  updateCustomTemplate: protectedProcedure
    .input(z.object({
      id: z.number(),
      label: z.string().min(1).max(100).optional(),
      prompt: z.string().min(1).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.updateCustomPromptTemplate(id, data);
    }),

  /**
   * Delete a custom prompt template
   */
  deleteCustomTemplate: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      return db.deleteCustomPromptTemplate(input.id);
    }),
});
