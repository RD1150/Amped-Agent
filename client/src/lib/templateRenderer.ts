import type { Template } from "../../../shared/templates";
import { type SocialPlatform, getPlatformSize } from "../../../shared/platformSizes";
import { getTemplateBackground } from "./templateBackgrounds";

interface RenderTemplateParams {
  template: Template;
  postText: string;
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
  const { template, postText, businessName, tagline, headshotUrl, primaryColor, platform = "multi", phone, email, website, agentName, licenseNumber, brokerageName, brokerageDRE } = params;
  
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

  // Load and render background image
  await renderBackgroundImage(ctx, template, platformSize.width, platformSize.height);

  // Add dark sidebar overlay
  await renderSidebarOverlay(ctx, template, brandColor, businessName, tagline, headshotUrl, phone, email, website, agentName, licenseNumber, brokerageName, brokerageDRE, platformSize.width, platformSize.height);

  // Add main content text
  await renderMainContent(ctx, template, postText, platformSize.width, platformSize.height);

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
      // Draw background image to fill canvas
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

async function renderSidebarOverlay(
  ctx: CanvasRenderingContext2D,
  template: Template,
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
  // Calculate sidebar width (30% of canvas width)
  const sidebarWidth = width * 0.3;
  
  // Draw dark overlay sidebar on the left
  ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
  ctx.fillRect(0, 0, sidebarWidth, height);

  // Add brand color accent stripe
  ctx.fillStyle = brandColor;
  ctx.fillRect(0, 0, 8, height);

  // Vertical text positioning
  let currentY = 80;
  const padding = 40;

  // Agent headshot at top (if provided)
  if (headshotUrl) {
    await renderHeadshot(ctx, headshotUrl, sidebarWidth / 2, currentY + 100);
    currentY += 240;
  }

  // Business name
  if (businessName) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px Arial, sans-serif";
    ctx.textAlign = "center";
    const nameLines = wrapText(ctx, businessName.toUpperCase(), sidebarWidth - padding * 2);
    nameLines.forEach((line) => {
      ctx.fillText(line, sidebarWidth / 2, currentY);
      currentY += 32;
    });
    currentY += 20;
  }

  // Tagline
  if (tagline) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "18px Arial, sans-serif";
    ctx.textAlign = "center";
    const taglineLines = wrapText(ctx, tagline, sidebarWidth - padding * 2);
    taglineLines.forEach((line) => {
      ctx.fillText(line, sidebarWidth / 2, currentY);
      currentY += 26;
    });
    currentY += 40;
  }

  // Divider line
  ctx.strokeStyle = brandColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, currentY);
  ctx.lineTo(sidebarWidth - padding, currentY);
  ctx.stroke();
  currentY += 40;

  // Contact information
  ctx.fillStyle = "#ffffff";
  ctx.font = "16px Arial, sans-serif";
  ctx.textAlign = "left";

  if (phone) {
    ctx.fillText("📞", padding, currentY);
    ctx.fillText(phone, padding + 30, currentY);
    currentY += 30;
  }

  if (email) {
    ctx.fillText("✉️", padding, currentY);
    const emailLines = wrapText(ctx, email, sidebarWidth - padding * 2 - 30);
    emailLines.forEach((line, index) => {
      ctx.fillText(line, padding + 30, currentY + (index * 24));
    });
    currentY += emailLines.length * 24 + 10;
  }

  if (website) {
    ctx.fillText("🌐", padding, currentY);
    const websiteLines = wrapText(ctx, website, sidebarWidth - padding * 2 - 30);
    websiteLines.forEach((line, index) => {
      ctx.fillText(line, padding + 30, currentY + (index * 24));
    });
    currentY += websiteLines.length * 24 + 20;
  }

  // DRE Compliance Information
  if (agentName && licenseNumber) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "14px Arial, sans-serif";
    ctx.textAlign = "left";
    const dreText = `${agentName} | DRE #${licenseNumber}`;
    const dreLines = wrapText(ctx, dreText, sidebarWidth - padding * 2);
    dreLines.forEach((line, index) => {
      ctx.fillText(line, padding, currentY + (index * 20));
    });
    currentY += dreLines.length * 20 + 10;
  }

  if (brokerageName && brokerageDRE) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "14px Arial, sans-serif";
    ctx.textAlign = "left";
    const brokerageDREText = `${brokerageName} | DRE #${brokerageDRE}`;
    const brokerageLines = wrapText(ctx, brokerageDREText, sidebarWidth - padding * 2);
    brokerageLines.forEach((line, index) => {
      ctx.fillText(line, padding, currentY + (index * 20));
    });
    currentY += brokerageLines.length * 20;
  }
}

async function renderMainContent(
  ctx: CanvasRenderingContext2D,
  template: Template,
  postText: string,
  width: number = 1080,
  height: number = 1080
) {
  const sidebarWidth = width * 0.3;
  const contentX = sidebarWidth + 60;
  const contentWidth = width - sidebarWidth - 120;

  // Extract title from post text
  const title = extractTitle(postText, template);

  // Draw semi-transparent overlay for text readability
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fillRect(sidebarWidth, height * 0.35, width - sidebarWidth, height * 0.3);

  // Main title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 48px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  const titleLines = wrapText(ctx, title, contentWidth);
  const titleY = height * 0.45;
  titleLines.forEach((line, index) => {
    ctx.fillText(line, contentX, titleY + (index * 60));
  });

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

async function renderHeadshot(
  ctx: CanvasRenderingContext2D,
  headshotUrl: string,
  x: number,
  y: number
) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const radius = 90;
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
        // Image is taller than wide (portrait) - crop height, focus on upper portion
        sourceWidth = img.width;
        sourceHeight = img.width; // Make it square
        sourceX = 0;
        // Position crop in upper third instead of center to capture face
        sourceY = Math.min(img.height * 0.15, (img.height - sourceHeight) * 0.3);
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
      ctx.lineWidth = 4;
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
