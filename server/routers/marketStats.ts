import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { contentPosts } from '../../drizzle/schema';
import { invokeLLM } from '../_core/llm';

// Mock market data generator (in production, this would call a real API like Zillow, Redfin, etc.)
function generateMockMarketData(location: string) {
  // Generate realistic-looking mock data
  const basePrice = 300000 + Math.floor(Math.random() * 500000);
  const priceChange = (Math.random() * 20 - 5).toFixed(1); // -5% to +15%
  const daysOnMarket = Math.floor(Math.random() * 60) + 15; // 15-75 days
  const activeListings = Math.floor(Math.random() * 500) + 100; // 100-600 listings
  const inventoryChange = (Math.random() * 30 - 10).toFixed(1); // -10% to +20%
  const pricePerSqft = Math.floor(basePrice / (1500 + Math.random() * 1000)); // Calculate price per sqft

  // Determine market temperature based on days on market
  let marketTemperature: 'hot' | 'balanced' | 'cold';
  if (daysOnMarket < 30) {
    marketTemperature = 'hot';
  } else if (daysOnMarket > 60) {
    marketTemperature = 'cold';
  } else {
    marketTemperature = 'balanced';
  }

  return {
    location,
    medianPrice: basePrice,
    priceChange: parseFloat(priceChange),
    daysOnMarket,
    activeListings,
    inventoryChange: parseFloat(inventoryChange),
    pricePerSqft,
    marketTemperature,
  };
}

export const marketStatsRouter = router({
  // Get market data for a location
  getMarketData: protectedProcedure
    .input(
      z.object({
        location: z.string(),
      })
    )
    .mutation(async ({ input }: { input: any }) => {
      // In production, this would call a real API
      // For now, return mock data
      const marketData = generateMockMarketData(input.location);
      return marketData;
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
