import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { integrations } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { ENV } from "../_core/env";
import crypto from "crypto";

/**
 * Facebook OAuth Router
 * Handles Facebook/Instagram account connection via OAuth 2.0
 */

// Encryption helpers for storing tokens securely
// Create a proper 32-byte encryption key from the cookie secret
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

export const facebookRouter = router({
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

      // Facebook OAuth scopes - includes Instagram permissions
      // Note: These scopes require Facebook App Review for production use
      // For Development Mode, only test users and app developers can use these
      const scopes = [
        "public_profile", // Basic profile info (always available)
        "pages_show_list", // Access to user's Facebook Pages
        "pages_read_engagement", // Read engagement data from Pages
        "instagram_basic", // Access to Instagram account info
        "instagram_content_publish", // Publish content to Instagram
      ];

      const authUrl = new URL("https://www.facebook.com/v18.0/dialog/oauth");
      authUrl.searchParams.set("client_id", ENV.facebookAppId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("state", encodedState);
      authUrl.searchParams.set("scope", scopes.join(","));
      authUrl.searchParams.set("response_type", "code");

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
      const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
      tokenUrl.searchParams.set("client_id", ENV.facebookAppId);
      tokenUrl.searchParams.set("client_secret", ENV.facebookAppSecret);
      tokenUrl.searchParams.set("redirect_uri", redirectUri);
      tokenUrl.searchParams.set("code", code);

      const tokenResponse = await fetch(tokenUrl.toString());
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        throw new Error(`Facebook OAuth error: ${tokenData.error.message}`);
      }

      const { access_token, expires_in } = tokenData;

      // Get user's Facebook profile
      const profileResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${access_token}&fields=id,name,email`
      );
      const profileData = await profileResponse.json();

      if (profileData.error) {
        throw new Error(`Failed to fetch Facebook profile: ${profileData.error.message}`);
      }

      // Get user's Facebook Pages (required for posting)
      // Also fetch instagram_business_account to detect connected Instagram accounts
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${access_token}&fields=id,name,access_token,instagram_business_account`
      );
      const pagesData = await pagesResponse.json();

      if (pagesData.error) {
        throw new Error(`Failed to fetch Facebook pages: ${pagesData.error.message}`);
      }

      // Store the user access token
      const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);
      const encryptedToken = encryptToken(access_token);

      // Check if integration already exists
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db
        .select()
        .from(integrations)
        .where(and(eq(integrations.userId, userId), eq(integrations.platform, "facebook")))
        .limit(1);

      if (existing.length > 0) {
        // Update existing integration
        await db
          .update(integrations)
          .set({
            accountName: profileData.name,
            accountId: profileData.id,
            accessToken: encryptedToken,
            tokenExpiresAt,
            isConnected: true,
            connectedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(integrations.id, existing[0].id));
      } else {
        // Create new integration
        await db.insert(integrations).values({
          userId,
          platform: "facebook",
          accountName: profileData.name,
          accountId: profileData.id,
          accessToken: encryptedToken,
          tokenExpiresAt,
          isConnected: true,
          connectedAt: new Date(),
        });
      }

      return {
        success: true,
        accountName: profileData.name,
        accountId: profileData.id,
        pages: pagesData.data || [],
      };
    }),

  /**
   * Get connected Facebook account
   */
  getConnection: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const connection = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.userId, userId), eq(integrations.platform, "facebook")))
      .limit(1);

    if (connection.length === 0) {
      return null;
    }

    const conn = connection[0];

    // Check if token is expired
    const isExpired = conn.tokenExpiresAt ? new Date(conn.tokenExpiresAt) < new Date() : false;

    return {
      id: conn.id,
      accountName: conn.accountName,
      accountId: conn.accountId,
      isConnected: conn.isConnected && !isExpired,
      connectedAt: conn.connectedAt,
      tokenExpiresAt: conn.tokenExpiresAt,
      isExpired,
    };
  }),

  /**
   * Disconnect Facebook account
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
        refreshToken: null,
        tokenExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(and(eq(integrations.userId, userId), eq(integrations.platform, "facebook")));

    return { success: true };
  }),

  /**
   * Get Facebook Pages for the connected account
   */
  getPages: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const connection = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.userId, userId), eq(integrations.platform, "facebook")))
      .limit(1);

    if (connection.length === 0 || !connection[0].accessToken) {
      throw new Error("Facebook account not connected");
    }

    const accessToken = decryptToken(connection[0].accessToken);

    // Get user's Facebook Pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,access_token,instagram_business_account`
    );
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      throw new Error(`Failed to fetch Facebook pages: ${pagesData.error.message}`);
    }

    return {
      pages: pagesData.data || [],
    };
  }),

  /**
   * Test the Facebook connection
   */
  testConnection: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;

    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const connection = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.userId, userId), eq(integrations.platform, "facebook")))
      .limit(1);

    if (connection.length === 0 || !connection[0].accessToken) {
      return {
        success: false,
        error: "Facebook account not connected",
      };
    }

    const accessToken = decryptToken(connection[0].accessToken);

    // Test the token by fetching user profile
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}&fields=id,name`
    );
    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        error: data.error.message,
      };
    }

    return {
      success: true,
      accountName: data.name,
      accountId: data.id,
    };
  }),

  /**
   * Get Instagram Business Accounts connected to Facebook Pages
   */
  getInstagramAccounts: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const connection = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.userId, userId), eq(integrations.platform, "facebook")))
      .limit(1);

    if (connection.length === 0 || !connection[0].accessToken) {
      throw new Error("Facebook account not connected");
    }

    const accessToken = decryptToken(connection[0].accessToken);

    // Get user's Facebook Pages with Instagram Business Accounts
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,access_token,instagram_business_account{id,username,profile_picture_url}`
    );
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      throw new Error(`Failed to fetch Instagram accounts: ${pagesData.error.message}`);
    }

    // Filter pages that have Instagram Business Accounts
    const instagramAccounts = (pagesData.data || [])
      .filter((page: any) => page.instagram_business_account)
      .map((page: any) => ({
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.access_token,
        instagramId: page.instagram_business_account.id,
        instagramUsername: page.instagram_business_account.username,
        instagramProfilePicture: page.instagram_business_account.profile_picture_url,
      }));

    return {
      accounts: instagramAccounts,
    };
  }),

  /**
   * Connect an Instagram Business Account
   */
  connectInstagram: protectedProcedure
    .input(
      z.object({
        pageId: z.string(),
        pageName: z.string(),
        pageAccessToken: z.string(),
        instagramId: z.string(),
        instagramUsername: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { pageId, pageName, pageAccessToken, instagramId, instagramUsername } = input;
      const userId = ctx.user.id;

      // Encrypt the page access token
      const encryptedPageToken = encryptToken(pageAccessToken);

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if Instagram integration already exists
      const existing = await db
        .select()
        .from(integrations)
        .where(and(eq(integrations.userId, userId), eq(integrations.platform, "instagram")))
        .limit(1);

      if (existing.length > 0) {
        // Update existing integration
        await db
          .update(integrations)
          .set({
            accountName: instagramUsername,
            accountId: instagramId,
            instagramBusinessAccountId: instagramId,
            instagramUsername,
            facebookPageId: pageId,
            facebookPageAccessToken: encryptedPageToken,
            isConnected: true,
            connectedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(integrations.id, existing[0].id));
      } else {
        // Create new integration
        await db.insert(integrations).values({
          userId,
          platform: "instagram",
          accountName: instagramUsername,
          accountId: instagramId,
          instagramBusinessAccountId: instagramId,
          instagramUsername,
          facebookPageId: pageId,
          facebookPageAccessToken: encryptedPageToken,
          isConnected: true,
          connectedAt: new Date(),
        });
      }

      return {
        success: true,
        instagramUsername,
        instagramId,
      };
    }),

  /**
   * Get connected Instagram account
   */
  getInstagramConnection: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const connection = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.userId, userId), eq(integrations.platform, "instagram")))
      .limit(1);

    if (connection.length === 0) {
      return null;
    }

    const conn = connection[0];

    return {
      id: conn.id,
      instagramUsername: conn.instagramUsername,
      instagramId: conn.instagramBusinessAccountId,
      facebookPageId: conn.facebookPageId,
      isConnected: conn.isConnected,
      connectedAt: conn.connectedAt,
    };
  }),

  /**
   * Disconnect Instagram account
   */
  disconnectInstagram: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;

    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db
      .update(integrations)
      .set({
        isConnected: false,
        facebookPageAccessToken: null,
        updatedAt: new Date(),
      })
      .where(and(eq(integrations.userId, userId), eq(integrations.platform, "instagram")));

    return { success: true };
  }),

  /**
   * Post image to Instagram feed
   */
  postToInstagram: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
        caption: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { imageUrl, caption } = input;
      const userId = ctx.user.id;

      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const connection = await db
        .select()
        .from(integrations)
        .where(and(eq(integrations.userId, userId), eq(integrations.platform, "instagram")))
        .limit(1);

      if (connection.length === 0 || !connection[0].facebookPageAccessToken) {
        throw new Error("Instagram account not connected");
      }

      const pageAccessToken = decryptToken(connection[0].facebookPageAccessToken);
      const instagramAccountId = connection[0].instagramBusinessAccountId;

      // Step 1: Create media container
      const containerResponse = await fetch(
        `https://graph.facebook.com/v18.0/${instagramAccountId}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: imageUrl,
            caption,
            access_token: pageAccessToken,
          }),
        }
      );
      const containerData = await containerResponse.json();

      if (containerData.error) {
        throw new Error(`Failed to create Instagram media container: ${containerData.error.message}`);
      }

      const creationId = containerData.id;

      // Step 2: Publish the media container
      const publishResponse = await fetch(
        `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: creationId,
            access_token: pageAccessToken,
          }),
        }
      );
      const publishData = await publishResponse.json();

      if (publishData.error) {
        throw new Error(`Failed to publish Instagram post: ${publishData.error.message}`);
      }

      return {
        success: true,
        postId: publishData.id,
      };
    }),
});
