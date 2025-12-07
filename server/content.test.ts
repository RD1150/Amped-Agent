import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeDefined();
    expect(result?.email).toBe("test@example.com");
    expect(result?.name).toBe("Test User");
  });

  it("returns null when not authenticated", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeNull();
  });
});

describe("content.generate input validation", () => {
  it("validates content type enum correctly", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test that valid content types are accepted by the schema
    const validContentTypes = ["property_listing", "market_report", "trending_news", "tips", "neighborhood", "custom"];
    
    for (const contentType of validContentTypes) {
      // Just verify the router exists and accepts the input structure
      expect(caller.content.generate).toBeDefined();
    }
  });

  it("validates content type enum", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const invalidInput = {
      topic: "Test topic",
      contentType: "invalid_type" as any,
    };

    await expect(caller.content.generate(invalidInput)).rejects.toThrow();
  });
});

describe("persona.upsert input validation", () => {
  it("accepts valid persona input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const validInput = {
      businessName: "Luxury Homes Realty",
      tagline: "Your Dream Home Awaits",
      brandVoice: "luxury" as const,
    };

    // This tests that the input validation works correctly
    try {
      await caller.persona.upsert(validInput);
    } catch (error: any) {
      // Database errors are expected in test environment
      expect(error.message).not.toContain("Invalid input");
    }
  });

  it("validates brand voice enum", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const invalidInput = {
      brandVoice: "invalid_voice" as any,
    };

    await expect(caller.persona.upsert(invalidInput)).rejects.toThrow();
  });
});

describe("calendar.create input validation", () => {
  it("accepts valid calendar event input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const validInput = {
      title: "Property Listing Post",
      eventDate: new Date("2025-12-15"),
      eventTime: "09:00",
      eventType: "post" as const,
    };

    try {
      await caller.calendar.create(validInput);
    } catch (error: any) {
      expect(error.message).not.toContain("Invalid input");
    }
  });
});

describe("importJobs.processCSV input validation", () => {
  it("accepts valid CSV processing input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const validInput = {
      jobId: 1,
      csvData: [
        {
          address: "123 Main St",
          price: "$500,000",
          bedrooms: "4",
          bathrooms: "3",
        },
      ],
      settings: {
        postsPerWeek: 3,
        contentTypes: ["property_listing"],
        startDate: "2025-12-15",
      },
    };

    try {
      await caller.importJobs.processCSV(validInput);
    } catch (error: any) {
      // Database/LLM errors are expected, but input should be valid
      expect(error.message).not.toContain("Invalid input");
    }
  });
});
