import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getPersonaByUserId: vi.fn().mockResolvedValue({
      agentName: "Jane Smith",
      primaryCity: "Austin",
      primaryColor: "#1a3a5c",
      brokerageName: "Realty Group",
      phoneNumber: "512-555-0100",
    }),
    createContentPost: vi.fn().mockResolvedValue({ insertId: 42 }),
  };
});

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          title: "The Austin First-Time Buyer Guide",
          subtitle: "Everything you need to know",
          introduction: "Austin is a great place to buy.",
          sections: [
            { heading: "Step 1: Get Pre-Approved", content: "Get pre-approved first.", tip: "Shop multiple lenders." },
            { heading: "Step 2: Define Must-Haves", content: "Know what you want.", tip: "Make a list." },
            { heading: "Step 3: Find Neighborhoods", content: "Explore neighborhoods.", tip: "Visit in person." },
            { heading: "Step 4: Make an Offer", content: "Be competitive.", tip: "Go in strong." },
            { heading: "Step 5: Close the Deal", content: "Navigate closing.", tip: "Review all docs." },
          ],
          closingMessage: "I'm here to help you every step of the way.",
          faqItems: [
            { question: "How much do I need for a down payment?", answer: "Typically 3-20%." },
            { question: "How long does it take?", answer: "30-60 days typically." },
            { question: "What are closing costs?", answer: "Usually 2-5% of the loan." },
          ],
        }),
      },
    }],
  }),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/lead-magnets/1/buyer_guide-abc123.pdf", key: "lead-magnets/1/buyer_guide-abc123.pdf" }),
}));

// Mock html-pdf-node to avoid needing Chromium in tests
vi.mock("html-pdf-node", () => ({
  default: {
    generatePdf: vi.fn().mockResolvedValue(Buffer.from("fake-pdf-content")),
  },
  generatePdf: vi.fn().mockResolvedValue(Buffer.from("fake-pdf-content")),
}));

function makeCtx(userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: "test-open-id",
      email: "agent@test.com",
      name: "Test Agent",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("leadMagnet.generate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires city to be at least 2 characters", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.leadMagnet.generate({ type: "buyer_guide", city: "A" })
    ).rejects.toThrow();
  });

  it("rejects invalid lead magnet type", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.leadMagnet.generate({ type: "invalid_type" as any, city: "Austin" })
    ).rejects.toThrow();
  });

  it("generates a buyer guide and returns a PDF URL", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.leadMagnet.generate({
      type: "buyer_guide",
      city: "Austin, TX",
    });

    expect(result.type).toBe("buyer_guide");
    expect(result.label).toBe("First-Time Buyer Guide");
    expect(result.city).toBe("Austin, TX");
    expect(result.pdfUrl).toMatch(/https:\/\//);
  });

  it("saves a draft post to the database after generation", async () => {
    const { createContentPost } = await import("./db");
    const caller = appRouter.createCaller(makeCtx());
    await caller.leadMagnet.generate({
      type: "buyer_guide",
      city: "Austin, TX",
    });

    expect(createContentPost).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        aiGenerated: true,
        status: "draft",
      })
    );
  });

  it("uses persona agent name when no override provided", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.leadMagnet.generate({
      type: "buyer_guide",
      city: "Austin, TX",
    });

    expect(result.agentName).toBe("Jane Smith");
  });

  it("uses provided agentName override", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.leadMagnet.generate({
      type: "buyer_guide",
      city: "Denver, CO",
      agentName: "Bob Jones",
    });

    expect(result.agentName).toBe("Bob Jones");
  });

  it("accepts neighborhood_report type with neighborhood field", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.leadMagnet.generate({
      type: "neighborhood_report",
      city: "Austin, TX",
      neighborhood: "South Congress",
    });

    expect(result.type).toBe("neighborhood_report");
    expect(result.label).toBe("Neighborhood Report");
  });

  it("accepts market_update type with month field", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.leadMagnet.generate({
      type: "market_update",
      city: "Austin, TX",
      month: "March 2026",
    });

    expect(result.type).toBe("market_update");
    expect(result.label).toBe("Market Update");
  });
});
