import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { moderateContent } from "../_core/contentModeration";
import { renderAutoReel, getRenderStatus } from "../_core/videoRenderer";
import { generateAvatarIntro, getRemainingCredits } from "../lib/did-service";
import * as db from "../db";

const inputMethodEnum = z.enum(["bullets", "caption", "blog", "listing"]);
const videoLengthEnum = z.enum(["30", "60"]);
const toneEnum = z.enum(["calm", "bold", "authoritative", "warm"]);
const depthEnum = z.enum(["standard", "deep"]).default("standard");

/**
 * Build persona context string from an agent's Authority Profile.
 * Used to inject local market, audience, and brand context into every LLM call.
 */
function buildPersonaContext(persona: Awaited<ReturnType<typeof db.getPersonaByUserId>>): { contextBlock: string; city: string; audienceType: string } {
  let contextBlock = "";
  let city = "";
  let audienceType = "";

  if (!persona) return { contextBlock, city, audienceType };

  if (persona.primaryCity) {
    city = persona.primaryCity;
    contextBlock += `\nAgent's Primary Market: ${persona.primaryCity}`;
  }
  if (persona.agentName) contextBlock += `\nAgent Name: ${persona.agentName}`;
  if (persona.brokerageName) contextBlock += `\nBrokerage: ${persona.brokerageName}`;
  if (persona.tagline) contextBlock += `\nAgent Tagline: ${persona.tagline}`;
  if (persona.brandValues) contextBlock += `\nBrand Values: ${persona.brandValues}`;
  if (persona.marketContext) contextBlock += `\nMarket Context: ${persona.marketContext}`;

  if (persona.customerAvatar) {
    try {
      const avatarObj = JSON.parse(persona.customerAvatar);
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
      if (avatarObj.type) {
        audienceType = audienceLabels[avatarObj.type] || avatarObj.type;
        contextBlock += `\nTarget Audience: ${audienceType}`;
        if (avatarObj.description) contextBlock += `\nAudience Profile: ${avatarObj.description}`;
        if (audienceToneGuide[avatarObj.type]) contextBlock += `\nAudience Tone Guidance: ${audienceToneGuide[avatarObj.type]}`;
      }
    } catch {
      contextBlock += `\nTarget Audience: ${persona.customerAvatar}`;
    }
  }

  return { contextBlock, city, audienceType };
}

