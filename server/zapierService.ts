/**
 * Zapier Webhook Service
 *
 * Fires webhook payloads to user-configured Zapier webhook URLs
 * whenever a lead event occurs in Amped Agent.
 *
 * Supported event types:
 *   - open_house_lead     → visitor signs in at open house
 *   - lead_magnet_download → agent sends a lead magnet to a recipient
 *   - new_crm_lead        → any new lead added to the internal CRM
 */

import { getDb } from "./db";
import { zapierWebhooks } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";

export type ZapierEventType =
  | "open_house_lead"
  | "lead_magnet_download"
  | "new_crm_lead";

export interface ZapierLeadPayload {
  event: ZapierEventType;
  timestamp: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  source?: string;
  message?: string;
  propertyAddress?: string;
  magnetTitle?: string;
  [key: string]: unknown;
}

/**
 * Fire a Zapier webhook for a given user and event type.
 * Non-blocking — errors are caught and logged, never thrown.
 */
export async function fireZapierWebhook(
  userId: number,
  eventType: ZapierEventType,
  payload: Omit<ZapierLeadPayload, "event" | "timestamp">
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // Find all enabled webhooks for this user + event type
    const hooks = await db
      .select()
      .from(zapierWebhooks)
      .where(
        and(
          eq(zapierWebhooks.userId, userId),
          eq(zapierWebhooks.eventType, eventType),
          eq(zapierWebhooks.isEnabled, true)
        )
      );

    if (!hooks.length) return;

    const fullPayload: ZapierLeadPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      ...payload,
      fullName: [payload.firstName, payload.lastName].filter(Boolean).join(" ") || payload.fullName,
    };

    // Fire all matching webhooks in parallel
    await Promise.allSettled(
      hooks.map(async (hook) => {
        const status = { success: false, message: "" };
        try {
          const res = await fetch(hook.webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fullPayload),
            signal: AbortSignal.timeout(10_000), // 10s timeout
          });
          status.success = res.ok;
          status.message = res.ok ? "ok" : `HTTP ${res.status}`;
        } catch (err: any) {
          status.message = err?.message || "fetch error";
        }

        // Update last fire status (non-blocking)
        db.update(zapierWebhooks)
          .set({
            lastFiredAt: new Date(),
            lastFireStatus: status.success ? "success" : "failed",
            updatedAt: new Date(),
          })
          .where(eq(zapierWebhooks.id, hook.id))
          .catch(() => {});
      })
    );
  } catch {
    // Never throw — Zapier failures must not break the main flow
  }
}
