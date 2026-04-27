/**
 * CRM Integrations Router
 * Manages API keys for Lofty, Follow Up Boss, and kvCORE
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { crmIntegrations } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  pushLeadToLofty,
  pushLeadToFollowUpBoss,
  pushLeadToKvcore,
} from "../crmService";

const PLATFORMS = ["lofty", "followupboss", "kvcore"] as const;
type Platform = (typeof PLATFORMS)[number];

export const crmIntegrationsRouter = router({
  // Get all CRM integrations for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const rows = await db
      .select()
      .from(crmIntegrations)
      .where(eq(crmIntegrations.userId, ctx.user.id));

    // Return without exposing full API key — just masked version
    return rows.map((row) => ({
      ...row,
      apiKey: row.apiKey ? maskApiKey(row.apiKey) : null,
      hasApiKey: !!row.apiKey,
    }));
  }),

  // Save (upsert) an API key for a platform
  save: protectedProcedure
    .input(
      z.object({
        platform: z.enum(PLATFORMS),
        apiKey: z.string().min(1).max(500),
        isEnabled: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const existing = await db
        .select()
        .from(crmIntegrations)
        .where(
          and(
            eq(crmIntegrations.userId, ctx.user.id),
            eq(crmIntegrations.platform, input.platform)
          )
        );

      if (existing.length > 0) {
        await db
          .update(crmIntegrations)
          .set({
            apiKey: input.apiKey,
            isEnabled: input.isEnabled,
            updatedAt: new Date(),
          })
          .where(eq(crmIntegrations.id, existing[0].id));
      } else {
        await db.insert(crmIntegrations).values({
          userId: ctx.user.id,
          platform: input.platform,
          apiKey: input.apiKey,
          isEnabled: input.isEnabled,
        });
      }

      return { success: true };
    }),

  // Toggle enabled/disabled for a platform
  toggle: protectedProcedure
    .input(
      z.object({
        platform: z.enum(PLATFORMS),
        isEnabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(crmIntegrations)
        .set({ isEnabled: input.isEnabled, updatedAt: new Date() })
        .where(
          and(
            eq(crmIntegrations.userId, ctx.user.id),
            eq(crmIntegrations.platform, input.platform)
          )
        );

      return { success: true };
    }),

  // Remove an API key for a platform
  remove: protectedProcedure
    .input(z.object({ platform: z.enum(PLATFORMS) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .delete(crmIntegrations)
        .where(
          and(
            eq(crmIntegrations.userId, ctx.user.id),
            eq(crmIntegrations.platform, input.platform)
          )
        );

      return { success: true };
    }),

  // Test a connection by sending a test lead
  test: protectedProcedure
    .input(z.object({ platform: z.enum(PLATFORMS) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const rows = await db
        .select()
        .from(crmIntegrations)
        .where(
          and(
            eq(crmIntegrations.userId, ctx.user.id),
            eq(crmIntegrations.platform, input.platform)
          )
        );

      if (rows.length === 0 || !rows[0].apiKey) {
        throw new Error("No API key saved for this platform");
      }

      const testLead = {
        firstName: "Amped",
        lastName: "Agent Test",
        email: "test@ampedagent.app",
        phone: "5550001234",
        source: "Amped Agent — Connection Test",
        message: "This is a test lead from Amped Agent to verify the CRM integration is working correctly. You can safely delete this contact.",
      };

      let result;
      switch (input.platform) {
        case "lofty":
          result = await pushLeadToLofty(rows[0].apiKey, testLead);
          break;
        case "followupboss":
          result = await pushLeadToFollowUpBoss(rows[0].apiKey, testLead);
          break;
        case "kvcore":
          result = await pushLeadToKvcore(rows[0].apiKey, testLead);
          break;
      }

      // Update test status in DB
      await db
        .update(crmIntegrations)
        .set({
          lastTestedAt: new Date(),
          lastTestStatus: result.success ? "success" : "failed",
          lastTestMessage: result.message,
          updatedAt: new Date(),
        })
        .where(eq(crmIntegrations.id, rows[0].id));

      return result;
    }),
});

function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 4) + "••••••••" + key.slice(-4);
}
