/**
 * Testimonial Engine Router
 *
 * - Request review from past client (Resend email with Google/Zillow links)
 * - Save received testimonial
 * - Auto-generate social post + story graphic text from review
 * - List all testimonials
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { testimonials } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { sendEmail } from "../emailService";
import { getPersonaByUserId } from "../db";
import { ENV } from "../_core/env";

const SITE_URL = "https://ampedagent.app";
const BRAND_COLOR = "#f97316";

function reviewRequestEmail(params: {
  agentName: string;
  agentEmail: string;
  clientName: string;
  googleReviewUrl?: string;
  zillowUrl?: string;
  realtorUrl?: string;
}): string {
  const { agentName, clientName, googleReviewUrl, zillowUrl, realtorUrl } = params;
  const links = [
    googleReviewUrl ? `<a href="${googleReviewUrl}" style="display:inline-block;margin:8px 8px 8px 0;padding:12px 20px;background:${BRAND_COLOR};color:#fff;font-weight:600;font-size:14px;text-decoration:none;border-radius:8px;">⭐ Review on Google</a>` : "",
    zillowUrl ? `<a href="${zillowUrl}" style="display:inline-block;margin:8px 8px 8px 0;padding:12px 20px;background:#006AFF;color:#fff;font-weight:600;font-size:14px;text-decoration:none;border-radius:8px;">🏠 Review on Zillow</a>` : "",
    realtorUrl ? `<a href="${realtorUrl}" style="display:inline-block;margin:8px 8px 8px 0;padding:12px 20px;background:#D92228;color:#fff;font-weight:600;font-size:14px;text-decoration:none;border-radius:8px;">🔑 Review on Realtor.com</a>` : "",
  ].filter(Boolean).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
        <tr>
          <td style="background:#0f172a;padding:28px 40px;">
            <span style="font-size:20px;font-weight:700;color:#ffffff;">Amped</span><span style="font-size:20px;font-weight:700;color:${BRAND_COLOR};"> Agent</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;color:#1a1a1a;font-size:15px;line-height:1.7;">
            <p style="margin:0 0 16px;">Hi ${clientName},</p>
            <p style="margin:0 0 16px;">It was truly a pleasure working with you! I hope you're settling in and loving your new home.</p>
            <p style="margin:0 0 16px;">If you have a moment, I would be incredibly grateful if you could share your experience. Reviews help other families find a trusted agent — and they mean the world to me.</p>
            <p style="margin:0 0 24px;font-weight:600;">It only takes 60 seconds:</p>
            <div style="margin:0 0 32px;">${links}</div>
            <p style="margin:0 0 16px;color:#666;font-size:13px;">If you have any feedback for me directly, just reply to this email — I read every message personally.</p>
            <p style="margin:24px 0 0;">With gratitude,<br/><strong>${agentName}</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #e5e5e5;text-align:center;color:#999;font-size:12px;">
            <p style="margin:0;">© ${new Date().getFullYear()} ${agentName} · Powered by Amped Agent</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const testimonialsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    return db
      .select()
      .from(testimonials)
      .where(eq(testimonials.userId, ctx.user.id))
      .orderBy(desc(testimonials.createdAt))
      .limit(100);
  }),

  requestReview: protectedProcedure
    .input(
      z.object({
        clientName: z.string().min(1),
        clientEmail: z.string().email(),
        googleReviewUrl: z.string().url().optional(),
        zillowUrl: z.string().url().optional(),
        realtorUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const persona = await getPersonaByUserId(ctx.user.id);
      const agentName = persona?.agentName || ctx.user.name || "Your Agent";
      const agentEmail = ctx.user.email || "";

      // Insert testimonial record
      const [result] = await db.insert(testimonials).values({
        userId: ctx.user.id,
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        status: "requested",
        requestSentAt: new Date(),
      });
      const testimonialId = (result as any).insertId;

      // Send review request email
      const html = reviewRequestEmail({
        agentName,
        agentEmail,
        clientName: input.clientName,
        googleReviewUrl: input.googleReviewUrl,
        zillowUrl: input.zillowUrl,
        realtorUrl: input.realtorUrl,
      });

      await sendEmail({
        to: input.clientEmail,
        subject: `${agentName} would love your feedback`,
        html,
        fallbackTitle: `Review request sent to ${input.clientName} (${input.clientEmail})`,
      });

      return { success: true, id: testimonialId };
    }),

  save: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(),
        clientName: z.string().min(1),
        clientEmail: z.string().email().optional(),
        reviewText: z.string().min(10),
        rating: z.number().min(1).max(5).default(5),
        source: z.enum(["google", "zillow", "realtor", "manual", "other"]).default("manual"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      if (input.id) {
        await db
          .update(testimonials)
          .set({
            reviewText: input.reviewText,
            rating: input.rating,
            source: input.source,
            status: "received",
            receivedAt: new Date(),
          })
          .where(eq(testimonials.id, input.id));
        return { id: input.id };
      } else {
        const [result] = await db.insert(testimonials).values({
          userId: ctx.user.id,
          clientName: input.clientName,
          clientEmail: input.clientEmail,
          reviewText: input.reviewText,
          rating: input.rating,
          source: input.source,
          status: "received",
          receivedAt: new Date(),
        });
        return { id: (result as any).insertId };
      }
    }),

  generatePost: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [testimonial] = await db
        .select()
        .from(testimonials)
        .where(eq(testimonials.id, input.id))
        .limit(1);
      if (!testimonial || testimonial.userId !== ctx.user.id) throw new Error("Not found");
      if (!testimonial.reviewText) throw new Error("No review text to generate from");

      const persona = await getPersonaByUserId(ctx.user.id);
      const agentName = persona?.agentName || "Your Agent";
      const city = persona?.primaryCity || "the area";

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a real estate social media expert. Turn client testimonials into compelling social media posts that build trust and generate referrals. Agent: ${agentName}, Market: ${city}.`,
          },
          {
            role: "user",
            content: `Turn this client review into 2 social media posts:\n\nClient: ${testimonial.clientName}\nReview: "${testimonial.reviewText}"\nRating: ${testimonial.rating}/5 stars\n\nPost 1: Instagram/Facebook (emotional, storytelling angle)\nPost 2: LinkedIn (professional, results-focused angle)\n\nInclude relevant emojis and hashtags.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "testimonial_posts",
            strict: true,
            schema: {
              type: "object",
              properties: {
                instagramPost: { type: "string" },
                linkedinPost: { type: "string" },
                storyCaption: { type: "string" },
              },
              required: ["instagramPost", "linkedinPost", "storyCaption"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      const posts = JSON.parse(typeof content === "string" ? content : "{}");

      await db
        .update(testimonials)
        .set({
          socialPostText: JSON.stringify(posts),
          status: "published",
        })
        .where(eq(testimonials.id, input.id));

      return posts;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.delete(testimonials).where(eq(testimonials.id, input.id));
      return { success: true };
    }),
});
