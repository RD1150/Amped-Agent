import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { contentPosts } from '../../drizzle/schema';
import { invokeLLM } from '../_core/llm';
import { getMarketData } from '../marketStatsHelper';
import { type MarketView, getMarketViewOption, DEFAULT_MARKET_VIEW } from '../../shared/marketView';

const marketViewEnum = z.enum([
  'this_month_vs_last',
  'month_over_month',
  'quarter_over_quarter',
  'year_over_year',
  'last_30_days',
]).default(DEFAULT_MARKET_VIEW);

export const marketStatsRouter = router({
  // Get market data for a location (uses RapidAPI Realtor API)
  getMarketData: protectedProcedure
    .input(
      z.object({
        location: z.string(),
        marketView: marketViewEnum.optional(),
      })
    )
    .mutation(async ({ input }: { input: any }) => {
      const marketView: MarketView = input.marketView ?? DEFAULT_MARKET_VIEW;
      const viewOption = getMarketViewOption(marketView);
      try {
        const marketData = await getMarketData(input.location);
        return {
          location: marketData.location,
          medianPrice: marketData.medianPrice,
          priceChange: marketData.priceChange,
          daysOnMarket: marketData.daysOnMarket,
          activeListings: marketData.activeListings,
          inventoryChange: marketData.listingsChange,
          pricePerSqft: marketData.pricePerSqft,
          marketTemperature: marketData.marketTemperature,
          insights: marketData.insights,
          // Pass the selected market view back so the UI can display the correct label
          marketView,
          statLabel: viewOption.statLabel,
          narrationPhrase: viewOption.narrationPhrase,
        };
      } catch (error) {
        console.error('Error fetching market data:', error);
        throw new Error('Failed to fetch market data. Please try a different location.');
      }
    }),

  // Generate social media post from market stats
  generateMarketPost: protectedProcedure
    .input(
      z.object({
        location: z.string(),
        medianPrice: z.number(),
        priceChange: z.number(),
        daysOnMarket: z.number(),
        activeListings: z.number(),
        inventoryChange: z.number(),
        insights: z.array(z.string()).optional(),
        pricePerSqft: z.number(),
        marketTemperature: z.enum(['hot', 'balanced', 'cold']),
        marketView: marketViewEnum.optional(),
      })
    )
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      const marketView: MarketView = input.marketView ?? DEFAULT_MARKET_VIEW;
      const viewOption = getMarketViewOption(marketView);
      const comparisonPhrase = viewOption.narrationPhrase; // e.g. "compared to last month"
      const userId = ctx.user.id;
      const agentName = ctx.user.name || 'Real Estate Agent';

      // Build hyperlocal context
      const { getPersonaByUserId } = await import('../db');
      const persona = await getPersonaByUserId(userId);
      let hyperlocalNote = '';
      if (persona?.targetNeighborhoods || persona?.targetZipCodes) {
        try {
          const hoods: string[] = persona.targetNeighborhoods ? JSON.parse(persona.targetNeighborhoods) : [];
          const zips: string[] = persona.targetZipCodes ? JSON.parse(persona.targetZipCodes) : [];
          const parts: string[] = [];
          if (hoods.length > 0) parts.push(`neighborhoods: ${hoods.join(', ')}`);
          if (zips.length > 0) parts.push(`ZIP codes: ${zips.join(', ')}`);
          if (parts.length > 0) hyperlocalNote = `\nHyperlocal SEO: Naturally weave in references to these specific ${parts.join(' and ')} where relevant to boost local search visibility.`;
        } catch {}
      }

      // Build audience context
      let audienceNote = '';
      let audienceFraming = 'buyers and sellers';
      if (persona?.customerAvatar) {
        try {
          const avatar = JSON.parse(persona.customerAvatar);
          const toneGuide: Record<string, string> = {
            'first-time-buyers': 'Speak to first-time buyers: encouraging, educational, jargon-free. Explain what each stat means in plain language.',
            'luxury-sellers': 'Speak to luxury sellers: sophisticated, discreet, emphasize exclusivity and market positioning.',
            'investors': 'Speak to real estate investors: data-driven, ROI-focused, direct. Highlight cap rates, cash flow implications, and market timing.',
            'relocators': 'Speak to relocating families: warm, reassuring, local expertise. Help them understand the market before they arrive.',
            'downsizers': 'Speak to downsizers: empathetic, lifestyle-focused. Emphasize equity gains and the opportunity to simplify.',
            'move-up-buyers': 'Speak to move-up buyers: aspirational, strategic, equity-focused. Show how current conditions affect their move.',
          };
          const framingGuide: Record<string, string> = {
            'first-time-buyers': 'first-time buyers entering the market',
            'luxury-sellers': 'luxury sellers and high-end property owners',
            'investors': 'real estate investors evaluating opportunities',
            'relocators': 'families relocating to the area',
            'downsizers': 'homeowners looking to downsize',
            'move-up-buyers': 'homeowners looking to move up',
          };
          if (avatar.type && toneGuide[avatar.type]) {
            audienceNote = `\nAudience: ${toneGuide[avatar.type]}`;
            audienceFraming = framingGuide[avatar.type] || 'buyers and sellers';
          }
        } catch {}
      }

      // Generate AI content based on market stats
      const systemPrompt = `You are a professional real estate social media content writer. Generate an engaging social media post about local market statistics. The post should:
- Be 150-200 words
- Present the data in an easy-to-understand way
- Include the agent's expert analysis and insights
- Provide actionable advice for buyers or sellers
- Use a professional yet conversational tone
- Include relevant emojis (2-3 maximum)
- End with a call-to-action
- Be formatted for social media (short paragraphs, easy to read)

Agent name: ${agentName}${audienceNote}${hyperlocalNote}`;

      const userPrompt = `Create a market update post for ${input.location} with the following data:

📊 Market Statistics (${viewOption.label}):
- Median Home Price: $${input.medianPrice.toLocaleString()} (${input.priceChange > 0 ? '+' : ''}${input.priceChange}% ${viewOption.statLabel})
- Days on Market: ${input.daysOnMarket} days
- Active Listings: ${input.activeListings.toLocaleString()} (${input.inventoryChange > 0 ? '+' : ''}${input.inventoryChange}% ${viewOption.statLabel})
- Price per Sq Ft: $${input.pricePerSqft}
- Market Temperature: ${input.marketTemperature.charAt(0).toUpperCase() + input.marketTemperature.slice(1)}

Frame all statistics as ${comparisonPhrase} (NOT year-over-year unless that is the selected view). Generate a social media post that explains what these numbers mean specifically for ${audienceFraming} in ${input.location}. Frame your insights and call-to-action around what this audience cares about most. Include insights about whether it's a good time to act based on the data.`;

      const result = await invokeLLM({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const generatedContent = result.choices[0]?.message?.content || '';
      if (typeof generatedContent !== 'string') {
        throw new Error('Generated content is not a string');
      }

      // Generate audience-specific "What this means for you" section
      let audienceInsight = '';
      try {
        const insightResult = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `You are a real estate expert writing a brief, punchy "What this means for you" insight paragraph for ${audienceFraming}. Be direct, specific, and actionable. 2-3 sentences max. No fluff.`,
            },
            {
              role: 'user',
              content: `Based on these market stats for ${input.location}:\n- Median Price: $${input.medianPrice.toLocaleString()} (${input.priceChange > 0 ? '+' : ''}${input.priceChange}% change)\n- Days on Market: ${input.daysOnMarket}\n- Active Listings: ${input.activeListings.toLocaleString()} (${input.inventoryChange > 0 ? '+' : ''}${input.inventoryChange}% change)\n- Market: ${input.marketTemperature}\n\nWrite a "What this means for ${audienceFraming}" paragraph. Start with that exact phrase as a bold header.`,
            },
          ],
        });
        const insightText = insightResult.choices[0]?.message?.content;
        if (typeof insightText === 'string') audienceInsight = insightText;
      } catch {}

      const fullContent = audienceInsight
        ? `${generatedContent}\n\n${audienceInsight}`
        : generatedContent;

      // Create content post
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      await db
        .insert(contentPosts)
        .values({
          userId,
          content: fullContent,
          contentType: 'market_report',
          status: 'draft',
          scheduledAt: null,
        });

      return {
        success: true,
        content: fullContent,
      };
    }),

  // Generate a market update video with optional ElevenLabs voiceover
  generateMarketVideo: protectedProcedure
    .input(
      z.object({
        location: z.string(),
        medianPrice: z.number(),
        priceChange: z.number(),
        daysOnMarket: z.number(),
        activeListings: z.number(),
        inventoryChange: z.number(),
        pricePerSqft: z.number(),
        marketTemperature: z.enum(['hot', 'balanced', 'cold']),
        insights: z.array(z.string()).optional(),
        enableVoiceover: z.boolean().optional(),
        voiceId: z.string().optional(),
        voiceoverStyle: z.enum(['professional', 'warm', 'luxury', 'casual']).optional(),
        marketView: marketViewEnum.optional(),
      })
    )
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      const marketView: MarketView = input.marketView ?? DEFAULT_MARKET_VIEW;
      const viewOption = getMarketViewOption(marketView);
      const { textToSpeech } = await import('../_core/elevenLabs');
      const { storagePut } = await import('../storage');
      const { renderMarketUpdateReel } = await import('../_core/videoRenderer');

      // Check monthly free pool (deducts slots or overage credits)
      const { checkAndDeductVideoPool } = await import('../credits');
      const marketPoolResult = await checkAndDeductVideoPool(ctx.user.id, 'market-update');
      if (!marketPoolResult.allowed) {
        throw new Error(marketPoolResult.reason);
      }

      // Generate voiceover script from market data
      let voiceoverAudioUrl: string | undefined;
      if (input.enableVoiceover) {
        const { invokeLLM } = await import('../_core/llm');
        const styleMap: Record<string, string> = {
          professional: 'authoritative and data-driven',
          warm: 'friendly and approachable',
          luxury: 'elegant and refined',
          casual: 'conversational and relatable',
        };
        const styleGuide = styleMap[input.voiceoverStyle || 'professional'] || 'authoritative and data-driven';

        const scriptResult = await invokeLLM({
          messages: [
            { role: 'system', content: `You are a real estate market analyst. Write a 30-second voiceover script (about 75 words) in a ${styleGuide} tone. Be concise and data-focused. Frame all statistics as ${viewOption.narrationPhrase} — do NOT say "year over year" unless the selected view is year_over_year.` },
            { role: 'user', content: `Write a voiceover for a market update video about ${input.location}. Time period: ${viewOption.label}. Median price: $${input.medianPrice.toLocaleString()} (${input.priceChange > 0 ? '+' : ''}${input.priceChange}% ${viewOption.statLabel}). Days on market: ${input.daysOnMarket}. Active listings: ${input.activeListings.toLocaleString()}. Market: ${input.marketTemperature}. Reference the comparison as "${viewOption.narrationPhrase}" in the script.` },
          ],
        });
        const script = scriptResult.choices[0]?.message?.content as string || '';

        const audioBuffer = await textToSpeech({
          text: script,
          voice_id: input.voiceId || '21m00Tcm4TlvDq8ikWAM',
          stability: 0.55,
          similarity_boost: 0.75,
        });
        const suffix = Math.random().toString(36).slice(2, 8);
        const { url } = await storagePut(`market-vo/${ctx.user.id}-${suffix}.mp3`, audioBuffer, 'audio/mpeg');
        voiceoverAudioUrl = url;
      }

      // Fetch persona for agent branding watermark
      const { getPersonaByUserId } = await import('../db');
      const persona = await getPersonaByUserId(ctx.user.id);

      // Use the dedicated market update renderer with proper stat slide layout
      const result = await renderMarketUpdateReel({
        location: input.location,
        medianPrice: input.medianPrice,
        priceChange: input.priceChange,
        daysOnMarket: input.daysOnMarket,
        activeListings: input.activeListings,
        pricePerSqft: input.pricePerSqft,
        marketTemperature: input.marketTemperature,
        voiceoverAudioUrl,
        agentName: persona?.agentName || ctx.user.name || undefined,
        brokerageName: persona?.brokerageName ?? undefined,
        headshotUrl: persona?.headshotUrl ?? undefined,
        headshotOffsetY: persona?.headshotOffsetY ?? undefined,
        headshotZoom: persona?.headshotZoom ?? undefined,
      });

      return { renderId: result.renderId, success: true };
    }),
});
