/**
 * Email Drip Sequences Router
 *
 * - Create multi-step email sequences (using existing letter templates as base)
 * - Enroll contacts into sequences
 * - Cron-triggered daily processor sends next email in sequence
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { dripSequences, dripEnrollments } from "../../drizzle/schema";
import { eq, desc, and, lte } from "drizzle-orm";
import { sendEmail } from "../emailService";
import { getPersonaByUserId } from "../db";
import { invokeLLM } from "../_core/llm";

const SEQUENCE_TYPES = ["seller_nurture", "buyer_nurture", "past_client", "open_house", "custom"] as const;

// Pre-built starter sequences
const STARTER_SEQUENCES: Record<string, { name: string; description: string; steps: Array<{ subject: string; body: string; delayDays: number }> }> = {
  seller_nurture: {
    name: "Seller Nurture (5 emails)",
    description: "Convert potential sellers over 4 weeks with market insights and value",
    steps: [
      { delayDays: 0, subject: "What's your home worth in today's market?", body: "Hi {{name}},\n\nI wanted to reach out because the market in our area has been moving quickly, and homeowners are often surprised by what their home is worth right now.\n\nI'd love to put together a complimentary market analysis for your home — no obligation, just real numbers.\n\nWould you be open to a quick 15-minute call this week?\n\n{{agentName}}" },
      { delayDays: 7, subject: "3 things happening in our market right now", body: "Hi {{name}},\n\nJust a quick update on what I'm seeing in our local market:\n\n1. Inventory is still tight — buyers are competing for well-priced homes\n2. Interest rates have been creating urgency among buyers\n3. Homes that are priced right are selling in days, not weeks\n\nIf you've been thinking about making a move, now is a great time to have a conversation. I'm happy to walk you through what your home could sell for.\n\n{{agentName}}" },
      { delayDays: 14, subject: "A home just sold near you", body: "Hi {{name}},\n\nI wanted to share some good news — a home near you recently sold, and the results were strong.\n\nThis is exactly the kind of activity that tells us the market is healthy for sellers right now.\n\nIf you're curious what your home might sell for in today's market, I'd be happy to put together a personalized analysis. It takes about 20 minutes and there's no pressure or obligation.\n\n{{agentName}}" },
      { delayDays: 21, subject: "Thinking about selling? Here's what to expect", body: "Hi {{name}},\n\nI know making a move is a big decision, so I wanted to share a quick overview of what the selling process looks like today:\n\n• Most well-priced homes are going under contract within 2-3 weeks\n• Preparation matters — I'll walk you through exactly what to do (and what not to do) before listing\n• My marketing plan includes professional photos, video, and targeted digital ads\n\nWould you like to sit down and talk through your options? No pressure — just a conversation.\n\n{{agentName}}" },
      { delayDays: 28, subject: "Last note from me for a while", body: "Hi {{name}},\n\nI've sent a few notes over the past month and I don't want to be a bother. This will be my last check-in for a while.\n\nIf you ever want to explore your options — whether that's selling, refinancing, or just understanding your home's value — I'm always here.\n\nFeel free to reach out anytime. I'd love to help when the time is right.\n\n{{agentName}}" },
    ],
  },
  buyer_nurture: {
    name: "Buyer Nurture (4 emails)",
    description: "Guide potential buyers from curious to committed over 3 weeks",
    steps: [
      { delayDays: 0, subject: "Ready to find your perfect home?", body: "Hi {{name}},\n\nThank you for your interest in buying a home in our area! I'm excited to help you find the right fit.\n\nThe market right now has some great opportunities, and I'd love to walk you through what's available and what to expect in the buying process.\n\nWould you be available for a quick call this week? I can answer any questions and help you get started.\n\n{{agentName}}" },
      { delayDays: 7, subject: "The home buying process — simplified", body: "Hi {{name}},\n\nBuying a home can feel overwhelming, but it doesn't have to be. Here's the process in plain English:\n\n1. Get pre-approved (I can connect you with a great lender)\n2. Define your must-haves vs. nice-to-haves\n3. Tour homes that fit your criteria\n4. Make an offer — I'll guide you every step\n5. Close and get your keys!\n\nThe whole process typically takes 30-60 days once you're pre-approved. I'll be with you at every step.\n\n{{agentName}}" },
      { delayDays: 14, subject: "New listings that might interest you", body: "Hi {{name}},\n\nI've been keeping an eye out for homes that match what you're looking for, and I wanted to share a few that caught my attention.\n\nIf any of these look interesting, I'd love to schedule a showing. The best homes go fast, so it's worth acting quickly when something feels right.\n\nReply to this email or give me a call and we'll set something up.\n\n{{agentName}}" },
      { delayDays: 21, subject: "Are you still looking?", body: "Hi {{name}},\n\nI wanted to check in and see where you are in your home search. Sometimes the timing isn't quite right, and that's completely okay.\n\nWhenever you're ready — whether that's next month or next year — I'm here to help. I'll make sure you're the first to know when the right home hits the market.\n\n{{agentName}}" },
    ],
  },
  past_client: {
    name: "Past Client Check-In (3 emails)",
    description: "Stay top of mind with past clients for referrals and repeat business",
    steps: [
      { delayDays: 0, subject: "Checking in — how's the home?", body: "Hi {{name}},\n\nI was thinking about you and wanted to reach out! How are you enjoying your home?\n\nIf there's anything you need — whether it's a contractor recommendation, questions about your home's value, or just a chat — I'm always here.\n\nAlso, if you know anyone who's thinking about buying or selling, I'd love to help them the way I helped you.\n\n{{agentName}}" },
      { delayDays: 30, subject: "Your home's value has probably changed", body: "Hi {{name}},\n\nI wanted to share something useful — home values in our area have shifted since you bought, and you might be surprised at where you stand today.\n\nIf you're curious about your current equity or what your home might sell for, I'd be happy to put together a quick analysis. No obligation — just good information to have.\n\n{{agentName}}" },
      { delayDays: 60, subject: "A quick favor to ask", body: "Hi {{name}},\n\nI hope everything is going well! I have a small favor to ask.\n\nIf you've been happy with my service, I'd be so grateful if you could leave me a quick review on Google or Zillow. It only takes a minute and it means the world to me.\n\nAnd as always — if you know anyone who needs a great agent, I'd love to help them too.\n\nThank you so much!\n\n{{agentName}}" },
    ],
  },
};

export const dripRouter = router({
  listSequences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    return db
      .select()
      .from(dripSequences)
      .where(and(eq(dripSequences.userId, ctx.user.id), eq(dripSequences.isActive, true)))
      .orderBy(desc(dripSequences.createdAt));
  }),

  getStarterSequences: protectedProcedure.query(async () => {
    return Object.entries(STARTER_SEQUENCES).map(([key, seq]) => ({
      key,
      name: seq.name,
      description: seq.description,
      stepCount: seq.steps.length,
    }));
  }),

  createFromStarter: protectedProcedure
    .input(z.object({ starterKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const starter = STARTER_SEQUENCES[input.starterKey];
      if (!starter) throw new Error("Starter sequence not found");

      const [result] = await db.insert(dripSequences).values({
        userId: ctx.user.id,
        name: starter.name,
        description: starter.description,
        sequenceType: (input.starterKey as any) || "custom",
        steps: JSON.stringify(starter.steps),
        isActive: true,
      });
      return { id: (result as any)?.id };
    }),

  createCustom: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        sequenceType: z.enum(SEQUENCE_TYPES).default("custom"),
        steps: z.array(
          z.object({
            subject: z.string(),
            body: z.string(),
            delayDays: z.number().min(0),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [result] = await db.insert(dripSequences).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        sequenceType: input.sequenceType,
        steps: JSON.stringify(input.steps),
        isActive: true,
      });
      return { id: (result as any)?.id };
    }),

  listEnrollments: protectedProcedure
    .input(z.object({ sequenceId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const conditions = [eq(dripEnrollments.userId, ctx.user.id)];
      if (input.sequenceId) {
        conditions.push(eq(dripEnrollments.sequenceId, input.sequenceId));
      }
      return db
        .select()
        .from(dripEnrollments)
        .where(and(...conditions))
        .orderBy(desc(dripEnrollments.enrolledAt))
        .limit(200);
    }),

  enroll: protectedProcedure
    .input(
      z.object({
        sequenceId: z.number(),
        contacts: z.array(
          z.object({
            name: z.string(),
            email: z.string().email(),
          })
        ),
        startImmediately: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Verify sequence ownership
      const [seq] = await db
        .select()
        .from(dripSequences)
        .where(and(eq(dripSequences.id, input.sequenceId), eq(dripSequences.userId, ctx.user.id)))
        .limit(1);
      if (!seq) throw new Error("Sequence not found");

      const steps = JSON.parse(seq.steps) as Array<{ delayDays: number }>;
      const firstDelay = steps[0]?.delayDays || 0;

      const nextSendAt = new Date();
      if (!input.startImmediately) {
        nextSendAt.setDate(nextSendAt.getDate() + firstDelay);
      }

      let enrolled = 0;
      for (const contact of input.contacts) {
        await db
          .insert(dripEnrollments)
          .values({
            sequenceId: input.sequenceId,
            userId: ctx.user.id,
            contactName: contact.name,
            contactEmail: contact.email,
            currentStep: 0,
            nextSendAt,
            status: "active",
          })
          .catch(() => {}); // Skip duplicates
        enrolled++;
      }

      return { enrolled };
    }),

  unenroll: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(dripEnrollments)
        .set({ status: "unsubscribed" })
        .where(
          and(
            eq(dripEnrollments.id, input.enrollmentId),
            eq(dripEnrollments.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  // Called by cron job daily — processes all due emails
  processQueue: protectedProcedure.mutation(async ({ ctx }) => {
    return processAllDueEmails(ctx.user.id);
  }),
});

// Exported for use in cron job
export async function processAllDueEmails(userId?: number) {
  const db = await getDb();
  if (!db) return { processed: 0 };

  const now = new Date();
  const conditions = [
    eq(dripEnrollments.status, "active"),
    lte(dripEnrollments.nextSendAt, now),
  ];
  if (userId) conditions.push(eq(dripEnrollments.userId, userId));

  const dueEnrollments = await db
    .select()
    .from(dripEnrollments)
    .where(and(...conditions))
    .limit(100);

  let processed = 0;

  for (const enrollment of dueEnrollments) {
    try {
      const [seq] = await db
        .select()
        .from(dripSequences)
        .where(eq(dripSequences.id, enrollment.sequenceId))
        .limit(1);
      if (!seq) continue;

      const steps = JSON.parse(seq.steps) as Array<{
        subject: string;
        body: string;
        delayDays: number;
      }>;

      const step = steps[enrollment.currentStep];
      if (!step) {
        // Sequence complete
        await db
          .update(dripEnrollments)
          .set({ status: "completed", completedAt: now })
          .where(eq(dripEnrollments.id, enrollment.id));
        continue;
      }

      // Get agent persona for personalization
      const persona = await getPersonaByUserId(enrollment.userId);
      const agentName = persona?.agentName || "Your Agent";

      // Personalize the email
      const personalizedBody = step.body
        .replace(/\{\{name\}\}/g, enrollment.contactName || "there")
        .replace(/\{\{agentName\}\}/g, agentName);

      const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
        <tr><td style="background:#0f172a;padding:28px 40px;">
          <span style="font-size:20px;font-weight:700;color:#ffffff;">${agentName}</span>
        </td></tr>
        <tr><td style="padding:40px;color:#1a1a1a;font-size:15px;line-height:1.8;white-space:pre-line;">
          ${personalizedBody.replace(/\n/g, "<br/>")}
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #e5e5e5;text-align:center;color:#999;font-size:12px;">
          <p style="margin:0;">© ${new Date().getFullYear()} ${agentName} · Powered by Amped Agent</p>
          <p style="margin:4px 0 0;"><a href="https://ampedagent.app/unsubscribe?e=${encodeURIComponent(enrollment.contactEmail)}&s=${enrollment.sequenceId}" style="color:#999;">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      await sendEmail({
        to: enrollment.contactEmail,
        subject: step.subject.replace(/\{\{agentName\}\}/g, agentName),
        html,
        fallbackTitle: `Drip email step ${enrollment.currentStep + 1} to ${enrollment.contactEmail}`,
      });

      // Advance to next step
      const nextStep = enrollment.currentStep + 1;
      if (nextStep >= steps.length) {
        await db
          .update(dripEnrollments)
          .set({
            status: "completed",
            completedAt: now,
            emailsSent: (enrollment.emailsSent || 0) + 1,
            lastEmailSentAt: now,
            currentStep: nextStep,
          })
          .where(eq(dripEnrollments.id, enrollment.id));
      } else {
        const nextDelay = steps[nextStep].delayDays;
        const nextSendAt = new Date();
        nextSendAt.setDate(nextSendAt.getDate() + nextDelay);
        await db
          .update(dripEnrollments)
          .set({
            currentStep: nextStep,
            nextSendAt,
            emailsSent: (enrollment.emailsSent || 0) + 1,
            lastEmailSentAt: now,
          })
          .where(eq(dripEnrollments.id, enrollment.id));
      }

      processed++;
    } catch (err) {
      console.error(`[DripProcessor] Error processing enrollment ${enrollment.id}:`, err);
    }
  }

  return { processed };
}
