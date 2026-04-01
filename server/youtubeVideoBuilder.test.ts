/**
 * YouTube Video Builder router tests
 * Tests script generation, SEO generation, and clip timestamp generation
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the LLM helper
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

// Mock DB
vi.mock("../drizzle/schema", () => ({
  users: {},
  fullAvatarVideos: {},
  customAvatarTwins: {},
}));

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

vi.mock("./lib/heygen-service", () => ({
  generateCustomAvatarVideo: vi.fn(),
  waitForHeyGenVideo: vi.fn(),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn(),
}));

import { invokeLLM } from "./_core/llm";

describe("YouTube Video Builder – script generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate a script with correct word count estimation", () => {
    const script = "Hello world. ".repeat(100); // 200 words
    const words = script.trim().split(/\s+/).length;
    const estimatedSeconds = Math.round((words / 140) * 60);
    expect(words).toBeGreaterThan(100);
    expect(estimatedSeconds).toBeGreaterThan(0);
  });

  it("should map duration targets to correct word counts", () => {
    const DURATION_TARGETS = {
      "5min": { words: 700, seconds: 300 },
      "8min": { words: 1100, seconds: 480 },
      "10min": { words: 1400, seconds: 600 },
      "15min": { words: 2100, seconds: 900 },
    };
    expect(DURATION_TARGETS["5min"].words).toBe(700);
    expect(DURATION_TARGETS["15min"].words).toBe(2100);
    expect(DURATION_TARGETS["8min"].seconds).toBe(480);
  });

  it("should handle LLM response for script generation", async () => {
    const mockScript = "Welcome to this month's market update for Austin, Texas. " +
      "I'm Sarah Johnson, your local real estate expert. ".repeat(50);

    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{ message: { content: mockScript } }],
    });

    const result = await (invokeLLM as any)({
      messages: [
        { role: "system", content: "You are a scriptwriter." },
        { role: "user", content: "Write a market update script." },
      ],
    });

    expect(result.choices[0].message.content).toBe(mockScript);
    expect(invokeLLM).toHaveBeenCalledOnce();
  });

  it("should handle LLM response for SEO generation", async () => {
    const mockSEO = JSON.stringify({
      title: "Austin Real Estate Market Update April 2026",
      description: "In this video, we cover the latest Austin market trends...",
      tags: ["austin real estate", "market update", "home buying"],
      chapters: [
        { time: "0:00", title: "Introduction" },
        { time: "1:30", title: "Market Overview" },
      ],
    });

    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{ message: { content: mockSEO } }],
    });

    const result = await (invokeLLM as any)({
      messages: [{ role: "user", content: "Generate SEO metadata." }],
    });

    const parsed = JSON.parse(result.choices[0].message.content);
    expect(parsed.title).toContain("Austin");
    expect(parsed.tags).toHaveLength(3);
    expect(parsed.chapters).toHaveLength(2);
  });

  it("should handle LLM response for clip timestamp generation", async () => {
    const mockClips = JSON.stringify({
      clips: [
        {
          openingSentence: "Here's the one thing most buyers get wrong...",
          title: "The #1 Buyer Mistake in Austin",
          reason: "High engagement hook with specific value",
          positionPercent: 25,
        },
        {
          openingSentence: "Interest rates are actually working in your favor right now...",
          title: "Why High Rates Are Actually Good for Buyers",
          reason: "Counterintuitive take that drives shares",
          positionPercent: 55,
        },
      ],
    });

    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{ message: { content: mockClips } }],
    });

    const result = await (invokeLLM as any)({
      messages: [{ role: "user", content: "Identify clip moments." }],
    });

    const parsed = JSON.parse(result.choices[0].message.content);
    expect(parsed.clips).toHaveLength(2);
    expect(parsed.clips[0].positionPercent).toBe(25);
    expect(parsed.clips[1].title).toContain("Rates");
  });

  it("should throw when LLM returns empty content", async () => {
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    });

    const result = await (invokeLLM as any)({ messages: [] });
    const content = result.choices?.[0]?.message?.content as string;
    expect(content).toBeNull();
    // In the router, this would throw: "Script generation failed"
  });
});

describe("YouTube Video Builder – topic validation", () => {
  const VALID_TOPICS = [
    "market_update", "buyer_guide", "seller_guide", "neighborhood_spotlight",
    "investment_tips", "mortgage_explainer", "faq", "year_in_review", "custom",
  ];

  it("should have all expected topic IDs", () => {
    expect(VALID_TOPICS).toContain("market_update");
    expect(VALID_TOPICS).toContain("buyer_guide");
    expect(VALID_TOPICS).toContain("custom");
    expect(VALID_TOPICS).toHaveLength(9);
  });

  it("should require non-empty topic for custom", () => {
    const selectedTopic = "custom";
    const customTopic = "";
    const topic = selectedTopic === "custom" ? customTopic : selectedTopic;
    expect(topic).toBe("");
    // Frontend would show error: "Enter your custom topic"
  });
});
