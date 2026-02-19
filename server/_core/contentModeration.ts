import { invokeLLM } from "./llm";

/**
 * Content moderation categories and thresholds
 */
export interface ModerationResult {
  flagged: boolean;
  categories: {
    hate: boolean;
    hate_threatening: boolean;
    harassment: boolean;
    harassment_threatening: boolean;
    self_harm: boolean;
    self_harm_intent: boolean;
    self_harm_instructions: boolean;
    sexual: boolean;
    sexual_minors: boolean;
    violence: boolean;
    violence_graphic: boolean;
  };
  category_scores: {
    hate: number;
    hate_threatening: number;
    harassment: number;
    harassment_threatening: number;
    self_harm: number;
    self_harm_intent: number;
    self_harm_instructions: number;
    sexual: number;
    sexual_minors: number;
    violence: number;
    violence_graphic: number;
  };
  reason?: string;
}

/**
 * Fair Housing Act protected classes and discriminatory terms
 */
const FAIR_HOUSING_VIOLATIONS = [
  // Race/Color
  /\b(white|black|asian|hispanic|latino|caucasian|african|indian)\s+(only|preferred|neighborhood|community|area)\b/i,
  /\b(no|not|avoid)\s+(white|black|asian|hispanic|latino|caucasian|african|indian)\b/i,
  
  // Religion
  /\b(christian|jewish|muslim|hindu|buddhist|catholic)\s+(only|preferred|neighborhood|community|area)\b/i,
  /\b(no|not|avoid)\s+(christian|jewish|muslim|hindu|buddhist|catholic)\b/i,
  
  // National Origin
  /\b(american|foreign|immigrant)\s+(only|preferred)\b/i,
  /\b(no|not|avoid)\s+(immigrants?|foreigners?)\b/i,
  
  // Familial Status
  /\b(no|not|avoid)\s+(children|kids|families|family)\b/i,
  /\badults?\s+only\b/i,
  /\bperfect\s+for\s+(singles?|couples?\s+without\s+children)\b/i,
  
  // Disability
  /\b(no|not|avoid)\s+(disabled|handicapped|wheelchair)\b/i,
  /\bmust\s+be\s+able\s+to\s+(walk|climb|see|hear)\b/i,
  
  // Sex/Gender
  /\b(male|female|men|women)\s+(only|preferred)\b/i,
  
  // General discriminatory language
  /\bexclusive\s+to\b/i,
  /\brestricted\s+to\b/i,
  /\bideal\s+for\s+(race|religion|nationality|ethnicity)\b/i,
];

/**
 * Moderate text content using OpenAI Moderation API
 */
export async function moderateText(text: string): Promise<ModerationResult> {
  try {
    // Use OpenAI Moderation API through LLM helper
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`,
      },
      body: JSON.stringify({
        input: text,
      }),
    });

    if (!response.ok) {
      console.error("[Moderation] API error:", response.statusText);
      // Fail open - don't block content if moderation API is down
      return {
        flagged: false,
        categories: {
          hate: false,
          hate_threatening: false,
          harassment: false,
          harassment_threatening: false,
          self_harm: false,
          self_harm_intent: false,
          self_harm_instructions: false,
          sexual: false,
          sexual_minors: false,
          violence: false,
          violence_graphic: false,
        },
        category_scores: {
          hate: 0,
          hate_threatening: 0,
          harassment: 0,
          harassment_threatening: 0,
          self_harm: 0,
          self_harm_intent: 0,
          self_harm_instructions: 0,
          sexual: 0,
          sexual_minors: 0,
          violence: 0,
          violence_graphic: 0,
        },
      };
    }

    const data = await response.json();
    const result = data.results[0];

    return {
      flagged: result.flagged,
      categories: result.categories,
      category_scores: result.category_scores,
      reason: result.flagged ? getFlagReason(result.categories) : undefined,
    };
  } catch (error) {
    console.error("[Moderation] Error:", error);
    // Fail open - don't block content if moderation fails
    return {
      flagged: false,
      categories: {
        hate: false,
        hate_threatening: false,
        harassment: false,
        harassment_threatening: false,
        self_harm: false,
        self_harm_intent: false,
        self_harm_instructions: false,
        sexual: false,
        sexual_minors: false,
        violence: false,
        violence_graphic: false,
      },
      category_scores: {
        hate: 0,
        hate_threatening: 0,
        harassment: 0,
        harassment_threatening: 0,
        self_harm: 0,
        self_harm_intent: 0,
        self_harm_instructions: 0,
        sexual: 0,
        sexual_minors: 0,
        violence: 0,
        violence_graphic: 0,
      },
    };
  }
}

/**
 * Check for Fair Housing Act violations in real estate content
 */
export function checkFairHousing(text: string): { violation: boolean; reason?: string } {
  for (const pattern of FAIR_HOUSING_VIOLATIONS) {
    const match = text.match(pattern);
    if (match) {
      return {
        violation: true,
        reason: `Potential Fair Housing Act violation detected: "${match[0]}". Avoid language that discriminates based on race, color, religion, national origin, sex, familial status, or disability.`,
      };
    }
  }

  return { violation: false };
}

/**
 * Get human-readable reason for content flagging
 */
function getFlagReason(categories: ModerationResult['categories']): string {
  const flagged = Object.entries(categories)
    .filter(([_, value]) => value)
    .map(([key]) => key.replace(/_/g, ' '));

  if (flagged.length === 0) return "Content flagged by moderation system";
  
  return `Content flagged for: ${flagged.join(', ')}`;
}

/**
 * Moderate content before generation (combined check)
 */
export async function moderateContent(text: string, checkFairHousingViolations = true): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  // Check OpenAI moderation
  const moderation = await moderateText(text);
  if (moderation.flagged) {
    return {
      allowed: false,
      reason: moderation.reason || "Content violates community guidelines",
    };
  }

  // Check Fair Housing compliance for real estate content
  if (checkFairHousingViolations) {
    const fairHousing = checkFairHousing(text);
    if (fairHousing.violation) {
      return {
        allowed: false,
        reason: fairHousing.reason,
      };
    }
  }

  return { allowed: true };
}
