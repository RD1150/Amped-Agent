import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { gbpLocations } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

const GBP_SCOPE = "https://www.googleapis.com/auth/business.manage";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GBP_API_BASE = "https://mybusiness.googleapis.com/v4";

/**
 * Refresh an expired Google access token using the refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    client_id: ENV.googleClientId,
    client_secret: ENV.googleClientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(`Token refresh failed: ${data.error_description ?? data.error}`);
  }
  return data;
}

/**
 * Get a valid access token for a GBP location record, refreshing if needed
 */
async function getValidToken(location: { accessToken: string; refreshToken: string | null; tokenExpiresAt: Date | null }): Promise<string> {
  // If token expires within 5 minutes, refresh it
  const expiresAt = location.tokenExpiresAt;
  const needsRefresh = !expiresAt || expiresAt.getTime() - Date.now() < 5 * 60 * 1000;

  if (needsRefresh && location.refreshToken) {
    const refreshed = await refreshAccessToken(location.refreshToken);
    return refreshed.access_token;
  }

  return location.accessToken;
}

export const gbpRouter = router({
  /**
   * Generate OAuth URL to start Google Business Profile connection
   */
  getAuthUrl: protectedProcedure
    .input(z.object({ redirectUri: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const stateData = JSON.stringify({ userId, timestamp: Date.now() });
      const state = Buffer.from(stateData).toString("base64url");

      const authUrl = new URL(GOOGLE_AUTH_URL);
      authUrl.searchParams.set("client_id", ENV.googleClientId);
      authUrl.searchParams.set("redirect_uri", input.redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", `openid email ${GBP_SCOPE}`);
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent"); // Force refresh token
      authUrl.searchParams.set("state", state);

      return { authUrl: authUrl.toString(), state };
    }),

  /**
   * Handle OAuth callback — exchange code for tokens and fetch account info
   */
  handleCallback: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        state: z.string(),
        redirectUri: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;

      // Verify state
      try {
        const stateData = JSON.parse(Buffer.from(input.state, "base64url").toString());
        if (stateData.userId !== userId) throw new Error("State mismatch");
        if (Date.now() - stateData.timestamp > 10 * 60 * 1000) throw new Error("State expired");
      } catch {
        throw new Error("Invalid state parameter");
      }

      // Exchange code for tokens
      const params = new URLSearchParams({
        client_id: ENV.googleClientId,
        client_secret: ENV.googleClientSecret,
        redirect_uri: input.redirectUri,
        code: input.code,
        grant_type: "authorization_code",
      });

      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      const tokenData = await tokenRes.json();

      if (tokenData.error) {
        throw new Error(`Google OAuth error: ${tokenData.error_description ?? tokenData.error}`);
      }

      const { access_token, refresh_token, expires_in } = tokenData;
      const tokenExpiresAt = new Date(Date.now() + (expires_in ?? 3600) * 1000);

      // Get user's Google email
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const profileData = await profileRes.json();
      const googleEmail = profileData.email ?? null;

      // Get Google Business accounts
      const accountsRes = await fetch(`${GBP_API_BASE}/accounts`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const accountsData = await accountsRes.json();

      const accounts: Array<{ name: string; accountName: string; type: string }> =
        accountsData.accounts ?? [];

      const db = await getDb();

      // Upsert the GBP connection (one per user for now)
      const existing = await db!
        .select()
        .from(gbpLocations)
        .where(eq(gbpLocations.userId, userId))
        .limit(1);

      if (existing.length > 0) {
        await db!
          .update(gbpLocations)
          .set({
            accessToken: access_token,
            refreshToken: refresh_token ?? existing[0].refreshToken,
            tokenExpiresAt,
            googleEmail,
            isConnected: true,
          })
          .where(eq(gbpLocations.userId, userId));
      } else {
        await db!.insert(gbpLocations).values({
          userId,
          accessToken: access_token,
          refreshToken: refresh_token ?? null,
          tokenExpiresAt,
          googleEmail,
          isConnected: true,
        });
      }

      return {
        success: true,
        googleEmail,
        accounts: accounts.map((a) => ({
          id: a.name, // e.g. "accounts/12345"
          name: a.accountName,
          type: a.type,
        })),
      };
    }),

  /**
   * List GBP locations for a given account
   */
  listLocations: protectedProcedure
    .input(z.object({ accountId: z.string() })) // e.g. "accounts/12345"
    .query(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const db = await getDb();

      const [connection] = await db!
        .select()
        .from(gbpLocations)
        .where(and(eq(gbpLocations.userId, userId), eq(gbpLocations.isConnected, true)))
        .limit(1);

      if (!connection) throw new Error("Google Business Profile not connected");

      const token = await getValidToken(connection);

      const res = await fetch(`${GBP_API_BASE}/${input.accountId}/locations?readMask=name,title,storefrontAddress`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.error) {
        throw new Error(`GBP API error: ${data.error.message}`);
      }

      const locations: Array<{ name: string; title: string; storefrontAddress?: { addressLines?: string[]; locality?: string; administrativeArea?: string } }> =
        data.locations ?? [];

      return locations.map((loc) => ({
        id: loc.name, // e.g. "accounts/123/locations/456"
        name: loc.title,
        address: loc.storefrontAddress
          ? [
              ...(loc.storefrontAddress.addressLines ?? []),
              loc.storefrontAddress.locality,
              loc.storefrontAddress.administrativeArea,
            ]
              .filter(Boolean)
              .join(", ")
          : null,
      }));
    }),

  /**
   * Save the selected location for this user
   */
  saveLocation: protectedProcedure
    .input(
      z.object({
        locationId: z.string(), // "accounts/123/locations/456"
        locationName: z.string(),
        address: z.string().optional(),
        googleAccountId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const db = await getDb();

      await db!
        .update(gbpLocations)
        .set({
          locationId: input.locationId,
          locationName: input.locationName,
          address: input.address ?? null,
          googleAccountId: input.googleAccountId ?? null,
        })
        .where(eq(gbpLocations.userId, userId));

      return { success: true };
    }),

  /**
   * Get current GBP connection status for the user
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await getDb();

    const [connection] = await db!
      .select({
        id: gbpLocations.id,
        googleEmail: gbpLocations.googleEmail,
        locationName: gbpLocations.locationName,
        locationId: gbpLocations.locationId,
        address: gbpLocations.address,
        isConnected: gbpLocations.isConnected,
      })
      .from(gbpLocations)
      .where(and(eq(gbpLocations.userId, userId), eq(gbpLocations.isConnected, true)))
      .limit(1);

    return connection ?? null;
  }),

  /**
   * Create a post on Google Business Profile
   * Post types: STANDARD (news/update), EVENT, OFFER
   */
  createPost: protectedProcedure
    .input(
      z.object({
        summary: z.string().min(1).max(1500),
        topicType: z.enum(["STANDARD", "EVENT", "OFFER"]).default("STANDARD"),
        callToAction: z
          .object({
            actionType: z.enum(["BOOK", "ORDER", "SHOP", "LEARN_MORE", "SIGN_UP", "CALL"]),
            url: z.string().url().optional(),
          })
          .optional(),
        mediaUrl: z.string().url().optional(), // Optional photo URL
        event: z
          .object({
            title: z.string(),
            startDate: z.string(), // ISO date string
            endDate: z.string(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const db = await getDb();

      const [connection] = await db!
        .select()
        .from(gbpLocations)
        .where(and(eq(gbpLocations.userId, userId), eq(gbpLocations.isConnected, true)))
        .limit(1);

      if (!connection) {
        throw new Error("Google Business Profile not connected. Please connect your GBP account in Integrations.");
      }

      if (!connection.locationId) {
        throw new Error("No business location selected. Please select your location in Integrations.");
      }

      const token = await getValidToken(connection);

      // Build the post payload
      const postPayload: Record<string, unknown> = {
        languageCode: "en-US",
        summary: input.summary,
        topicType: input.topicType,
      };

      if (input.callToAction) {
        postPayload.callToAction = {
          actionType: input.callToAction.actionType,
          ...(input.callToAction.url ? { url: input.callToAction.url } : {}),
        };
      }

      if (input.mediaUrl) {
        postPayload.media = [
          {
            mediaFormat: "PHOTO",
            sourceUrl: input.mediaUrl,
          },
        ];
      }

      if (input.event && input.topicType === "EVENT") {
        const start = new Date(input.event.startDate);
        const end = new Date(input.event.endDate);
        postPayload.event = {
          title: input.event.title,
          schedule: {
            startDate: { year: start.getFullYear(), month: start.getMonth() + 1, day: start.getDate() },
            endDate: { year: end.getFullYear(), month: end.getMonth() + 1, day: end.getDate() },
          },
        };
      }

      const postRes = await fetch(
        `${GBP_API_BASE}/${connection.locationId}/localPosts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postPayload),
        }
      );

      const postData = await postRes.json();

      if (postData.error) {
        throw new Error(`GBP post failed: ${postData.error.message}`);
      }

      return {
        success: true,
        postName: postData.name as string,
        searchUrl: postData.searchUrl as string | undefined,
      };
    }),

  /**
   * Disconnect Google Business Profile
   */
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await getDb();

    await db!
      .update(gbpLocations)
      .set({ isConnected: false })
      .where(eq(gbpLocations.userId, userId));

    return { success: true };
  }),
});
