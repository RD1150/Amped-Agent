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

Agent name: ${agentName}`;

      const userPrompt = `Create a market update post for ${input.location} with the following data:

📊 Market Statistics (${viewOption.label}):
- Median Home Price: $${input.medianPrice.toLocaleString()} (${input.priceChange > 0 ? '+' : ''}${input.priceChange}% ${viewOption.statLabel})
- Days on Market: ${input.daysOnMarket} days
- Active Listings: ${input.activeListings.toLocaleString()} (${input.inventoryChange > 0 ? '+' : ''}${input.inventoryChange}% ${viewOption.statLabel})
- Price per Sq Ft: $${input.pricePerSqft}
- Market Temperature: ${input.marketTemperature.charAt(0).toUpperCase() + input.marketTemperature.slice(1)}

Frame all statistics as ${comparisonPhrase} (NOT year-over-year unless that is the selected view). Generate a social media post that explains what these numbers mean for buyers and sellers in ${input.location}. Include insights about whether it's a good time to buy or sell based on the data.`;

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

      // Create content post
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      await db
        .insert(contentPosts)
        .values({
          userId,
          content: generatedContent,
          contentType: 'market_report',
          status: 'draft',
          scheduledAt: null,
        });

      return {
        success: true,
        content: generatedContent,
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
      const { deductCredits } = await import('../credits');
      const { textToSpeech } = await import('../_core/elevenLabs');
      const { storagePut } = await import('../storage');
      const { renderMarketUpdateReel } = await import('../_core/videoRenderer');

      const creditCost = 10 + (input.enableVoiceover ? 5 : 0);
      await deductCredits({
        userId: ctx.user.id,
        amount: creditCost,
        usageType: 'market_update_video',
        description: `Market update video for ${input.location}${input.enableVoiceover ? ' with voiceover' : ''}`,
      });

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
        agentName: ctx.user.name || undefined,
      });

      return { renderId: result.renderId, success: true };
    }),
});
