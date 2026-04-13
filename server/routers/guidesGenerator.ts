/**
 * guidesGenerator.ts
 * Branded Seller's Manual & Buyer's Guide PDF generator.
 *
 * Generates a fully branded, print-ready PDF for each guide type.
 * Agent branding is auto-filled from their Authority Profile (persona).
 * Supports custom cover photo, CMA data, and custom notes.
 *
 * Access rules:
 *  - Agency tier: unlimited generations (no credit deduction)
 *  - Starter / Pro: costs GUIDE_CREDIT_COST credits per generation
 *  - Re-downloads from My Documents: always free
 */

import { z } from "zod";
import PDFDocument from "pdfkit";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { generatedGuides, personas } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { storagePut } from "../storage";
import { fetchMarketData } from "../marketStatsHelper";
import { getCreditBalance, deductCredits } from "../credits";
import { TRPCError } from "@trpc/server";

const GUIDE_CREDIT_COST = 5;

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const CmaCompSchema = z.object({
  address: z.string(),
  salePrice: z.string(),
  beds: z.string().optional(),
  baths: z.string().optional(),
  sqft: z.string().optional(),
  saleDate: z.string().optional(),
  adjustments: z.string().optional(), // e.g. "+5000 (extra bath), -3000 (no garage)"
  adjustedPrice: z.string().optional(),
  notes: z.string().optional(),
});

const GenerateGuideInputSchema = z.object({
  guideType: z.enum(["sellers_manual", "buyers_guide"]),
  clientName: z.string().optional(),
  propertyAddress: z.string().optional(),
  cityArea: z.string().min(2, "Please enter a city or area"),
  coverPhotoUrl: z.string().url().optional(),
  // CMA (sellers_manual only)
  cmaComps: z.array(CmaCompSchema).max(8).optional(),
  suggestedPriceRange: z.string().optional(),
  // Custom notes / action plan
  customNotes: z.string().max(2000).optional(),
});

// ─── PDF builder ─────────────────────────────────────────────────────────────

interface AgentBranding {
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  agentBrokerage: string;
  agentHeadshotUrl: string | null;
  agentLogoUrl: string | null;
  primaryColor: string;
}

interface GuideInput {
  guideType: "sellers_manual" | "buyers_guide";
  clientName?: string;
  propertyAddress?: string;
  cityArea: string;
  coverPhotoUrl?: string;
  cmaComps?: z.infer<typeof CmaCompSchema>[];
  suggestedPriceRange?: string;
  customNotes?: string;
  marketData?: {
    medianPrice: number;
    daysOnMarket: number;
    activeListings: number;
    marketTemperature: string;
    pricePerSqft: number;
    insights: string[];
  };
  agent: AgentBranding;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } catch {
    return null;
  }
}

