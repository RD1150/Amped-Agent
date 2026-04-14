import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { blogPosts, personas } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { getMarketData } from "../marketStatsHelper";

const NICHE_LABELS: Record<string, string> = {
  buyers: "First-Time & Move-Up Buyers",
  sellers: "Home Sellers",
  investors: "Real Estate Investors",
  luxury: "Luxury Buyers & Sellers",
  relocation: "Relocation Clients",
  general: "General Real Estate",
  local_authority: "Local Authority / Neighborhood Guide",
};

// Templates for the Local Authority blog type
const LOCAL_AUTHORITY_TEMPLATES: Record<string, { title: string; description: string; topicHint: string }> = {
  neighborhood_guide: {
    title: "Ultimate Neighborhood Guide",
    description: "Comprehensive guide to living in a specific neighborhood — schools, restaurants, parks, lifestyle, and market stats.",
    topicHint: "Ultimate Guide to Living in [Neighborhood]: Everything You Need to Know",
  },
  zip_code_market: {
    title: "ZIP Code Market Report",
    description: "Hyperlocal market analysis for a specific ZIP code — prices, trends, inventory, and what it means for buyers and sellers.",
    topicHint: "[ZIP Code] Real Estate Market Report: Prices, Trends & What to Expect",
  },
  best_streets: {
    title: "Best Streets / Blocks",
    description: "Showcase the most desirable streets or blocks in a neighborhood and why buyers love them.",
    topicHint: "The Best Streets to Live on in [Neighborhood] (And Why Buyers Are Competing for Them)",
  },
  moving_to: {
    title: "Moving to [City/Neighborhood]",
    description: "A relocation guide for people moving to the area — what to know, where to live, and how to find the right home.",
    topicHint: "Moving to [City/Neighborhood]? Here's Everything You Need to Know Before You Buy",
  },
  hidden_gems: {
    title: "Hidden Gem Neighborhoods",
    description: "Spotlight underrated or up-and-coming neighborhoods before they hit the mainstream radar.",
    topicHint: "[City]'s Hidden Gem Neighborhoods: Where Smart Buyers Are Looking Right Now",
  },
};

