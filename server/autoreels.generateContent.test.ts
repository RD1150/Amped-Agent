import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test Agent",
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

  return ctx;
}

describe("autoreels.generateContent", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    const ctx = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  it("should generate content based on topic and input method", async () => {
    const result = await caller.autoreels.generateContent({
      topic: "First-time homebuyer tips",
      inputMethod: "bullets",
    });

    expect(result).toBeDefined();
    expect(result.content).toBeTruthy();
    expect(typeof result.content).toBe("string");
    expect(result.content.length).toBeGreaterThan(50);
  }, 30000);

  it("should generate caption-style content", async () => {
    const result = await caller.autoreels.generateContent({
      topic: "Why now is a great time to sell",
      inputMethod: "caption",
    });

    expect(result).toBeDefined();
    expect(result.content).toBeTruthy();
    expect(result.content.length).toBeGreaterThan(100);
  }, 30000);

  it("should generate blog-style content", async () => {
    const result = await caller.autoreels.generateContent({
      topic: "Understanding mortgage rates",
      inputMethod: "blog",
    });

    expect(result).toBeDefined();
    expect(result.content).toBeTruthy();
    expect(result.content.length).toBeGreaterThan(150);
  }, 30000);

  it("should reject empty topic", async () => {
    await expect(
      caller.autoreels.generateContent({
        topic: "",
        inputMethod: "bullets",
      })
    ).rejects.toThrow();
  });
});
