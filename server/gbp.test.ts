import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module — factory must be self-contained (vi.mock is hoisted)
vi.mock("./db", () => {
  const chain: any = {};
  chain.select = () => chain;
  chain.from = () => chain;
  chain.where = () => chain;
  chain.limit = () => Promise.resolve([]); // no connection found
  chain.update = () => chain;
  chain.set = () => chain;
  chain.insert = () => chain;
  chain.values = () => Promise.resolve(undefined);
  return {
    getDb: () => Promise.resolve(chain),
  };
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeCtx(userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-open-id",
    name: "Test Agent",
    email: "test@example.com",
    role: "user",
    subscriptionTier: "pro" as any,
    subscriptionStatus: "active" as any,
    trialStartedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    avatarUrl: null,
    agentCity: null,
    agentState: null,
    agentBio: null,
    agentPhone: null,
    agentWebsite: null,
    agentLicense: null,
    agentBrokerage: null,
    onboardingCompleted: true,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  };
  return {
    user,
    req: { headers: { origin: "https://authoritycontent.co" } } as any,
    res: {} as any,
  };
}

describe("GBP Router", () => {
  describe("getAuthUrl", () => {
    it("should generate a valid Google OAuth URL with business.manage scope", async () => {
      const caller = appRouter.createCaller(makeCtx());
      const result = await caller.gbp.getAuthUrl({
        redirectUri: "https://authoritycontent.co/integrations/google/callback",
      });

      expect(result.authUrl).toContain("accounts.google.com/o/oauth2/v2/auth");
      expect(result.authUrl).toContain("business.manage");
      expect(result.authUrl).toContain("access_type=offline");
      expect(result.authUrl).toContain("prompt=consent");
    });

    it("should include openid and email scopes", async () => {
      const caller = appRouter.createCaller(makeCtx());
      const result = await caller.gbp.getAuthUrl({
        redirectUri: "https://authoritycontent.co/integrations/google/callback",
      });

      expect(result.authUrl).toContain("openid");
      expect(result.authUrl).toContain("email");
    });

    it("should encode userId in base64url state parameter", async () => {
      const caller = appRouter.createCaller(makeCtx(42));
      const result = await caller.gbp.getAuthUrl({
        redirectUri: "https://authoritycontent.co/integrations/google/callback",
      });

      expect(result.state).toBeTruthy();
      const stateData = JSON.parse(Buffer.from(result.state, "base64url").toString());
      expect(stateData.userId).toBe(42);
      expect(stateData.timestamp).toBeDefined();
    });

    it("should return a non-empty state token", async () => {
      const caller = appRouter.createCaller(makeCtx());
      const result = await caller.gbp.getAuthUrl({
        redirectUri: "https://authoritycontent.co/integrations/google/callback",
      });

      expect(result.state.length).toBeGreaterThan(10);
    });
  });

  describe("getStatus", () => {
    it("should return null when no GBP location is saved", async () => {
      const caller = appRouter.createCaller(makeCtx());
      const result = await caller.gbp.getStatus();
      expect(result).toBeNull();
    });
  });

  describe("createPost input validation", () => {
    it("should reject empty summary", async () => {
      const caller = appRouter.createCaller(makeCtx());
      await expect(
        caller.gbp.createPost({ summary: "", topicType: "STANDARD" })
      ).rejects.toThrow();
    });

    it("should reject summary over 1500 characters", async () => {
      const caller = appRouter.createCaller(makeCtx());
      const longSummary = "a".repeat(1501);
      await expect(
        caller.gbp.createPost({ summary: longSummary, topicType: "STANDARD" })
      ).rejects.toThrow();
    });

    it("should fail with 'not connected' error when no GBP location saved", async () => {
      const caller = appRouter.createCaller(makeCtx());
      await expect(
        caller.gbp.createPost({
          summary: "Just listed! Beautiful 4BR home in Austin. DM for details.",
          topicType: "STANDARD",
        })
      ).rejects.toThrow(/not connected/i);
    });
  });
});
