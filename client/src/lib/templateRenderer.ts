import type { Template } from "../../../shared/templates";
import { type SocialPlatform, getPlatformSize } from "../../../shared/platformSizes";
import { getTemplateBackground } from "./templateBackgrounds";

interface RenderTemplateParams {
  template: Template;
  postText: string;
  customHook?: string;
  businessName?: string;
  tagline?: string;
  headshotUrl?: string;
  primaryColor?: string;
  platform?: SocialPlatform;
  phone?: string;
  email?: string;
  website?: string;
  agentName?: string;
  licenseNumber?: string;
  brokerageName?: string;
  brokerageDRE?: string;
}

// ─── Luxury Design Tokens ─────────────────────────────────────────────────────
const LUXURY = {
  gold: "#C9A962",
  goldLight: "#E8D5A3",
  goldDim: "rgba(201,169,98,0.85)",
  charcoal: "#0F0F0F",
  charcoalMid: "#1A1A1A",
  overlayDark: "rgba(10,10,10,0.62)",
  overlayMid: "rgba(10,10,10,0.48)",
  white: "#FFFFFF",
  offWhite: "#F5F0E8",
  // Serif font stack — Cormorant Garamond loads via Google Fonts in index.html;
  // Canvas falls back to Georgia which is also elegant.
  serifFont: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
  sansFont: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
};

export async function renderTemplate(params: RenderTemplateParams): Promise<string> {
  const {
    template, postText, customHook, businessName, tagline, headshotUrl,
    primaryColor, platform = "multi", phone, email, website, agentName,
    licenseNumber, brokerageName, brokerageDRE,
  } = params;

  const platformSize = getPlatformSize(platform);
  const canvas = document.createElement("canvas");
  canvas.width = platformSize.width;
  canvas.height = platformSize.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  const W = platformSize.width;
  const H = platformSize.height;

  // 1. Full-bleed background photo
  await renderBackgroundImage(ctx, template, W, H);

  // 2. Gradient vignette — darkens bottom third so text pops
  renderVignette(ctx, W, H);

  // 3. Thin gold frame inset
  renderGoldFrame(ctx, W, H);

  // 4. Hook text band (centered, adaptive height, reduced-opacity band)
  const title = customHook || extractTitle(postText, template);
  await renderHookBand(ctx, title, W, H);

  // 5. Bottom branding strip
  await renderBrandingStrip(
    ctx, W, H, brandColor(primaryColor), agentName, licenseNumber,
    brokerageName, brokerageDRE, phone, headshotUrl,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(URL.createObjectURL(blob));
      else reject(new Error("Failed to create blob"));
    }, "image/png");
  });
}

// ─── Background ───────────────────────────────────────────────────────────────
async function renderBackgroundImage(
  ctx: CanvasRenderingContext2D,
  template: Template,
  width: number,
  height: number,
) {
  return new Promise<void>((resolve) => {
    const backgroundUrl = getTemplateBackground(template.category, 0);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Cover-fit: fill canvas, center-crop
      const scale = Math.max(width / img.width, height / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      const sx = (width - sw) / 2;
      const sy = (height - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh);
      resolve();
    };
    img.onerror = () => {
      // Elegant dark fallback
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#0F0F0F");
      grad.addColorStop(1, "#1C1A14");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      resolve();
    };
    img.src = backgroundUrl;
  });
}

// ─── Vignette ─────────────────────────────────────────────────────────────────
function renderVignette(ctx: CanvasRenderingContext2D, W: number, H: number) {
  // Radial vignette around edges
  const radial = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
  radial.addColorStop(0, "rgba(0,0,0,0)");
  radial.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, W, H);

  // Linear gradient darkening the bottom 40%
  const linear = ctx.createLinearGradient(0, H * 0.55, 0, H);
  linear.addColorStop(0, "rgba(0,0,0,0)");
  linear.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = linear;
  ctx.fillRect(0, H * 0.55, W, H * 0.45);
}