async function buildGuidePdf(input: GuideInput): Promise<Buffer> {
  const [pr, pg, pb] = hexToRgb(input.agent.primaryColor || "#C9A962");
  const isSeller = input.guideType === "sellers_manual";
  const guideTitle = isSeller ? "Home Seller's Manual" : "Home Buyer's Guide";
  const subtitle = isSeller
    ? "Everything You Need to Know to Sell Your Home"
    : "Everything You Need to Know to Buy Your Home";

  // Pre-fetch images
  const [headshotBuf, logoBuf, coverBuf] = await Promise.all([
    input.agent.agentHeadshotUrl ? fetchImageBuffer(input.agent.agentHeadshotUrl) : Promise.resolve(null),
    input.agent.agentLogoUrl ? fetchImageBuffer(input.agent.agentLogoUrl) : Promise.resolve(null),
    input.coverPhotoUrl ? fetchImageBuffer(input.coverPhotoUrl) : Promise.resolve(null),
  ]);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 0, info: { Title: guideTitle, Author: input.agent.agentName } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;   // 612
    const H = doc.page.height;  // 792
    const M = 48; // margin
    const CW = W - M * 2; // content width

    // ─── PAGE 1: COVER ────────────────────────────────────────────────────────
    // Hero photo or gradient background
    if (coverBuf) {
      try {
        doc.image(coverBuf, 0, 0, { width: W, height: H * 0.65, cover: [W, H * 0.65] });
      } catch {
        doc.rect(0, 0, W, H * 0.65).fill([pr, pg, pb]);
      }
    } else {
      // Default gradient-style background
      doc.rect(0, 0, W, H * 0.65).fill([pr, pg, pb]);
      // Subtle pattern overlay
      doc.opacity(0.08);
      for (let i = 0; i < 20; i++) {
        doc.circle(Math.random() * W, Math.random() * H * 0.65, 30 + Math.random() * 80).fill("white");
      }
      doc.opacity(1);
    }

    // Dark overlay on bottom of hero for readability
    doc.rect(0, H * 0.42, W, H * 0.23)
      .fill([0, 0, 0])
      .opacity(0.55);
    doc.opacity(1);

    // Guide title on hero
    doc.fillColor("white")
      .fontSize(36)
      .font("Helvetica-Bold")
      .text(guideTitle, M, H * 0.46, { width: CW, align: "left" });

    doc.fillColor("white")
      .fontSize(13)
      .font("Helvetica")
      .opacity(0.9)
      .text(subtitle, M, H * 0.46 + 48, { width: CW });
    doc.opacity(1);

    if (input.cityArea) {
      doc.fillColor("white")
        .fontSize(11)
        .font("Helvetica-Oblique")
        .opacity(0.8)
        .text(`${input.cityArea} Market`, M, H * 0.46 + 72, { width: CW });
      doc.opacity(1);
    }

    // ─── Agent footer bar ─────────────────────────────────────────────────────
    const footerY = H * 0.65;
    doc.rect(0, footerY, W, H - footerY).fill([pr, pg, pb]);

    // Logo (top-left of footer)
    let footerX = M;
    if (logoBuf) {
      try {
        doc.image(logoBuf, footerX, footerY + 18, { height: 44, fit: [120, 44] });
        footerX += 140;
      } catch { /* skip */ }
    }

    // Headshot circle
    if (headshotBuf) {
      try {
        const hsX = footerX;
        const hsY = footerY + 14;
        const hsSize = 52;
        doc.save();
        doc.circle(hsX + hsSize / 2, hsY + hsSize / 2, hsSize / 2).clip();
        doc.image(headshotBuf, hsX, hsY, { width: hsSize, height: hsSize });
        doc.restore();
        footerX += hsSize + 14;
      } catch { /* skip */ }
    }

    // Agent name & contact
    doc.fillColor("white")
      .fontSize(15)
      .font("Helvetica-Bold")
      .text(input.agent.agentName || "Your Agent", footerX, footerY + 20, { width: W - footerX - M });

    const contactLine = [
      input.agent.agentPhone,
      input.agent.agentEmail,
      input.agent.agentBrokerage,
    ].filter(Boolean).join("  |  ");

    doc.fillColor("white")
      .fontSize(9)
      .font("Helvetica")
      .opacity(0.85)
      .text(contactLine, footerX, footerY + 40, { width: W - footerX - M });
    doc.opacity(1);

    if (input.clientName) {
      doc.fillColor("white")
        .fontSize(9)
        .font("Helvetica-Oblique")
        .opacity(0.75)
        .text(`Prepared for: ${input.clientName}`, footerX, footerY + 56, { width: W - footerX - M });
      doc.opacity(1);
    }

    // ─── PAGE 2: TABLE OF CONTENTS ────────────────────────────────────────────
    doc.addPage();
    let y = M;

    // Section header
    doc.rect(0, 0, W, 80).fill([pr, pg, pb]);
    doc.fillColor("white").fontSize(22).font("Helvetica-Bold")
      .text("Table of Contents", M, 24, { width: CW });
    y = 100;

    const sellerChapters = [
      { num: "01", title: "Preparing Your Home for Sale", desc: "First impressions, staging tips, and pre-listing repairs" },
      { num: "02", title: "Pricing Strategy", desc: "How we determine the right price to attract buyers and maximize value" },
      { num: "03", title: "Marketing Your Property", desc: "Professional photography, MLS exposure, digital and print marketing" },
      { num: "04", title: "Showing Your Home", desc: "Scheduling, feedback, and making the most of every showing" },
      { num: "05", title: "Receiving & Negotiating Offers", desc: "Understanding offer terms, contingencies, and counter-offer strategy" },
      { num: "06", title: "Under Contract", desc: "Inspections, appraisals, and what happens between contract and close" },
      { num: "07", title: "Closing Day", desc: "What to expect, what to bring, and how to prepare" },
      { num: "08", title: "After the Sale", desc: "Moving tips, tax considerations, and staying in touch" },
    ];

    const buyerChapters = [
      { num: "01", title: "Getting Pre-Approved", desc: "Why pre-approval matters and how to choose the right lender" },
      { num: "02", title: "Defining Your Search", desc: "Must-haves vs. nice-to-haves, neighborhoods, and priorities" },
      { num: "03", title: "The Home Search Process", desc: "Working with your agent, scheduling tours, and evaluating homes" },
      { num: "04", title: "Making an Offer", desc: "Offer strategy, terms, contingencies, and earnest money" },
      { num: "05", title: "Under Contract", desc: "Inspections, appraisals, and navigating the due diligence period" },
      { num: "06", title: "Financing & Final Approval", desc: "Working with your lender through underwriting and clear to close" },
      { num: "07", title: "Closing Day", desc: "Final walkthrough, what to bring, and receiving your keys" },
      { num: "08", title: "After You Move In", desc: "Utilities, maintenance, homestead exemption, and building equity" },
    ];

    const chapters = isSeller ? sellerChapters : buyerChapters;

    for (const ch of chapters) {
      if (y > 720) { doc.addPage(); y = M; }
      // Chapter row
      doc.rect(M, y, 36, 36).fill([pr, pg, pb]);
      doc.fillColor("white").fontSize(13).font("Helvetica-Bold")
        .text(ch.num, M, y + 10, { width: 36, align: "center" });
      doc.fillColor("#1f2937").fontSize(12).font("Helvetica-Bold")
        .text(ch.title, M + 46, y + 4, { width: CW - 46 });
      doc.fillColor("#6b7280").fontSize(9).font("Helvetica")
        .text(ch.desc, M + 46, y + 20, { width: CW - 46 });
      y += 50;
    }

    // ─── PAGES 3-10: CHAPTER CONTENT ─────────────────────────────────────────
    for (const ch of chapters) {
      doc.addPage();
      // Chapter header
      doc.rect(0, 0, W, 90).fill([pr, pg, pb]);
      doc.fillColor("white").fontSize(11).font("Helvetica")
        .text(`CHAPTER ${ch.num}`, M, 20, { characterSpacing: 2 });
      doc.fillColor("white").fontSize(22).font("Helvetica-Bold")
        .text(ch.title, M, 36, { width: CW });

      y = 110;
      doc.fillColor("#374151").fontSize(11).font("Helvetica")
        .text(ch.desc, M, y, { width: CW, lineGap: 4 });
      y += 40;

      // Generate chapter body content
      const bodyContent = getChapterContent(ch.num, isSeller, input.cityArea);
      for (const block of bodyContent) {
        if (y > 700) { doc.addPage(); y = M; }
        if (block.type === "heading") {
          doc.rect(M, y, 3, 18).fill([pr, pg, pb]);
          doc.fillColor("#1f2937").fontSize(12).font("Helvetica-Bold")
            .text(block.text, M + 10, y + 1, { width: CW - 10 });
          y += 26;
        } else if (block.type === "bullet") {
          doc.fillColor([pr, pg, pb]).fontSize(9).font("Helvetica-Bold")
            .text("•", M + 8, y + 1);
          doc.fillColor("#4b5563").fontSize(10).font("Helvetica")
            .text(block.text, M + 22, y, { width: CW - 22, lineGap: 2 });
          y += doc.heightOfString(block.text, { width: CW - 22 }) + 8;
        } else {
          doc.fillColor("#4b5563").fontSize(10).font("Helvetica")
            .text(block.text, M, y, { width: CW, lineGap: 3 });
          y += doc.heightOfString(block.text, { width: CW }) + 12;
        }
      }
    }

    // ─── HYPERLOCAL MARKET SNAPSHOT PAGE ─────────────────────────────────────
    if (input.marketData) {
      doc.addPage();
      doc.rect(0, 0, W, 90).fill([pr, pg, pb]);
      doc.fillColor("white").fontSize(11).font("Helvetica")
        .text("MARKET SNAPSHOT", M, 20, { characterSpacing: 2 });
      doc.fillColor("white").fontSize(22).font("Helvetica-Bold")
        .text(`${input.cityArea} Real Estate Market`, M, 36, { width: CW });

      y = 110;
      const md = input.marketData;
      const stats = [
        { label: "Median Home Price", value: `$${md.medianPrice.toLocaleString()}` },
        { label: "Avg. Days on Market", value: `${md.daysOnMarket} days` },
        { label: "Active Listings", value: md.activeListings.toLocaleString() },
        { label: "Price per Sq Ft", value: `$${md.pricePerSqft.toLocaleString()}` },
        { label: "Market Temperature", value: md.marketTemperature.charAt(0).toUpperCase() + md.marketTemperature.slice(1) },
      ];

      // Stats grid (2 columns)
      const colW = (CW - 16) / 2;
      for (let i = 0; i < stats.length; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        if (col === 0 && row > 0) y += 72;
        if (y > 680) { doc.addPage(); y = M; }
        const sx = M + col * (colW + 16);
        doc.rect(sx, y, colW, 60).fill("#f9fafb").stroke("#e5e7eb");
        doc.fillColor([pr, pg, pb]).fontSize(18).font("Helvetica-Bold")
          .text(stats[i].value, sx + 12, y + 10, { width: colW - 24 });
        doc.fillColor("#6b7280").fontSize(9).font("Helvetica")
          .text(stats[i].label, sx + 12, y + 36, { width: colW - 24 });
      }
      y += 80;

      // Market insights
      if (md.insights && md.insights.length > 0) {
        if (y > 660) { doc.addPage(); y = M; }
        doc.rect(M, y, CW, 28).fill([pr, pg, pb]);
        doc.fillColor("white").fontSize(12).font("Helvetica-Bold")
          .text("Market Insights", M + 12, y + 7, { width: CW - 24 });
        y += 34;
        for (const insight of md.insights.slice(0, 5)) {
          if (y > 720) break;
          doc.rect(M, y, 3, 16).fill([pr, pg, pb]);
          doc.fillColor("#374151").fontSize(10).font("Helvetica")
            .text(insight, M + 10, y + 1, { width: CW - 10 });
          y += 24;
        }
      }
    }

    // ─── CMA PAGE (sellers_manual only) ──────────────────────────────────────
    if (isSeller && input.cmaComps && input.cmaComps.length > 0) {
      doc.addPage();
      doc.rect(0, 0, W, 90).fill([pr, pg, pb]);
      doc.fillColor("white").fontSize(11).font("Helvetica")
        .text("PRICING ANALYSIS", M, 20, { characterSpacing: 2 });
      doc.fillColor("white").fontSize(22).font("Helvetica-Bold")
        .text("Comparative Market Analysis", M, 36, { width: CW });

      y = 110;
      if (input.propertyAddress) {
        doc.fillColor("#374151").fontSize(11).font("Helvetica")
          .text(`Subject Property: ${input.propertyAddress}`, M, y, { width: CW });
        y += 24;
      }

      // Table header
      const cols = { addr: 180, price: 80, beds: 40, sqft: 60, date: 70, adj: 90 };
      const headerY = y;
      doc.rect(M, headerY, CW, 24).fill([pr, pg, pb]);
      doc.fillColor("white").fontSize(8).font("Helvetica-Bold");
      let cx = M + 6;
      doc.text("Address", cx, headerY + 7, { width: cols.addr }); cx += cols.addr;
      doc.text("Sale Price", cx, headerY + 7, { width: cols.price }); cx += cols.price;
      doc.text("Bed/Ba", cx, headerY + 7, { width: cols.beds }); cx += cols.beds;
      doc.text("Sq Ft", cx, headerY + 7, { width: cols.sqft }); cx += cols.sqft;
      doc.text("Date", cx, headerY + 7, { width: cols.date }); cx += cols.date;
      doc.text("Adj. Price", cx, headerY + 7, { width: cols.adj });
      y += 28;

      for (let i = 0; i < input.cmaComps.length; i++) {
        const comp = input.cmaComps[i];
        if (y > 700) { doc.addPage(); y = M; }
        const rowBg = i % 2 === 0 ? "#f9fafb" : "#ffffff";
        doc.rect(M, y, CW, 28).fill(rowBg).stroke("#e5e7eb");
        doc.fillColor("#1f2937").fontSize(8).font("Helvetica");
        cx = M + 6;
        doc.text(comp.address, cx, y + 9, { width: cols.addr - 4, ellipsis: true }); cx += cols.addr;
        doc.text(comp.salePrice, cx, y + 9, { width: cols.price - 4 }); cx += cols.price;
        doc.text(`${comp.beds || "-"}/${comp.baths || "-"}`, cx, y + 9, { width: cols.beds - 4 }); cx += cols.beds;
        doc.text(comp.sqft || "-", cx, y + 9, { width: cols.sqft - 4 }); cx += cols.sqft;
        doc.text(comp.saleDate || "-", cx, y + 9, { width: cols.date - 4 }); cx += cols.date;
        doc.fillColor(comp.adjustedPrice ? [pr, pg, pb] : "#6b7280").font("Helvetica-Bold")
          .text(comp.adjustedPrice || comp.salePrice, cx, y + 9, { width: cols.adj - 4 });
        if (comp.notes) {
          doc.fillColor("#9ca3af").fontSize(7).font("Helvetica-Oblique")
            .text(comp.notes, M + 6, y + 19, { width: CW - 12 });
        }
        y += comp.notes ? 36 : 30;
      }

      if (input.suggestedPriceRange) {
        y += 16;
        doc.rect(M, y, CW, 44).fill([pr, pg, pb]);
        doc.fillColor("white").fontSize(11).font("Helvetica")
          .text("Suggested Listing Price Range", M + 16, y + 8, { width: CW - 32 });
        doc.fillColor("white").fontSize(18).font("Helvetica-Bold")
          .text(input.suggestedPriceRange, M + 16, y + 22, { width: CW - 32 });
      }
    }

    // ─── CUSTOM ACTION PLAN / NOTES PAGE ─────────────────────────────────────
    if (input.customNotes) {
      doc.addPage();
      doc.rect(0, 0, W, 90).fill([pr, pg, pb]);
      doc.fillColor("white").fontSize(11).font("Helvetica")
        .text("ACTION PLAN", M, 20, { characterSpacing: 2 });
      doc.fillColor("white").fontSize(22).font("Helvetica-Bold")
        .text(isSeller ? "Your Personalized Selling Plan" : "Your Personalized Buying Plan", M, 36, { width: CW });

      y = 110;
      doc.fillColor("#374151").fontSize(11).font("Helvetica")
        .text(input.customNotes, M, y, { width: CW, lineGap: 5 });
    }

    // ─── BACK COVER ───────────────────────────────────────────────────────────
    doc.addPage();
    doc.rect(0, 0, W, H).fill([pr, pg, pb]);

    // Logo centered
    if (logoBuf) {
      try {
        doc.image(logoBuf, W / 2 - 60, H * 0.25, { fit: [120, 60] });
      } catch { /* skip */ }
    }

    doc.fillColor("white").fontSize(20).font("Helvetica-Bold")
      .text(input.agent.agentName || "Your Agent", M, H * 0.42, { width: CW, align: "center" });
    doc.fillColor("white").fontSize(11).font("Helvetica").opacity(0.85)
      .text(input.agent.agentBrokerage || "", M, H * 0.42 + 30, { width: CW, align: "center" });
    doc.opacity(1);

    const backContact = [input.agent.agentPhone, input.agent.agentEmail].filter(Boolean).join("   |   ");
    doc.fillColor("white").fontSize(11).font("Helvetica").opacity(0.8)
      .text(backContact, M, H * 0.42 + 56, { width: CW, align: "center" });
    doc.opacity(1);

    doc.fillColor("white").fontSize(13).font("Helvetica-Bold")
      .text("Ready to get started?", M, H * 0.62, { width: CW, align: "center" });
    doc.fillColor("white").fontSize(10).font("Helvetica").opacity(0.8)
      .text("Reach out today — I'm here to guide you every step of the way.", M, H * 0.62 + 22, { width: CW, align: "center" });
    doc.opacity(1);

    doc.end();
  });
}

