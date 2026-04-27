/**
 * Zapier Webhooks Router
 *
 * Allows agents to configure Zapier webhook URLs for each event type.
 * Supports save, list, toggle, remove, and test operations.
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { zapierWebhooks } from "../../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { fireZapierWebhook, ZapierEventType } from "../zapierService";

const EVENT_TYPES: ZapierEventType[] = [
  "open_house_lead",
  "lead_magnet_download",
  "new_crm_lead",
];

export const zapierWebhooksRouter = router({
  /** Get all webhook configs for the current user */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select()
      .from(zapierWebhooks)
      .where(eq(zapierWebhooks.userId, ctx.user.id));

    // Return one entry per event type, merging DB rows with defaults
    return EVENT_TYPES.map((eventType) => {
      const row = rows.find((r) => r.eventType === eventType);
      return {
        eventType,
        webhookUrl: row?.webhookUrl ?? "",
        isEnabled: row?.isEnabled ?? true,
        lastFiredAt: row?.lastFiredAt ?? null,
        lastFireStatus: row?.lastFireStatus ?? null,
        configured: !!row?.webhookUrl,
      };
    });
  }),

  /** Save (upsert) a webhook URL for a given event type */
  save: protectedProcedure
    .input(
      z.object({
        eventType: z.enum(["open_house_lead", "lead_magnet_download", "new_crm_lead"]),
        webhookUrl: z.string().url("Must be a valid URL"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check if already exists
      const [existing] = await db
        .select()
        .from(zapierWebhooks)
        .where(
          and(
            eq(zapierWebhooks.userId, ctx.user.id),
            eq(zapierWebhooks.eventType, input.eventType)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(zapierWebhooks)
          .set({ webhookUrl: input.webhookUrl, isEnabled: true, updatedAt: new Date() })
          .where(eq(zapierWebhooks.id, existing.id));
      } else {
        await db.insert(zapierWebhooks).values({
          userId: ctx.user.id,
          eventType: input.eventType,
          webhookUrl: input.webhookUrl,
          isEnabled: true,
        });
      }
      return { success: true };
    }),

  /** Toggle a webhook on or off */
  toggle: protectedProcedure
    .input(
      z.object({
        eventType: z.enum(["open_house_lead", "lead_magnet_download", "new_crm_lead"]),
        isEnabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(zapierWebhooks)
        .set({ isEnabled: input.isEnabled, updatedAt: new Date() })
        .where(
          and(
            eq(zapierWebhooks.userId, ctx.user.id),
            eq(zapierWebhooks.eventType, input.eventType)
          )
        );
      return { success: true };
    }),

  /** Remove a webhook URL */
  remove: protectedProcedure
    .input(
      z.object({
        eventType: z.enum(["open_house_lead", "lead_magnet_download", "new_crm_lead"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .delete(zapierWebhooks)
        .where(
          and(
            eq(zapierWebhooks.userId, ctx.user.id),
            eq(zapierWebhooks.eventType, input.eventType)
          )
        );
      return { success: true };
    }),

  /** Test a webhook by sending a sample payload */
  test: protectedProcedure
    .input(
      z.object({
        eventType: z.enum(["open_house_lead", "lead_magnet_download", "new_crm_lead"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [hook] = await db
        .select()
        .from(zapierWebhooks)
        .where(
          and(
            eq(zapierWebhooks.userId, ctx.user.id),
            eq(zapierWebhooks.eventType, input.eventType)
          )
        )
        .limit(1);

      if (!hook?.webhookUrl) {
        return { success: false, message: "No webhook URL configured for this event" };
      }

      const samplePayloads: Record<ZapierEventType, object> = {
        open_house_lead: {
          firstName: "Jane",
          lastName: "Smith",
          fullName: "Jane Smith",
          email: "jane.smith@example.com",
          phone: "555-123-4567",
          source: "Open House",
          propertyAddress: "123 Main St, Austin TX",
          message: "Open house visitor. Buying timeframe: 3-6 months. Pre-approved.",
        },
        lead_magnet_download: {
          firstName: "John",
          lastName: "Doe",
          fullName: "John Doe",
          email: "john.doe@example.com",
          source: "Lead Magnet",
          magnetTitle: "First-Time Buyer Guide — Austin TX",
          message: "Downloaded lead magnet: First-Time Buyer Guide — Austin TX",
        },
        new_crm_lead: {
          firstName: "Alex",
          lastName: "Johnson",
          fullName: "Alex Johnson",
          email: "alex.johnson@example.com",
          phone: "555-987-6543",
          source: "Website",
          message: "New lead added to CRM",
        },
      };

      try {
        const res = await fetch(hook.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: input.eventType,
            timestamp: new Date().toISOString(),
            test: true,
            ...samplePayloads[input.eventType as ZapierEventType],
          }),
          signal: AbortSignal.timeout(10_000),
        });

        const success = res.ok;
        const message = res.ok ? "Test payload sent successfully" : `HTTP ${res.status}`;

        await db
          .update(zapierWebhooks)
          .set({
            lastFiredAt: new Date(),
            lastFireStatus: success ? "success" : "failed",
            updatedAt: new Date(),
          })
          .where(eq(zapierWebhooks.id, hook.id));

        return { success, message };
      } catch (err: any) {
        return { success: false, message: err?.message || "Request failed" };
      }
    }),
});
