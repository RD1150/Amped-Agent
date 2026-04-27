/**
 * CRM Service — pushes leads to external CRM platforms
 * Supports: Lofty (v1 API), Follow Up Boss (Events API), kvCORE (v1 API)
 */

export interface CrmLead {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  source?: string; // e.g. "Open House", "Lead Magnet"
  message?: string; // optional note
  propertyAddress?: string; // for seller/buyer leads
}

export interface CrmPushResult {
  success: boolean;
  platform: string;
  message: string;
  leadId?: string;
}

// ─── Lofty ───────────────────────────────────────────────────────────────────
// API: POST https://api.lofty.com/v1.0/leads
// Auth: Bearer token (the API key IS the bearer token)
export async function pushLeadToLofty(
  apiKey: string,
  lead: CrmLead
): Promise<CrmPushResult> {
  try {
    const nameParts = lead.firstName.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = lead.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");

    const body: Record<string, unknown> = {
      firstName,
      lastName: lastName || undefined,
      leadTypes: [1], // 1 = Buyer (default)
    };

    if (lead.email) body.emails = [lead.email];
    if (lead.phone) body.phones = [lead.phone];
    if (lead.source) body.sourceUrl = lead.source;

    const resp = await fetch("https://api.lofty.com/v1.0/leads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => resp.statusText);
      return { success: false, platform: "lofty", message: `Lofty API error ${resp.status}: ${errText}` };
    }

    const data = await resp.json().catch(() => ({}));
    return {
      success: true,
      platform: "lofty",
      message: "Lead pushed to Lofty",
      leadId: data?.leadId ? String(data.leadId) : undefined,
    };
  } catch (err: any) {
    return { success: false, platform: "lofty", message: err?.message || "Unknown error" };
  }
}

// ─── Follow Up Boss ───────────────────────────────────────────────────────────
// API: POST https://api.followupboss.com/v1/events
// Auth: Basic auth — API key as username, empty password
export async function pushLeadToFollowUpBoss(
  apiKey: string,
  lead: CrmLead
): Promise<CrmPushResult> {
  try {
    const nameParts = lead.firstName.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = lead.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");

    const person: Record<string, unknown> = {
      firstName,
      lastName: lastName || undefined,
    };
    if (lead.email) person.emails = [{ value: lead.email }];
    if (lead.phone) person.phones = [{ value: lead.phone }];

    const eventBody: Record<string, unknown> = {
      source: lead.source || "Amped Agent",
      system: "Amped Agent",
      type: "Registration",
      person,
    };

    if (lead.message) eventBody.message = lead.message;
    if (lead.propertyAddress) {
      eventBody.property = { street: lead.propertyAddress };
    }

    const credentials = Buffer.from(`${apiKey}:`).toString("base64");

    const resp = await fetch("https://api.followupboss.com/v1/events", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
        "X-System": "Amped Agent",
        "X-System-Key": apiKey,
      },
      body: JSON.stringify(eventBody),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => resp.statusText);
      return { success: false, platform: "followupboss", message: `Follow Up Boss API error ${resp.status}: ${errText}` };
    }

    const data = await resp.json().catch(() => ({}));
    return {
      success: true,
      platform: "followupboss",
      message: "Lead pushed to Follow Up Boss",
      leadId: data?.id ? String(data.id) : undefined,
    };
  } catch (err: any) {
    return { success: false, platform: "followupboss", message: err?.message || "Unknown error" };
  }
}

// ─── kvCORE ───────────────────────────────────────────────────────────────────
// API: POST https://api.kvcore.com/v1/contacts
// Auth: Bearer token
export async function pushLeadToKvcore(
  apiKey: string,
  lead: CrmLead
): Promise<CrmPushResult> {
  try {
    const nameParts = lead.firstName.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = lead.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");

    const body: Record<string, unknown> = {
      first_name: firstName,
      last_name: lastName || undefined,
      lead_source: lead.source || "Amped Agent",
    };

    if (lead.email) body.email = lead.email;
    if (lead.phone) body.phone = lead.phone;
    if (lead.message) body.notes = lead.message;

    const resp = await fetch("https://api.kvcore.com/v1/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => resp.statusText);
      return { success: false, platform: "kvcore", message: `kvCORE API error ${resp.status}: ${errText}` };
    }

    const data = await resp.json().catch(() => ({}));
    return {
      success: true,
      platform: "kvcore",
      message: "Lead pushed to kvCORE",
      leadId: data?.id ? String(data.id) : undefined,
    };
  } catch (err: any) {
    return { success: false, platform: "kvcore", message: err?.message || "Unknown error" };
  }
}

// ─── Unified push ─────────────────────────────────────────────────────────────
// Pushes a lead to all enabled CRM integrations for a user
import { getDb } from "./db";
import { crmIntegrations } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function pushLeadToAllCrms(
  userId: number,
  lead: CrmLead
): Promise<CrmPushResult[]> {
  const db = await getDb();
  if (!db) return [];

  const integrations = await db
    .select()
    .from(crmIntegrations)
    .where(and(eq(crmIntegrations.userId, userId), eq(crmIntegrations.isEnabled, true)));

  if (integrations.length === 0) return [];

  const results: CrmPushResult[] = [];

  for (const integration of integrations) {
    if (!integration.apiKey) continue;

    let result: CrmPushResult;
    switch (integration.platform) {
      case "lofty":
        result = await pushLeadToLofty(integration.apiKey, lead);
        break;
      case "followupboss":
        result = await pushLeadToFollowUpBoss(integration.apiKey, lead);
        break;
      case "kvcore":
        result = await pushLeadToKvcore(integration.apiKey, lead);
        break;
      default:
        continue;
    }
    results.push(result);
  }

  return results;
}
