/**
 * letterPdf.ts
 * Generates a professional, print-ready PDF for a prospecting letter.
 *
 * Layout:
 *  - Header: agent headshot (circle), agent name, brokerage, contact info
 *  - Divider line in brand primary color
 *  - Date
 *  - Letter body (formatted paragraphs)
 *  - Signature block
 *  - Footer: brokerage name + DRE + website
 */
import { z } from "zod";
import PDFDocument from "pdfkit";
import https from "https";
import http from "http";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { personas } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "../storage";
import { TRPCError } from "@trpc/server";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fetchImageBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    protocol.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

// ─── PDF builder ─────────────────────────────────────────────────────────────

async function buildLetterPdf(opts: {
  letterContent: string;
  letterLabel: string;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  agentBrokerage: string;
  agentDRE: string;
  agentWebsite: string;
  agentHeadshotUrl: string | null;
  primaryColor: string;
}): Promise<Buffer> {
  const {
    letterContent,
    agentName,
    agentPhone,
    agentEmail,
    agentBrokerage,
    agentDRE,
    agentWebsite,
    agentHeadshotUrl,
    primaryColor,
  } = opts;

  const brandColor = hexToRgb(primaryColor || "#C9A962");

  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margins: { top: 60, bottom: 60, left: 72, right: 72 },
        info: {
          Title: `${opts.letterLabel} — ${agentName}`,
          Author: agentName,
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = doc.page.width;
      const leftMargin = 72;
      const rightMargin = 72;
      const contentWidth = pageWidth - leftMargin - rightMargin;

      // ── Header ────────────────────────────────────────────────────────────
      const headerY = 60;
      const headshotSize = 64;
      const headshotX = leftMargin;

      // Try to load headshot
      let headshotBuffer: Buffer | null = null;
      if (agentHeadshotUrl) {
        try {
          headshotBuffer = await fetchImageBuffer(agentHeadshotUrl);
        } catch {
          headshotBuffer = null;
        }
      }

      if (headshotBuffer) {
        // Draw circular clip for headshot
        doc.save();
        doc
          .circle(headshotX + headshotSize / 2, headerY + headshotSize / 2, headshotSize / 2)
          .clip();
        doc.image(headshotBuffer, headshotX, headerY, {
          width: headshotSize,
          height: headshotSize,
          cover: [headshotSize, headshotSize],
        });
        doc.restore();

        // Draw circle border in brand color
        doc
          .circle(headshotX + headshotSize / 2, headerY + headshotSize / 2, headshotSize / 2)
          .lineWidth(2)
          .strokeColor(brandColor)
          .stroke();
      } else {
        // Placeholder circle
        doc
          .circle(headshotX + headshotSize / 2, headerY + headshotSize / 2, headshotSize / 2)
          .fillColor(brandColor)
          .fill();
        doc
          .fillColor([255, 255, 255])
          .fontSize(22)
          .font("Helvetica-Bold")
          .text(
            agentName.charAt(0).toUpperCase(),
            headshotX,
            headerY + headshotSize / 2 - 13,
            { width: headshotSize, align: "center" }
          );
      }

      // Agent name and info to the right of headshot
      const textX = headshotX + headshotSize + 16;
      const textWidth = contentWidth - headshotSize - 16;

      doc
        .fillColor([20, 20, 20])
        .font("Helvetica-Bold")
        .fontSize(16)
        .text(agentName, textX, headerY + 4, { width: textWidth });

      doc
        .fillColor([80, 80, 80])
        .font("Helvetica")
        .fontSize(10);

      let infoY = headerY + 26;
      if (agentBrokerage) {
        doc.text(agentBrokerage, textX, infoY, { width: textWidth });
        infoY += 14;
      }

      const contactParts: string[] = [];
      if (agentPhone) contactParts.push(agentPhone);
      if (agentEmail) contactParts.push(agentEmail);
      if (contactParts.length > 0) {
        doc.text(contactParts.join("  ·  "), textX, infoY, { width: textWidth });
        infoY += 14;
      }
      if (agentWebsite) {
        doc.fillColor(brandColor).text(agentWebsite, textX, infoY, { width: textWidth });
      }

      // ── Divider ───────────────────────────────────────────────────────────
      const dividerY = headerY + headshotSize + 16;
      doc
        .moveTo(leftMargin, dividerY)
        .lineTo(pageWidth - rightMargin, dividerY)
        .lineWidth(2)
        .strokeColor(brandColor)
        .stroke();

      // ── Date ──────────────────────────────────────────────────────────────
      const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      doc
        .fillColor([80, 80, 80])
        .font("Helvetica")
        .fontSize(10)
        .text(dateStr, leftMargin, dividerY + 14, { width: contentWidth });

      // ── Letter body ───────────────────────────────────────────────────────
      const bodyY = dividerY + 36;
      doc.y = bodyY;

      // Split letter into paragraphs and render each
      const paragraphs = letterContent
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean);

      doc
        .fillColor([20, 20, 20])
        .font("Helvetica")
        .fontSize(11)
        .lineGap(4);

      for (const para of paragraphs) {
        // Detect if this is a salutation or closing line (short, no period mid-line)
        const isShortLine = para.split("\n").length === 1 && para.length < 80;
        if (isShortLine && (para.startsWith("Dear") || para.startsWith("Sincerely") || para.startsWith("Warm") || para.startsWith("Best") || para.startsWith("Respectfully") || para.startsWith("With"))) {
          doc.text(para, leftMargin, doc.y, {
            width: contentWidth,
            align: "left",
            lineGap: 2,
          });
          doc.moveDown(0.6);
        } else {
          doc.text(para, leftMargin, doc.y, {
            width: contentWidth,
            align: "justify",
            lineGap: 2,
          });
          doc.moveDown(0.8);
        }
      }

      // ── Footer ────────────────────────────────────────────────────────────
      const footerY = doc.page.height - 50;
      doc
        .moveTo(leftMargin, footerY - 8)
        .lineTo(pageWidth - rightMargin, footerY - 8)
        .lineWidth(0.5)
        .strokeColor([200, 200, 200])
        .stroke();

      const footerParts: string[] = [];
      if (agentBrokerage) footerParts.push(agentBrokerage);
      if (agentDRE) footerParts.push(`DRE# ${agentDRE}`);
      if (agentWebsite) footerParts.push(agentWebsite);

      doc
        .fillColor([140, 140, 140])
        .font("Helvetica")
        .fontSize(8)
        .text(footerParts.join("  ·  "), leftMargin, footerY, {
          width: contentWidth,
          align: "center",
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const letterPdfRouter = router({
  /** Generate a print-ready PDF for a prospecting letter and return a download URL */
  generate: protectedProcedure
    .input(
      z.object({
        letterContent: z.string().min(50),
        letterLabel: z.string(),
        letterType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Pull agent branding
      const [persona] = await db
        .select()
        .from(personas)
        .where(eq(personas.userId, ctx.user.id))
        .limit(1);

      const agentName = persona?.agentName ?? ctx.user.name ?? "Your Agent";
      const agentPhone = persona?.phoneNumber ?? "";
      const agentEmail = persona?.emailAddress ?? ctx.user.email ?? "";
      const agentBrokerage = persona?.brokerageName ?? persona?.brokerage ?? "";
      const agentDRE = persona?.licenseNumber ?? "";
      const agentWebsite = persona?.bookingUrl ?? persona?.websiteUrl ?? "";
      const agentHeadshotUrl = persona?.headshotUrl ?? null;
      const primaryColor = persona?.primaryColor ?? "#C9A962";

      const pdfBuffer = await buildLetterPdf({
        letterContent: input.letterContent,
        letterLabel: input.letterLabel,
        agentName,
        agentPhone,
        agentEmail,
        agentBrokerage,
        agentDRE,
        agentWebsite,
        agentHeadshotUrl,
        primaryColor,
      });

      const fileKey = `letter-pdfs/${ctx.user.id}/${input.letterType}-${Date.now()}.pdf`;
      const { url } = await storagePut(fileKey, pdfBuffer, "application/pdf");

      return { pdfUrl: url };
    }),
});
