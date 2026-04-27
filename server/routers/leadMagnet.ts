import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { pushLeadToAllCrms } from "../crmService";
import { fireZapierWebhook } from "../zapierService";
import { invokeLLM } from "../_core/llm";
import * as db from "../db";
import { createContentPost } from "../db";
import { storagePut } from "../storage";
import { getDb } from "../db";
import { leadMagnets } from "../../drizzle/schema";
import { eq, desc, inArray } from "drizzle-orm";
import PDFDocument from "pdfkit";
import { notifyOwner } from "../_core/notification";
import QRCode from "qrcode";
import { getMarketData } from "../marketStatsHelper";

/**
 * Lead Magnet Generator Router
 * Generates branded PDF lead magnets for real estate agents:
 * - First-Time Buyer Guide
 * - Neighborhood Report
 * - Market Update
 *
 * PDF generation is done server-side using html-pdf-node (headless Chromium).
 * The PDF is uploaded to S3 and a public URL is returned.
 */

const LEAD_MAGNET_TYPES = ["buyer_guide", "neighborhood_report", "market_update"] as const;
type LeadMagnetType = typeof LEAD_MAGNET_TYPES[number];

const typeLabels: Record<LeadMagnetType, string> = {
  buyer_guide: "First-Time Buyer Guide",
  neighborhood_report: "Neighborhood Report",
  market_update: "Market Update",
};

