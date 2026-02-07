import { describe, it, expect, beforeEach } from "vitest";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as rateLimit from "./rateLimit";

describe("Rate Limiting", () => {
  let testUserId: number;

  beforeEach(async () => {
    // Create a test user
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [user] = await db
      .insert(users)
      .values({
        openId: `test-ratelimit-${Date.now()}`,
        name: "Test User",
        email: "ratelimit@example.com",
        dailyVideoCount: 0,
        lastDailyReset: new Date(),
      })
      .$returningId();

    testUserId = user.id;
  });

  it("should allow video generation when under limit", async () => {
    const status = await rateLimit.checkDailyVideoLimit(testUserId);
    
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(10);
    expect(status.current).toBe(0);
  });

  it("should increment daily video count", async () => {
    const newCount = await rateLimit.incrementDailyVideoCount(testUserId);
    expect(newCount).toBe(1);

    const status = await rateLimit.checkDailyVideoLimit(testUserId);
    expect(status.current).toBe(1);
    expect(status.remaining).toBe(9);
  });

  it("should block generation when limit reached", async () => {
    // Increment to limit
    for (let i = 0; i < 10; i++) {
      await rateLimit.incrementDailyVideoCount(testUserId);
    }

    const status = await rateLimit.checkDailyVideoLimit(testUserId);
    expect(status.allowed).toBe(false);
    expect(status.remaining).toBe(0);
    expect(status.current).toBe(10);
  });

  it("should reset counter after 24 hours", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Set count to 10 and reset time to 25 hours ago (more than 1 day)
    const yesterday = new Date();
    yesterday.setTime(yesterday.getTime() - (25 * 60 * 60 * 1000)); // 25 hours ago

    await db
      .update(users)
      .set({
        dailyVideoCount: 10,
        lastDailyReset: yesterday,
      })
      .where(eq(users.id, testUserId));

    // Check should reset the counter
    const status = await rateLimit.checkDailyVideoLimit(testUserId);
    expect(status.allowed).toBe(true);
    expect(status.current).toBe(0);
    expect(status.remaining).toBe(10);
  });

  it("should get daily video usage", async () => {
    await rateLimit.incrementDailyVideoCount(testUserId);
    await rateLimit.incrementDailyVideoCount(testUserId);
    await rateLimit.incrementDailyVideoCount(testUserId);

    const usage = await rateLimit.getDailyVideoUsage(testUserId);
    expect(usage.used).toBe(3);
    expect(usage.limit).toBe(10);
    expect(usage.remaining).toBe(7);
    expect(usage.resetTime).toBeInstanceOf(Date);
  });

  it("should provide correct reset time", async () => {
    const status = await rateLimit.checkDailyVideoLimit(testUserId);
    
    // Reset time should be tomorrow at midnight UTC
    const now = new Date();
    const expectedReset = new Date(now);
    expectedReset.setUTCHours(24, 0, 0, 0);

    expect(status.resetTime.getTime()).toBeGreaterThan(now.getTime());
    expect(status.resetTime.getUTCHours()).toBe(0);
    expect(status.resetTime.getUTCMinutes()).toBe(0);
  });
});
