import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { contentPosts } from '../../drizzle/schema';
import { invokeLLM } from '../_core/llm';

// Mock real estate news data (in production, this would fetch from a real API)
const MOCK_NEWS_ARTICLES = [
  {
    id: 'news-1',
    title: 'Fed Holds Interest Rates Steady at 7.5% Amid Economic Uncertainty',
    summary: 'The Federal Reserve announced today that it will maintain the federal funds rate at 7.5%, citing mixed economic signals and ongoing inflation concerns. This decision impacts mortgage rates and housing affordability across the nation.',
    source: 'Federal Reserve',
    url: 'https://www.federalreserve.gov',
    publishedAt: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop',
  },
  {
    id: 'news-2',
    title: 'Housing Inventory Increases 15% Year-Over-Year in Major Markets',
    summary: 'New data from the National Association of Realtors shows a significant increase in available homes for sale, with inventory up 15% compared to last year. This shift could signal a more balanced market for buyers.',
    source: 'National Association of Realtors',
    url: 'https://www.nar.realtor',
    publishedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
  },
  {
    id: 'news-3',
    title: 'New Tax Incentives for First-Time Homebuyers Announced',
    summary: 'Congress has passed legislation offering enhanced tax credits for first-time homebuyers, potentially saving eligible buyers up to $15,000. The program aims to boost homeownership rates among younger generations.',
    source: 'U.S. Department of Housing',
    url: 'https://www.hud.gov',
    publishedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    imageUrl: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=600&fit=crop',
  },
  {
    id: 'news-4',
    title: 'Remote Work Trends Continue to Shape Housing Demand',
    summary: 'A new study reveals that 65% of remote workers are considering relocating to more affordable areas, driving demand in suburban and rural markets while urban centers see stabilization.',
    source: 'Urban Institute',
    url: 'https://www.urban.org',
    publishedAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    imageUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop',
  },
  {
    id: 'news-5',
    title: 'Climate Resilience Becomes Top Priority for Homebuyers',
    summary: 'Recent surveys show that 78% of homebuyers now consider climate risks and natural disaster preparedness when choosing a property, leading to increased demand for homes with sustainable features.',
    source: 'Realtor.com',
    url: 'https://www.realtor.com',
    publishedAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
  },
  {
    id: 'news-6',
    title: 'Mortgage Application Volume Drops 8% as Rates Remain Elevated',
    summary: 'The Mortgage Bankers Association reports an 8% decline in mortgage applications compared to last month, as elevated interest rates continue to impact buyer affordability and purchasing power.',
    source: 'Mortgage Bankers Association',
    url: 'https://www.mba.org',
    publishedAt: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop',
  },
];

export const newsRouter = router({
  // Get trending real estate news
  getTrendingNews: protectedProcedure.query(async () => {
    // In production, this would fetch from a real news API
    // For now, return mock data
    return MOCK_NEWS_ARTICLES;
  }),

  // Generate social media post from news article
  generateNewsPost: protectedProcedure
    .input(
      z.object({
        articleId: z.string(),
        title: z.string(),
        summary: z.string(),
        source: z.string(),
        url: z.string(),
      })
    )
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      const userId = ctx.user.id;

      // Get agent name for personalization
      const agentName = ctx.user.name || 'Real Estate Agent';

      // Generate AI content based on the news article
      const systemPrompt = `You are a professional real estate social media content writer. Generate an engaging social media post about the following real estate news. The post should:
- Be 150-200 words
- Include the agent's expert perspective
- Relate the news to local market implications
- Use a professional yet conversational tone
- Include relevant emojis (2-3 maximum)
- End with a call-to-action
- Be formatted for social media (short paragraphs, easy to read)

Agent name: ${agentName}`;

      const userPrompt = `News Title: ${input.title}

News Summary: ${input.summary}

Source: ${input.source}

Generate a social media post about this news that positions the agent as a knowledgeable market expert.`;

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
          contentType: 'trending_news',
          status: 'draft',
          scheduledAt: null,
        });

      return {
        success: true,
        content: generatedContent,
      };
    }),
});
