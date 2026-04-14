import { describe, it, expect } from "vitest";

// Utility: estimate narration duration from word count
function estimateDurationSeconds(wordCount: number): number {
  const wordsPerMinute = 130;
  return Math.round((wordCount / wordsPerMinute) * 60);
}

// Utility: format duration as mm:ss
function fmtDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

describe("Podcast Builder utilities", () => {
  it("estimates duration correctly for 130 words (1 min)", () => {
    expect(estimateDurationSeconds(130)).toBe(60);
  });

  it("estimates duration correctly for 650 words (5 min)", () => {
    expect(estimateDurationSeconds(650)).toBe(300);
  });

  it("estimates duration for 0 words", () => {
    expect(estimateDurationSeconds(0)).toBe(0);
  });

  it("formats duration 0:00 correctly", () => {
    expect(fmtDuration(0)).toBe("0:00");
  });

  it("formats duration 1:05 correctly", () => {
    expect(fmtDuration(65)).toBe("1:05");
  });

  it("formats duration 10:30 correctly", () => {
    expect(fmtDuration(630)).toBe("10:30");
  });
});
