/**
 * Listing Launch Kit Router
 *
 * One listing address → full asset bundle:
 * - 5 social posts
 * - Email blast draft
 * - Listing presentation link (Gamma)
 * - Property tour video (Shotstack Ken Burns)
 * - Lead magnet PDF
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { listingKits } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { storagePut } from "../storage";
import { getPersonaByUserId } from "../db";

export const listingKitRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    return db
      .select()
      .from(listingKits)
      .where(eq(listingKits.userId, ctx.user.id))
      .orderBy(desc(listingKits.createdAt))
      .limit(50);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [kit] = await db
        .select()
        .from(listingKits)
        .where(eq(listingKits.id, input.id))
        .limit(1);
      if (!kit || kit.userId !== ctx.user.id) throw new Error("Not found");
      return kit;
    }),

  create: protectedProcedure
    .input(
      z.object({
        address: z.string().min(5),
        city: z.string().optional(),
        state: z.string().optional(),
        price: z.string().optional(),
        bedrooms: z.number().optional(),
        bathrooms: z.string().optional(),
        sqft: z.number().optional(),
        description: z.string().optional(),
        photoUrls: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [result] = await db.insert(listingKits).values({
        userId: ctx.user.id,
        address: input.address,
        city: input.city,
        state: input.state,
        price: input.price,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        sqft: input.sqft,
        description: input.description,
        photoUrls: input.photoUrls ? JSON.stringify(input.photoUrls) : null,
        status: "draft",
      });
      return { id: (result as any).insertId };
    }),

  generate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [kit] = await db
        .select()
        .from(listingKits)
        .where(eq(listingKits.id, input.id))
        .limit(1);
      if (!kit || kit.userId !== ctx.user.id) throw new Error("Not found");

      // Mark as generating
      await db
        .update(listingKits)
        .set({ status: "generating" })
        .where(eq(listingKits.id, input.id));

      const persona = await getPersonaByUserId(ctx.user.id);
      const agentName = persona?.agentName || "Your Agent";
      const city = kit.city || persona?.primaryCity || "the area";
      const brokerage = persona?.brokerageName || "";

      const listingDetails = [
        `Address: ${kit.address}`,
        kit.city ? `City: ${kit.city}` : "",
        kit.price ? `Price: ${kit.price}` : "",
        kit.bedrooms ? `Bedrooms: ${kit.bedrooms}` : "",
        kit.bathrooms ? `Bathrooms: ${kit.bathrooms}` : "",
        kit.sqft ? `Square Footage: ${kit.sqft.toLocaleString()} sq ft` : "",
        kit.description ? `Description: ${kit.description}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      try {
        // Generate all content in parallel
        const [socialPostsRes, emailBlastRes] = await Promise.all([
          // 5 social posts
          invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a real estate social media expert. Write punchy, engaging social posts for a real estate agent. Each post should be distinct — vary the angle (lifestyle, investment, neighborhood, urgency, storytelling). Include relevant emojis. End each post with a CTA. Agent: ${agentName}${brokerage ? `, ${brokerage}` : ""}.`,
              },
              {
                role: "user",
                content: `Write 5 social media posts for this listing in ${city}:\n\n${listingDetails}\n\nMake each post unique in angle and tone. Posts should work on Instagram, Facebook, and LinkedIn.`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "social_posts",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    posts: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          angle: { type: "string" },
                          content: { type: "string" },
                          hashtags: { type: "string" },
                        },
                        required: ["angle", "content", "hashtags"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["posts"],
                  additionalProperties: false,
                },
              },
            },
          }),
          // Email blast
          invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a real estate email marketing expert. Write compelling listing announcement emails that generate showings. Agent: ${agentName}${brokerage ? `, ${brokerage}` : ""}.`,
              },
              {
                role: "user",
                content: `Write a listing announcement email blast for this property in ${city}:\n\n${listingDetails}\n\nInclude a compelling subject line, engaging body (2-3 paragraphs), and a clear CTA to schedule a showing.`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "email_blast",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    subject: { type: "string" },
                    preheader: { type: "string" },
                    body: { type: "string" },
                    cta: { type: "string" },
                  },
                  required: ["subject", "preheader", "body", "cta"],
                  additionalProperties: false,
                },
              },
            },
          }),
        ]);

        const socialPostsContent = socialPostsRes.choices[0].message.content;
        const emailBlastContent = emailBlastRes.choices[0].message.content;

        const socialPosts = JSON.parse(
          typeof socialPostsContent === "string" ? socialPostsContent : "{}"
        );
        const emailBlast = JSON.parse(
          typeof emailBlastContent === "string" ? emailBlastContent : "{}"
        );

        await db
          .update(listingKits)
          .set({
            status: "ready",
            socialPosts: JSON.stringify(socialPosts.posts || []),
            emailBlast: JSON.stringify(emailBlast),
          })
          .where(eq(listingKits.id, input.id));

        return { success: true, id: input.id };
      } catch (err) {
        await db
          .update(listingKits)
          .set({
            status: "failed",
            errorMessage: err instanceof Error ? err.message : "Generation failed",
          })
          .where(eq(listingKits.id, input.id));
        throw err;
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .delete(listingKits)
        .where(eq(listingKits.id, input.id));
      return { success: true };
    }),
});
