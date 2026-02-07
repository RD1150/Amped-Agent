import { describe, it, expect, beforeEach } from "vitest";
import { getDb } from "./db";
import { users, creditTransactions } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as credits from "./credits";

describe("Credit System", () => {
  let testUserId: number;

  beforeEach(async () => {
    // Create a test user
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [user] = await db
      .insert(users)
      .values({
        openId: `test-${Date.now()}`,
        name: "Test User",
        email: "test@example.com",
        creditBalance: 100, // Start with 100 credits
      })
      .$returningId();

    testUserId = user.id;
  });

  it("should get credit balance", async () => {
    const balance = await credits.getCreditBalance(testUserId);
    expect(balance).toBe(100);
  });

  it("should check if user has sufficient credits", async () => {
    const hasEnough = await credits.hasCredits(testUserId, 50);
    expect(hasEnough).toBe(true);

    const notEnough = await credits.hasCredits(testUserId, 150);
    expect(notEnough).toBe(false);
  });

  it("should deduct credits and record transaction", async () => {
    const newBalance = await credits.deductCredits({
      userId: testUserId,
      amount: 40,
      usageType: "full_ai_video",
      description: "Generated Full AI Cinematic video",
    });

    expect(newBalance).toBe(60);

    // Verify transaction was recorded
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [transaction] = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, testUserId))
      .limit(1);

    expect(transaction.type).toBe("usage");
    expect(transaction.amount).toBe(-40);
    expect(transaction.balanceAfter).toBe(60);
    expect(transaction.usageType).toBe("full_ai_video");
  });

  it("should throw error when insufficient credits", async () => {
    await expect(
      credits.deductCredits({
        userId: testUserId,
        amount: 150,
        usageType: "full_ai_video",
        description: "Test",
      })
    ).rejects.toThrow("Insufficient credits");
  });

  it("should add credits and record transaction", async () => {
    const newBalance = await credits.addCredits({
      userId: testUserId,
      amount: 100,
      type: "purchase",
      description: "Purchased Starter Package",
      packageName: "Starter",
      amountPaid: 4900,
    });

    expect(newBalance).toBe(200);

    // Verify transaction was recorded
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [transaction] = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, testUserId))
      .limit(1);

    expect(transaction.type).toBe("purchase");
    expect(transaction.amount).toBe(100);
    expect(transaction.balanceAfter).toBe(200);
    expect(transaction.packageName).toBe("Starter");
  });

  it("should calculate video cost correctly", async () => {
    // Standard video
    const standardCost = credits.calculateVideoCost({
      videoMode: "standard",
      enableVoiceover: false,
    });
    expect(standardCost.totalCredits).toBe(5);
    expect(standardCost.breakdown).toHaveLength(1);

    // AI-Enhanced video
    const aiEnhancedCost = credits.calculateVideoCost({
      videoMode: "ai-enhanced",
      enableVoiceover: false,
    });
    expect(aiEnhancedCost.totalCredits).toBe(15);

    // Full AI with voiceover
    const fullAiWithVoice = credits.calculateVideoCost({
      videoMode: "full-ai",
      enableVoiceover: true,
    });
    expect(fullAiWithVoice.totalCredits).toBe(45); // 40 + 5
    expect(fullAiWithVoice.breakdown).toHaveLength(2);
  });

  it("should retrieve credit history", async () => {
    // Add some transactions
    await credits.deductCredits({
      userId: testUserId,
      amount: 15,
      usageType: "ai_enhanced_video",
      description: "AI-Enhanced video",
    });

    await credits.addCredits({
      userId: testUserId,
      amount: 50,
      type: "bonus",
      description: "Bonus credits",
    });

    const history = await credits.getCreditHistory(testUserId, 10);
    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history[0].userId).toBe(testUserId);
  });

  it("should grant trial credits to new user", async () => {
    // Create another test user with 0 credits
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [newUser] = await db
      .insert(users)
      .values({
        openId: `trial-${Date.now()}`,
        name: "Trial User",
        email: "trial@example.com",
        creditBalance: 0,
      })
      .$returningId();

    const newBalance = await credits.grantTrialCredits(newUser.id);
    expect(newBalance).toBe(50);

    const balance = await credits.getCreditBalance(newUser.id);
    expect(balance).toBe(50);
  });
});
