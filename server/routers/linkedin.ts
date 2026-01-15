import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { integrations } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { ENV } from "../_core/env";
import crypto from "crypto";

/**
 * LinkedIn OAuth Router
 * Handles LinkedIn account connection via OAuth 2.0 and posting
 */

// Encryption helpers for storing tokens securely
const ENCRYPTION_KEY = crypto.createHash('sha256').update(ENV.cookieSecret).digest();
const ALGORITHM = "aes-256-cbc";

function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decryptToken(encryptedToken: string): string {
  const parts = encryptedToken.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// LinkedIn OAuth configuration
// Note: You need to create a LinkedIn app at https://www.linkedin.com/developers/apps
// and set these environment variables:
// LINKEDIN_CLIENT_ID
// LINKEDIN_CLIENT_SECRET
// LINKEDIN_REDIRECT_URI

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || "";
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || "";

export const linkedinRouter = router({
  /**
   * Get OAuth authorization URL to start the flow
   */
  getAuthUrl: protectedProcedure
    .input(
      z.object({
        redirectUri: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { redirectUri } = input;
      const userId = ctx.user.id;

      // Generate state parameter for CSRF protection
      const stateData = JSON.stringify({ userId, timestamp: Date.now() });
      const encodedState = Buffer.from(stateData).toString("base64url");

      // LinkedIn OAuth scopes
      const scopes = [
        "openid",
        "profile",
        "email",
        "w_member_social", // Post, comment and like posts
      ];

      const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("client_id", LINKEDIN_CLIENT_ID);
      authUrl.searchParams.append("redirect_uri", redirectUri);
      authUrl.searchParams.append("state", encodedState);
      authUrl.searchParams.append("scope", scopes.join(" "));

      return {
        authUrl: authUrl.toString(),
        state: encodedState,
      };
    }),

  /**
   * Handle OAuth callback and exchange code for access token
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
      const { code, state, redirectUri } = input;
      const userId = ctx.user.id;

      // Verify state parameter
      try {
        const stateData = JSON.parse(Buffer.from(state, "base64url").toString());
        if (stateData.userId !== userId) {
          throw new Error("Invalid state parameter");
        }
      } catch (error) {
        throw new Error("Invalid state parameter");
      }

      // Exchange code for access token
      const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: LINKEDIN_CLIENT_ID,
          client_secret: LINKEDIN_CLIENT_SECRET,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        throw new Error(`LinkedIn OAuth error: ${tokenData.error_description || tokenData.error}`);
      }

      const { access_token, expires_in } = tokenData;

      // Get user profile
      const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const profileData = await profileResponse.json();

      if (profileData.error) {
        throw new Error(`Failed to fetch LinkedIn profile: ${profileData.message}`);
      }

      // Encrypt access token
      const encryptedToken = encryptToken(access_token);

      // Store integration in database
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db
        .select()
        .from(integrations)
        .where(and(eq(integrations.userId, userId), eq(integrations.platform, "linkedin")))
        .limit(1);

      const expiresAt = new Date(Date.now() + expires_in * 1000);

      if (existing.length > 0) {
        // Update existing integration
        await db
          .update(integrations)
          .set({
            accountName: profileData.name || profileData.email,
            accountId: profileData.sub,
            accessToken: encryptedToken,
            tokenExpiresAt: expiresAt,
            isConnected: true,
            connectedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(integrations.id, existing[0].id));
      } else {
        // Create new integration
        await db.insert(integrations).values({
          userId,
          platform: "linkedin",
          accountName: profileData.name || profileData.email,
          accountId: profileData.sub,
          accessToken: encryptedToken,
          tokenExpiresAt: expiresAt,
          isConnected: true,
          connectedAt: new Date(),
        });
      }

      return {
        success: true,
        accountName: profileData.name || profileData.email,
        accountId: profileData.sub,
      };
    }),

  /**
   * Get LinkedIn connection status
   */
  getConnection: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const db = await getDb();
    if (!db) return { isConnected: false };

    const connection = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.userId, userId), eq(integrations.platform, "linkedin")))
      .limit(1);

    if (connection.length === 0) {
      return { isConnected: false };
    }

    const conn = connection[0];

    return {
      id: conn.id,
      isConnected: conn.isConnected,
      accountName: conn.accountName,
      accountId: conn.accountId,
      connectedAt: conn.connectedAt,
    };
  }),

  /**
   * Disconnect LinkedIn account
   */
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(integrations)
      .set({
        isConnected: false,
        accessToken: null,
        tokenExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(and(eq(integrations.userId, userId), eq(integrations.platform, "linkedin")));

    return { success: true };
  }),

  /**
   * Post to LinkedIn feed
   */
  post: protectedProcedure
    .input(
      z.object({
        text: z.string(),
        imageUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { text, imageUrl } = input;
      const userId = ctx.user.id;

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const connection = await db
        .select()
        .from(integrations)
        .where(and(eq(integrations.userId, userId), eq(integrations.platform, "linkedin")))
        .limit(1);

      if (connection.length === 0 || !connection[0].accessToken) {
        throw new Error("LinkedIn account not connected");
      }

      const accessToken = decryptToken(connection[0].accessToken);
      const accountId = connection[0].accountId;

      // Create post payload
      const postPayload: any = {
        author: `urn:li:person:${accountId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: text,
            },
            shareMediaCategory: imageUrl ? "IMAGE" : "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      };

      // If image is provided, add media
      if (imageUrl) {
        postPayload.specificContent["com.linkedin.ugc.ShareContent"].media = [
          {
            status: "READY",
            originalUrl: imageUrl,
          },
        ];
      }

      // Post to LinkedIn
      const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(postPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Failed to post to LinkedIn: ${data.message || response.statusText}`);
      }

      return {
        success: true,
        postId: data.id,
      };
    }),
});
