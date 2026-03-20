import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { blogPosts } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

const NICHE_LABELS: Record<string, string> = {
  buyers: "First-Time & Move-Up Buyers",
  sellers: "Home Sellers",
  investors: "Real Estate Investors",
  luxury: "Luxury Buyers & Sellers",
  relocation: "Relocation Clients",
  general: "General Real Estate",
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
        niche: z.enum(["buyers", "sellers", "investors", "luxury", "relocation", "general"]).default("general"),
        agentName: z.string().optional(),
        brokerage: z.string().optional(),
        tone: z.enum(["professional", "conversational", "educational", "inspirational"]).default("conversational"),
        wordCount: z.enum(["short", "medium", "long"]).default("medium"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const wordCountTarget = input.wordCount === "short" ? "500-600" : input.wordCount === "medium" ? "750-900" : "1000-1200";
      const nicheLabel = NICHE_LABELS[input.niche] || "General Real Estate";
      const locationContext = input.city ? `in ${input.city}` : "in the local market";

      const systemPrompt = `You are an expert real estate content writer who specializes in SEO-optimized blog posts for real estate agents. 
You write in a ${input.tone} tone that builds trust and authority. 
Your posts are hyperlocal, actionable, and designed to rank on Google for local real estate searches.
Always write from the perspective of a knowledgeable local real estate agent.
Format your response as valid JSON only.`;

      const userPrompt = `Write a ${wordCountTarget}-word SEO-optimized blog post for a real estate agent targeting ${nicheLabel} ${locationContext}.

Topic: "${input.topic}"
${input.agentName ? `Agent Name: ${input.agentName}` : ""}
${input.brokerage ? `Brokerage: ${input.brokerage}` : ""}

Requirements:
- Write a compelling H1 title (not the same as the topic, more specific and SEO-friendly)
- Include 3-5 H2 subheadings that break up the content
- Write naturally, avoid generic filler phrases like "In today's market" or "As a real estate agent"
- Include 1-2 hyperlocal data points or insights (can be general/typical for the area type)
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
});
