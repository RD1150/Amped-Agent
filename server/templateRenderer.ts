/**
 * Server-side Template Renderer
 * Renders social media post templates with user branding using @napi-rs/canvas
 */

import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import type { Template } from "../shared/templates";
import { templateBackgrounds } from "../client/src/lib/templateBackgrounds";
import { storagePut } from "./storage";

interface RenderTemplateParams {
  template: Template;
  postText: string;
  customHook?: string;
  headshotUrl?: string;
  primaryColor?: string;
  phone?: string;
  agentName?: string;
  licenseNumber?: string;
  brokerageName?: string;
  brokerageDRE?: string;
  ctaText?: string;
  width?: number;
  height?: number;
}

const colorSchemeColors: Record<string, { primary: string; secondary: string; text: string }> = {
  blue: { primary: "#3b82f6", secondary: "#1e40af", text: "#ffffff" },
  green: { primary: "#10b981", secondary: "#047857", text: "#ffffff" },
  gold: { primary: "#fbbf24", secondary: "#C9A962", text: "#1a1a1a" },
  red: { primary: "#ef4444", secondary: "#b91c1c", text: "#ffffff" },
  purple: { primary: "#a855f7", secondary: "#7e22ce", text: "#ffffff" },
  teal: { primary: "#14b8a6", secondary: "#0f766e", text: "#ffffff" },
  orange: { primary: "#f97316", secondary: "#c2410c", text: "#ffffff" },
};

/**
 * Get a background image URL for a template category
 */
function getTemplateBackground(category: string, index: number = 0): string {
  const images = templateBackgrounds[category];
  if (!images || images.length === 0) {
    return templateBackgrounds["buyers"][0];
  }
  return images[index % images.length];
}

/**
 * Render a template with user branding and upload to S3
 * Returns the public CDN URL of the generated image
 */
export async function renderTemplate(params: RenderTemplateParams): Promise<string> {
  const {
    template,
    postText,
    customHook,
    headshotUrl,
    primaryColor,
    phone,
    agentName,
    licenseNumber,
    brokerageName,
    brokerageDRE,
    ctaText,
    width = 1080,
    height = 1080,
  } = params;

  // Get color scheme
  const colors = colorSchemeColors[template.colorScheme] || colorSchemeColors.blue;
  const brandColor = primaryColor || colors.primary;

  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Load and render background image
  await renderBackgroundImage(ctx, template, width, height);

  // Add optional vertical sidebar text
  renderVerticalSidebarText(ctx, template, width, height);

  // Add main content text (centered headline with overlay)
  renderMainContent(ctx, template, postText, customHook, width, height);

  // Add bottom-left branding card
  await renderBrandingCard(
    ctx,
    brandColor,
    headshotUrl,
    phone,
    agentName,
    licenseNumber,
    brokerageName,
    brokerageDRE,
    width,
    height
  );

  // Add CTA text if provided
  if (ctaText) {
    renderCTAText(ctx, ctaText, width, height);
  }

  // Convert to buffer and upload to S3
  const buffer = canvas.toBuffer("image/png");
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const fileKey = `generated-posts/${timestamp}-${randomId}.png`;
  
  const { url } = await storagePut(fileKey, buffer, "image/png");
  return url;
}

async function renderBackgroundImage(
  ctx: any,
  template: Template,
  width: number,
  height: number
) {
  try {
    const backgroundUrl = getTemplateBackground(template.category, 0);
    const img = await loadImage(backgroundUrl);
    
    // Draw background image to fill entire canvas
    ctx.drawImage(img, 0, 0, width, height);
  } catch (error) {
    console.warn("Failed to load background image, using solid color", error);
    // Fallback to solid color
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, width, height);
  }
}

function renderVerticalSidebarText(
  ctx: any,
  template: Template,
  width: number,
  height: number
) {
  // 50% chance to add vertical sidebar text for variety
  if (Math.random() > 0.5) {
    const sidebarTexts = [
      "NEW TRENDS",
      "CATCH THE LATEST",
      "MARKET INSIGHTS",
      "EXPERT ADVICE",
      "REAL ESTATE TIPS",
    ];
    const text = sidebarTexts[Math.floor(Math.random() * sidebarTexts.length)];
    
    ctx.save();
    ctx.translate(30, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "bold 18px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
}

function renderMainContent(
  ctx: any,
  template: Template,
  postText: string,
  customHook: string | undefined,
  width: number,
  height: number
) {
  const title = extractTitle(postText, template);
  
  // Draw semi-transparent dark overlay for text readability
  const overlayHeight = 200;
  const overlayY = (height - overlayHeight) / 2;
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, overlayY, width, overlayHeight);
  
  // Draw main headline
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 56px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  // Word wrap for long titles
  const maxWidth = width - 100;
  const words = title.split(" ");
  let line = "";
  const lines: string[] = [];
  
  for (const word of words) {
    const testLine = line + word + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== "") {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  
  // Draw lines
  const lineHeight = 64;
  const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, startY + index * lineHeight);
  });
}

