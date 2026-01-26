import type { Template } from "../../../shared/templates";

interface RenderTemplateParams {
  template: Template;
  postText: string;
  businessName?: string;
  tagline?: string;
  headshotUrl?: string;
  primaryColor?: string;
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
  const { template, postText, businessName, tagline, headshotUrl, primaryColor } = params;
  
  // Get color scheme
  const colors = colorSchemeColors[template.colorScheme] || colorSchemeColors.blue;
  const brandColor = primaryColor || colors.primary;

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Apply design style
  await renderDesignStyle(ctx, template, colors, brandColor);

  // Add content
  await renderContent(ctx, template, postText, businessName, tagline, colors);

  // Add headshot if provided
  if (headshotUrl) {
    await renderHeadshot(ctx, headshotUrl);
  }

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

async function renderDesignStyle(
  ctx: CanvasRenderingContext2D,
  template: Template,
  colors: { primary: string; secondary: string; text: string },
  brandColor: string
) {
  const { designStyle } = template;

  switch (designStyle) {
    case "modern":
      // Clean gradient background
      const modernGradient = ctx.createLinearGradient(0, 0, 1080, 1080);
      modernGradient.addColorStop(0, colors.primary);
      modernGradient.addColorStop(1, colors.secondary);
      ctx.fillStyle = modernGradient;
      ctx.fillRect(0, 0, 1080, 1080);
      
      // Add subtle pattern
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      for (let i = 0; i < 20; i++) {
        ctx.fillRect(i * 60, 0, 30, 1080);
      }
      break;

    case "bold":
      // Vibrant gradient
      const boldGradient = ctx.createLinearGradient(0, 0, 1080, 1080);
      boldGradient.addColorStop(0, colors.primary);
      boldGradient.addColorStop(0.5, brandColor);
      boldGradient.addColorStop(1, colors.secondary);
      ctx.fillStyle = boldGradient;
      ctx.fillRect(0, 0, 1080, 1080);
      
      // Add geometric shapes
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.beginPath();
      ctx.arc(900, 200, 300, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(200, 900, 250, 0, Math.PI * 2);
      ctx.fill();
      break;

    case "elegant":
      // Sophisticated solid background
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, 1080, 1080);
      
      // Add gold accent border
      ctx.strokeStyle = brandColor;
      ctx.lineWidth = 8;
      ctx.strokeRect(40, 40, 1000, 1000);
      
      // Inner border
      ctx.strokeStyle = "rgba(201, 169, 98, 0.3)";
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 60, 960, 960);
      break;

    case "data":
      // Clean background for data visualization
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, 1080, 1080);
      
      // Grid pattern
      ctx.strokeStyle = "rgba(148, 163, 184, 0.1)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 1080; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 1080);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(1080, i);
        ctx.stroke();
      }
      
      // Accent bar
      ctx.fillStyle = colors.primary;
      ctx.fillRect(0, 0, 1080, 20);
      break;

    case "minimal":
      // Clean white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1080, 1080);
      
      // Subtle accent
      ctx.fillStyle = brandColor;
      ctx.fillRect(0, 0, 1080, 10);
      ctx.fillRect(0, 1070, 1080, 10);
      break;

    case "luxury":
      // Dark elegant background
      const luxuryGradient = ctx.createRadialGradient(540, 540, 0, 540, 540, 700);
      luxuryGradient.addColorStop(0, "#2d2d3a");
      luxuryGradient.addColorStop(1, "#1a1a2e");
      ctx.fillStyle = luxuryGradient;
      ctx.fillRect(0, 0, 1080, 1080);
      
      // Gold accents
      ctx.fillStyle = brandColor;
      ctx.fillRect(0, 520, 1080, 40);
      break;

    default:
      // Default gradient
      const defaultGradient = ctx.createLinearGradient(0, 0, 1080, 1080);
      defaultGradient.addColorStop(0, colors.primary);
      defaultGradient.addColorStop(1, colors.secondary);
      ctx.fillStyle = defaultGradient;
      ctx.fillRect(0, 0, 1080, 1080);
  }
}

async function renderContent(
  ctx: CanvasRenderingContext2D,
  template: Template,
  postText: string,
  businessName?: string,
  tagline?: string,
  colors?: { primary: string; secondary: string; text: string }
) {
  const textColor = colors?.text || "#ffffff";
  
  // Business name at top
  if (businessName) {
    ctx.fillStyle = textColor;
    ctx.font = "bold 32px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(businessName.toUpperCase(), 540, 120);
  }

  // Main content - extract title from post text
  const title = extractTitle(postText, template);
  ctx.fillStyle = textColor;
  ctx.font = template.designStyle === "elegant" ? "bold 56px Georgia, serif" : "bold 56px Arial, sans-serif";
  ctx.textAlign = "center";
  
  // Word wrap title
  const titleLines = wrapText(ctx, title, 900);
  const titleY = 540 - (titleLines.length * 35);
  titleLines.forEach((line, index) => {
    ctx.fillText(line, 540, titleY + (index * 70));
  });

  // Tagline at bottom
  if (tagline) {
    ctx.fillStyle = textColor;
    ctx.font = "24px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(tagline, 540, 980);
  }

  // Template name watermark
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.font = "16px Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(template.name, 1040, 1060);
}

async function renderHeadshot(ctx: CanvasRenderingContext2D, headshotUrl: string) {
  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Draw circular headshot in bottom left
      ctx.save();
      ctx.beginPath();
      ctx.arc(150, 930, 80, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 70, 850, 160, 160);
      ctx.restore();
      
      // Add border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(150, 930, 80, 0, Math.PI * 2);
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
