import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { integrations } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Twitter/X Integration Router
 * Handles Twitter API v2 connection via OAuth 1.0a credentials
 * (Users provide their own Twitter Developer App credentials)
 */
export const twitterRouter = router({
  /**
   * Get Twitter connection status
   */
  getConnection: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const integration = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.userId, userId),
          eq(integrations.platform, "twitter")
        )
      )
      .limit(1);

    if (integration.length === 0) {
      return { isConnected: false };
    }

    const conn = integration[0];
    return {
      isConnected: conn.isConnected && !!conn.accessToken,
      accountId: conn.accountId,
      accountName: conn.accountName,
      connectedAt: conn.connectedAt,
    };
  }),

  /**
   * Connect Twitter account using OAuth 1.0a credentials
   * Users provide their own Twitter Developer App keys
   */
  connect: protectedProcedure
    .input(
      z.object({
        apiKey: z.string().min(1, "API Key is required"),
        apiSecret: z.string().min(1, "API Secret is required"),
        accessToken: z.string().min(1, "Access Token is required"),
        accessTokenSecret: z.string().min(1, "Access Token Secret is required"),
        accountName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify credentials by calling Twitter API v2
      const crypto = require("crypto");
      const axios = require("axios");

      const verifyUrl = "https://api.twitter.com/2/users/me";

      // Generate OAuth 1.0a header
      const oauthTimestamp = Math.floor(Date.now() / 1000).toString();
      const oauthNonce = crypto.randomBytes(16).toString("hex");

      const oauthParams: Record<string, string> = {
        oauth_consumer_key: input.apiKey,
        oauth_nonce: oauthNonce,
        oauth_signature_method: "HMAC-SHA1",
        oauth_timestamp: oauthTimestamp,
        oauth_token: input.accessToken,
        oauth_version: "1.0",
      };

      const paramString = Object.keys(oauthParams)
        .sort()
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
        .join("&");

      const signatureBase = [
        "GET",
        encodeURIComponent(verifyUrl),
        encodeURIComponent(paramString),
      ].join("&");

      const signingKey = `${encodeURIComponent(input.apiSecret)}&${encodeURIComponent(input.accessTokenSecret)}`;
      const signature = crypto.createHmac("sha1", signingKey).update(signatureBase).digest("base64");

      const authHeader =
        "OAuth " +
        Object.keys(oauthParams)
          .sort()
          .map((key) => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
          .join(", ") +
        `, oauth_signature="${encodeURIComponent(signature)}"`;

      let twitterUserId = "";
      let twitterUsername = input.accountName || "";

      try {
        const response = await axios.get(verifyUrl, {
          headers: { Authorization: authHeader },
        });
        twitterUserId = response.data.data?.id || "";
        twitterUsername = response.data.data?.username ? `@${response.data.data.username}` : twitterUsername;
      } catch (err: any) {
        throw new Error(
          `Twitter credentials verification failed: ${err.response?.data?.detail || err.message}`
        );
      }

      // Check if integration already exists
      const existing = await db
        .select()
        .from(integrations)
        .where(and(eq(integrations.userId, userId), eq(integrations.platform, "twitter")))
        .limit(1);

      const now = new Date();

      if (existing.length > 0) {
        await db
          .update(integrations)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .set({
            accessToken: input.accessToken,
            accessTokenSecret: input.accessTokenSecret,
            twitterApiKey: input.apiKey,
            twitterApiSecret: input.apiSecret,
            accountId: twitterUserId,
            accountName: twitterUsername,
            isConnected: true,
            connectedAt: now,
            updatedAt: now,
          } as any)
          .where(and(eq(integrations.userId, userId), eq(integrations.platform, "twitter")));
      } else {
        await db.insert(integrations).values({
          userId,
          platform: "twitter",
          accessToken: input.accessToken,
          accessTokenSecret: input.accessTokenSecret,
          twitterApiKey: input.apiKey,
          twitterApiSecret: input.apiSecret,
          accountId: twitterUserId,
          accountName: twitterUsername,
          isConnected: true,
          connectedAt: now,
        });
      }

      return {
        success: true,
        accountName: twitterUsername,
        accountId: twitterUserId,
      };
    }),

  /**
   * Disconnect Twitter account
   */
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(integrations)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set({
        isConnected: false,
        accessToken: null,
        accessTokenSecret: null,
        twitterApiKey: null,
        twitterApiSecret: null,
        updatedAt: new Date(),
      } as any)
      .where(and(eq(integrations.userId, userId), eq(integrations.platform, "twitter")));

    return { success: true };
  }),
});
