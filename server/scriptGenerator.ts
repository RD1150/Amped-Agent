import { invokeLLM } from "./_core/llm";

export interface PropertyDetails {
  address: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  description?: string;
  features?: string[];
}

export interface ScriptGenerationOptions {
  propertyDetails: PropertyDetails;
  duration?: number; // Target duration in seconds (default: 30)
  style?: "professional" | "warm" | "luxury" | "casual";
}

/**
 * Generate a natural-sounding narration script for a property tour video
 * Uses LLM to create engaging, concise scripts tailored to the property
 */
export async function generatePropertyTourScript(
  options: ScriptGenerationOptions
): Promise<string> {
  const { propertyDetails, duration = 30, style = "professional" } = options;

  const stylePrompts = {
    professional:
      "Use a professional, authoritative tone. Focus on facts and value proposition.",
    warm: "Use a warm, welcoming tone. Make it feel like a personal tour from a friendly agent.",
    luxury:
      "Use an elegant, sophisticated tone. Emphasize exclusivity and premium features.",
    casual:
      "Use a conversational, relaxed tone. Make it feel approachable and easy-going.",
  };

  const prompt = `Generate a natural-sounding narration script for a real estate property tour video.

Property Details:
- Address: ${propertyDetails.address}
${propertyDetails.price ? `- Price: $${propertyDetails.price.toLocaleString()}` : ""}
${propertyDetails.bedrooms ? `- Bedrooms: ${propertyDetails.bedrooms}` : ""}
${propertyDetails.bathrooms ? `- Bathrooms: ${propertyDetails.bathrooms}` : ""}
${propertyDetails.squareFeet ? `- Square Feet: ${propertyDetails.squareFeet.toLocaleString()}` : ""}
${propertyDetails.description ? `- Description: ${propertyDetails.description}` : ""}
${propertyDetails.features && propertyDetails.features.length > 0 ? `- Key Features: ${propertyDetails.features.join(", ")}` : ""}

Requirements:
- Target duration: ${duration} seconds (approximately ${Math.floor(duration / 2)} words)
- Style: ${stylePrompts[style]}
- Start with a compelling opening hook
- Highlight the most attractive features
- End with a clear call-to-action
- Use natural, conversational language suitable for voice narration
- Avoid overly complex sentences or technical jargon
- Do NOT include stage directions, timestamps, or formatting - just the script text

Generate ONLY the narration script, nothing else:`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are an expert real estate copywriter specializing in property tour video scripts. Generate engaging, natural-sounding narration that sounds great when spoken aloud.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0].message.content;
  const script = typeof content === "string" ? content.trim() : "";

  // Clean up any potential formatting artifacts
  return script
    .replace(/\[.*?\]/g, "") // Remove any [stage directions]
    .replace(/\*.*?\*/g, "") // Remove any *emphasis markers*
    .replace(/\n\n+/g, " ") // Replace multiple newlines with space
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

/**
 * Estimate the duration of a script when spoken
 * Average speaking rate: ~150 words per minute = 2.5 words per second
 */
export function estimateScriptDuration(script: string): number {
  const wordCount = script.split(/\s+/).length;
  const wordsPerSecond = 2.5;
  return Math.ceil(wordCount / wordsPerSecond);
}
