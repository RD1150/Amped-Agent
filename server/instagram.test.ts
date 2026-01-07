import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { integrations, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import type { TrpcContext } from "./_core/context";

/**
 * Instagram Integration Tests
 * Tests for Instagram Business Account connection and posting via Facebook Graph API
 */

describe("Instagram Integration", () => {
  let testUserId: number;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test user
    const [user] = await db
      .insert(users)
      .values({
        openId: `test-instagram-${Date.now()}`,
        name: "Instagram Test User",
        email: `instagram-test-${Date.now()}@example.com`,
      })
      .$returningId();

    testUserId = user.id;

    // Create caller with test user context
    const ctx: TrpcContext = {
      user: {
        id: testUserId,
        openId: `test-instagram-${Date.now()}`,
        name: "Instagram Test User",
        email: `instagram-test-${Date.now()}@example.com`,
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    caller = appRouter.createCaller(ctx);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(integrations).where(eq(integrations.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should return null when no Instagram connection exists", async () => {
    const connection = await caller.facebook.getInstagramConnection();
    expect(connection).toBeNull();
  });

  it("should connect Instagram Business Account", async () => {
    const result = await caller.facebook.connectInstagram({
      pageId: "test-page-123",
      pageName: "Test Real Estate Page",
      pageAccessToken: "test-page-token-456",
      instagramId: "test-ig-789",
      instagramUsername: "testrealestate",
    });

    expect(result.success).toBe(true);
    expect(result.instagramUsername).toBe("testrealestate");
    expect(result.instagramId).toBe("test-ig-789");
  });

  it("should retrieve connected Instagram account", async () => {
    const connection = await caller.facebook.getInstagramConnection();

    expect(connection).not.toBeNull();
    expect(connection?.instagramUsername).toBe("testrealestate");
    expect(connection?.instagramId).toBe("test-ig-789");
    expect(connection?.facebookPageId).toBe("test-page-123");
    expect(connection?.isConnected).toBe(true);
  });

  it("should update existing Instagram connection", async () => {
    const result = await caller.facebook.connectInstagram({
      pageId: "test-page-999",
      pageName: "Updated Real Estate Page",
      pageAccessToken: "updated-page-token",
      instagramId: "updated-ig-999",
      instagramUsername: "updatedrealestate",
    });

    expect(result.success).toBe(true);
    expect(result.instagramUsername).toBe("updatedrealestate");

    const connection = await caller.facebook.getInstagramConnection();
    expect(connection?.instagramUsername).toBe("updatedrealestate");
    expect(connection?.facebookPageId).toBe("test-page-999");
  });

  it("should disconnect Instagram account", async () => {
    const result = await caller.facebook.disconnectInstagram();
    expect(result.success).toBe(true);

    const connection = await caller.facebook.getInstagramConnection();
    expect(connection?.isConnected).toBe(false);
  });

  it("should store encrypted page access token", async () => {
    await caller.facebook.connectInstagram({
      pageId: "test-page-123",
      pageName: "Test Page",
      pageAccessToken: "secret-token-abc123",
      instagramId: "test-ig-456",
      instagramUsername: "testaccount",
    });

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.userId, testUserId), eq(integrations.platform, "instagram")))
      .limit(1);

    expect(integration).toBeDefined();
    expect(integration.facebookPageAccessToken).toBeDefined();
    // Token should be encrypted (contains : separator for IV)
    expect(integration.facebookPageAccessToken).toContain(":");
    // Token should not be plain text
    expect(integration.facebookPageAccessToken).not.toBe("secret-token-abc123");
  });

  it("should throw error when posting without Instagram connection", async () => {
    // Disconnect first
    await caller.facebook.disconnectInstagram();

    await expect(
      caller.facebook.postToInstagram({
        imageUrl: "https://example.com/image.jpg",
        caption: "Test post",
      })
    ).rejects.toThrow("Instagram account not connected");
  });
});