// ─── Gold Frame ───────────────────────────────────────────────────────────────
function renderGoldFrame(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const inset = Math.round(W * 0.025); // ~27px on 1080
  const lineW = Math.max(1, Math.round(W * 0.0018)); // ~2px

  ctx.strokeStyle = LUXURY.gold;
  ctx.lineWidth = lineW;
  ctx.globalAlpha = 0.7;
  ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
  ctx.globalAlpha = 1;

  // Corner accent marks — small L-shapes at each corner
  const cs = Math.round(W * 0.055); // corner size ~60px
  const ci = inset - Math.round(lineW / 2);
  ctx.strokeStyle = LUXURY.gold;
  ctx.lineWidth = Math.max(2, lineW * 2);
  ctx.globalAlpha = 0.9;

  const corners: [number, number, number, number][] = [
    [ci, ci, cs, cs],                         // top-left
    [W - ci - cs, ci, cs, cs],                // top-right
    [ci, H - ci - cs, cs, cs],                // bottom-left
    [W - ci - cs, H - ci - cs, cs, cs],       // bottom-right
  ];

  for (const [x, y, cw, ch] of corners) {
    ctx.beginPath();
    // horizontal arm
    ctx.moveTo(x, y + ch / 2);
    ctx.lineTo(x + cw, y + ch / 2);
    // vertical arm
    ctx.moveTo(x + cw / 2, y);
    ctx.lineTo(x + cw / 2, y + ch);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ─── Hook Band ────────────────────────────────────────────────────────────────
async function renderHookBand(
  ctx: CanvasRenderingContext2D,
  title: string,
  W: number,
  H: number,
) {
  // Load Cormorant Garamond via FontFace API if not already loaded
  await ensureLuxuryFonts();

  const maxTextWidth = W * 0.72;
  const fontSize = Math.round(W * 0.055); // ~59px on 1080
  const lineHeight = Math.round(fontSize * 1.28);

  ctx.font = `600 ${fontSize}px ${LUXURY.serifFont}`;
  const lines = wrapText(ctx, title.toUpperCase(), maxTextWidth);

  const textBlockH = lines.length * lineHeight;
  const bandPadV = Math.round(H * 0.028);
  const bandH = textBlockH + bandPadV * 2;

  // Center the band vertically (slightly above center for visual balance)
  const bandY = Math.round(H * 0.35 - bandH / 2);

  // Semi-transparent dark band — only as wide as the text + padding
  const bandPadH = Math.round(W * 0.06);
  ctx.font = `600 ${fontSize}px ${LUXURY.serifFont}`;
  const maxLineW = lines.reduce((acc, l) => Math.max(acc, ctx.measureText(l).width), 0);
  const bandW = Math.min(maxLineW + bandPadH * 2, W - Math.round(W * 0.08));
  const bandX = (W - bandW) / 2;

  // Draw band with rounded corners
  ctx.fillStyle = LUXURY.overlayDark;
  roundRect(ctx, bandX, bandY, bandW, bandH, Math.round(W * 0.008));
  ctx.fill();

  // Gold hairline above and below band
  ctx.strokeStyle = LUXURY.gold;
  ctx.lineWidth = Math.max(1, Math.round(W * 0.0015));
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(bandX + Math.round(W * 0.02), bandY);
  ctx.lineTo(bandX + bandW - Math.round(W * 0.02), bandY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bandX + Math.round(W * 0.02), bandY + bandH);
  ctx.lineTo(bandX + bandW - Math.round(W * 0.02), bandY + bandH);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Hook text — white, serif, centered
  ctx.fillStyle = LUXURY.white;
  ctx.font = `600 ${fontSize}px ${LUXURY.serifFont}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // Subtle text shadow for depth
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, bandY + bandPadV + i * lineHeight);
  });

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.textBaseline = "alphabetic";
}

// ─── Branding Strip ───────────────────────────────────────────────────────────
async function renderBrandingStrip(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  accentColor: string,
  agentName?: string,
  licenseNumber?: string,
  brokerageName?: string,
  brokerageDRE?: string,
  phone?: string,
  headshotUrl?: string,
) {
  await ensureLuxuryFonts();

  const stripH = Math.round(H * 0.135); // ~146px on 1080
  const stripY = H - stripH;

  // Dark strip background
  ctx.fillStyle = "rgba(8,8,8,0.82)";
  ctx.fillRect(0, stripY, W, stripH);

  // Gold top border on strip
  ctx.fillStyle = LUXURY.gold;
  ctx.fillRect(0, stripY, W, Math.max(2, Math.round(H * 0.003)));

  const pad = Math.round(W * 0.04);
  let textX = pad;
  const centerY = stripY + stripH / 2;

  // Headshot circle
  if (headshotUrl) {
    const r = Math.round(stripH * 0.38);
    await renderHeadshot(ctx, headshotUrl, textX + r, centerY, r, accentColor);
    textX += r * 2 + Math.round(W * 0.025);
  }

  // Agent name — serif, white
  const nameFontSize = Math.round(W * 0.026);
  const detailFontSize = Math.round(W * 0.018);
  const smallFontSize = Math.round(W * 0.015);

  let lineY = centerY - Math.round(stripH * 0.22);

  if (agentName) {
    ctx.fillStyle = LUXURY.white;
    ctx.font = `600 ${nameFontSize}px ${LUXURY.serifFont}`;
    ctx.textAlign = "left";
    ctx.fillText(agentName, textX, lineY);
    lineY += Math.round(nameFontSize * 1.4);
  }

  // Brokerage name — gold accent
  if (brokerageName) {
    ctx.fillStyle = LUXURY.gold;
    ctx.font = `500 ${detailFontSize}px ${LUXURY.sansFont}`;
    ctx.letterSpacing = "1px";
    ctx.fillText(brokerageName.toUpperCase(), textX, lineY);
    ctx.letterSpacing = "0px";
    lineY += Math.round(detailFontSize * 1.5);
  }

  // DRE + phone on same line
  const dre = licenseNumber ? `DRE #${licenseNumber}` : "";
  const ph = phone ? `  ·  ${phone}` : "";
  const details = [dre, ph].filter(Boolean).join("");
  if (details) {
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = `400 ${smallFontSize}px ${LUXURY.sansFont}`;
    ctx.fillText(details, textX, lineY);
  }

  // Right side: gold diamond + "LUXURY REAL ESTATE" label
  const rightX = W - pad;
  ctx.fillStyle = LUXURY.gold;
  ctx.font = `400 ${smallFontSize}px ${LUXURY.sansFont}`;
  ctx.textAlign = "right";
  ctx.globalAlpha = 0.8;
  ctx.fillText("LUXURY REAL ESTATE", rightX, centerY - Math.round(smallFontSize * 0.5));
  ctx.globalAlpha = 1;

  // Small gold diamond ornament
  const diamondY = centerY + Math.round(smallFontSize * 1.2);
  const ds = Math.round(W * 0.008);
  ctx.fillStyle = LUXURY.gold;
  ctx.beginPath();
  ctx.moveTo(rightX - ds * 3, diamondY);
  ctx.lineTo(rightX - ds * 3 + ds, diamondY - ds);
  ctx.lineTo(rightX - ds * 3 + ds * 2, diamondY);
  ctx.lineTo(rightX - ds * 3 + ds, diamondY + ds);
  ctx.closePath();
  ctx.fill();
}

// ─── Headshot ─────────────────────────────────────────────────────────────────
async function renderHeadshot(
  ctx: CanvasRenderingContext2D,
  headshotUrl: string,
  cx: number,
  cy: number,
  radius: number,
  accentColor: string,
) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const d = radius * 2;
      const aspect = img.width / img.height;
      let sw, sh, sx, sy;
      if (aspect > 1) {
        sh = img.height; sw = img.height; sx = (img.width - sw) / 2; sy = 0;
      } else {
        sw = img.width; sh = img.width; sx = 0; sy = 0;
      }
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, sx, sy, sw, sh, cx - radius, cy - radius, d, d);
      ctx.restore();

      // Gold ring border
      ctx.strokeStyle = accentColor || LUXURY.gold;
      ctx.lineWidth = Math.max(2, Math.round(radius * 0.06));
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      resolve();
    };
    img.onerror = () => resolve();
    img.src = headshotUrl;
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function brandColor(primaryColor?: string): string {
  return primaryColor || LUXURY.gold;
}

function extractTitle(postText: string, template: Template): string {
  if (template.category === "sellers" && template.id.includes("just_listed")) return "Just Listed";
  if (template.category === "sellers" && template.id.includes("just_sold")) return "Just Sold";
  if (template.category === "sellers" && template.id.includes("open_house")) return "Open House";
  const first = postText.split(/[.!?]/)[0].trim();
  if (first.length > 10 && first.length < 90) return first;
  return template.name;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

let luxuryFontsLoaded = false;
async function ensureLuxuryFonts() {
  if (luxuryFontsLoaded) return;
  try {
    await Promise.all([
      document.fonts.load("600 60px 'Cormorant Garamond'"),
      document.fonts.load("500 30px 'Montserrat'"),
    ]);
  } catch {
    // Fonts may not be available in all environments; fall back gracefully
  }
  luxuryFontsLoaded = true;
}
