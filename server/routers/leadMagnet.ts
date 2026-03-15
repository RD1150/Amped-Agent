import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import * as db from "../db";
import { storagePut } from "../storage";
import { getDb } from "../db";
import { leadMagnets } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

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

      // Step 1: Generate content via LLM
      const contentPrompt = buildContentPrompt(type, {
        city,
        agentName,
        neighborhood: input.neighborhood,
        month: input.month || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
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

      // Step 2: Render HTML → PDF
      const html = buildPdfHtml({
        type,
        content,
        agentName,
        agentPhone,
        agentEmail,
        agentBrokerage,
        city,
        primaryColor,
        neighborhood: input.neighborhood,
        month: input.month,
      });

      const pdfBuffer = await renderHtmlToPdf(html);

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

      return {
        type,
        label: typeLabels[type],
        city,
        pdfUrl: url,
        agentName,
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
});

// ============ CONTENT PROMPT BUILDERS ============

function buildContentPrompt(
  type: LeadMagnetType,
  ctx: { city: string; agentName: string; neighborhood?: string; month?: string }
): string {
  const { city, agentName, neighborhood, month } = ctx;

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
    return `Create a Neighborhood Report for ${area}, ${city}. Return this exact JSON:
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
    "description": "2-3 sentences about the current real estate market in ${area}",
    "stats": [
      { "label": "Median Home Price", "value": "Estimated range for ${area}" },
      { "label": "Average Days on Market", "value": "Estimated range" },
      { "label": "Price per Sq Ft", "value": "Estimated range" }
    ]
  },
  "whyLiveHere": "2-3 compelling sentences about why people love ${area}",
  "closingMessage": "2-3 sentence closing from ${agentName} offering to help"
}`;
  }

  // market_update
  return `Create a Market Update for ${city} for ${month}. Return this exact JSON:
{
  "title": "${city} Real Estate Market Update",
  "subtitle": "${month} — What Buyers & Sellers Need to Know",
  "introduction": "2-3 sentence market overview for ${city} this month",
  "marketCondition": "Buyer's Market | Seller's Market | Balanced Market",
  "marketConditionExplanation": "1-2 sentences explaining the current condition",
  "keyStats": [
    { "label": "Median Sale Price", "trend": "up | down | flat", "value": "Estimated value or range", "note": "Brief context" },
    { "label": "Active Listings", "trend": "up | down | flat", "value": "Estimated value or range", "note": "Brief context" },
    { "label": "Days on Market", "trend": "up | down | flat", "value": "Estimated value or range", "note": "Brief context" },
    { "label": "Sale-to-List Ratio", "trend": "up | down | flat", "value": "Estimated percentage", "note": "Brief context" }
  ],
  "buyerAdvice": "2-3 sentences of advice for buyers this month",
  "sellerAdvice": "2-3 sentences of advice for sellers this month",
  "outlook": "2-3 sentences on what to expect in the coming months",
  "closingMessage": "2-3 sentence closing from ${agentName}"
}`;
}

// ============ HTML TEMPLATE ============

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

async function renderHtmlToPdf(html: string): Promise<Buffer> {
  // Dynamically import html-pdf-node to avoid issues if not installed
  let htmlPdf: any;
  try {
    htmlPdf = await import("html-pdf-node");
  } catch {
    throw new Error("PDF generation library not available. Please contact support.");
  }

  const options = {
    format: "A4",
    margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    printBackground: true,
    // Use system Chromium in sandbox environment
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  };

  const file = { content: html };
  const buffer = await htmlPdf.generatePdf(file, options);
  return buffer;
}
