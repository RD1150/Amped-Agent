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

const colorSchemeColors: Record<string, { primary: string; secondary: string; text: string }> = {
  blue: { primary: "#3b82f6", secondary: "#1e40af", text: "#ffffff" },
  green: { primary: "#10b981", secondary: "#047857", text: "#ffffff" },
  gold: { primary: "#fbbf24", secondary: "#C9A962", text: "#1a1a1a" },
  red: { primary: "#ef4444", secondary: "#b91c1c", text: "#ffffff" },
  purple: { primary: "#a855f7", secondary: "#7e22ce", text: "#ffffff" },
  teal: { primary: "#14b8a6", secondary: "#0f766e", text: "#ffffff" },
  orange: { primary: "#f97316", secondary: "#c2410c", text: "#ffffff" },
};

export async function renderTemplate(params: RenderTemplateParams): Promise<string> {
  const { template, postText, customHook, businessName, tagline, headshotUrl, primaryColor, platform = "multi", phone, email, website, agentName, licenseNumber, brokerageName, brokerageDRE } = params;
  
  // Get platform-specific dimensions
  const platformSize = getPlatformSize(platform);
  
  // Get color scheme
  const colors = colorSchemeColors[template.colorScheme] || colorSchemeColors.blue;
  const brandColor = primaryColor || colors.primary;

  // Create canvas with platform-specific dimensions
  const canvas = document.createElement("canvas");
  canvas.width = platformSize.width;
  canvas.height = platformSize.height;
  const ctx = canvas.getContext("2d");
  
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Load and render background image (full width, no sidebar)
  await renderBackgroundImage(ctx, template, platformSize.width, platformSize.height);

  // Add optional vertical sidebar text (e.g., "NEW TRENDS")
  renderVerticalSidebarText(ctx, template, platformSize.width, platformSize.height);

  // Add main content text (centered headline with overlay)
  await renderMainContent(ctx, template, postText, customHook, platformSize.width, platformSize.height);

  // Add bottom-left branding card (headshot, name, DRE, company, phone)
  await renderBrandingCard(ctx, brandColor, businessName, tagline, headshotUrl, phone, email, website, agentName, licenseNumber, brokerageName, brokerageDRE, platformSize.width, platformSize.height);

  // Convert to blob and return URL
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob));
      } else {
        reject(new Error("Failed to create blob"));
      }
    }, "image/png");
  });
}

async function renderBackgroundImage(
  ctx: CanvasRenderingContext2D,
  template: Template,
  width: number,
  height: number
) {
  return new Promise<void>((resolve, reject) => {
    const backgroundUrl = getTemplateBackground(template.category, 0);
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      // Draw background image to fill entire canvas (no sidebar)
      ctx.drawImage(img, 0, 0, width, height);
      resolve();
    };
    
    img.onerror = () => {
      console.warn("Failed to load background image, using solid color");
      // Fallback to solid color
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, width, height);
      resolve();
    };
    
    img.src = backgroundUrl;
  });
}

function renderVerticalSidebarText(
  ctx: CanvasRenderingContext2D,
  template: Template,
  width: number,
  height: number
) {
  // Optional: Add vertical text on left edge for some templates
  // Examples: "NEW TRENDS", "CATCH THE LATEST", etc.
  
  // Only show for certain categories
  const showVerticalText = Math.random() > 0.5; // 50% chance for variety
  if (!showVerticalText) return;

  const verticalTexts = [
    "NEW TRENDS",
    "CATCH THE LATEST",
    "MARKET INSIGHTS",
    "EXPERT ADVICE",
    "LOCAL KNOWLEDGE"
  ];
  
  const text = verticalTexts[Math.floor(Math.random() * verticalTexts.length)];
  
  ctx.save();
  ctx.translate(40, height / 2);
  ctx.rotate(-Math.PI / 2);
  
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font = "bold 24px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.letterSpacing = "8px";
  
  // Add text shadow for readability
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  ctx.fillText(text, 0, 0);
  
  ctx.restore();
}

async function renderMainContent(
  ctx: CanvasRenderingContext2D,
  template: Template,
  postText: string,
  customHook: string | undefined,
  width: number = 1080,
  height: number = 1080
) {
  // Use custom hook if provided, otherwise extract title from post text
  const title = customHook || extractTitle(postText, template);

  // Calculate text metrics first to determine overlay size
  ctx.font = "bold 56px Arial, sans-serif";
  const titleLines = wrapText(ctx, title, width * 0.7);
  const lineHeight = 70;
  const totalTextHeight = titleLines.length * lineHeight + 40;

  // Draw semi-transparent overlay for text readability (centered, adaptive height)
  const overlayY = (height - totalTextHeight) / 2;
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, overlayY, width, totalTextHeight);

  // Main title (centered, white text)
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 56px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  const titleY = overlayY + 60;
  titleLines.forEach((line, index) => {
    ctx.fillText(line, width / 2, titleY + (index * lineHeight));
  });

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

async function renderBrandingCard(
  ctx: CanvasRenderingContext2D,
  brandColor: string,
  businessName?: string,
  tagline?: string,
  headshotUrl?: string,
  phone?: string,
  email?: string,
  website?: string,
  agentName?: string,
  licenseNumber?: string,
  brokerageName?: string,
  brokerageDRE?: string,
  width: number = 1080,
  height: number = 1080
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
    await renderHeadshot(ctx, headshotUrl, headshotX + headshotSize / 2, headshotY + headshotSize / 2, headshotSize / 2);
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
  ctx: CanvasRenderingContext2D,
  headshotUrl: string,
  x: number,
  y: number,
  radius: number = 70
) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const diameter = radius * 2;
      
      // Calculate aspect ratio and crop dimensions
      const imgAspect = img.width / img.height;
      let sourceWidth, sourceHeight, sourceX, sourceY;
      
      if (imgAspect > 1) {
        // Image is wider than tall - crop width
        sourceHeight = img.height;
        sourceWidth = img.height; // Make it square
        sourceX = (img.width - sourceWidth) / 2; // Center horizontally
        sourceY = 0;
      } else {
        // Image is taller than wide (portrait) - crop from bottom to preserve full head
        sourceWidth = img.width;
        sourceHeight = img.width; // Make it square
        sourceX = 0;
        // Start from top (0) to preserve head, crop excess from bottom
        sourceY = 0;
      }
      
      // Draw circular headshot with proper aspect ratio
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      
      // Draw the cropped, centered portion of the image
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight, // Source rectangle (cropped)
        x - radius, y - radius, diameter, diameter    // Destination rectangle (circle bounds)
      );
      
      ctx.restore();
      
      // Add white border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      resolve();
    };
    img.onerror = () => {
      console.warn("Failed to load headshot, continuing without it");
      resolve();
    };
    img.src = headshotUrl;
  });
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
  
  // Extract first sentence or use template name
  const firstSentence = postText.split(/[.!?]/)[0].trim();
  if (firstSentence.length > 10 && firstSentence.length < 80) {
    return firstSentence;
  }
  
  return template.name;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine + (currentLine ? " " : "") + word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
