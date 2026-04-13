import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

// Increase timeout for LLM API calls
const TEST_TIMEOUT = 30000; // 30 seconds

describe("Enhanced Performance Coach", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testUserId: number;

  beforeAll(async () => {
    // Create test user
    const openId = `test-coach-${Date.now()}`;
    await db.upsertUser({
      openId,
      name: "Test Coach User",
      email: `coach-test-${Date.now()}@test.com`,
    });
    
    // Get user to get ID
    const user = await db.getUserByOpenId(openId);
    if (!user) throw new Error("Failed to create test user");
    testUserId = user.id;

    // Create caller with test user context (include createdAt so trial is active)
    caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: user.openId,
        name: user.name,
        email: user.email!,
        role: "user",
        subscriptionStatus: "active" as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        loginMethod: "manus",
      },
      req: {} as any,
      res: {} as any,
    });
  });

  it("should analyze post without persona data (baseline)", async () => {
    const result = await caller.coach.analyze({
      content: "Just listed! Beautiful 3BR/2BA home in downtown. Perfect for first-time buyers. Call me today!",
    });

    expect(result).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.scores.engagement).toBeDefined();
    expect(result.scores.clarity).toBeDefined();
    expect(result.scores.cta).toBeDefined();
    expect(result.scores.authority).toBeDefined();
    expect(result.strengths).toBeInstanceOf(Array);
    expect(result.improvements).toBeInstanceOf(Array);
    expect(result.rewriteSuggestion).toBeDefined();
  }, TEST_TIMEOUT);

  it("should analyze post with persona data (personalized)", async () => {
    // Set up persona with customer avatar, brand values, and market context
    await caller.persona.updateAuthorityProfile({
      customerAvatar: JSON.stringify({
        type: "Luxury Home Buyers",
        description: "High-net-worth individuals looking for premium properties",
      }),
      brandValues: JSON.stringify(["Exclusivity", "White-glove service", "Discretion"]),
      marketContext: JSON.stringify({
        city: "Beverly Hills",
        state: "CA",
        marketType: "luxury",
        keyTrends: ["Rising demand for privacy", "Smart home features"],
      }),
    });

    const result = await caller.coach.analyze({
      content: "Just listed! Beautiful 3BR/2BA home in downtown. Perfect for first-time buyers. Call me today!",
    });

    expect(result).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
    
    // Should have personalized scores
    expect(result.scores.avatarAlignment).toBeDefined();
    expect(result.scores.brandAlignment).toBeDefined();
    expect(result.scores.marketRelevance).toBeDefined();
    
    // Scores should be low because post doesn't match luxury avatar/brand/market
    expect(result.scores.avatarAlignment!).toBeLessThan(50);
    expect(result.scores.brandAlignment!).toBeLessThan(50);
  }, TEST_TIMEOUT);

  it("should give high scores for well-aligned content", async () => {
    // Use the same luxury persona from previous test
    const result = await caller.coach.analyze({
      content: "Exclusive opportunity: Architectural masterpiece in Beverly Hills. 6BR/8BA estate with smart home integration, private theater, and unparalleled privacy. Discreet showings by appointment only. Contact me for a private tour.",
    });

    expect(result).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(60);
    
    // Should have high personalized scores
    expect(result.scores.avatarAlignment!).toBeGreaterThan(60);
    expect(result.scores.brandAlignment!).toBeGreaterThan(60);
    expect(result.scores.marketRelevance!).toBeGreaterThan(60);
  }, TEST_TIMEOUT);
});
