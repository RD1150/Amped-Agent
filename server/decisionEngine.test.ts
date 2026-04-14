/**
 * Decision Engine — Weekly Digest & Settings Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock the DB and LLM so tests run without real connections ─────────────────
vi.mock("./db", () => ({
  getDb: vi.fn(),
  getPersonaByUserId: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

vi.mock("./emailService", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

// ── Import after mocks ────────────────────────────────────────────────────────
import { sendWeeklyDigests } from "./jobs/weeklyDigest";
import { getDb, getPersonaByUserId } from "./db";
import { invokeLLM } from "./_core/llm";
import { sendEmail } from "./emailService";

const mockDiagnosisResponse = {
  choices: [
    {
      message: {
        content: JSON.stringify({
          criticalIssue: {
            title: "Zero posts this week",
            whatIsHappening: "No content published in 7 days.",
            consequence: "You are invisible to your audience.",
            action: "Post 3 times this week using the Authority Post Builder.",
          },
          missedOpportunities: [
            {
              title: "Blog posts drive 3x leads",
              insight: "No blog posts published.",
              action: "Write one blog post this week.",
            },
          ],
          priorityActions: [
            { rank: 1, action: "Publish a market update post", tool: "Post Builder", href: "/generate" },
            { rank: 2, action: "Create a property tour video", tool: "Property Tours", href: "/property-tours" },
            { rank: 3, action: "Complete your Authority Profile", tool: "Authority Profile", href: "/authority-profile" },
          ],
          leverageInsight: "Agents who post 3+ times/week see 2x more inbound leads.",
          weeklyFocus: "Consistency is your competitive advantage this week.",
        }),
      },
    },
  ],
};

describe("Weekly Digest Job", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips users without email addresses", async () => {
    const mockDbInst = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 1, email: null, name: "Agent A" }]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };
    vi.mocked(getDb).mockResolvedValue(mockDbInst as any);

    await sendWeeklyDigests();

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends email to opted-in user with valid email", async () => {
    // Build a chainable mock that resolves at the end of the chain
    let callCount = 0;
    const mockChain: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: return opted-in users list (no more chaining needed)
          return Promise.resolve([{ id: 1, email: "agent@test.com", name: "Jane Smith" }]);
        }
        // Subsequent calls: return chainable (for orderBy/limit chains)
        return mockChain;
      }),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };
    const mockDbInst = mockChain;
    vi.mocked(getDb).mockResolvedValue(mockDbInst as any);
    vi.mocked(getPersonaByUserId).mockResolvedValue({
      agentName: "Jane Smith",
      primaryCity: "Austin",
    } as any);
    vi.mocked(invokeLLM).mockResolvedValue(mockDiagnosisResponse as any);

    await sendWeeklyDigests();

    expect(invokeLLM).toHaveBeenCalledOnce();
    expect(sendEmail).toHaveBeenCalledOnce();
    const callArgs = vi.mocked(sendEmail).mock.calls[0][0];
    expect(callArgs.to).toBe("agent@test.com");
    expect(callArgs.subject).toContain("Weekly Strategy Briefing");
    expect(callArgs.html).toContain("Jane Smith");
    expect(callArgs.html).toContain("Zero posts this week");
    expect(callArgs.html).toContain("Consistency is your competitive advantage");
  });

  it("handles LLM failure gracefully without crashing", async () => {
    const mockDbInst = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn()
        .mockResolvedValueOnce([{ id: 2, email: "agent2@test.com", name: "Bob" }])
        .mockResolvedValue([]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(getDb).mockResolvedValue(mockDbInst as any);
    vi.mocked(getPersonaByUserId).mockResolvedValue(null);
    vi.mocked(invokeLLM).mockRejectedValue(new Error("LLM timeout"));

    // Should not throw
    await expect(sendWeeklyDigests()).resolves.not.toThrow();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("handles database unavailable gracefully", async () => {
    vi.mocked(getDb).mockResolvedValue(null as any);

    await expect(sendWeeklyDigests()).resolves.not.toThrow();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe("WeeklyInsightBlock route resolution", () => {
  // Test the TOOL_ROUTES logic inline (mirrors client-side logic)
  const TOOL_ROUTES: Record<string, string> = {
    "Authority Post Builder": "/generate",
    "Post Builder": "/generate",
    "Blog Builder": "/blog-builder",
    "Property Tours": "/property-tours",
    "Avatar Video": "/full-avatar-video",
    "Authority Profile": "/authority-profile",
    "Listing Launch Kit": "/listing-launch-kit",
    "Open House": "/open-house-manager",
    "CRM": "/crm-pipeline",
  };

  function resolveHref(href?: string, tool?: string): string | undefined {
    if (href && href.startsWith("/")) return href;
    if (tool) {
      for (const [key, path] of Object.entries(TOOL_ROUTES)) {
        if (tool.toLowerCase().includes(key.toLowerCase())) return path;
      }
    }
    return undefined;
  }

  it("resolves absolute hrefs directly", () => {
    expect(resolveHref("/generate")).toBe("/generate");
    expect(resolveHref("/coach")).toBe("/coach");
  });

  it("resolves tool names to routes", () => {
    expect(resolveHref(undefined, "Post Builder")).toBe("/generate");
    expect(resolveHref(undefined, "Authority Profile")).toBe("/authority-profile");
    expect(resolveHref(undefined, "Blog Builder")).toBe("/blog-builder");
    expect(resolveHref(undefined, "Open House Manager")).toBe("/open-house-manager");
  });

  it("returns undefined for unknown tools", () => {
    expect(resolveHref(undefined, "Unknown Tool XYZ")).toBeUndefined();
    expect(resolveHref(undefined, undefined)).toBeUndefined();
  });

  it("prefers explicit href over tool name", () => {
    expect(resolveHref("/specific-page", "Post Builder")).toBe("/specific-page");
  });
});
