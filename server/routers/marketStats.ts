import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { contentPosts } from '../../drizzle/schema';
import { invokeLLM } from '../_core/llm';
import { getMarketData } from '../marketStatsHelper';

export const marketStatsRouter = router({
  // Get market data for a location (uses RapidAPI Realtor API)
  getMarketData: protectedProcedure
    .input(
      z.object({
        location: z.string(),
      })
    )
    .mutation(async ({ input }: { input: any }) => {
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
      })
    )
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
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

📊 Market Statistics:
- Median Home Price: $${input.medianPrice.toLocaleString()} (${input.priceChange > 0 ? '+' : ''}${input.priceChange}% YoY)
- Days on Market: ${input.daysOnMarket} days
- Active Listings: ${input.activeListings.toLocaleString()} (${input.inventoryChange > 0 ? '+' : ''}${input.inventoryChange}% YoY)
- Price per Sq Ft: $${input.pricePerSqft}
- Market Temperature: ${input.marketTemperature.charAt(0).toUpperCase() + input.marketTemperature.slice(1)}

Generate a social media post that explains what these numbers mean for buyers and sellers in ${input.location}. Include insights about whether it's a good time to buy or sell based on the data.`;

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
});
