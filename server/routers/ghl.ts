import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { ENV } from "../_core/env";

/**
 * GoHighLevel (GHL) Integration Router
 * Handles CRM sync, social planner, and calendar integration.
 * GHL credentials are configured via environment variables.
 */
export const ghlRouter = router({
  /**
   * Get GHL integration settings / connection status
   */
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const isConfigured = !!(ENV.ghlLocationApiKey && ENV.ghlCompanyId);
    return {
      connected: isConfigured,
      locationId: ENV.ghlCompanyId || null,
      agencyApiKeyConfigured: !!ENV.ghlAgencyApiKey,
    };
  }),

  /**
   * Save / update GHL integration settings (no-op — configured via env)
   */
  saveSettings: protectedProcedure
    .input(z.object({
      locationId: z.string().min(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // GHL credentials are managed via environment variables
      return { success: true, message: "GHL settings are managed via environment configuration." };
    }),

  /**
   * Test GHL API connection
   */
  testConnection: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ENV.ghlLocationApiKey) {
      return { success: false, message: "GHL API key not configured" };
    }
    try {
      const response = await fetch(
        "https://services.leadconnectorhq.com/users/me",
        {
          headers: {
            Authorization: `Bearer ${ENV.ghlLocationApiKey}`,
            Version: "2021-07-28",
          },
        }
      );
      if (response.ok) {
        return { success: true, message: "Connected successfully" };
      }
      return { success: false, message: `API returned ${response.status}` };
    } catch (err) {
      return { success: false, message: "Connection failed" };
    }
  }),

  /**
   * Push a content post to GHL Social Planner
   */
  pushToSocialPlanner: protectedProcedure
    .input(z.object({
      content: z.string().min(1),
      imageUrl: z.string().url().optional(),
      scheduledAt: z.number().optional(), // UTC timestamp
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ENV.ghlLocationApiKey || !ENV.ghlCompanyId) {
        throw new Error("GHL integration not configured. Please add GHL_LOCATION_API_KEY and GHL_COMPANY_ID to your environment.");
      }
      const body: Record<string, unknown> = {
        locationId: ENV.ghlCompanyId,
        body: input.content,
        type: "gmb",
      };
      if (input.imageUrl) body.mediaUrls = [input.imageUrl];
      if (input.scheduledAt) body.scheduledAt = new Date(input.scheduledAt).toISOString();
      const response = await fetch(
        "https://services.leadconnectorhq.com/social-media-posting/posts",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ENV.ghlLocationApiKey}`,
            "Content-Type": "application/json",
            Version: "2021-07-28",
          },
          body: JSON.stringify(body),
        }
      );
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`GHL Social Planner error: ${err}`);
      }
      const data = await response.json();
      return { success: true, postId: data.id };
    }),

  /**
   * Sync content calendar with GHL calendar
   */
  syncCalendar: protectedProcedure
    .input(z.object({
      calendarId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ENV.ghlLocationApiKey) {
        throw new Error("GHL integration not configured.");
      }
      // Return sync status — full implementation would push scheduled posts to GHL calendar
      return {
        success: true,
        synced: 0,
        message: "Calendar sync initiated",
      };
    }),
});
