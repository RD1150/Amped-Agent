import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { youtubeConnections } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const YOUTUBE_SCOPE = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
].join(" ");

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * Refresh an expired Google access token
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
 * Get a valid access token, refreshing if needed
 */
async function getValidToken(conn: {
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
}): Promise<string> {
  const expiresAt = conn.tokenExpiresAt;
  const needsRefresh = !expiresAt || expiresAt.getTime() - Date.now() < 5 * 60 * 1000;
  if (needsRefresh && conn.refreshToken) {
    const refreshed = await refreshAccessToken(conn.refreshToken);
    return refreshed.access_token;
  }
  return conn.accessToken;
}

export const youtubeRouter = router({
  /**
   * Generate OAuth URL to start YouTube connection
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
      authUrl.searchParams.set("scope", `openid email ${YOUTUBE_SCOPE}`);
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("state", state);

      return { authUrl: authUrl.toString(), state };
    }),

  /**
   * Handle OAuth callback — exchange code for tokens, fetch channel info, save
   */
  handleCallback: protectedProcedure
    .input(z.object({ code: z.string(), redirectUri: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const db = await getDb();

      // Exchange code for tokens
      const tokenParams = new URLSearchParams({
        code: input.code,
        client_id: ENV.googleClientId,
        client_secret: ENV.googleClientSecret,
        redirect_uri: input.redirectUri,
        grant_type: "authorization_code",
      });

      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenParams.toString(),
      });
      const tokenData = await tokenRes.json();

      if (tokenData.error) {
        throw new Error(`OAuth failed: ${tokenData.error_description ?? tokenData.error}`);
      }

      const accessToken: string = tokenData.access_token;
      const refreshToken: string | undefined = tokenData.refresh_token;
      const expiresIn: number = tokenData.expires_in ?? 3600;
      const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

      // Fetch the user's YouTube channel info
      const channelRes = await fetch(
        `${YOUTUBE_API_BASE}/channels?part=snippet&mine=true`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const channelData = await channelRes.json();
      const channel = channelData.items?.[0];
      const channelId: string | undefined = channel?.id;
      const channelTitle: string | undefined = channel?.snippet?.title;
      const channelThumbnail: string | undefined =
        channel?.snippet?.thumbnails?.default?.url;

      // Upsert — one connection per user
      const existing = await db!
        .select()
        .from(youtubeConnections)
        .where(eq(youtubeConnections.userId, userId))
        .limit(1);

      if (existing.length > 0) {
        await db!
          .update(youtubeConnections)
          .set({
            accessToken,
            refreshToken: refreshToken ?? existing[0].refreshToken,
            tokenExpiresAt,
            channelId: channelId ?? existing[0].channelId,
            channelTitle: channelTitle ?? existing[0].channelTitle,
            channelThumbnail: channelThumbnail ?? existing[0].channelThumbnail,
            isConnected: true,
          })
          .where(eq(youtubeConnections.userId, userId));
      } else {
        await db!.insert(youtubeConnections).values({
          userId,
          accessToken,
          refreshToken: refreshToken ?? null,
          tokenExpiresAt,
          channelId: channelId ?? null,
          channelTitle: channelTitle ?? null,
          channelThumbnail: channelThumbnail ?? null,
          isConnected: true,
        });
      }

      return {
        success: true,
        channelId,
        channelTitle,
        channelThumbnail,
      };
    }),

  /**
   * Get current YouTube connection status for the logged-in user
   */
  getConnection: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const rows = await db!
      .select()
      .from(youtubeConnections)
      .where(
        and(
          eq(youtubeConnections.userId, ctx.user.id),
          eq(youtubeConnections.isConnected, true)
        )
      )
      .limit(1);

    if (!rows.length) return { connected: false };

    const conn = rows[0];
    return {
      connected: true,
      channelId: conn.channelId,
      channelTitle: conn.channelTitle,
      channelThumbnail: conn.channelThumbnail,
    };
  }),

  /**
   * Disconnect YouTube account
   */
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    await db!
      .update(youtubeConnections)
      .set({ isConnected: false })
      .where(eq(youtubeConnections.userId, ctx.user.id));
    return { success: true };
  }),

  /**
   * Upload a video to YouTube with SEO metadata
   * Accepts a publicly accessible video URL (from S3) and uploads it via resumable upload
   */
  uploadVideo: protectedProcedure
    .input(
      z.object({
        videoUrl: z.string().url(),
        title: z.string().max(100),
        description: z.string().max(5000),
        tags: z.array(z.string()).max(20).optional(),
        categoryId: z.string().default("23"), // 23 = Comedy, but we'll use 22 = People & Blogs
        privacyStatus: z.enum(["public", "private", "unlisted"]).default("public"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const rows = await db!
        .select()
        .from(youtubeConnections)
        .where(
          and(
            eq(youtubeConnections.userId, ctx.user.id),
            eq(youtubeConnections.isConnected, true)
          )
        )
        .limit(1);

      if (!rows.length) {
        throw new Error("YouTube account not connected. Please connect your YouTube channel first.");
      }

      const conn = rows[0];
      const accessToken = await getValidToken(conn);

      // Step 1: Fetch the video bytes from the S3 URL
      const videoRes = await fetch(input.videoUrl);
      if (!videoRes.ok) {
        throw new Error(`Failed to fetch video from URL: ${videoRes.statusText}`);
      }
      const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
      const contentLength = videoBuffer.byteLength;

      // Step 2: Initiate resumable upload session
      const metadata = {
        snippet: {
          title: input.title,
          description: input.description,
          tags: input.tags ?? [],
          categoryId: "22", // People & Blogs — best fit for real estate agent content
        },
        status: {
          privacyStatus: input.privacyStatus,
          selfDeclaredMadeForKids: false,
        },
      };

      const initRes = await fetch(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json; charset=UTF-8",
            "X-Upload-Content-Type": "video/mp4",
            "X-Upload-Content-Length": String(contentLength),
          },
          body: JSON.stringify(metadata),
        }
      );

      if (!initRes.ok) {
        const errText = await initRes.text();
        throw new Error(`Failed to initiate YouTube upload: ${errText}`);
      }

      const uploadUrl = initRes.headers.get("Location");
      if (!uploadUrl) {
        throw new Error("YouTube did not return an upload URL");
      }

      // Step 3: Upload the video bytes
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": String(contentLength),
        },
        body: videoBuffer,
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error(`YouTube upload failed: ${errText}`);
      }

      const uploadData = await uploadRes.json();
      const videoId: string = uploadData.id;

      return {
        success: true,
        videoId,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      };
    }),

  /**
   * Fetch channel analytics: stats + recent videos
   */
  getChannelAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const rows = await db!
      .select()
      .from(youtubeConnections)
      .where(and(eq(youtubeConnections.userId, ctx.user.id), eq(youtubeConnections.isConnected, true)))
      .limit(1);
    if (!rows.length) return null;

    const conn = rows[0];
    let accessToken: string;
    try {
      accessToken = await getValidToken(conn);
    } catch {
      return null;
    }

    // Fetch channel stats
    let channelRes: Response;
    try {
      channelRes = await fetch(
        `${YOUTUBE_API_BASE}/channels?part=statistics,snippet&mine=true`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    } catch {
      return null;
    }
    if (!channelRes.ok) return null;
    const channelData = await channelRes.json() as {
      items?: Array<{
        statistics: { viewCount?: string; subscriberCount?: string; videoCount?: string };
        snippet: { title: string; thumbnails?: { default?: { url: string } } };
      }>;
    };
    const channel = channelData.items?.[0];
    if (!channel) return null;

    // Fetch recent videos
    let recentVideos: Array<{ id: string; title: string; thumbnail: string; publishedAt: string }> = [];
    try {
      const videosRes = await fetch(
        `${YOUTUBE_API_BASE}/search?part=snippet&forMine=true&type=video&order=date&maxResults=5`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (videosRes.ok) {
        const videosData = await videosRes.json() as {
          items?: Array<{
            id: { videoId: string };
            snippet: { title: string; thumbnails: { medium?: { url: string } }; publishedAt: string };
          }>;
        };
        recentVideos = (videosData.items ?? []).map((v) => ({
          id: v.id.videoId,
          title: v.snippet.title,
          thumbnail: v.snippet.thumbnails.medium?.url ?? "",
          publishedAt: v.snippet.publishedAt,
        }));
      }
    } catch { /* ignore video fetch errors */ }

    return {
      channelTitle: channel.snippet.title,
      channelThumbnail: channel.snippet.thumbnails?.default?.url ?? "",
      stats: {
        views: parseInt(channel.statistics.viewCount ?? "0", 10),
        subscribers: parseInt(channel.statistics.subscriberCount ?? "0", 10),
        videos: parseInt(channel.statistics.videoCount ?? "0", 10),
      },
      recentVideos,
    };
  }),
});