export const autoreelsRouter = router({
  /**
   * Generate content based on a topic/prompt using Authority Profile
   */
  generateContent: protectedProcedure
    .input(z.object({
      topic: z.string().min(1, "Topic is required"),
      inputMethod: inputMethodEnum,
      city: z.string().optional(), // For market update topics: pull live data
    }))
    .mutation(async ({ ctx, input }) => {
      const { topic, inputMethod } = input;
      
      // Moderate input content
      const moderation = await moderateContent(topic, true);
      if (!moderation.allowed) {
        throw new Error(`Content moderation: ${moderation.reason}`);
      }
      
      // Get user's persona/authority profile
      const persona = await db.getPersonaByUserId(ctx.user.id);
      
      // Build context from Authority Profile
      let contextPrompt = "";
      if (persona) {
        if (persona.customerAvatar) {
          try {
            const avatarObj = JSON.parse(persona.customerAvatar);
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
            if (avatarObj.type) {
              contextPrompt += `\nTarget Audience: ${audienceLabels[avatarObj.type] || avatarObj.type}`;
              if (avatarObj.description) contextPrompt += `\nAudience Profile: ${avatarObj.description}`;
              if (audienceToneGuide[avatarObj.type]) contextPrompt += `\nTone Guidance: ${audienceToneGuide[avatarObj.type]}`;
            }
          } catch {
            contextPrompt += `\nTarget Audience: ${persona.customerAvatar}`;
          }
        }
        if (persona.brandValues) {
          contextPrompt += `\nBrand Values: ${persona.brandValues}`;
        }
        if (persona.marketContext) {
          contextPrompt += `\nMarket Context: ${persona.marketContext}`;
        }
      }
      
      // Fetch live market data if topic is market-related and city is provided
      let marketDataBlock = "";
      const isMarketTopic = /market|price|inventory|listing|rate|sold|buyer|seller/i.test(topic);
      if (isMarketTopic && input.city) {
        try {
          const { getMarketData } = await import("../marketStatsHelper");
          const md = await getMarketData(input.city);
          marketDataBlock = `\n\nLIVE MARKET DATA for ${md.location} (use these exact numbers — do not invent statistics):
- Median Home Price: $${md.medianPrice.toLocaleString()} (${md.priceChange > 0 ? "+" : ""}${md.priceChange}% YoY)
- Days on Market: ${md.daysOnMarket} days
- Active Listings: ${md.activeListings.toLocaleString()} (${md.listingsChange > 0 ? "+" : ""}${md.listingsChange}% YoY)
- Price per Sq Ft: $${md.pricePerSqft}
- Market Condition: ${md.marketTemperature === "hot" ? "Seller's Market" : md.marketTemperature === "cold" ? "Buyer's Market" : "Balanced Market"}`;
          console.log(`[AutoReels] Fetched live market data for ${input.city}`);
        } catch (err) {
          console.warn("[AutoReels] Could not fetch market data:", err);
        }
      }

      // Generate content based on input method
      const contentTypeInstructions = {
        bullets: "Create 4-6 bullet points for a reel script. Each bullet must be a specific, concrete insight — not a generic tip. Include real numbers, local references, or named scenarios wherever possible. Avoid vague advice like 'work with a professional' or 'do your research'.",
        caption: "Write a long-form caption (200-300 words) for a social media post that will become a reel. Go deep: include specific data points, local market context, named neighborhoods or price ranges, and a clear opinion or insight that only a local expert would know. Avoid generic real estate advice.",
        blog: "Write a substantive blog-style piece (300-450 words) that goes beyond surface-level advice. Include specific local market context, concrete numbers, real scenarios, and an expert opinion or prediction. This should read like something only a local expert with real experience would write — not a generic real estate article.",
        listing: "Write a compelling property description that goes beyond standard features. Include neighborhood context, lifestyle benefits, proximity to specific local landmarks or amenities, and a clear picture of who this home is perfect for."
      };
      
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a real estate content strategist helping agents create authentic, authority-building content that positions them as the definitive local expert.${contextPrompt}\n\nRules:\n- NEVER write generic advice (e.g., "work with a professional", "do your research", "the market is changing")\n- ALWAYS include specific details: price ranges, neighborhood names, local landmarks, concrete timelines, real numbers\n- Write as if you are the agent speaking directly to their specific audience in their specific market\n- Every sentence should contain information that only a local expert would know`
          },
          {
            role: "user",
            content: `Topic: ${topic}${marketDataBlock}\n\n${contentTypeInstructions[inputMethod]}\n\nMake it hyperlocal, specific, and deeply valuable.${marketDataBlock ? " Use the LIVE MARKET DATA numbers above — do not invent statistics." : ""}`
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
      depth: depthEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      const { inputText, inputMethod, videoLength, tone, niche, depth } = input;

      // Load persona for context injection
      const persona = await db.getPersonaByUserId(ctx.user.id);
      const { contextBlock, city, audienceType } = buildPersonaContext(persona);
      
      // Moderate input content
      const moderation = await moderateContent(inputText, true);
      if (!moderation.allowed) {
        throw new Error(`Content moderation: ${moderation.reason}`);
      }
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
      // Build depth-aware context strings
      const locationRef = city || "this market";
      const audienceRef = audienceType || "your audience";
      // Build local highlights instruction block
      const highlightsBlock = highlights.length > 0
        ? `\n\nLOCAL HIGHLIGHTS — naturally weave at least 1-2 of these into the content where relevant:\n${highlights.map(h => `- ${h}`).join("\n")}`
        : "";
      const depthInstructions = depth === "deep"
        ? `\n\nDEEP DIVE MODE — MANDATORY RULES:\n- Reference specific neighborhoods, zip codes, or streets in ${locationRef} by name\n- Include concrete price ranges, percentages, or timeframes (e.g. "homes under $450K", "3-4 weeks", "12% below asking")\n- Name real local dynamics: school districts, commute corridors, development projects, seasonal patterns\n- Share an expert opinion or contrarian take that only a local agent with real experience would know\n- Avoid ANY generic advice ("work with a professional", "the market is changing", "do your research")\n- Every sentence must contain information that could not have been written by someone who doesn't know ${locationRef}`
        : "";
      const personaSystemAddition = contextBlock
        ? `\n\nAGENT CONTEXT (use this to personalize every output):\n${contextBlock}${highlightsBlock}`
        : highlightsBlock ? `\n\nLOCAL CONTEXT:${highlightsBlock}` : "";

      // Build depth-aware context strings
      const locationRef = city || "this market";
      const audienceRef = audienceType || "your audience";

      const depthInstructions = depth === "deep"
        ? `\n\nDEEP DIVE MODE — MANDATORY RULES:\n- Reference specific neighborhoods, zip codes, or streets in ${locationRef} by name\n- Include concrete price ranges, percentages, or timeframes (e.g. "homes under $450K", "3-4 weeks", "12% below asking")\n- Name real local dynamics: school districts, commute corridors, development projects, seasonal patterns\n- Share an expert opinion or contrarian take that only a local agent with real experience would know\n- Avoid ANY generic advice ("work with a professional", "the market is changing", "do your research")\n- Every sentence must contain information that could not have been written by someone who doesn't know ${locationRef}`
        : "";

      const personaSystemAddition = contextBlock
        ? `\n\nAGENT CONTEXT (use this to personalize every output):\n${contextBlock}`
        : "";

      // Step 1: Generate 3 hook options
      const hooksResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert social media copywriter specializing in ${niche} content for real estate agents. Your job is to create scroll-stopping hooks for short-form vertical videos (Reels, TikTok, Shorts) that drive LEADS — not just views.${personaSystemAddition}

Your PRIMARY GOAL: Get viewers to comment, DM, or click for more information.

A great hook:
- Stops the scroll in the first 2 seconds with a bold statement, question, or pattern interrupt
- Creates curiosity, urgency, or FOMO
- Is short and punchy (under 12 words)
- Speaks directly to ${audienceRef}'s pain points or desires
- Uses power words, numbers, or emotional triggers
- Avoids generic openers like "Did you know" or "Here's why"

Hook formulas that GENERATE LEADS:
- "[Number] [mistake/secret/insight] about [topic in ${locationRef}] — DM me before you [action]"
- "Stop [doing X] if you want [outcome] in ${locationRef} — comment [word] for the full breakdown"
- "Why [surprising local fact] is happening right now — ${audienceRef} need to see this"
- "[Controversial local opinion] — most agents won't tell you this"
- "[Specific local stat or scenario] — here's what it actually means for you"

The tone should be: ${toneDescriptions[tone]}${depthInstructions}`
          },
          {
            role: "user",
            content: `Create 3 different scroll-stopping hooks for a ${videoLength}-second ${niche} video based on these ${contentTypeDescriptions[inputMethod]}:\n\n${inputText}\n\nReturn ONLY the 3 hooks, one per line, numbered 1-3. No additional explanation.`
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
      const wordTarget = Math.floor(parseInt(videoLength) * 2.5);
      const scriptResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert scriptwriter for short-form vertical videos. You write for real estate agents who want to be seen as the definitive local authority.${personaSystemAddition}

Script requirements:
- Conversational and natural — sounds like a real person talking, not a teleprompter
- Short, punchy sentences (ideal for subtitle display)
- Target length: ~${wordTarget} words (${videoLength} seconds at natural speaking pace)
- Tone: ${toneDescriptions[tone]}
- Do NOT include the hook (it will be prepended separately)
- Do NOT include stage directions, formatting, or section labels

${depth === "deep" ? `DEEP DIVE MODE — every line must earn its place:\n- Name specific neighborhoods, streets, or landmarks in ${locationRef}\n- Use real numbers: price ranges, days on market, percentages, timelines\n- Include at least one insight that only a local expert would know\n- End with a clear, specific call to action tied to the topic\n- Zero generic filler — if a sentence could appear in any real estate video anywhere, cut it` : `Make every sentence specific and valuable. Avoid generic advice. Include at least one concrete detail (number, local reference, or specific scenario) that makes this feel local and expert.`}`
          },
          {
            role: "user",
            content: `Write a ${videoLength}-second script body for a ${niche} video based on this content:\n\n${inputText}\n\nThe hook will be: "${hooks[0]}"\n\nWrite ONLY the script body. No hook, no stage directions, no formatting.`
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
            content: `You are an expert Instagram caption writer for ${niche} professionals.${personaSystemAddition}

Caption requirements:
- 2-4 short paragraphs, Instagram-ready
- Relevant emojis (not excessive)
- End with a strong, specific call-to-action
- Tone: ${toneDescriptions[tone]}
- NO HASHTAGS
- Expand on the video with additional depth — the caption should add value beyond what's in the script
${depth === "deep" ? `- Include at least one specific local detail (neighborhood, price range, local stat) not mentioned in the script\n- CTA should be specific: not just "DM me" but "DM me '[keyword]' and I'll send you [specific resource]"` : ""}

CTA options:
- "DM me '[keyword]' for [specific resource]"
- "Follow for weekly ${locationRef} market updates"
- "Save this — you'll need it when [specific scenario]"
- "Tag someone who's [doing X in locationRef]"
- "Comment '[word]' below and I'll send you [specific thing]"`
          },
          {
            role: "user",
            content: `Write an Instagram caption for this ${niche} video:\n\nHook: "${hooks[0]}"\nScript: "${script}"\n\nOriginal content:\n${inputText}\n\nWrite a caption that adds depth beyond the video. NO HASHTAGS.`
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
      depth: depthEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      // Regenerate uses the same upgraded logic as generate
      const { inputText, inputMethod, videoLength, tone, niche, depth } = input;
      
      // Moderate input content
      const moderation = await moderateContent(inputText, true);
      if (!moderation.allowed) {
        throw new Error(`Content moderation: ${moderation.reason}`);
      }

      // Load persona for context injection
      const persona = await db.getPersonaByUserId(ctx.user.id);
      const { contextBlock, city, audienceType } = buildPersonaContext(persona);

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
      const locationRef = city || "this market";
      const audienceRef = audienceType || "your audience";
      // Build local highlights instruction block
      const highlightsBlock = highlights.length > 0
        ? `\n\nLOCAL HIGHLIGHTS — naturally weave at least 1-2 of these into the content where relevant:\n${highlights.map((h: string) => `- ${h}`).join("\n")}`
        : "";
      const depthInstructions = depth === "deep"
        ? `\n\nDEEP DIVE MODE — MANDATORY RULES:\n- Reference specific neighborhoods, zip codes, or streets in ${locationRef} by name\n- Include concrete price ranges, percentages, or timeframes\n- Name real local dynamics: school districts, commute corridors, development projects, seasonal patterns\n- Share an expert opinion or contrarian take that only a local agent with real experience would know\n- Avoid ANY generic advice\n- Every sentence must contain information that could not have been written by someone who doesn't know ${locationRef}`
        : "";
      const personaSystemAddition = contextBlock
        ? `\n\nAGENT CONTEXT (use this to personalize every output):\n${contextBlock}${highlightsBlock}`
        : highlightsBlock ? `\n\nLOCAL CONTEXT:${highlightsBlock}` : "";

      const locationRef = city || "this market";
      const audienceRef = audienceType || "your audience";

      const depthInstructions = depth === "deep"
        ? `\n\nDEEP DIVE MODE — MANDATORY RULES:\n- Reference specific neighborhoods, zip codes, or streets in ${locationRef} by name\n- Include concrete price ranges, percentages, or timeframes\n- Name real local dynamics: school districts, commute corridors, development projects, seasonal patterns\n- Share an expert opinion or contrarian take that only a local agent with real experience would know\n- Avoid ANY generic advice\n- Every sentence must contain information that could not have been written by someone who doesn't know ${locationRef}`
        : "";

      const personaSystemAddition = contextBlock
        ? `\n\nAGENT CONTEXT (use this to personalize every output):\n${contextBlock}`
        : "";

      const hooksResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert social media copywriter specializing in ${niche} content for real estate agents. Your job is to create scroll-stopping hooks for short-form vertical videos that drive LEADS.${personaSystemAddition}\n\nSpeak directly to ${audienceRef}. Use specific references to ${locationRef} when possible.\n\nHook formulas:\n- "[Number] [mistake/secret/insight] about [topic in ${locationRef}] — DM me before you [action]"\n- "Stop [doing X] if you want [outcome] in ${locationRef}"\n- "Why [surprising local fact] is happening right now"\n- "[Controversial local opinion] — most agents won't tell you this"\n- "[Specific local stat] — here's what it actually means for you"\n\nTone: ${toneDescriptions[tone]}${depthInstructions}`
          },
          {
            role: "user",
            content: `Create 3 DIFFERENT scroll-stopping hooks for a ${videoLength}-second ${niche} video based on these ${contentTypeDescriptions[inputMethod]}:\n\n${inputText}\n\nReturn ONLY the 3 hooks, one per line, numbered 1-3. No additional explanation.`
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

      const wordTarget = Math.floor(parseInt(videoLength) * 2.5);
      const scriptResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert scriptwriter for short-form vertical videos for real estate agents.${personaSystemAddition}\n\nScript requirements:\n- Conversational and natural — sounds like a real person talking\n- Short, punchy sentences (ideal for subtitle display)\n- Target length: ~${wordTarget} words (${videoLength} seconds)\n- Tone: ${toneDescriptions[tone]}\n- Do NOT include the hook\n- Do NOT include stage directions or formatting\n\n${depth === "deep" ? `DEEP DIVE MODE:\n- Name specific neighborhoods, streets, or landmarks in ${locationRef}\n- Use real numbers: price ranges, days on market, percentages, timelines\n- Include at least one insight that only a local expert would know\n- End with a specific call to action tied to the topic\n- Zero generic filler` : `Include at least one concrete detail (number, local reference, or specific scenario) that makes this feel local and expert.`}`
          },
          {
            role: "user",
            content: `Write a ${videoLength}-second script body for a ${niche} video based on this content:\n\n${inputText}\n\nThe hook will be: "${hooks[0]}"\n\nWrite ONLY the script body. No hook, no stage directions, no formatting.`
          }
        ]
      });

      const scriptContent = scriptResponse.choices[0].message.content;
      const script = typeof scriptContent === 'string' ? scriptContent.trim() : "";

      const captionResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert Instagram caption writer for ${niche} professionals.${personaSystemAddition}\n\nCaption requirements:\n- 2-4 short paragraphs, Instagram-ready\n- Relevant emojis (not excessive)\n- End with a strong, specific call-to-action\n- Tone: ${toneDescriptions[tone]}\n- NO HASHTAGS\n- Expand on the video with additional depth\n${depth === "deep" ? `- Include at least one specific local detail not in the script\n- CTA should be specific: "DM me '[keyword]' and I'll send you [specific resource]"` : ""}`
          },
          {
            role: "user",
            content: `Write an Instagram caption for this ${niche} video:\n\nHook: "${hooks[0]}"\nScript: "${script}"\n\nOriginal content:\n${inputText}\n\nWrite a caption that adds depth beyond the video. NO HASHTAGS.`
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
      caption: z.string().optional(),
      videoLength: videoLengthEnum,
      tone: toneEnum,
      enableVoiceover: z.boolean().optional().default(false),
      voiceId: z.string().optional(),
      voiceoverStyle: z.enum(["professional", "warm", "luxury", "casual"]).optional().default("professional"),
      backgroundImages: z.array(z.string().url()).max(4).optional(),
      captionsEnabled: z.boolean().optional().default(true),
      captionSize: z.enum(["normal", "large"]).optional().default("normal"),
      captionStyle: z.enum(["white", "yellow", "gold", "none"]).optional().default("white"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { hook, script, caption, videoLength, tone, enableVoiceover, voiceId, voiceoverStyle, backgroundImages, captionsEnabled, captionSize, captionStyle } = input;

      // Check monthly free pool (deducts slots or overage credits)
      const { checkAndDeductVideoPool } = await import("../credits");
      const reelPoolResult = await checkAndDeductVideoPool(ctx.user.id, 'ken-burns');
      if (!reelPoolResult.allowed) {
        throw new Error(reelPoolResult.reason);
      }

      // Voice-over is always free — no additional credit deduction
      try {
        console.log('[renderVideo] Starting video render with params:', {
          hook: hook.substring(0, 50),
          scriptLength: script.length,
          videoLength,
          tone,
          enableVoiceover,
          voiceoverStyle,
        });

        // Generate voiceover audio if requested
        let voiceoverAudioUrl: string | undefined;
        let voiceAlignment: import("../_core/elevenLabs").WordAlignment[] | undefined;
        if (enableVoiceover) {
          try {
            const { textToSpeechWithTimestamps } = await import("../_core/elevenLabs");
            const { storagePut } = await import("../storage");
            const fullScript = `${hook}. ${script}`;
            const { audioBuffer, alignment } = await textToSpeechWithTimestamps({
              text: fullScript,
              voice_id: voiceId || "21m00Tcm4TlvDq8ikWAM",
              stability: voiceoverStyle === "professional" ? 0.6 : voiceoverStyle === "luxury" ? 0.7 : 0.5,
              similarity_boost: 0.75,
              use_speaker_boost: true,
            });
            if (!audioBuffer || audioBuffer.length === 0) {
              throw new Error("Voice generation returned empty audio for AutoReel voiceover.");
            }
            const key = `autoreels/voiceover/${ctx.user.id}-${Date.now()}.mp3`;
            const { url } = await storagePut(key, audioBuffer, "audio/mpeg");
            voiceoverAudioUrl = url;
            voiceAlignment = alignment.length > 0 ? alignment : undefined;
            console.log('[renderVideo] Voiceover audio generated with', alignment.length, 'word timestamps:', voiceoverAudioUrl);
          } catch (voErr: any) {
            console.error('[renderVideo] Voiceover generation failed, continuing without audio:', voErr.message);
            // Non-fatal: render without voiceover rather than failing the whole job
          }
        }
        
        // Fetch persona for agent branding watermark
        const persona = await db.getPersonaByUserId(ctx.user.id);

        const result = await renderAutoReel({
          hook,
          script,
          videoLength: parseInt(videoLength),
          tone,
          voiceoverAudioUrl,
          voiceAlignment,
          backgroundImages: backgroundImages && backgroundImages.length > 0 ? backgroundImages : undefined,
          captionsEnabled,
          captionSize,
          captionStyle,
          headshotUrl: persona?.headshotUrl ?? undefined,
          headshotOffsetY: persona?.headshotOffsetY ?? undefined,
          headshotZoom: persona?.headshotZoom ?? undefined,
          agentName: persona?.agentName ?? undefined,
          brokerageName: persona?.brokerageName ?? undefined,
        });
        
        console.log('[renderVideo] Render initiated successfully:', result);
        
        // Save reel to database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90); // 90 days expiration
        
        await db.createAiReel({
          userId: ctx.user.id,
          script,
          hook,
          caption: caption || script,
          shotstackRenderId: result.renderId,
          reelType: 'authority_reel',
          status: 'processing',
          expiresAt,
        });
        
        return result;
      } catch (error: any) {
        console.error('[renderVideo] Error occurred:', {
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
          statusCode: error.response?.status
        });

        // Throw a more descriptive error
        throw new Error(`Video render failed: ${error.message || 'Unknown error'}`);
      }
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
        throw new Error(`Failed to fetch avatar credits: ${error.message}`);
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

  /**
   * Get user's saved reels
   */
  getReels: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getAiReelsByUserId(ctx.user.id);
    }),

  /**
   * Save a completed reel's video URL and mark it as completed in the database.
   * Called by the frontend after polling returns status=done with a URL.
   */
  saveCompletedReel: protectedProcedure
    .input(z.object({
      renderId: z.string().min(1),
      videoUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const { aiReels } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) throw new Error("Database not available");
      // Only update the reel that belongs to this user and matches the renderId
      await database
        .update(aiReels)
        .set({
          shotstackRenderUrl: input.videoUrl,
          status: "completed" as const,
        })
        .where(
          and(
            eq(aiReels.userId, ctx.user.id),
            eq(aiReels.shotstackRenderId, input.renderId)
          )
        );
      return { success: true };
    }),

  /**
   * Get the most recent in-progress reel for job recovery
   * Returns the latest processing reel with a renderId so the frontend can resume polling
   */
  getLatestPendingReel: protectedProcedure
    .query(async ({ ctx }) => {
      const { getDb } = await import("../db");
      const { aiReels } = await import("../../drizzle/schema");
      const { eq, and, desc, isNotNull } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) return null;
      const rows = await database
        .select()
        .from(aiReels)
        .where(
          and(
            eq(aiReels.userId, ctx.user.id),
            eq(aiReels.status, "processing"),
            isNotNull(aiReels.shotstackRenderId)
          )
        )
        .orderBy(desc(aiReels.createdAt))
        .limit(1);
      return rows[0] ?? null;
    }),
});
