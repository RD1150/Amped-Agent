import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock DB helpers
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getPersonaByUserId: vi.fn().mockResolvedValue({
      agentName: "Jane Smith",
      primaryCity: "Austin",
      targetAudience: "first-time home buyers",
      brandVoice: "friendly and professional",
    }),
    createContentPost: vi.fn().mockResolvedValue({ insertId: 99 }),
  };
});

// Mock LLM to return valid repurpose JSON
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            carousel: {
              slides: [
                { slideNumber: 1, headline: "Cover Slide", body: "Opening body text" },
                { slideNumber: 2, headline: "Point 1", body: "Detail about point 1" },
                { slideNumber: 3, headline: "Point 2", body: "Detail about point 2" },
                { slideNumber: 4, headline: "Point 3", body: "Detail about point 3" },
                { slideNumber: 5, headline: "Point 4", body: "Detail about point 4" },
                { slideNumber: 6, headline: "Point 5", body: "Detail about point 5" },
                { slideNumber: 7, headline: "CTA Slide", body: "Call to action text" },
              ],
              caption: "Great caption #RealEstate #HomebuYing",
            },
            reelScript: {
              hook: "Did you know this about buying a home?",
              script: "Full script here with [PAUSE] cues.",
              cta: "Follow for more tips!",
            },
            newsletter: {
              subjectLine: "5 things buyers miss",
              previewText: "Don't make these mistakes",
              body: "Newsletter body paragraph 1.\n\nParagraph 2.\n\nParagraph 3.",
            },
            gbpPost: {
              text: "Google Business post text here.",
              callToAction: "LEARN_MORE",
            },
            linkedin: {
              hook: "Most buyers don't know this...",
              body: "LinkedIn body text here.",
              hashtags: ["#RealEstate", "#Homebuying"],
            },
          }),
        },
      },
    ],
  }),
}));

import * as db from "./db";

function makeCtx(userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: "test-open-id",
      email: "agent@test.com",
      name: "Test Agent",
      loginMethod: "manus",
      role: "user",
        subscriptionStatus: "active" as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("repurpose.repurposeContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires topic to be at least 3 characters", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.repurpose.repurposeContent({ topic: "ab", body: "Some content body here", platforms: ["linkedin"] })
    ).rejects.toThrow();
  });

  it("requires body to be at least 10 characters", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.repurpose.repurposeContent({ topic: "Valid topic", body: "short", platforms: ["linkedin"] })
    ).rejects.toThrow();
  });

  it("returns platform-native content for selected platforms", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.repurpose.repurposeContent({
      topic: "5 mistakes first-time buyers make",
      body: "Many first-time buyers make costly mistakes that could be avoided with the right guidance.",
      platforms: ["linkedin", "instagram"],
    });

    expect(result.topic).toBe("5 mistakes first-time buyers make");
    expect(result.platforms).toContain("linkedin");
    expect(result.platforms).toContain("instagram");
    expect(result.linkedin).toBeDefined();
    expect(result.linkedin?.hashtags).toBeInstanceOf(Array);
    expect(result.instagram).toBeDefined();
  });

  it("saves a draft post to the database", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await caller.repurpose.repurposeContent({
      topic: "Why pre-approval matters",
      body: "Getting pre-approved before house hunting saves time and strengthens your offer significantly.",
      platforms: ["linkedin"],
    });

    expect(db.createContentPost).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        aiGenerated: true,
        status: "draft",
      })
    );
  });

  it("uses persona data for context when available", async () => {
    const { invokeLLM } = await import("./_core/llm");
    const caller = appRouter.createCaller(makeCtx());
    await caller.repurpose.repurposeContent({
      topic: "Local market update",
      body: "The Austin market is showing strong buyer demand this spring season.",
      platforms: ["linkedin"],
    });

    expect(invokeLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: "system",
            content: expect.stringContaining("Jane Smith"),
          }),
        ]),
      })
    );
  });

  it("allows optional agentName and city overrides", async () => {
    const { invokeLLM } = await import("./_core/llm");
    const caller = appRouter.createCaller(makeCtx());
    await caller.repurpose.repurposeContent({
      topic: "Seller tips for spring",
      body: "Spring is the best time to list your home for maximum buyer competition.",
      platforms: ["linkedin"],
      agentName: "Bob Jones",
      city: "Denver",
    });

    expect(invokeLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: "system",
            content: expect.stringContaining("Bob Jones"),
          }),
        ]),
      })
    );
  });
});