// ─── Chapter content helper ───────────────────────────────────────────────────

function getChapterContent(chNum: string, isSeller: boolean, cityArea: string): { type: "heading" | "bullet" | "text"; text: string }[] {
  const sellerContent: Record<string, { type: "heading" | "bullet" | "text"; text: string }[]> = {
    "01": [
      { type: "heading", text: "First Impressions Matter" },
      { type: "text", text: `In the ${cityArea} market, homes that show well sell faster and for more money. Buyers form an opinion within the first 30 seconds of walking through the door.` },
      { type: "bullet", text: "Deep clean every room, including windows, baseboards, and appliances" },
      { type: "bullet", text: "Declutter and depersonalize — buyers need to envision themselves living there" },
      { type: "bullet", text: "Address any deferred maintenance: leaky faucets, squeaky doors, scuffed paint" },
      { type: "heading", text: "Curb Appeal" },
      { type: "bullet", text: "Mow, edge, and mulch the lawn; trim overgrown shrubs" },
      { type: "bullet", text: "Power wash the driveway, walkway, and front porch" },
      { type: "bullet", text: "Add fresh flowers or potted plants near the entry" },
      { type: "heading", text: "Staging Tips" },
      { type: "bullet", text: "Arrange furniture to maximize space and flow" },
      { type: "bullet", text: "Use neutral colors and remove personal photos" },
      { type: "bullet", text: "Ensure every room has good lighting — replace burned-out bulbs" },
    ],
    "02": [
      { type: "heading", text: "How We Price Your Home" },
      { type: "text", text: `Pricing is the single most important decision in selling your home. In ${cityArea}, overpriced homes sit on the market and eventually sell for less than if they had been priced correctly from the start.` },
      { type: "bullet", text: "We analyze recent comparable sales (comps) within a 1-mile radius" },
      { type: "bullet", text: "We adjust for differences in size, condition, upgrades, and location" },
      { type: "bullet", text: "We review current active listings — your competition" },
      { type: "heading", text: "The Danger of Overpricing" },
      { type: "bullet", text: "Buyers and their agents track days on market — a stale listing raises red flags" },
      { type: "bullet", text: "Price reductions signal desperation and invite low offers" },
      { type: "bullet", text: "The first two weeks on market generate the most activity — price it right from day one" },
    ],
    "03": [
      { type: "heading", text: "Professional Marketing Package" },
      { type: "text", text: `Your home will receive a comprehensive marketing campaign designed to reach the most qualified buyers in ${cityArea} and beyond.` },
      { type: "bullet", text: "Professional photography and video walkthrough" },
      { type: "bullet", text: "MLS listing with full exposure to all buyer's agents" },
      { type: "bullet", text: "Zillow, Realtor.com, and all major real estate portals" },
      { type: "bullet", text: "Targeted social media advertising (Instagram, Facebook)" },
      { type: "bullet", text: "Email blast to active buyer database" },
      { type: "bullet", text: "Yard sign, lockbox, and open house as appropriate" },
    ],
    "04": [
      { type: "heading", text: "Showing Best Practices" },
      { type: "bullet", text: "Leave the home during showings — buyers are more comfortable without the seller present" },
      { type: "bullet", text: "Keep the home show-ready at all times: clean, decluttered, and well-lit" },
      { type: "bullet", text: "Secure pets and personal valuables before each showing" },
      { type: "heading", text: "Feedback & Adjustments" },
      { type: "text", text: "After each showing, we collect feedback from the buyer's agent. If we hear consistent themes (price, condition, specific features), we address them quickly." },
    ],
    "05": [
      { type: "heading", text: "Understanding an Offer" },
      { type: "bullet", text: "Purchase price and earnest money deposit" },
      { type: "bullet", text: "Financing contingency — buyer's ability to obtain a loan" },
      { type: "bullet", text: "Inspection contingency — buyer's right to inspect and negotiate repairs" },
      { type: "bullet", text: "Appraisal contingency — protects buyer if home appraises below purchase price" },
      { type: "bullet", text: "Closing date and possession terms" },
      { type: "heading", text: "Negotiation Strategy" },
      { type: "text", text: "Every offer is an opportunity. Even a low offer can be countered. Our goal is to get you the best possible price and terms, not just the highest number on paper." },
    ],
    "06": [
      { type: "heading", text: "What Happens After Acceptance" },
      { type: "bullet", text: "Buyer orders home inspection within the option period" },
      { type: "bullet", text: "We review inspection report and negotiate repairs or credits" },
      { type: "bullet", text: "Lender orders appraisal — we provide comps to support value" },
      { type: "bullet", text: "Title company opens escrow and begins title search" },
      { type: "heading", text: "Your Responsibilities" },
      { type: "bullet", text: "Continue maintaining the home in showing condition" },
      { type: "bullet", text: "Do not make major purchases or changes to your credit" },
      { type: "bullet", text: "Respond promptly to requests from title, lender, or your agent" },
    ],
    "07": [
      { type: "heading", text: "Closing Day Checklist" },
      { type: "bullet", text: "Bring a valid government-issued photo ID" },
      { type: "bullet", text: "Confirm wire transfer of proceeds with your bank in advance" },
      { type: "bullet", text: "Do a final walkthrough of the property before closing" },
      { type: "bullet", text: "Gather all keys, garage door openers, mailbox keys, and access codes" },
      { type: "heading", text: "What to Expect" },
      { type: "text", text: "Closing typically takes 1-2 hours. You'll sign a stack of documents, the buyer's funds will be confirmed, and the deed will be recorded. Once funded, the home is officially sold." },
    ],
    "08": [
      { type: "heading", text: "After the Sale" },
      { type: "bullet", text: "Keep copies of all closing documents for your tax records" },
      { type: "bullet", text: "Consult your CPA about capital gains exclusions (up to $250K single / $500K married)" },
      { type: "bullet", text: "Cancel homeowner's insurance after closing is confirmed" },
      { type: "bullet", text: "Forward your mail and update your address with USPS, banks, and subscriptions" },
      { type: "heading", text: "Stay Connected" },
      { type: "text", text: "My goal is to be your real estate agent for life. Whether you're buying your next home, referring a friend, or just have questions about the market — I'm always here." },
    ],
  };

  const buyerContent: Record<string, { type: "heading" | "bullet" | "text"; text: string }[]> = {
    "01": [
      { type: "heading", text: "Why Pre-Approval Comes First" },
      { type: "text", text: `In ${cityArea}'s competitive market, sellers expect buyers to be pre-approved before they'll accept an offer. Pre-approval tells you exactly how much you can spend and makes your offer credible.` },
      { type: "bullet", text: "Contact 2-3 lenders and compare rates, fees, and loan programs" },
      { type: "bullet", text: "Gather documents: 2 years tax returns, pay stubs, bank statements, W-2s" },
      { type: "bullet", text: "Avoid opening new credit accounts or making large purchases during this process" },
      { type: "heading", text: "Pre-Approval vs. Pre-Qualification" },
      { type: "text", text: "Pre-qualification is a quick estimate based on self-reported information. Pre-approval involves a full credit check and document review — it carries much more weight with sellers." },
    ],
    "02": [
      { type: "heading", text: "Defining Your Priorities" },
      { type: "text", text: `Before we start touring homes in ${cityArea}, let's get clear on what matters most to you. This saves time and ensures we focus on the right properties.` },
      { type: "bullet", text: "Location: school district, commute time, neighborhood feel" },
      { type: "bullet", text: "Size: bedrooms, bathrooms, square footage, lot size" },
      { type: "bullet", text: "Condition: move-in ready vs. willing to renovate" },
      { type: "bullet", text: "Style: single-family, condo, townhome, new construction" },
      { type: "heading", text: "Must-Haves vs. Nice-to-Haves" },
      { type: "text", text: "Separate your non-negotiables from your wish list. In a competitive market, flexibility on nice-to-haves can be the difference between winning and losing a home you love." },
    ],
    "03": [
      { type: "heading", text: "How We Search Together" },
      { type: "bullet", text: "I'll set up an automated MLS search that emails you new listings the moment they hit the market" },
      { type: "bullet", text: "We'll tour homes together — I'll point out things you might miss" },
      { type: "bullet", text: "I'll research the history of any home you're serious about" },
      { type: "heading", text: "What to Look for on Tours" },
      { type: "bullet", text: "Foundation, roof condition, and signs of water damage" },
      { type: "bullet", text: "HVAC age, water heater age, and electrical panel" },
      { type: "bullet", text: "Natural light, storage, and traffic flow" },
      { type: "bullet", text: "Neighborhood: noise, parking, proximity to amenities" },
    ],
    "04": [
      { type: "heading", text: "Crafting a Winning Offer" },
      { type: "text", text: `In ${cityArea}, well-priced homes often receive multiple offers. Here's how we make yours stand out.` },
      { type: "bullet", text: "Offer price: based on comps, not emotion" },
      { type: "bullet", text: "Earnest money: a larger deposit signals serious intent" },
      { type: "bullet", text: "Closing date: flexible to match the seller's needs" },
      { type: "bullet", text: "Contingencies: inspection and financing protect you; waiving them strengthens your offer" },
      { type: "heading", text: "Escalation Clauses" },
      { type: "text", text: "In a multiple-offer situation, an escalation clause automatically increases your offer up to a set maximum if another buyer outbids you. I'll advise when this strategy makes sense." },
    ],
    "05": [
      { type: "heading", text: "The Option Period" },
      { type: "text", text: "After your offer is accepted, you typically have an option period (usually 7-10 days) to conduct inspections and decide whether to proceed." },
      { type: "bullet", text: "Hire a licensed home inspector — I can recommend trusted professionals" },
      { type: "bullet", text: "Consider specialty inspections: foundation, roof, HVAC, pool, pest" },
      { type: "bullet", text: "Review the inspection report carefully and prioritize repair requests" },
      { type: "heading", text: "Negotiating Repairs" },
      { type: "text", text: "We can ask the seller to repair items, provide a credit at closing, or reduce the price. I'll help you decide which approach gets you the best outcome." },
    ],
    "06": [
      { type: "heading", text: "Working with Your Lender" },
      { type: "bullet", text: "Respond immediately to all lender requests for documents" },
      { type: "bullet", text: "Do not change jobs, open new credit, or make large purchases" },
      { type: "bullet", text: "Lock your interest rate when the time is right — I'll coordinate with your lender" },
      { type: "heading", text: "The Appraisal" },
      { type: "text", text: "Your lender will order an appraisal to confirm the home is worth what you're paying. If it comes in low, we have options: renegotiate the price, pay the difference, or walk away." },
    ],
    "07": [
      { type: "heading", text: "Final Walkthrough" },
      { type: "text", text: "24-48 hours before closing, we'll do a final walkthrough to confirm the home is in the agreed-upon condition and all negotiated repairs were completed." },
      { type: "heading", text: "Closing Day Checklist" },
      { type: "bullet", text: "Bring a valid government-issued photo ID" },
      { type: "bullet", text: "Wire your closing funds in advance — confirm the wire instructions directly with the title company (never via email)" },
      { type: "bullet", text: "Plan for 1-2 hours of signing" },
      { type: "bullet", text: "Bring your checkbook for any last-minute adjustments" },
    ],
    "08": [
      { type: "heading", text: "Your First Week" },
      { type: "bullet", text: "Change the locks — you don't know who has copies of the old keys" },
      { type: "bullet", text: "Set up utilities: electricity, gas, water, internet" },
      { type: "bullet", text: "Locate your main water shutoff, electrical panel, and HVAC filter" },
      { type: "heading", text: "Building Equity" },
      { type: "bullet", text: "File for your homestead exemption (if applicable in your state) — it can save you hundreds per year in property taxes" },
      { type: "bullet", text: "Consider making one extra mortgage payment per year to pay off your loan years early" },
      { type: "text", text: "Congratulations on your new home! I'm always here if you have questions, need a referral, or are ready for your next move." },
    ],
  };

  return (isSeller ? sellerContent : buyerContent)[chNum] || [
    { type: "text", text: "Content for this chapter is customized based on your specific situation. Your agent will walk you through this section in detail during your appointment." },
  ];
}