export const blogBuilderRouter = router({
  /**
   * Generate a new blog post using AI
   */
  generate: protectedProcedure
    .input(
      z.object({
        topic: z.string().min(3).max(255),
        city: z.string().optional(),
        niche: z.enum(["buyers", "sellers", "investors", "luxury", "relocation", "general", "local_authority"]).default("general"),
        localAuthorityTemplate: z.enum(["neighborhood_guide", "zip_code_market", "best_streets", "moving_to", "hidden_gems"]).optional(),
        agentName: z.string().optional(),
        brokerage: z.string().optional(),
        tone: z.enum(["professional", "conversational", "educational", "inspirational"]).default("conversational"),
        wordCount: z.enum(["short", "medium", "long"]).default("medium"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch persona for hyperlocal context
      const { getPersonaByUserId } = await import('../db');
      const persona = await getPersonaByUserId(ctx.user.id);

      // Build hyperlocal context from persona
      let hyperlocalContext = "";
      if (persona?.targetNeighborhoods || persona?.targetZipCodes) {
        try {
          const hoods: string[] = persona.targetNeighborhoods ? JSON.parse(persona.targetNeighborhoods) : [];
          const zips: string[] = persona.targetZipCodes ? JSON.parse(persona.targetZipCodes) : [];
          const parts: string[] = [];
          if (hoods.length > 0) parts.push(`target neighborhoods: ${hoods.join(", ")}`);
          if (zips.length > 0) parts.push(`target ZIP codes: ${zips.join(", ")}`);
          if (parts.length > 0) {
            hyperlocalContext = `\n\nHYPERLOCAL SEO TARGETING: This agent's ${parts.join(" and ")}. Naturally weave these neighborhood names and ZIP codes into the content wherever relevant — in the title, subheadings, and body text — to maximize local search ranking. Do NOT force them; use them organically where they fit.`;
          }
        } catch {}
      }

      const wordCountTarget = input.wordCount === "short" ? "500-600" : input.wordCount === "medium" ? "750-900" : "1000-1200";
      const nicheLabel = NICHE_LABELS[input.niche] || "General Real Estate";
      const locationContext = input.city ? `in ${input.city}` : "in the local market";

      // For local_authority niche, use expanded word count and SEO-first structure
      const isLocalAuthority = input.niche === "local_authority";
      const localTemplate = isLocalAuthority && input.localAuthorityTemplate
        ? LOCAL_AUTHORITY_TEMPLATES[input.localAuthorityTemplate]
        : null;
      const effectiveWordCount = isLocalAuthority
        ? (input.wordCount === "short" ? "800-1000" : input.wordCount === "medium" ? "1200-1500" : "1800-2200")
        : wordCountTarget;

      // Fetch real market data when a city is provided
      let realMarketData: any = null;
      if (input.city) {
        try {
          realMarketData = await getMarketData(input.city);
          console.log(`[BlogBuilder] Fetched real market data for ${input.city}`);
        } catch (err) {
          console.warn('[BlogBuilder] Could not fetch real market data:', err);
        }
      }

      const marketDataBlock = realMarketData
        ? `\n\nREAL MARKET DATA for ${input.city} (use these exact numbers — do not invent statistics):\n- Median Home Price: $${realMarketData.medianPrice.toLocaleString()} (${realMarketData.priceChange > 0 ? '+' : ''}${realMarketData.priceChange}% YoY)\n- Days on Market: ${realMarketData.daysOnMarket} days\n- Active Listings: ${realMarketData.activeListings.toLocaleString()} (${realMarketData.listingsChange > 0 ? '+' : ''}${realMarketData.listingsChange}% YoY)\n- Price per Sq Ft: $${realMarketData.pricePerSqft}\n- Market Condition: ${realMarketData.marketTemperature === 'hot' ? "Seller's Market" : realMarketData.marketTemperature === 'cold' ? "Buyer's Market" : "Balanced Market"}`
        : '';

      const localAuthorityInstructions = isLocalAuthority ? `

LOCAL AUTHORITY BLOG REQUIREMENTS:
- This is a hyperlocal SEO pillar post designed to rank on Google for neighborhood/location searches
- Use the exact neighborhood name, city, and/or ZIP code in the H1 title, first paragraph, and at least 2 subheadings
- Include a "Quick Stats" or "At a Glance" section with bullet points (schools, walkability, commute, price range)
- Add a "What's It Like to Live Here?" section with lifestyle details
- Include a "Current Market Snapshot" section with real or estimated data
- End with a strong CTA: "Thinking about buying in [area]? Let's talk."
- Write at least ${effectiveWordCount} words — this is a comprehensive guide, not a short post
${localTemplate ? `- Template style: ${localTemplate.title} — ${localTemplate.description}` : ""}` : "";

      const systemPrompt = `You are an expert real estate content writer who specializes in SEO-optimized blog posts for real estate agents. 
You write in a ${input.tone} tone that builds trust and authority. 
Your posts are hyperlocal, actionable, and designed to rank on Google for local real estate searches.
Always write from the perspective of a knowledgeable local real estate agent.${hyperlocalContext}
Format your response as valid JSON only.`;

      const userPrompt = `Write a ${effectiveWordCount}-word SEO-optimized blog post for a real estate agent targeting ${nicheLabel} ${locationContext}.

Topic: "${input.topic}"
${input.agentName ? `Agent Name: ${input.agentName}` : ""}
${input.brokerage ? `Brokerage: ${input.brokerage}` : ""}${marketDataBlock}${localAuthorityInstructions}

Requirements:
- Write a compelling H1 title (not the same as the topic, more specific and SEO-friendly)
- Include 3-5 H2 subheadings that break up the content
- Write naturally, avoid generic filler phrases like "In today's market" or "As a real estate agent"
- Include 1-2 hyperlocal data points or insights${marketDataBlock ? " using the REAL MARKET DATA provided above" : " (can be general/typical for the area type)"}
- End with a clear call-to-action paragraph
- The post should feel like it was written by a real person, not AI

Return ONLY valid JSON in this exact format:
{
  "title": "The SEO-optimized H1 title",
  "content": "The full blog post in markdown format with ## for H2 headers",
  "metaDescription": "A 150-160 character meta description for SEO",
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "wordCount": 750
}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "blog_post",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" },
                metaDescription: { type: "string" },
                seoKeywords: { type: "array", items: { type: "string" } },
                wordCount: { type: "integer" },
              },
              required: ["title", "content", "metaDescription", "seoKeywords", "wordCount"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices[0]?.message?.content;
      const raw = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
      if (!raw) throw new Error("No response from AI");

      const parsed = JSON.parse(raw);

      // Save to database
      const database = await getDb();
      const [inserted] = await database!.insert(blogPosts).values({
        userId: ctx.user.id,
        title: parsed.title,
        content: parsed.content,
        topic: input.topic,
        city: input.city || null,
        niche: input.niche,
        wordCount: parsed.wordCount,
        seoKeywords: JSON.stringify(parsed.seoKeywords),
        metaDescription: parsed.metaDescription,
      });

      const newPost = await database!.select().from(blogPosts).where(eq(blogPosts.id, inserted.insertId)).limit(1);
      return newPost[0];
    }),

  /**
   * List all blog posts for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    return database!
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.userId, ctx.user.id))
      .orderBy(desc(blogPosts.createdAt));
  }),

  /**
   * Get a single blog post by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      const [post] = await database!
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, input.id))
        .limit(1);
      if (!post || post.userId !== ctx.user.id) throw new Error("Not found");
      return post;
    }),

  /**
   * Delete a blog post
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      const [post] = await database!.select().from(blogPosts).where(eq(blogPosts.id, input.id)).limit(1);
      if (!post || post.userId !== ctx.user.id) throw new Error("Not found");
      await database!.delete(blogPosts).where(eq(blogPosts.id, input.id));
      return { success: true };
    }),

  /**
   * Public: get agent blog page by slug (derived from agentName)
   * Slug format: "reena-dutta" from agentName "Reena Dutta"
   */
  getPublicBlog: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database unavailable");
      const allPersonas = await database
        .select({
          userId: personas.userId,
          agentName: personas.agentName,
          brokerageName: personas.brokerageName,
          brokerageDRE: personas.brokerageDRE,
          licenseNumber: personas.licenseNumber,
          phoneNumber: personas.phoneNumber,
          headshotUrl: personas.headshotUrl,
          primaryCity: personas.primaryCity,
          primaryState: personas.primaryState,
          tagline: personas.tagline,
          bio: personas.bio,
          websiteUrl: personas.websiteUrl,
          emailAddress: personas.emailAddress,
          bookingUrl: personas.bookingUrl,
          primaryColor: personas.primaryColor,
          logoUrl: personas.logoUrl,
        })
        .from(personas)
        .where(eq(personas.isCompleted, true));
      const persona = allPersonas.find((p) => {
        if (!p.agentName) return false;
        const s = p.agentName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return s === input.slug;
      });
      if (!persona) throw new Error("Blog not found");
      const posts = await database
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.userId, persona.userId))
        .orderBy(desc(blogPosts.createdAt))
        .limit(50);
      return { persona, posts };
    }),

  /**
   * Public: get a single blog post by ID for the public blog
   */
  getPublicPost: publicProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database unavailable");
      const [post] = await database
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, input.postId))
        .limit(1);
      if (!post) throw new Error("Post not found");
      const [persona] = await database
        .select({
          agentName: personas.agentName,
          brokerageName: personas.brokerageName,
          licenseNumber: personas.licenseNumber,
          phoneNumber: personas.phoneNumber,
          headshotUrl: personas.headshotUrl,
          primaryCity: personas.primaryCity,
          primaryState: personas.primaryState,
          tagline: personas.tagline,
          bio: personas.bio,
          websiteUrl: personas.websiteUrl,
          emailAddress: personas.emailAddress,
          bookingUrl: personas.bookingUrl,
          primaryColor: personas.primaryColor,
        })
        .from(personas)
        .where(eq(personas.userId, post.userId))
        .limit(1);
      return { post, persona: persona || null };
    }),
});
