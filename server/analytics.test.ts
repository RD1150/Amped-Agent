import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
        subscriptionStatus: "active" as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("analytics router", () => {
  it("getMetrics returns aggregated analytics data", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analytics.getMetrics({});

    expect(result).toHaveProperty("totalViews");
    expect(result).toHaveProperty("totalLikes");
    expect(result).toHaveProperty("totalComments");
    expect(result).toHaveProperty("totalShares");
    expect(result).toHaveProperty("totalClicks");
    expect(result).toHaveProperty("avgEngagement");
    expect(result).toHaveProperty("totalPosts");
    expect(typeof result.totalViews).toBe("number");
    expect(typeof result.avgEngagement).toBe("number");
  });

  it("getTopPosts returns array of top performing posts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analytics.getTopPosts({ limit: 5 });

    expect(Array.isArray(result)).toBe(true);
    // Empty array is valid if no analytics data exists yet
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("contentPostId");
      expect(result[0]).toHaveProperty("totalViews");
      expect(result[0]).toHaveProperty("totalEngagement");
      expect(result[0]).toHaveProperty("platforms");
    }
  });

  it("getTrends returns time-series analytics data", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const result = await caller.analytics.getTrends({
      startDate,
      endDate,
      groupBy: "day",
    });

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("date");
      expect(result[0]).toHaveProperty("views");
      expect(result[0]).toHaveProperty("likes");
      expect(result[0]).toHaveProperty("engagement");
      expect(result[0]).toHaveProperty("platform");
    }
  });
});

describe("schedules router", () => {
  it("list returns user's posting schedules", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.schedules.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("getActive returns only active schedules", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.schedules.getActive();

    expect(Array.isArray(result)).toBe(true);
    // All returned schedules should be active
    result.forEach(schedule => {
      expect(schedule.isActive).toBe(true);
    });
  });

  it("create adds a new posting schedule", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const scheduleData = {
      name: "Test Schedule",
      contentType: "property_listing" as const,
      frequency: "weekly" as const,
      dayOfWeek: 1,
      timeOfDay: "09:00",
      autoGenerate: true,
    };

    const result = await caller.schedules.create(scheduleData);

    expect(result).toHaveProperty("id");
    expect(result.name).toBe(scheduleData.name);
    expect(result.contentType).toBe(scheduleData.contentType);
    expect(result.frequency).toBe(scheduleData.frequency);
    expect(result.nextRunAt).toBeDefined();
  });

  it("update modifies an existing schedule", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a schedule
    const created = await caller.schedules.create({
      name: "Original Name",
      contentType: "tips" as const,
      frequency: "daily" as const,
      timeOfDay: "10:00",
      autoGenerate: true,
    });

    // Then update it
    await caller.schedules.update({
      id: created.id,
      name: "Updated Name",
      isActive: false,
    });

    // Verify the update
    const allSchedules = await caller.schedules.list();
    const updated = allSchedules.find(s => s.id === created.id);
    
    expect(updated?.name).toBe("Updated Name");
    expect(updated?.isActive).toBe(false);
  });

  it("delete removes a schedule", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a schedule
    const created = await caller.schedules.create({
      name: "To Delete",
      contentType: "custom" as const,
      frequency: "monthly" as const,
      dayOfMonth: 15,
      timeOfDay: "14:00",
      autoGenerate: false,
    });

    // Delete it
    await caller.schedules.delete({ id: created.id });

    // Verify it's gone
    const allSchedules = await caller.schedules.list();
    const deleted = allSchedules.find(s => s.id === created.id);
    
    expect(deleted).toBeUndefined();
  });
});
