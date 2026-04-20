/**
 * Open House Router
 *
 * - Create open house event + generate QR code URL
 * - Public lead capture (no auth — visitors sign in via QR)
 * - View leads per open house
 * - Auto-queue follow-up emails on lead capture
 */
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { openHouses, openHouseLeads, crmLeads } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { sendEmail } from "../emailService";
import { sendSMS, openHouseSMSTemplate, isTwilioConfigured } from "../sms";
import { getPersonaByUserId } from "../db";
import { nanoid } from "nanoid";
import { pushLeadToAllCrms } from "../crmService";

const SITE_URL = "https://ampedagent.app";
const BRAND_COLOR = "#f97316";

export function openHouseFollowUpEmail(params: {
  agentName: string;
  agentPhone?: string;
  agentEmail?: string;
  visitorName: string;
  address: string;
  emailNumber: number;
  bookingUrl?: string;
}): { subject: string; html: string } {
  const { agentName, agentPhone, agentEmail, visitorName, address, emailNumber, bookingUrl } = params;

  const subjects = [
    `Great meeting you at ${address}!`,
    `Still thinking about ${address}?`,
    `A quick update on ${address}`,
  ];

  const bodies = [
    `<p>Hi ${visitorName},</p>
    <p>It was wonderful meeting you at the open house today at <strong>${address}</strong>. I hope you loved the home as much as I do!</p>
    <p>I'm here to answer any questions — about the property, the neighborhood, financing, or anything else on your mind. Just reply to this email or give me a call.</p>
    ${bookingUrl ? `<p><a href="${bookingUrl}" style="display:inline-block;padding:12px 24px;background:${BRAND_COLOR};color:#fff;font-weight:600;text-decoration:none;border-radius:8px;">Schedule a Private Showing</a></p>` : ""}`,

    `<p>Hi ${visitorName},</p>
    <p>I wanted to follow up on the open house at <strong>${address}</strong>. Properties like this don't stay on the market long, and I'd hate for you to miss out.</p>
    <p>If you'd like to take a second look or have any questions about the home, I'm happy to arrange a private showing at your convenience.</p>
    ${bookingUrl ? `<p><a href="${bookingUrl}" style="display:inline-block;padding:12px 24px;background:${BRAND_COLOR};color:#fff;font-weight:600;text-decoration:none;border-radius:8px;">Book a Private Showing</a></p>` : ""}`,

    `<p>Hi ${visitorName},</p>
    <p>I'm reaching out one more time about <strong>${address}</strong>. Whether you're still considering this home or looking for something different, I'd love to help you find the right fit.</p>
    <p>As a local expert, I have access to listings before they hit the market. Let's connect and talk about what you're looking for.</p>
    ${bookingUrl ? `<p><a href="${bookingUrl}" style="display:inline-block;padding:12px 24px;background:${BRAND_COLOR};color:#fff;font-weight:600;text-decoration:none;border-radius:8px;">Let's Connect</a></p>` : ""}`,
  ];

  const idx = Math.min(emailNumber - 1, 2);

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
        <tr><td style="background:#0f172a;padding:28px 40px;">
          <span style="font-size:20px;font-weight:700;color:#ffffff;">${agentName}</span>
        </td></tr>
        <tr><td style="padding:40px;color:#1a1a1a;font-size:15px;line-height:1.7;">
          ${bodies[idx]}
          <p style="margin:24px 0 0;color:#666;font-size:13px;">
            ${agentPhone ? `📞 ${agentPhone}` : ""}
            ${agentEmail ? ` · ✉️ ${agentEmail}` : ""}
          </p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #e5e5e5;text-align:center;color:#999;font-size:12px;">
          <p style="margin:0;">© ${new Date().getFullYear()} ${agentName} · Powered by Amped Agent</p>
          <p style="margin:4px 0 0;"><a href="${SITE_URL}/unsubscribe" style="color:#999;">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject: subjects[idx], html };
}