// ─── tRPC router ─────────────────────────────────────────────────────────────

export const guidesGeneratorRouter = router({
  /**
   * Generate a branded Seller's Manual or Buyer's Guide PDF.
   * Deducts credits for non-Agency users.
   */
  generate: protectedProcedure
    .input(GenerateGuideInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // 1. Check credits
      const balance = await getCreditBalance(userId);
      if (balance < GUIDE_CREDIT_COST) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You need at least ${GUIDE_CREDIT_COST} credits to generate a guide. You have ${balance}.`,
        });
      }

      // 2. Fetch agent persona
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [persona] = await database
        .select()
        .from(personas)
        .where(eq(personas.userId, userId))
        .limit(1);

      const agent: AgentBranding = {
        agentName: persona?.agentName || ctx.user.name || "Your Agent",
        agentPhone: persona?.phoneNumber || "",
        agentEmail: persona?.emailAddress || ctx.user.email || "",
        agentBrokerage: persona?.brokerageName || persona?.brokerage || "",
        agentHeadshotUrl: persona?.headshotUrl || null,
        agentLogoUrl: persona?.logoUrl || null,
        primaryColor: persona?.primaryColor || "#C9A962",
      };

      // 3. Fetch hyperlocal market data (best-effort)
      let marketData: GuideInput["marketData"] | undefined;
      try {
        const md = await fetchMarketData(input.cityArea);
        marketData = {
          medianPrice: md.medianPrice,
          daysOnMarket: md.daysOnMarket,
          activeListings: md.activeListings,
          marketTemperature: md.marketTemperature,
          pricePerSqft: md.pricePerSqft,
          insights: md.insights,
        };
      } catch {
        // Market data is optional — proceed without it
      }

      // 4. Build PDF
      const pdfBuffer = await buildGuidePdf({
        guideType: input.guideType,
        clientName: input.clientName,
        propertyAddress: input.propertyAddress,
        cityArea: input.cityArea,
        coverPhotoUrl: input.coverPhotoUrl,
        cmaComps: input.cmaComps,
        suggestedPriceRange: input.suggestedPriceRange,
        customNotes: input.customNotes,
        marketData,
        agent,
      });

      // 5. Upload to S3
      const suffix = Date.now().toString(36);
      const guideLabel = input.guideType === "sellers_manual" ? "sellers-manual" : "buyers-guide";
      const s3Key = `guides/${userId}/${guideLabel}-${suffix}.pdf`;
      const { url: pdfUrl } = await storagePut(s3Key, pdfBuffer, "application/pdf");

      // 6. Deduct credits
      await deductCredits({
        userId,
        amount: GUIDE_CREDIT_COST,
        usageType: "guide_generation",
        description: `Generated ${guideLabel}`,
      });

      // 7. Save record to DB
      const insertResult = await database
        .insert(generatedGuides)
        .values({
          userId,
          guideType: input.guideType,
          clientName: input.clientName || null,
          propertyAddress: input.propertyAddress || null,
          cityArea: input.cityArea,
          agentName: agent.agentName,
          agentPhone: agent.agentPhone,
          agentEmail: agent.agentEmail,
          agentBrokerage: agent.agentBrokerage,
          agentHeadshotUrl: agent.agentHeadshotUrl,
          agentLogoUrl: agent.agentLogoUrl,
          coverPhotoUrl: input.coverPhotoUrl || null,
          cmaData: input.cmaComps ? JSON.stringify(input.cmaComps) : null,
          suggestedPriceRange: input.suggestedPriceRange || null,
          customNotes: input.customNotes || null,
          pdfUrl,
          s3Key,
          creditsCost: GUIDE_CREDIT_COST,
        });
      const insertedId = (insertResult as unknown as { insertId: number }).insertId ?? 0;

      return {
        id: insertedId,
        pdfUrl,
        creditsCost: GUIDE_CREDIT_COST,
        creditsRemaining: balance - GUIDE_CREDIT_COST,
      };
    }),

  /**
   * List all generated guides for the current user (My Documents).
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) return [];
    const guides = await database
      .select()
      .from(generatedGuides)
      .where(eq(generatedGuides.userId, ctx.user.id))
      .orderBy(desc(generatedGuides.createdAt))
      .limit(100);
    return guides;
  }),

  /**
   * Delete a guide from My Documents.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [guide] = await database
        .select({ id: generatedGuides.id, userId: generatedGuides.userId })
        .from(generatedGuides)
        .where(eq(generatedGuides.id, input.id))
        .limit(1);

      if (!guide || guide.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Guide not found" });
      }

      await database.delete(generatedGuides).where(eq(generatedGuides.id, input.id));
      return { success: true };
    }),
});