export const leadMagnetRouter = router({
  /**
   * Generate the content for a lead magnet using AI, then render it as a PDF.
   * Returns a public URL to the generated PDF.
   */
  generate: protectedProcedure
    .input(
      z.object({
        type: z.enum(LEAD_MAGNET_TYPES),
        city: z.string().min(2, "City is required"),
        agentName: z.string().optional(),
        agentPhone: z.string().optional(),
        agentEmail: z.string().optional(),
        agentBrokerage: z.string().optional(),
        agentWebsite: z.string().optional(),
        // For neighborhood report
        neighborhood: z.string().optional(),
        // For market update
        month: z.string().optional(), // e.g. "March 2026"
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { type, city } = input;
      const persona = await db.getPersonaByUserId(ctx.user.id);

      const agentName = input.agentName || persona?.agentName || "Your Agent";
      const agentPhone = input.agentPhone || persona?.phoneNumber || "";
      const agentEmail = input.agentEmail || ctx.user.email || "";
      const agentBrokerage = input.agentBrokerage || persona?.brokerageName || "";
      const primaryColor = persona?.primaryColor || "#1a3a5c";

      // Step 1: Fetch real market data for market-related types
      let realMarketData: any = null;
      if (type === 'market_update' || type === 'neighborhood_report') {
        try {
          const locationQuery = type === 'neighborhood_report' && input.neighborhood
            ? `${input.neighborhood}, ${city}`
            : city;
          realMarketData = await getMarketData(locationQuery);
          console.log(`[LeadMagnet] Fetched real market data for ${locationQuery}:`, {
            medianPrice: realMarketData.medianPrice,
            daysOnMarket: realMarketData.daysOnMarket,
            activeListings: realMarketData.activeListings,
          });
        } catch (err) {
          console.warn('[LeadMagnet] Could not fetch real market data, falling back to LLM estimates:', err);
        }
      }

      // Step 2: Generate content via LLM (with real data injected when available)
      const contentPrompt = buildContentPrompt(type, {
        city,
        agentName,
        neighborhood: input.neighborhood,
        month: input.month || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        realMarketData,
      });

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a professional real estate content writer creating a branded lead magnet PDF for ${agentName}, a real estate agent in ${city}. 
Write authoritative, helpful, and locally relevant content. Return ONLY valid JSON matching the schema provided.`,
          },
          { role: "user", content: contentPrompt },
        ],
        response_format: { type: "json_object" },
      });

      const raw =
        typeof response.choices[0].message.content === "string"
          ? response.choices[0].message.content
          : JSON.stringify(response.choices[0].message.content);

      let content: any;
      try {
        content = JSON.parse(raw);
      } catch {
        throw new Error("AI returned invalid content. Please try again.");
      }

      // Step 2: Render PDF using PDFKit (pure Node.js, no system deps)
      const agentWebsite = input.agentWebsite || persona?.websiteUrl || "";
      const pdfBuffer = await buildPdfWithPDFKit({
        type,
        content,
        agentName,
        agentPhone,
        agentEmail,
        agentBrokerage,
        agentWebsite,
        city,
        primaryColor,
        neighborhood: input.neighborhood,
        month: input.month,
      });

      // Step 3: Upload to S3
      const suffix = Math.random().toString(36).slice(2, 8);
      const fileKey = `lead-magnets/${ctx.user.id}/${type}-${suffix}.pdf`;
      const { url } = await storagePut(fileKey, pdfBuffer, "application/pdf");

      // Step 4: Save to lead_magnets table for My Lead Magnets library
      const database = await getDb();
      if (!database) throw new Error("Database unavailable");
      // Map frontend type to schema enum
      const schemaType = type === "buyer_guide" ? "first_time_buyer_guide" : type as "neighborhood_report" | "market_update";
      await database.insert(leadMagnets).values({
        userId: ctx.user.id,
        type: schemaType,
        title: `${typeLabels[type]} — ${city}`,
        city,
        agentName,
        agentBrokerage: agentBrokerage || undefined,
        pdfUrl: url,
      });

      // Step 5: Save a draft content post for the content calendar
      await createContentPost({
        userId: ctx.user.id,
        content: content?.introduction || content?.intro || `${typeLabels[type]} for ${city}`,
        title: `${typeLabels[type]} — ${city}`,
        contentType: "market_report",
        aiGenerated: true,
        status: "draft",
      });

      return {
        type,
        label: typeLabels[type],
        city,
        pdfUrl: url,
        agentName,
        agentPhone,
        agentEmail,
        agentBrokerage,
        primaryColor,
        content,
      };
    }),

  /**
   * Get all lead magnets for the current user
   */
  getMyLeadMagnets: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) return [];
    const results = await database
      .select()
      .from(leadMagnets)
      .where(eq(leadMagnets.userId, ctx.user.id))
      .orderBy(desc(leadMagnets.createdAt));
    return results;
  }),

  /**
   * Delete a lead magnet by ID (only owner can delete)
   */
  deleteLeadMagnet: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database unavailable");
      await database
        .delete(leadMagnets)
        .where(
          eq(leadMagnets.id, input.id)
        );
      return { success: true };
    }),

  /**
   * Bulk delete multiple lead magnets by ID (must belong to the authenticated user)
   */
  bulkDeleteLeadMagnets: protectedProcedure
    .input(z.object({ ids: z.array(z.number()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database unavailable");
      await database
        .delete(leadMagnets)
        .where(
          inArray(leadMagnets.id, input.ids)
        );
      return { success: true, deleted: input.ids.length };
    }),

  /**
   * Send a lead magnet PDF link via email notification
   */
  sendByEmail: protectedProcedure
    .input(z.object({
      recipientEmail: z.string().email("Please enter a valid email address"),
      recipientName: z.string().optional(),
      pdfUrl: z.string().url(),
      magnetLabel: z.string(),
      agentName: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { recipientEmail, recipientName, pdfUrl, magnetLabel, agentName } = input;
      const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";
      await notifyOwner({
        title: `Lead Magnet Sent: ${magnetLabel} → ${recipientEmail}`,
        content: `Agent ${agentName} (${ctx.user.email}) sent a lead magnet to ${recipientEmail}${recipientName ? ` (${recipientName})` : ""}\n\nMagnet: ${magnetLabel}\nPDF URL: ${pdfUrl}\n\n--- Email sent to recipient ---\n${greeting}\n\n${agentName} has shared a free resource with you:\n\n📄 ${magnetLabel}\n\nDownload your copy here:\n${pdfUrl}\n\nThis guide was created specifically for your local market. Feel free to reach out to ${agentName} with any questions.\n\nBest regards,\n${agentName}`,
      });
      // Push recipient as a lead to external CRMs — non-blocking
      pushLeadToAllCrms(ctx.user.id, {
        firstName: recipientName ? recipientName.split(" ")[0] : "Lead",
        lastName: recipientName ? (recipientName.split(" ").slice(1).join(" ") || undefined) : undefined,
        email: recipientEmail,
        source: "Lead Magnet",
        message: `Downloaded lead magnet: ${magnetLabel}`,
      }).catch(() => {});
      // Fire Zapier webhook for lead magnet download — non-blocking
      fireZapierWebhook(ctx.user.id, "lead_magnet_download", {
        firstName: recipientName ? recipientName.split(" ")[0] : "Lead",
        lastName: recipientName ? (recipientName.split(" ").slice(1).join(" ") || undefined) : undefined,
        email: recipientEmail,
        source: "Lead Magnet",
        magnetTitle: magnetLabel,
        message: `Downloaded lead magnet: ${magnetLabel}`,
      }).catch(() => {});
      return { success: true, sentTo: recipientEmail };
    }),
});

// ============ CONTENT PROMPT BUILDERS ============

function buildContentPrompt(
  type: LeadMagnetType,
  ctx: { city: string; agentName: string; neighborhood?: string; month?: string; realMarketData?: any }
): string {
  const { city, agentName, neighborhood, month, realMarketData } = ctx;

  if (type === "buyer_guide") {
    return `Create a comprehensive First-Time Buyer Guide for ${city}. Return this exact JSON:
{
  "title": "The ${city} First-Time Buyer Guide",
  "subtitle": "Everything you need to know before buying your first home",
  "introduction": "2-3 sentence warm intro paragraph",
  "sections": [
    {
      "heading": "Step 1: Get Pre-Approved",
      "content": "2-3 sentences explaining this step with local context for ${city}",
      "tip": "Pro tip: one actionable sentence"
    },
    {
      "heading": "Step 2: Define Your Must-Haves",
      "content": "2-3 sentences",
      "tip": "Pro tip: one actionable sentence"
    },
    {
      "heading": "Step 3: Find the Right Neighborhood",
      "content": "2-3 sentences with ${city}-specific context",
      "tip": "Pro tip: one actionable sentence"
    },
    {
      "heading": "Step 4: Make a Competitive Offer",
      "content": "2-3 sentences about the ${city} market",
      "tip": "Pro tip: one actionable sentence"
    },
    {
      "heading": "Step 5: Navigate Inspections & Closing",
      "content": "2-3 sentences",
      "tip": "Pro tip: one actionable sentence"
    }
  ],
  "closingMessage": "2-3 sentence warm closing message from ${agentName}",
  "faqItems": [
    { "question": "How much do I need for a down payment in ${city}?", "answer": "2-3 sentences" },
    { "question": "How long does the buying process take?", "answer": "2-3 sentences" },
    { "question": "What are closing costs in ${city}?", "answer": "2-3 sentences" }
  ]
}`;
  }

  if (type === "neighborhood_report") {
    const area = neighborhood || city;
    const marketContext = realMarketData
      ? `\n\nIMPORTANT: Use these REAL market statistics (do not invent numbers):
- Median Home Price: $${realMarketData.medianPrice.toLocaleString()} (${realMarketData.priceChange > 0 ? '+' : ''}${realMarketData.priceChange}% YoY)
- Days on Market: ${realMarketData.daysOnMarket} days
- Active Listings: ${realMarketData.activeListings.toLocaleString()} (${realMarketData.listingsChange > 0 ? '+' : ''}${realMarketData.listingsChange}% YoY)
- Price per Sq Ft: $${realMarketData.pricePerSqft}
- Market Temperature: ${realMarketData.marketTemperature}`
      : '';
    return `Create a Neighborhood Report for ${area}, ${city}.${marketContext} Return this exact JSON:
{
  "title": "${area} Neighborhood Report",
  "subtitle": "Your complete guide to living in ${area}",
  "introduction": "2-3 sentence overview of ${area}",
  "highlights": [
    { "icon": "🏠", "label": "Housing", "value": "Brief description of housing stock and styles" },
    { "icon": "🏫", "label": "Schools", "value": "Brief description of school options" },
    { "icon": "🛒", "label": "Shopping & Dining", "value": "Brief description of local amenities" },
    { "icon": "🌳", "label": "Parks & Recreation", "value": "Brief description of outdoor spaces" },
    { "icon": "🚗", "label": "Commute", "value": "Brief description of commute options" }
  ],
  "marketSnapshot": {
    "heading": "Current Market Snapshot",
    "description": "2-3 sentences about the current real estate market in ${area} based on the real data provided",
    "stats": [
      { "label": "Median Home Price", "value": "${realMarketData ? '$' + realMarketData.medianPrice.toLocaleString() : 'Estimated range for ' + area}" },
      { "label": "Average Days on Market", "value": "${realMarketData ? realMarketData.daysOnMarket + ' days' : 'Estimated range'}" },
      { "label": "Price per Sq Ft", "value": "${realMarketData ? '$' + realMarketData.pricePerSqft + '/sqft' : 'Estimated range'}" }
    ]
  },
  "whyLiveHere": "2-3 compelling sentences about why people love ${area}",
  "closingMessage": "2-3 sentence closing from ${agentName} offering to help"
}`;
  }

  // market_update
  const marketCondition = realMarketData
    ? realMarketData.marketTemperature === 'hot' ? "Seller's Market"
      : realMarketData.marketTemperature === 'cold' ? "Buyer's Market"
      : "Balanced Market"
    : null;
  const realDataBlock = realMarketData
    ? `\n\nIMPORTANT: Use these REAL market statistics (do not invent numbers):
- Median Home Price: $${realMarketData.medianPrice.toLocaleString()} (${realMarketData.priceChange > 0 ? '+' : ''}${realMarketData.priceChange}% YoY)
- Days on Market: ${realMarketData.daysOnMarket} days
- Active Listings: ${realMarketData.activeListings.toLocaleString()} (${realMarketData.listingsChange > 0 ? '+' : ''}${realMarketData.listingsChange}% YoY)
- Price per Sq Ft: $${realMarketData.pricePerSqft}
- Market Temperature: ${realMarketData.marketTemperature} → ${marketCondition}`
    : '';
  return `Create a Market Update for ${city} for ${month}.${realDataBlock} Return this exact JSON:
{
  "title": "${city} Real Estate Market Update",
  "subtitle": "${month} — What Buyers & Sellers Need to Know",
  "introduction": "2-3 sentence market overview for ${city} this month based on the real data provided",
  "marketCondition": "${marketCondition || 'Buyer\'s Market | Seller\'s Market | Balanced Market'}",
  "marketConditionExplanation": "1-2 sentences explaining the current condition",
  "keyStats": [
    { "label": "Median Sale Price", "trend": "${realMarketData ? (realMarketData.priceChange > 0 ? 'up' : realMarketData.priceChange < 0 ? 'down' : 'flat') : 'up | down | flat'}", "value": "${realMarketData ? '$' + realMarketData.medianPrice.toLocaleString() : 'Estimated value or range'}", "note": "${realMarketData ? (realMarketData.priceChange > 0 ? '+' : '') + realMarketData.priceChange + '% year over year' : 'Brief context'}" },
    { "label": "Active Listings", "trend": "${realMarketData ? (realMarketData.listingsChange > 0 ? 'up' : realMarketData.listingsChange < 0 ? 'down' : 'flat') : 'up | down | flat'}", "value": "${realMarketData ? realMarketData.activeListings.toLocaleString() + ' homes' : 'Estimated value or range'}", "note": "${realMarketData ? (realMarketData.listingsChange > 0 ? '+' : '') + realMarketData.listingsChange + '% year over year' : 'Brief context'}" },
    { "label": "Days on Market", "trend": "${realMarketData ? (realMarketData.daysOnMarket < 30 ? 'up' : 'flat') : 'up | down | flat'}", "value": "${realMarketData ? realMarketData.daysOnMarket + ' days' : 'Estimated value or range'}", "note": "Brief context about what this means for buyers/sellers" },
    { "label": "Price per Sq Ft", "trend": "up | down | flat", "value": "${realMarketData ? '$' + realMarketData.pricePerSqft + '/sqft' : 'Estimated value'}", "note": "Brief context" }
  ],
  "buyerAdvice": "2-3 sentences of advice for buyers this month based on the real data",
  "sellerAdvice": "2-3 sentences of advice for sellers this month based on the real data",
  "outlook": "2-3 sentences on what to expect in the coming months",
  "closingMessage": "2-3 sentence closing from ${agentName}"
}`;
}

// ============ PDFKIT RENDERER ============

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [isNaN(r) ? 26 : r, isNaN(g) ? 58 : g, isNaN(b) ? 92 : b];
}

function wrapText(doc: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const lines = doc.heightOfString(text, { width: maxWidth });
  doc.text(text, x, y, { width: maxWidth });
  return y + lines + lineHeight;
}

async function buildPdfWithPDFKit(opts: {
  type: LeadMagnetType;
  content: any;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  agentBrokerage: string;
  agentWebsite?: string;
  city: string;
  primaryColor: string;
  neighborhood?: string;
  month?: string;
}): Promise<Buffer> {
  const { type, content, agentName, agentPhone, agentEmail, agentBrokerage, agentWebsite, city, primaryColor } = opts;
  const [pr, pg, pb] = hexToRgb(primaryColor);
  const label = typeLabels[type];
  // Pre-generate QR code buffer BEFORE entering the Promise (await not allowed inside Promise executor)
  let qrBuffer: Buffer | null = null;
  if (agentWebsite) {
    const qrUrl = agentWebsite.startsWith("http") ? agentWebsite : `https://${agentWebsite}`;
    qrBuffer = await QRCode.toBuffer(qrUrl, {
      type: "png",
      width: 200,
      margin: 2,
      color: { dark: primaryColor.replace("#", "").padEnd(8, "ff"), light: "ffffffff" },
    });
  }
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: label, Author: agentName } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;   // 595
    const margin = 48;
    const contentWidth = W - margin * 2;

    // ── HEADER BAND ──
    doc.rect(0, 0, W, 110).fill([pr, pg, pb]);
    doc.fillColor("white").fontSize(9).font("Helvetica")
      .text(label.toUpperCase(), margin, 24, { characterSpacing: 2 });
    doc.fontSize(22).font("Helvetica-Bold")
      .text(content.title || label, margin, 38, { width: contentWidth });
    if (content.subtitle) {
      doc.fontSize(11).font("Helvetica").fillOpacity(0.85)
        .text(content.subtitle, margin, 72, { width: contentWidth });
    }
    doc.fillOpacity(1);

    let y = 130;

    // ── INTRODUCTION ──
    if (content.introduction) {
      doc.fillColor("#374151").fontSize(11).font("Helvetica")
        .text(content.introduction, margin, y, { width: contentWidth, lineGap: 3 });
      y += doc.heightOfString(content.introduction, { width: contentWidth }) + 20;
    }

    // ── TYPE-SPECIFIC BODY ──
    if (type === "buyer_guide" && content.sections) {
      for (const section of content.sections) {
        // Check if we need a new page
        if (y > 720) { doc.addPage(); y = margin; }
        // Section heading bar
        doc.rect(margin, y, contentWidth, 24).fill([pr, pg, pb]);
        doc.fillColor("white").fontSize(11).font("Helvetica-Bold")
          .text(section.heading, margin + 10, y + 6, { width: contentWidth - 20 });
        y += 30;
        doc.fillColor("#4b5563").fontSize(10).font("Helvetica")
          .text(section.content, margin, y, { width: contentWidth, lineGap: 2 });
        y += doc.heightOfString(section.content, { width: contentWidth }) + 6;
        if (section.tip) {
          doc.rect(margin, y, 3, 28).fill([pr, pg, pb]);
          doc.fillColor("#374151").fontSize(9).font("Helvetica-Oblique")
            .text(`💡 ${section.tip}`, margin + 10, y + 4, { width: contentWidth - 14 });
          y += 34;
        }
        y += 12;
      }
      // FAQ
      if (content.faqItems && content.faqItems.length > 0) {
        if (y > 680) { doc.addPage(); y = margin; }
        doc.rect(margin, y, contentWidth, 24).fill([pr, pg, pb]);
        doc.fillColor("white").fontSize(11).font("Helvetica-Bold")
          .text("Frequently Asked Questions", margin + 10, y + 6);
        y += 30;
        for (const faq of content.faqItems) {
          if (y > 720) { doc.addPage(); y = margin; }
          doc.fillColor([pr, pg, pb]).fontSize(10).font("Helvetica-Bold")
            .text(`Q: ${faq.question}`, margin, y, { width: contentWidth });
          y += doc.heightOfString(`Q: ${faq.question}`, { width: contentWidth }) + 4;
          doc.fillColor("#6b7280").fontSize(9).font("Helvetica")
            .text(faq.answer, margin + 10, y, { width: contentWidth - 10, lineGap: 2 });
          y += doc.heightOfString(faq.answer, { width: contentWidth - 10 }) + 12;
        }
      }
    } else if (type === "neighborhood_report" && content.highlights) {
      // Highlights grid (2 columns)
      const colW = (contentWidth - 12) / 2;
      for (let i = 0; i < content.highlights.length; i++) {
        const h = content.highlights[i];
        const col = i % 2;
        const row = Math.floor(i / 2);
        if (col === 0 && row > 0) y += 60;
        if (y > 700) { doc.addPage(); y = margin; }
        const hx = margin + col * (colW + 12);
        doc.rect(hx, y, colW, 52).fill("#f9fafb").stroke("#e5e7eb");
        doc.fillColor([pr, pg, pb]).fontSize(11).font("Helvetica-Bold")
          .text(`${h.label}`, hx + 10, y + 8, { width: colW - 20 });
        doc.fillColor("#6b7280").fontSize(9).font("Helvetica")
          .text(h.value, hx + 10, y + 24, { width: colW - 20, lineGap: 1 });
      }
      const rowCount = Math.ceil(content.highlights.length / 2);
      y += rowCount * 60 + 16;
      // Market snapshot
      if (content.marketSnapshot) {
        if (y > 680) { doc.addPage(); y = margin; }
        doc.rect(margin, y, contentWidth, 24).fill([pr, pg, pb]);
        doc.fillColor("white").fontSize(11).font("Helvetica-Bold")
          .text(content.marketSnapshot.heading || "Market Snapshot", margin + 10, y + 6);
        y += 30;
        doc.fillColor("#4b5563").fontSize(10).font("Helvetica")
          .text(content.marketSnapshot.description, margin, y, { width: contentWidth, lineGap: 2 });
        y += doc.heightOfString(content.marketSnapshot.description, { width: contentWidth }) + 12;
        // Stats row
        const stats = content.marketSnapshot.stats || [];
        const sw = contentWidth / Math.max(stats.length, 1);
        for (let i = 0; i < stats.length; i++) {
          const sx = margin + i * sw;
          doc.rect(sx, y, sw - 8, 44).fill("#f3f4f6");
          doc.fillColor("#6b7280").fontSize(8).font("Helvetica")
            .text(stats[i].label, sx + 6, y + 6, { width: sw - 16 });
          doc.fillColor([pr, pg, pb]).fontSize(13).font("Helvetica-Bold")
            .text(stats[i].value, sx + 6, y + 20, { width: sw - 16 });
        }
        y += 52;
      }
      if (content.whyLiveHere) {
        if (y > 680) { doc.addPage(); y = margin; }
        doc.rect(margin, y, contentWidth, 24).fill([pr, pg, pb]);
        doc.fillColor("white").fontSize(11).font("Helvetica-Bold")
          .text("Why People Love Living Here", margin + 10, y + 6);
        y += 30;
        doc.fillColor("#4b5563").fontSize(10).font("Helvetica")
          .text(content.whyLiveHere, margin, y, { width: contentWidth, lineGap: 2 });
        y += doc.heightOfString(content.whyLiveHere, { width: contentWidth }) + 12;
      }
    } else if (type === "market_update" && content.keyStats) {
      // Market condition badge
      if (content.marketCondition) {
        doc.rect(margin, y, 160, 28).fill([pr, pg, pb]);
        doc.fillColor("white").fontSize(11).font("Helvetica-Bold")
          .text(content.marketCondition, margin + 10, y + 8);
        y += 34;
        if (content.marketConditionExplanation) {
          doc.fillColor("#4b5563").fontSize(10).font("Helvetica")
            .text(content.marketConditionExplanation, margin, y, { width: contentWidth, lineGap: 2 });
          y += doc.heightOfString(content.marketConditionExplanation, { width: contentWidth }) + 14;
        }
      }
      // Key stats grid
      const stats = content.keyStats || [];
      const sw = contentWidth / Math.min(stats.length, 2);
      for (let i = 0; i < stats.length; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        if (col === 0 && row > 0) y += 64;
        if (y > 700) { doc.addPage(); y = margin; }
        const sx = margin + col * sw;
        const trendColor = stats[i].trend === "up" ? [22, 163, 74] : stats[i].trend === "down" ? [220, 38, 38] : [107, 114, 128];
        doc.rect(sx, y, sw - 8, 56).fill("#f9fafb").stroke("#e5e7eb");
        doc.fillColor("#6b7280").fontSize(8).font("Helvetica")
          .text(stats[i].label, sx + 8, y + 6, { width: sw - 20 });
        doc.fillColor([pr, pg, pb]).fontSize(14).font("Helvetica-Bold")
          .text(stats[i].value, sx + 8, y + 20, { width: sw - 20 });
        doc.fillColor(trendColor as [number, number, number]).fontSize(8).font("Helvetica")
          .text(stats[i].note || "", sx + 8, y + 40, { width: sw - 20 });
      }
      const rowCount = Math.ceil(stats.length / 2);
      y += rowCount * 64 + 16;
      // Buyer/Seller advice
      for (const [heading, text] of [
        ["Advice for Buyers", content.buyerAdvice],
        ["Advice for Sellers", content.sellerAdvice],
        ["Market Outlook", content.outlook],
      ]) {
        if (!text) continue;
        if (y > 680) { doc.addPage(); y = margin; }
        doc.rect(margin, y, contentWidth, 24).fill([pr, pg, pb]);
        doc.fillColor("white").fontSize(11).font("Helvetica-Bold")
          .text(heading as string, margin + 10, y + 6);
        y += 30;
        doc.fillColor("#4b5563").fontSize(10).font("Helvetica")
          .text(text as string, margin, y, { width: contentWidth, lineGap: 2 });
        y += doc.heightOfString(text as string, { width: contentWidth }) + 14;
      }
    }

    // ── CLOSING MESSAGE ──
    if (content.closingMessage) {
      if (y > 700) { doc.addPage(); y = margin; }
      doc.rect(margin, y, contentWidth, 1).fill("#e5e7eb");
      y += 10;
      doc.fillColor("#374151").fontSize(10).font("Helvetica-Oblique")
        .text(content.closingMessage, margin, y, { width: contentWidth, lineGap: 3 });
      y += doc.heightOfString(content.closingMessage, { width: contentWidth }) + 16;
    }

    // ── QR CODE PAGE (if website provided) ──
    if (agentWebsite && qrBuffer) {
      doc.addPage();
      const qrUrl = agentWebsite.startsWith("http") ? agentWebsite : `https://${agentWebsite}`;
      const qrSize = 180;
      const qrX = (W - qrSize) / 2;
      const qrY = 140;
      // Header band
      doc.rect(0, 0, W, 110).fill([pr, pg, pb]);
      doc.fillColor("white").fontSize(9).font("Helvetica")
        .text("CONNECT WITH ME", margin, 24, { characterSpacing: 2, align: "center", width: contentWidth });
      doc.fontSize(20).font("Helvetica-Bold")
        .text("Scan to Visit My Website", margin, 44, { align: "center", width: contentWidth });
      doc.fontSize(11).font("Helvetica").fillOpacity(0.85)
        .text(agentName, margin, 76, { align: "center", width: contentWidth });
      doc.fillOpacity(1);
      // QR code image
      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
      // URL text below QR
      doc.fillColor([pr, pg, pb] as any).fontSize(11).font("Helvetica-Bold")
        .text(qrUrl, margin, qrY + qrSize + 16, { align: "center", width: contentWidth });
      doc.fillColor("#6b7280").fontSize(10).font("Helvetica")
        .text("Scan the QR code above with your phone camera to visit my website", margin, qrY + qrSize + 36, { align: "center", width: contentWidth });
      // Agent contact card at bottom
      const cardY = qrY + qrSize + 80;
      doc.rect(margin, cardY, contentWidth, 90).fill("#f9fafb");
      doc.rect(margin, cardY, 4, 90).fill([pr, pg, pb]);
      doc.fillColor("#111827").fontSize(14).font("Helvetica-Bold")
        .text(agentName, margin + 20, cardY + 16, { width: contentWidth - 24 });
      if (agentBrokerage) {
        doc.fillColor("#6b7280").fontSize(10).font("Helvetica")
          .text(agentBrokerage, margin + 20, cardY + 34, { width: contentWidth - 24 });
      }
      const contactLine2 = [agentPhone, agentEmail].filter(Boolean).join("  ·  ");
      if (contactLine2) {
        doc.fillColor("#374151").fontSize(10).font("Helvetica")
          .text(contactLine2, margin + 20, cardY + 54, { width: contentWidth - 24 });
      }
      // Footer band
      const footerY2 = doc.page.height - 48;
      doc.rect(0, footerY2 - 8, W, 56).fill([pr, pg, pb]);
      doc.fillColor("white").fontSize(9).font("Helvetica").fillOpacity(0.7)
        .text("Generated by Amped Agent.co", margin, footerY2 + 6, { align: "center", width: contentWidth });
      doc.fillOpacity(1);
    }
    // ── FOOTER (on main content pages) ──
    // Note: footer is drawn on the last content page before QR page
    // We need to end the doc after QR page if website exists
    if (!agentWebsite) {
      const footerY = doc.page.height - 48;
      doc.rect(0, footerY - 8, W, 56).fill([pr, pg, pb]);
      const agentLine = [agentName, agentBrokerage].filter(Boolean).join(" · ");
      const contactLine = [agentPhone, agentEmail].filter(Boolean).join(" · ");
      doc.fillColor("white").fontSize(10).font("Helvetica-Bold")
        .text(agentLine, margin, footerY, { width: contentWidth });
      if (contactLine) {
        doc.fillColor("white").fontSize(9).font("Helvetica").fillOpacity(0.85)
          .text(contactLine, margin, footerY + 14, { width: contentWidth });
      }
      doc.fillOpacity(1);
    }
     doc.end();
  });
}
// ── Legacy HTML builder (kept for reference, no longer used) ──
function buildPdfHtml(opts: {
  type: LeadMagnetType;
  content: any;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  agentBrokerage: string;
  city: string;
  primaryColor: string;
  neighborhood?: string;
  month?: string;
}): string {
  const { type, content, agentName, agentPhone, agentEmail, agentBrokerage, primaryColor } = opts;
  const label = typeLabels[type];

  const trendArrow = (trend: string) =>
    trend === "up" ? "▲" : trend === "down" ? "▼" : "→";
  const trendColor = (trend: string) =>
    trend === "up" ? "#16a34a" : trend === "down" ? "#dc2626" : "#6b7280";

  let bodyHtml = "";

  if (type === "buyer_guide" && content.sections) {
    bodyHtml = `
      <p class="intro">${content.introduction || ""}</p>
      ${(content.sections || []).map((s: any) => `
        <div class="section">
          <h2>${s.heading}</h2>
          <p>${s.content}</p>
          ${s.tip ? `<div class="tip">💡 ${s.tip}</div>` : ""}
        </div>
      `).join("")}
      ${content.faqItems ? `
        <div class="section">
          <h2>Frequently Asked Questions</h2>
          ${content.faqItems.map((f: any) => `
            <div class="faq-item">
              <strong>Q: ${f.question}</strong>
              <p>${f.answer}</p>
            </div>
          `).join("")}
        </div>
      ` : ""}
      <p class="closing">${content.closingMessage || ""}</p>
    `;
  } else if (type === "neighborhood_report" && content.highlights) {
    bodyHtml = `
      <p class="intro">${content.introduction || ""}</p>
      <div class="highlights-grid">
        ${(content.highlights || []).map((h: any) => `
          <div class="highlight-card">
            <span class="highlight-icon">${h.icon}</span>
            <strong>${h.label}</strong>
            <p>${h.value}</p>
          </div>
        `).join("")}
      </div>
      ${content.marketSnapshot ? `
        <div class="section">
          <h2>${content.marketSnapshot.heading}</h2>
          <p>${content.marketSnapshot.description}</p>
          <div class="stats-row">
            ${(content.marketSnapshot.stats || []).map((s: any) => `
              <div class="stat-box">
                <div class="stat-label">${s.label}</div>
                <div class="stat-value">${s.value}</div>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}
      <div class="section">
        <h2>Why People Love Living Here</h2>
        <p>${content.whyLiveHere || ""}</p>
      </div>
      <p class="closing">${content.closingMessage || ""}</p>
    `;
  } else if (type === "market_update" && content.keyStats) {
    bodyHtml = `
      <p class="intro">${content.introduction || ""}</p>
      <div class="market-condition">
        <span class="condition-badge">${content.marketCondition || ""}</span>
        <p>${content.marketConditionExplanation || ""}</p>
      </div>
      <div class="stats-grid">
        ${(content.keyStats || []).map((s: any) => `
          <div class="stat-card">
            <div class="stat-label">${s.label}</div>
            <div class="stat-value">${s.value}</div>
            <div class="stat-trend" style="color:${trendColor(s.trend)}">${trendArrow(s.trend)} ${s.note}</div>
          </div>
        `).join("")}
      </div>
      <div class="two-col">
        <div class="section">
          <h2>🏠 Advice for Buyers</h2>
          <p>${content.buyerAdvice || ""}</p>
        </div>
        <div class="section">
          <h2>🔑 Advice for Sellers</h2>
          <p>${content.sellerAdvice || ""}</p>
        </div>
      </div>
      <div class="section">
        <h2>📈 Market Outlook</h2>
        <p>${content.outlook || ""}</p>
      </div>
      <p class="closing">${content.closingMessage || ""}</p>
    `;
  } else {
    bodyHtml = `<p>${JSON.stringify(content)}</p>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #fff; }
  
  .header {
    background: ${primaryColor};
    color: white;
    padding: 40px 48px 32px;
  }
  .header-label {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    opacity: 0.8;
    margin-bottom: 8px;
  }
  .header h1 { font-size: 28px; font-weight: 700; line-height: 1.2; margin-bottom: 8px; }
  .header .subtitle { font-size: 14px; opacity: 0.85; }
  
  .content { padding: 36px 48px; }
  
  .intro { font-size: 15px; line-height: 1.7; color: #374151; margin-bottom: 28px; }
  .closing { font-size: 14px; line-height: 1.7; color: #374151; margin-top: 28px; font-style: italic; }
  
  .section { margin-bottom: 24px; }
  .section h2 { font-size: 16px; font-weight: 700; color: ${primaryColor}; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 2px solid ${primaryColor}20; }
  .section p { font-size: 13px; line-height: 1.7; color: #4b5563; }
  
  .tip { background: ${primaryColor}10; border-left: 3px solid ${primaryColor}; padding: 10px 14px; margin-top: 10px; font-size: 12px; color: #374151; border-radius: 0 6px 6px 0; }
  
  .faq-item { margin-bottom: 14px; }
  .faq-item strong { font-size: 13px; color: #1a1a1a; display: block; margin-bottom: 4px; }
  .faq-item p { font-size: 12px; color: #6b7280; }
  
  .highlights-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 28px; }
  .highlight-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
  .highlight-icon { font-size: 20px; display: block; margin-bottom: 6px; }
  .highlight-card strong { font-size: 13px; color: ${primaryColor}; display: block; margin-bottom: 4px; }
  .highlight-card p { font-size: 12px; color: #6b7280; line-height: 1.5; }
  
  .stats-row { display: flex; gap: 12px; margin-top: 14px; flex-wrap: wrap; }
  .stat-box { flex: 1; min-width: 120px; background: ${primaryColor}08; border: 1px solid ${primaryColor}20; border-radius: 8px; padding: 14px; text-align: center; }
  .stat-label { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
  .stat-value { font-size: 16px; font-weight: 700; color: ${primaryColor}; }
  
  .market-condition { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .condition-badge { display: inline-block; background: #16a34a; color: white; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-bottom: 8px; }
  .market-condition p { font-size: 13px; color: #374151; }
  
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
  .stat-card .stat-label { font-size: 11px; color: #9ca3af; margin-bottom: 4px; }
  .stat-card .stat-value { font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
  .stat-card .stat-trend { font-size: 11px; }
  
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  
  .footer {
    background: #f9fafb;
    border-top: 2px solid ${primaryColor};
    padding: 20px 48px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .agent-info .agent-name { font-size: 14px; font-weight: 700; color: ${primaryColor}; }
  .agent-info .agent-details { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .footer-disclaimer { font-size: 10px; color: #9ca3af; max-width: 300px; text-align: right; }
</style>
</head>
<body>
  <div class="header">
    <div class="header-label">${label}</div>
    <h1>${content.title || label}</h1>
    <div class="subtitle">${content.subtitle || ""}</div>
  </div>
  
  <div class="content">
    ${bodyHtml}
  </div>
  
  <div class="footer">
    <div class="agent-info">
      <div class="agent-name">${agentName}</div>
      <div class="agent-details">
        ${agentBrokerage ? `${agentBrokerage} · ` : ""}${agentPhone}${agentPhone && agentEmail ? " · " : ""}${agentEmail}
      </div>
    </div>
    <div class="footer-disclaimer">
      This report is for informational purposes only. Market data is estimated. Contact ${agentName} for current, accurate information.
    </div>
  </div>
</body>
</html>`;
}

// ============ PDF RENDERER ============

/**
 * Render HTML to PDF using puppeteer-core.
 * puppeteer-core does NOT bundle Chromium — it uses the system browser,
 * which avoids the large Chromium download that broke Cloud Run deployments.
 *
 * Chromium lookup order:
 *   1. PUPPETEER_EXECUTABLE_PATH env var (set in production)
 *   2. Common Cloud Run / Linux paths
 *   3. macOS path (local dev)
 */
function findChromiumExecutable(): string {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean) as string[];

  const fs = require("fs");
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      // ignore
    }
  }
  // Fall back to first candidate and let puppeteer surface a clear error
  return candidates[0] ?? "/usr/bin/chromium-browser";
}

async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const puppeteer = await import("puppeteer-core");

  const executablePath = findChromiumExecutable();
  console.log(`[LeadMagnet] PDF render using Chromium at: ${executablePath}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      printBackground: true,
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
