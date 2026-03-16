/**
 * AI Cost Tracker
 * Logs every AI API call with estimated cost to api_usage_logs table.
 *
 * Cost estimates (as of Mar 2026):
 *  - Creatomate: $0.10 per render (Starter plan ~$49/mo / 300 renders)
 *  - ElevenLabs: $0.00003 per character (Creator plan ~$22/mo / 100k chars)
 *  - Runway: $0.05 per second of generated video (Gen-3 Alpha)
 *  - Kling: $0.14 per render (standard quality)
 *  - OpenAI: $0.000002 per token (GPT-4o-mini) or $0.00003 per token (GPT-4o)
 *  - D-ID: $0.10 per minute of talking-head video
 */

import { getDb } from "../db";
import { apiUsageLogs } from "../../drizzle/schema";

export type AIService = "creatomate" | "elevenlabs" | "runway" | "kling" | "openai" | "did" | "shotstack";

// Cost per unit in USD
const COST_PER_UNIT: Record<AIService, number> = {
  creatomate: 0.10,       // per render
  elevenlabs: 0.00003,    // per character
  runway: 0.05,           // per second of generated video
  kling: 0.14,            // per render
  openai: 0.000002,       // per token (GPT-4o-mini default)
  did: 0.10 / 60,         // per second (D-ID charges per minute)
  shotstack: 0.15,        // per render-second (legacy, kept for historical data)
};

const UNIT_TYPE: Record<AIService, string> = {
  creatomate: "renders",
  elevenlabs: "characters",
  runway: "seconds",
  kling: "renders",
  openai: "tokens",
  did: "seconds",
  shotstack: "render_seconds",
};

interface LogUsageOptions {
  userId?: number | null;
  service: AIService;
  feature: string;
  units: number;
  renderId?: string;
  metadata?: Record<string, unknown>;
  /** Override the default cost-per-unit if you have a more accurate figure */
  costPerUnit?: number;
}

/**
 * Log an AI API call to the database.
 * This is fire-and-forget — errors are caught and logged but never thrown.
 */
export async function logAIUsage(opts: LogUsageOptions): Promise<void> {
  try {
    const costPerUnit = opts.costPerUnit ?? COST_PER_UNIT[opts.service];
    const estimatedCostUsd = opts.units * costPerUnit;

    const db = await getDb();
    if (!db) return;
    await db.insert(apiUsageLogs).values({
      userId: opts.userId ?? null,
      service: opts.service,
      feature: opts.feature,
      units: String(opts.units),
      unitType: UNIT_TYPE[opts.service],
      estimatedCostUsd: String(estimatedCostUsd),
      renderId: opts.renderId ?? null,
      metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
    });
  } catch (err: any) {
    // Never let cost tracking break the main flow
    console.error("[CostTracker] Failed to log AI usage:", err.message);
  }
}

/**
 * Convenience wrappers for each service
 */
export const trackCreatomate = (userId: number | null | undefined, feature: string, renderId?: string) =>
  logAIUsage({ userId, service: "creatomate", feature, units: 1, renderId });

export const trackElevenLabs = (userId: number | null | undefined, feature: string, characterCount: number) =>
  logAIUsage({ userId, service: "elevenlabs", feature, units: characterCount });

export const trackRunway = (userId: number | null | undefined, feature: string, durationSeconds: number, renderId?: string) =>
  logAIUsage({ userId, service: "runway", feature, units: durationSeconds, renderId });

export const trackKling = (userId: number | null | undefined, feature: string, renderId?: string) =>
  logAIUsage({ userId, service: "kling", feature, units: 1, renderId });

export const trackOpenAI = (userId: number | null | undefined, feature: string, tokenCount: number) =>
  logAIUsage({ userId, service: "openai", feature, units: tokenCount });

export const trackDID = (userId: number | null | undefined, feature: string, durationSeconds: number, renderId?: string) =>
  logAIUsage({ userId, service: "did", feature, units: durationSeconds, renderId });
