import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { integrations } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { ENV } from "../_core/env";
import crypto from "crypto";

/**
 * LinkedIn OAuth Router
 * Handles LinkedIn account connection via OAuth 2.0
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
      const state = crypto.randomBytes(32).toString("hex");

      // Store state in session or database (for now, we'll include userId in state)
      const stateData = JSON.stringify({ userId, timestamp: Date.now() });
      const encodedState = Buffer.from(stateData).toString("base64url");

      // LinkedIn OAuth scopes
      const scopes = [
        "openid",           // OpenID Connect
        "profile",          // Basic profile info
        "email",            // Email address
        "w_member_social",  // Post to LinkedIn (Share on LinkedIn product)
      ];

      const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("client_id", ENV.linkedinClientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("state", encodedState);
      authUrl.searchParams.set("scope", scopes.join(" "));

      // Debug logging
      console.log("[LinkedIn OAuth] Generating auth URL:");
      console.log("  Client ID:", ENV.linkedinClientId);
      console.log("  Redirect URI:", redirectUri);
      console.log("  Scopes:", scopes.join(" "));
      console.log("  Full URL:", authUrl.toString());

      return {
        authUrl: authUrl.toString(),
        state: encodedState,
      };
    }),

  /**
   * Handle OAuth callback - exchange code for access token
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
          throw new Error("State parameter mismatch - possible CSRF attack");
        }
        // Check timestamp (state should be used within 10 minutes)
        if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
          throw new Error("State parameter expired");
        }
      } catch (error) {
        throw new Error("Invalid state parameter");
      }

      // Exchange authorization code for access token
      const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirectUri,
          client_id: ENV.linkedinClientId,
          client_secret: ENV.linkedinClientSecret,
        }).toString(),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        throw new Error(`LinkedIn OAuth error: ${tokenData.error_description || tokenData.error}`);
      }

      const { access_token, expires_in } = tokenData;

      // Get user's LinkedIn profile
      const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const profileData = await profileResponse.json();

      if (profileData.error) {
        throw new Error(`Failed to fetch LinkedIn profile: ${profileData.error_description || profileData.error}`);
      }

      // Store the access token
      const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);
      const encryptedToken = encryptToken(access_token);

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if integration already exists
      const existingIntegration = await db
        .select()
        .from(integrations)
        .where(
          and(
            eq(integrations.userId, userId),
            eq(integrations.platform, "linkedin")
          )
        )
        .limit(1);

      if (existingIntegration.length > 0) {
        // Update existing integration
        await db
          .update(integrations)
          .set({
            accessToken: encryptedToken,
            tokenExpiresAt,
            accountId: profileData.sub, // LinkedIn user ID
            accountName: profileData.name,
            isConnected: true,
            connectedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(integrations.id, existingIntegration[0].id));

        return {
          success: true,
          profile: {
            id: profileData.sub,
            name: profileData.name,
            email: profileData.email,
            picture: profileData.picture,
          },
        };
      } else {
        // Create new integration
        await db.insert(integrations).values({
          userId,
          platform: "linkedin",
          accessToken: encryptedToken,
          tokenExpiresAt,
          accountId: profileData.sub,
          accountName: profileData.name,
          isConnected: true,
          connectedAt: new Date(),
        });

        return {
          success: true,
          profile: {
            id: profileData.sub,
            name: profileData.name,
            email: profileData.email,
            picture: profileData.picture,
          },
        };
      }
    }),

  /**
   * Get LinkedIn connection status (alias for consistency with Facebook router)
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
          eq(integrations.platform, "linkedin")
        )
      )
      .limit(1);

    if (integration.length === 0) {
      return {
        isConnected: false,
      };
    }

    const conn = integration[0];
    const isExpired = conn.tokenExpiresAt ? new Date() > conn.tokenExpiresAt : false;

    return {
      isConnected: conn.isConnected,
      accountId: conn.accountId,
      accountName: conn.accountName,
      connectedAt: conn.connectedAt,
      tokenExpiresAt: conn.tokenExpiresAt,
      isExpired,
    };
  }),

  /**
   * Get LinkedIn connection status (legacy name)
   */
  getConnectionStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const integration = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.userId, userId),
          eq(integrations.platform, "linkedin")
        )
      )
      .limit(1);

    if (integration.length === 0) {
      return {
        connected: false,
      };
    }

    const conn = integration[0];

    return {
      connected: true,
      profile: {
        id: conn.accountId,
        name: conn.accountName,
      },
      connectedAt: conn.connectedAt,
      tokenExpiresAt: conn.tokenExpiresAt,
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
      .delete(integrations)
      .where(
        and(
          eq(integrations.userId, userId),
          eq(integrations.platform, "linkedin")
        )
      );

    return {
      success: true,
    };
  }),

  /**
   * Post to LinkedIn
   * This will be implemented after OAuth is working
   */
  createPost: protectedProcedure
    .input(
      z.object({
        text: z.string(),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get LinkedIn access token
      const integration = await db
        .select()
        .from(integrations)
        .where(
          and(
            eq(integrations.userId, userId),
            eq(integrations.platform, "linkedin")
          )
        )
        .limit(1);

      if (integration.length === 0) {
        throw new Error("LinkedIn account not connected");
      }

      const accessToken = decryptToken(integration[0].accessToken!);

      // Check if token is expired
      if (integration[0].tokenExpiresAt && new Date() > integration[0].tokenExpiresAt) {
        throw new Error("LinkedIn access token expired. Please reconnect your account.");
      }

      // Get user's LinkedIn ID (sub)
      const linkedinUserId = integration[0].accountId;

      // Create post payload
      const postData: any = {
        author: `urn:li:person:${linkedinUserId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: input.text,
            },
            shareMediaCategory: input.imageUrl ? "IMAGE" : "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      };

      // Add image if provided
      if (input.imageUrl) {
        postData.specificContent["com.linkedin.ugc.ShareContent"].media = [
          {
            status: "READY",
            originalUrl: input.imageUrl,
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
        body: JSON.stringify(postData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`Failed to post to LinkedIn: ${responseData.message || response.statusText}`);
      }

      return {
        success: true,
        postId: responseData.id,
      };
    }),
});
