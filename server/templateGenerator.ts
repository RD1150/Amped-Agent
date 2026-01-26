import { generateImage } from "./_core/imageGeneration";

export type TemplateStyle = "modern_clean" | "bold_gradient" | "dark_luxury" | "market_authority";

interface TemplateConfig {
  background: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
}

const templateConfigs: Record<TemplateStyle, TemplateConfig> = {
  modern_clean: {
    background: "white with subtle gradient",
    textColor: "dark gray (#1a1a1a)",
    accentColor: "navy blue (#1e40af)",
    fontFamily: "modern sans-serif",
  },
  bold_gradient: {
    background: "vibrant purple to pink gradient",
    textColor: "white",
    accentColor: "bright yellow (#fbbf24)",
    fontFamily: "bold sans-serif",
  },
  dark_luxury: {
    background: "dark navy to black gradient",
    textColor: "gold (#C9A962)",
    accentColor: "white",
    fontFamily: "elegant serif",
  },
  market_authority: {
    background: "dark teal gradient with data visualization elements",
    textColor: "bright green (#4ade80)",
    accentColor: "cyan (#22d3ee)",
    fontFamily: "professional sans-serif",
  },
};

interface GenerateTemplateImageParams {
  templateStyle: TemplateStyle;
  postText: string;
  businessName?: string;
  tagline?: string;
  headshotUrl?: string;
}

export async function generateTemplateImage(params: GenerateTemplateImageParams): Promise<string> {
  const { templateStyle, postText, businessName, tagline } = params;
  const config = templateConfigs[templateStyle];

  // Create a detailed prompt for image generation that describes the template
  const prompt = `Create a professional real estate social media post graphic in ${templateStyle.replace('_', ' ')} style.

Layout requirements:
- ${config.background} background
- Main text: "${postText.substring(0, 150)}..." in ${config.textColor} color
- ${config.fontFamily} typography
- ${businessName ? `Business name "${businessName}" at the top` : 'Space for business name at top'}
- ${tagline ? `Tagline "${tagline}" at the bottom` : 'Space for tagline at bottom'}
- Accent color: ${config.accentColor}
- Professional, clean, Instagram-ready design
- 1080x1080px square format
- High contrast for readability
- Modern real estate aesthetic
- Leave space for text overlay

Style: ${templateStyle === 'modern_clean' ? 'Minimalist, clean, professional' : 
         templateStyle === 'bold_gradient' ? 'Eye-catching, vibrant, energetic' :
         templateStyle === 'dark_luxury' ? 'Sophisticated, elegant, premium' :
         'Data-driven, authoritative, trustworthy'}`;

  try {
    const { url } = await generateImage({ prompt });
    if (!url) {
      throw new Error('Image generation returned no URL');
    }
    return url;
  } catch (error) {
    console.error('Error generating template image:', error);
    throw new Error('Failed to generate template image');
  }
}

// Helper to extract the first sentence or key phrase from post text
export function extractPostTitle(postText: string): string {
  // Try to get first sentence
  const firstSentence = postText.split(/[.!?]/)[0];
  if (firstSentence && firstSentence.length > 10 && firstSentence.length < 100) {
    return firstSentence.trim();
  }
  
  // Fallback to first 80 characters
  return postText.substring(0, 80).trim() + (postText.length > 80 ? '...' : '');
}
