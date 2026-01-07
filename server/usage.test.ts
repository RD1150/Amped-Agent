import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("usage tracking", () => {
  it("returns current usage and subscription info", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.usage.current();

    expect(result).toHaveProperty("usage");
    expect(result).toHaveProperty("subscription");
    expect(result).toHaveProperty("tier");
    expect(result).toHaveProperty("allowed");
    expect(result.usage).toHaveProperty("postsGenerated");
    expect(result.usage).toHaveProperty("imagesGenerated");
  });

  it("returns all subscription tiers", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const tiers = await caller.usage.tiers();

    expect(Array.isArray(tiers)).toBe(true);
    expect(tiers.length).toBeGreaterThan(0);
    expect(tiers[0]).toHaveProperty("name");
    expect(tiers[0]).toHaveProperty("displayName");
    expect(tiers[0]).toHaveProperty("monthlyPrice");
  });

  it("returns usage alerts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const alerts = await caller.usage.alerts();

    expect(Array.isArray(alerts)).toBe(true);
  });
});

describe("GHL webhooks", () => {
  it("handles user.created event", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    const result = await caller.webhooks.ghl({
      event: "user.created",
      email: "newuser@example.com",
      name: "New User",
      tier: "basic",
      status: "trial",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("subscription created");
  });

  it("handles user.subscription.updated event", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    const result = await caller.webhooks.ghl({
      event: "user.subscription.updated",
      email: "sample@example.com",
      tier: "pro",
      status: "active",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("updated");
  });

  it("handles user.subscription.cancelled event", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    const result = await caller.webhooks.ghl({
      event: "user.subscription.cancelled",
      email: "sample@example.com",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("cancelled");
  });
});

describe("white-label settings", () => {
  it("returns white-label settings for user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const settings = await caller.whiteLabel.get();

    // May be undefined if not set yet
    if (settings) {
      expect(settings).toHaveProperty("appName");
      expect(settings).toHaveProperty("primaryColor");
    }
  });

  it("upserts white-label settings", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.whiteLabel.upsert({
      appName: "My Custom Brand",
      primaryColor: "#FF5733",
      hideOriginalBranding: true,
    });

    const settings = await caller.whiteLabel.get();

    expect(settings).toBeDefined();
    if (settings) {
      expect(settings.appName).toBe("My Custom Brand");
      expect(settings.primaryColor).toBe("#FF5733");
    }
  });
});