export const openHouseRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    return db
      .select()
      .from(openHouses)
      .where(eq(openHouses.userId, ctx.user.id))
      .orderBy(desc(openHouses.createdAt))
      .limit(50);
  }),

  getLeads: protectedProcedure
    .input(z.object({ openHouseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      // Verify ownership
      const [oh] = await db
        .select()
        .from(openHouses)
        .where(and(eq(openHouses.id, input.openHouseId), eq(openHouses.userId, ctx.user.id)))
        .limit(1);
      if (!oh) throw new Error("Not found");
      return db
        .select()
        .from(openHouseLeads)
        .where(eq(openHouseLeads.openHouseId, input.openHouseId))
        .orderBy(desc(openHouseLeads.createdAt));
    }),

  create: protectedProcedure
    .input(
      z.object({
        address: z.string().min(5),
        city: z.string().optional(),
        date: z.string(), // ISO date string
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        price: z.string().optional(),
        followUpSequence: z.enum(["none", "3email", "5email"]).default("3email"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const slug = nanoid(10);
      const [result] = await db.insert(openHouses).values({
        userId: ctx.user.id,
        address: input.address,
        city: input.city,
        date: new Date(input.date),
        startTime: input.startTime,
        endTime: input.endTime,
        price: input.price,
        publicSlug: slug,
        followUpSequence: input.followUpSequence,
        isActive: true,
      });
      const id = (result as any)?.id;
      const qrUrl = `${SITE_URL}/open-house/${slug}`;
      return { id, slug, qrUrl };
    }),

  deactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(openHouses)
        .set({ isActive: false })
        .where(and(eq(openHouses.id, input.id), eq(openHouses.userId, ctx.user.id)));
      return { success: true };
    }),

  // Public endpoint — no auth required (visitors sign in via QR code)
  getPublicInfo: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [oh] = await db
        .select({
          id: openHouses.id,
          address: openHouses.address,
          city: openHouses.city,
          date: openHouses.date,
          startTime: openHouses.startTime,
          endTime: openHouses.endTime,
          price: openHouses.price,
          isActive: openHouses.isActive,
          agentUserId: openHouses.userId,
          listingPrice: openHouses.price,
          bedrooms: openHouses.bedrooms,
          bathrooms: openHouses.bathrooms,
          followUpSequence: openHouses.followUpSequence,
        })
        .from(openHouses)
        .where(eq(openHouses.publicSlug, input.slug))
        .limit(1);
      if (!oh || !oh.isActive) throw new Error("Open house not found or closed");
      // Get agent name from persona
      const persona = await getPersonaByUserId(oh.agentUserId);
      return {
        ...oh,
        agentName: persona?.agentName || "Your Agent",
      };
    }),

  // Public lead capture — no auth required
  capturePublicLead: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        timeframe: z.string().optional(),
        preApproved: z.boolean().optional(),
        smsConsent: z.boolean().optional().default(false), // TCPA consent for SMS follow-up
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [oh] = await db
        .select()
        .from(openHouses)
        .where(eq(openHouses.publicSlug, input.slug))
        .limit(1);
      if (!oh || !oh.isActive) throw new Error("Open house not found or closed");

      // Save lead
      const nextFollowUp = new Date();
      nextFollowUp.setDate(nextFollowUp.getDate() + 1); // First follow-up next day

      const [leadResult] = await db.insert(openHouseLeads).values({
        openHouseId: oh.id,
        agentUserId: oh.userId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        timeframe: input.timeframe,
        preApproved: input.preApproved ?? false,
        followUpStatus: oh.followUpSequence === "none" ? "completed" : "pending",
        nextFollowUpAt: oh.followUpSequence === "none" ? null : nextFollowUp,
        smsConsent: input.smsConsent ?? false,
        smsConsentTimestamp: input.smsConsent ? new Date() : null,
      });

      // Also add to CRM leads and back-link the ID
      if (input.email || input.phone) {
        try {
          const [crmResult] = await db.insert(crmLeads).values({
            userId: oh.userId,
            name: input.name,
            email: input.email,
            phone: input.phone,
            stage: "new",
            source: "open_house",
            sourceRef: oh.address,
          });
          const crmLeadId = (crmResult as any)?.id;
          if (crmLeadId) {
            const leadId = (leadResult as any)?.id;
            await db
              .update(openHouseLeads)
              .set({ crmLeadId })
              .where(eq(openHouseLeads.id, leadId))
              .catch(() => {});
          }
        } catch {
          // Non-blocking — CRM insert failure should not break sign-in
        }
      }

      // Push lead to external CRMs (Lofty, Follow Up Boss, kvCORE) — non-blocking
      pushLeadToAllCrms(oh.userId, {
        firstName: input.name.split(" ")[0],
        lastName: input.name.split(" ").slice(1).join(" ") || undefined,
        email: input.email,
        phone: input.phone,
        source: "Open House",
        message: `Open house visitor at ${oh.address}`,
        propertyAddress: oh.address,
      }).catch(() => {});

      // Send immediate follow-up email if email provided and sequence is active
      if (input.email && oh.followUpSequence !== "none") {
        // Get agent persona for email personalization
        const persona = await getPersonaByUserId(oh.userId);
        const agentName = persona?.agentName || "Your Agent";
        const agentPhone = persona?.phoneNumber ?? undefined;
        const agentEmail = persona?.emailAddress ?? undefined;
        const bookingUrl = persona?.bookingUrl ?? undefined;

        const { subject, html } = openHouseFollowUpEmail({
          agentName,
          agentPhone,
          agentEmail,
          visitorName: input.name,
          address: oh.address,
          emailNumber: 1,
          bookingUrl,
        });

        await sendEmail({
          to: input.email,
          subject,
          html,
          fallbackTitle: `Open house follow-up #1 to ${input.name}`,
        }).catch(() => {});

        // Update emails sent count
        await db
          .update(openHouseLeads)
          .set({ emailsSent: 1 })
          .where(eq(openHouseLeads.id, (leadResult as any)?.id))
          .catch(() => {});
      }

      return { success: true };
    }),

  // Send follow-up email manually
  sendFollowUp: protectedProcedure
    .input(z.object({ leadId: z.number(), emailNumber: z.number().min(1).max(5) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [lead] = await db
        .select()
        .from(openHouseLeads)
        .where(and(eq(openHouseLeads.id, input.leadId), eq(openHouseLeads.agentUserId, ctx.user.id)))
        .limit(1);
      if (!lead) throw new Error("Lead not found");
      if (!lead.email) throw new Error("No email address for this lead");

      const [oh] = await db
        .select()
        .from(openHouses)
        .where(eq(openHouses.id, lead.openHouseId))
        .limit(1);

      const persona = await getPersonaByUserId(ctx.user.id);
      const agentName = persona?.agentName || "Your Agent";

      const { subject, html } = openHouseFollowUpEmail({
        agentName,
        agentPhone: persona?.phoneNumber ?? undefined,
        agentEmail: persona?.emailAddress ?? undefined,
        visitorName: lead.name,
        address: oh?.address || "the property",
        emailNumber: input.emailNumber,
        bookingUrl: persona?.bookingUrl ?? undefined,
      });

      const sent = await sendEmail({ to: lead.email, subject, html });
      if (sent) {
        await db
          .update(openHouseLeads)
          .set({
            emailsSent: (lead.emailsSent || 0) + 1,
          })
          .where(eq(openHouseLeads.id, input.leadId));
      }

      return { success: sent };
    }),

  // Send SMS follow-up to a lead (consent-gated)
  sendSMSFollowUp: protectedProcedure
    .input(z.object({ leadId: z.number(), messageNumber: z.union([z.literal(1), z.literal(2), z.literal(3)]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [lead] = await db
        .select()
        .from(openHouseLeads)
        .where(and(eq(openHouseLeads.id, input.leadId), eq(openHouseLeads.agentUserId, ctx.user.id)))
        .limit(1);
      if (!lead) throw new Error("Lead not found");
      if (!lead.phone) throw new Error("No phone number for this lead");
      if (!lead.smsConsent) throw new Error("Lead has not consented to SMS");
      if (lead.smsOptedOut) throw new Error("Lead has opted out of SMS");

      const [oh] = await db
        .select()
        .from(openHouses)
        .where(eq(openHouses.id, lead.openHouseId))
        .limit(1);

      const persona = await getPersonaByUserId(ctx.user.id);
      const agentName = persona?.agentName || "Your Agent";

      const body = openHouseSMSTemplate({
        agentName,
        visitorName: lead.name,
        address: oh?.address || "the property",
        messageNumber: input.messageNumber,
        bookingUrl: persona?.bookingUrl ?? undefined,
      });

      const result = await sendSMS({
        to: lead.phone,
        body,
        consentVerified: true,
      });

      if (result.success) {
        await db
          .update(openHouseLeads)
          .set({ smsSent: (lead.smsSent || 0) + 1 })
          .where(eq(openHouseLeads.id, input.leadId));
      }

      return { success: result.success, error: result.error };
    }),

  // Check if Twilio is configured
  getTwilioStatus: protectedProcedure.query(async () => {
    return { configured: isTwilioConfigured() };
  }),
});
