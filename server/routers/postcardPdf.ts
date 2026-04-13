/**
 * Postcard PDF Generator
 * Generates a print-ready 4x6 postcard PDF
 * Front: headline + subheadline + agent branding
 * Back: message body + CTA + agent contact info + QR code
 */
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { storagePut } from "../storage";

export interface PostcardContent {
  headline: string;
  subheadline?: string;
  backBody: string;
  cta: string;
  agentTagline: string;
}

export interface AgentBranding {
  agentName: string;
  brokerageName?: string;
  phoneNumber?: string;
  websiteUrl?: string;
  bookingUrl?: string;
  headshotUrl?: string;
  logoUrl?: string;
  primaryCity?: string;
  primaryColor?: string;
}

/**
 * Generate a 4x6 postcard PDF and upload to S3.
 * Returns the public URL of the uploaded PDF.
 */
export async function generatePostcardPdf(
  content: PostcardContent,
  agent: AgentBranding,
  userId: number
): Promise<string> {
  // 4x6 inches in PDF points (1pt = 1/72 inch)
  // 6in wide x 4in tall = 432pt x 288pt
  const W = 432;
  const H = 288;
  const accent = agent.primaryColor || "#E85D04";

  // Generate QR code PNG buffer
  let qrPngBuffer: Buffer | null = null;
  try {
    const qrUrl = agent.bookingUrl || agent.websiteUrl || "https://ampedagent.app";
    qrPngBuffer = await QRCode.toBuffer(qrUrl, {
      type: "png",
      width: 120,
      margin: 1,
      color: { dark: "#111111", light: "#FFFFFF" },
    });
  } catch {
    // QR generation failed — use placeholder
  }

  const finalBuffers: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({
      size: [W, H],
      margin: 0,
      info: { Title: "Postcard", Author: agent.agentName },
    });

    doc.on("data", (chunk: Buffer) => finalBuffers.push(chunk));
    doc.on("end", resolve);
    doc.on("error", reject);

    // ── PAGE 1: FRONT ────────────────────────────────────────────────
    doc.rect(0, 0, W, H).fill("#0F0F0F");
    // Left accent stripe
    doc.rect(0, 0, 8, H).fill(accent);

    // Headline
    const headlineFontSize = content.headline.length > 40 ? 22 : 26;
    doc
      .font("Helvetica-Bold")
      .fontSize(headlineFontSize)
      .fillColor("#FFFFFF")
      .text(content.headline, 28, 40, { width: W - 56, align: "left", lineGap: 4 });

    // Subheadline
    if (content.subheadline) {
      const headlineH = doc.currentLineHeight(true) * Math.ceil(content.headline.length / 28) + 10;
      doc
        .font("Helvetica")
        .fontSize(13)
        .fillColor("#CCCCCC")
        .text(content.subheadline, 28, 50 + headlineH, { width: W - 56 });
    }

    // Bottom divider
    doc.moveTo(28, H - 60).lineTo(W - 28, H - 60).strokeColor(accent).lineWidth(0.5).stroke();

    // Agent tagline bottom-left
    doc
      .font("Helvetica-Oblique")
      .fontSize(11)
      .fillColor(accent)
      .text(content.agentTagline, 28, H - 50, { width: W / 2 });

    // Agent name bottom-right
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#FFFFFF")
      .text(agent.agentName, W / 2, H - 50, { width: W / 2 - 28, align: "right" });

    if (agent.brokerageName) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#AAAAAA")
        .text(agent.brokerageName, W / 2, H - 34, { width: W / 2 - 28, align: "right" });
    }

    // ── PAGE 2: BACK ─────────────────────────────────────────────────
    doc.addPage({ size: [W, H], margin: 0 });
    doc.rect(0, 0, W, H).fill("#FFFFFF");

    const leftW = Math.floor(W * 0.62);
    const rightW = W - leftW;
    const pad = 24;
    const rightPad = 16;
    const rightX = leftW + rightPad;
    const qrSize = rightW - rightPad * 2;

    // Left column background
    doc.rect(0, 0, leftW, H).fill("#F8F8F8");

    // Agent name header
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#111111")
      .text(agent.agentName, pad, pad, { width: leftW - pad * 2 });

    if (agent.brokerageName) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#666666")
        .text(agent.brokerageName, pad, pad + 18, { width: leftW - pad * 2 });
    }

    // Divider under header
    doc.moveTo(pad, pad + 34).lineTo(leftW - pad, pad + 34).strokeColor("#DDDDDD").lineWidth(0.5).stroke();

    // Back body message
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#333333")
      .text(content.backBody, pad, pad + 46, { width: leftW - pad * 2, lineGap: 3 });

    // CTA button
    const bodyLines = Math.ceil(content.backBody.length / 45);
    const bodyH = bodyLines * 16;
    const ctaY = pad + 46 + bodyH + 16;
    if (ctaY + 28 < H - 10) {
      doc.rect(pad, ctaY, leftW - pad * 2, 28).fill(accent);
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#FFFFFF")
        .text(content.cta, pad + 8, ctaY + 8, { width: leftW - pad * 2 - 16, align: "center" });
    }

    // Right column: QR code
    if (qrPngBuffer) {
      doc.image(qrPngBuffer, rightX, pad, { width: qrSize, height: qrSize });
    } else {
      doc.rect(rightX, pad, qrSize, qrSize).fill("#EEEEEE");
      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor("#999999")
        .text("Scan to connect", rightX, pad + qrSize / 2 - 5, { width: qrSize, align: "center" });
    }

    // Contact info below QR
    let contactY = pad + qrSize + 10;
    if (agent.phoneNumber) {
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#111111").text(agent.phoneNumber, rightX, contactY, { width: qrSize });
      contactY += 14;
    }
    if (agent.websiteUrl) {
      doc.font("Helvetica").fontSize(8).fillColor("#555555").text(agent.websiteUrl.replace(/^https?:\/\//, ""), rightX, contactY, { width: qrSize });
      contactY += 12;
    }
    if (agent.primaryCity) {
      doc.font("Helvetica").fontSize(8).fillColor("#888888").text(agent.primaryCity, rightX, contactY, { width: qrSize });
    }

    doc.end();
  });

  const pdfBuffer = Buffer.concat(finalBuffers);
  const fileKey = `postcards/${userId}-postcard-${Date.now()}.pdf`;
  const { url } = await storagePut(fileKey, pdfBuffer, "application/pdf");
  return url;
}