async function renderBrandingCard(
  ctx: any,
  brandColor: string,
  headshotUrl: string | undefined,
  phone: string | undefined,
  agentName: string | undefined,
  licenseNumber: string | undefined,
  brokerageName: string | undefined,
  brokerageDRE: string | undefined,
  width: number,
  height: number
) {
  // Bottom-left branding card dimensions
  const cardWidth = 380;
  const cardHeight = 200;
  const cardX = 20;
  const cardY = height - cardHeight - 20;
  const headshotSize = 140;
  const headshotX = cardX + 20;
  const headshotY = cardY + (cardHeight - headshotSize) / 2;

  // Draw semi-transparent dark background for branding card
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

  // Agent headshot (left side of card)
  if (headshotUrl) {
    try {
      await renderHeadshot(ctx, headshotUrl, headshotX + headshotSize / 2, headshotY + headshotSize / 2, headshotSize / 2);
    } catch (error) {
      console.warn("Failed to load headshot, continuing without it", error);
    }
  }

  // Text content (right side of card)
  const textX = headshotX + headshotSize + 20;
  let textY = cardY + 30;

  // Agent name
  if (agentName) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(agentName + " Realtor", textX, textY);
    textY += 28;
  }

  // DRE License
  if (licenseNumber) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("DRE " + licenseNumber, textX, textY);
    textY += 26;
  }

  // Brokerage name
  if (brokerageName) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "16px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(brokerageName, textX, textY);
    textY += 24;
  }

  // Phone number
  if (phone) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Text/Call: " + phone, textX, textY);
    textY += 24;
  }

  // Add "Swipe →" indicator in bottom-right corner
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font = "bold 24px Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("Swipe →", width - 30, height - 30);
}

async function renderHeadshot(
  ctx: any,
  headshotUrl: string,
  x: number,
  y: number,
  radius: number = 70
) {
  const img = await loadImage(headshotUrl);
  const diameter = radius * 2;
  
  // Calculate aspect ratio and crop dimensions
  const imgAspect = img.width / img.height;
  let sourceWidth, sourceHeight, sourceX, sourceY;
  
  if (imgAspect > 1) {
    // Image is wider than tall - crop width
    sourceHeight = img.height;
    sourceWidth = img.height;
    sourceX = (img.width - sourceWidth) / 2;
    sourceY = 0;
  } else {
    // Image is taller than wide - crop from top
    sourceWidth = img.width;
    sourceHeight = img.width;
    sourceX = 0;
    sourceY = 0;
  }
  
  // Draw circular headshot
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  
  ctx.drawImage(
    img,
    sourceX, sourceY, sourceWidth, sourceHeight,
    x - radius, y - radius, diameter, diameter
  );
  
  ctx.restore();
  
  // Add white border
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function extractTitle(postText: string, template: Template): string {
  // For specific template types, use template name
  if (template.category === "sellers" && template.id.includes("just_listed")) {
    return "JUST LISTED";
  }
  if (template.category === "sellers" && template.id.includes("just_sold")) {
    return "JUST SOLD";
  }
  if (template.category === "sellers" && template.id.includes("open_house")) {
    return "OPEN HOUSE";
  }
  
  // Extract first sentence or use first 50 characters
  const firstSentence = postText.split(/[.!?]/)[0].trim();
  if (firstSentence.length > 0 && firstSentence.length < 100) {
    return firstSentence.toUpperCase();
  }
  
  return postText.substring(0, 50).trim().toUpperCase() + "...";
}

/**
 * Render CTA text at the bottom center of the image
 */
function renderCTAText(
  ctx: any,
  ctaText: string,
  width: number,
  height: number
) {
  // Position CTA text at bottom center, above the branding card
  const ctaY = height - 200; // Position above branding card
  const ctaX = width / 2;
  
  // Add semi-transparent background for readability
  const textMetrics = ctx.measureText(ctaText);
  const padding = 20;
  const bgWidth = textMetrics.width + padding * 2;
  const bgHeight = 60;
  const bgX = ctaX - bgWidth / 2;
  const bgY = ctaY - bgHeight / 2 - 10;
  
  // Draw rounded rectangle background
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.beginPath();
  ctx.roundRect(bgX, bgY, bgWidth, bgHeight, 10);
  ctx.fill();
  
  // Draw CTA text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(ctaText, ctaX, ctaY);
}
