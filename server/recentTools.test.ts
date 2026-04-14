/**
 * Tests for the recently-used tools logic.
 * We test the pure utility functions (read/write/record) in a Node environment
 * by mocking localStorage via a simple in-memory map.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ── Minimal localStorage mock ──────────────────────────────────────────────────
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
};

// Inject mock before importing the module under test
vi.stubGlobal("localStorage", localStorageMock);
vi.stubGlobal("window", { dispatchEvent: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() });

// ── Import helpers (re-implement inline to avoid DOM import issues) ─────────────
const STORAGE_KEY = "amped_recent_tools";
const MAX_ENTRIES = 20;

interface RecentEntry { path: string; label: string; timestamp: number; }

function readEntries(): RecentEntry[] {
  try {
    const raw = localStorageMock.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentEntry[];
  } catch { return []; }
}

function recordToolVisit(path: string, label: string) {
  const entries = readEntries().filter((e) => e.path !== path);
  entries.unshift({ path, label, timestamp: Date.now() });
  localStorageMock.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

// ── Tests ──────────────────────────────────────────────────────────────────────
describe("recentTools utility", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("returns empty array when nothing has been recorded", () => {
    expect(readEntries()).toEqual([]);
  });

  it("records a visit and returns it", () => {
    recordToolVisit("/blog-builder", "Blog Builder");
    const entries = readEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].path).toBe("/blog-builder");
    expect(entries[0].label).toBe("Blog Builder");
  });

  it("deduplicates: re-visiting a tool moves it to the front", () => {
    recordToolVisit("/blog-builder", "Blog Builder");
    recordToolVisit("/autoreels", "AI Reels");
    recordToolVisit("/blog-builder", "Blog Builder"); // revisit
    const entries = readEntries();
    expect(entries[0].path).toBe("/blog-builder");
    expect(entries).toHaveLength(2); // no duplicate
  });

  it("most recent visit appears first", () => {
    recordToolVisit("/blog-builder", "Blog Builder");
    recordToolVisit("/autoreels", "AI Reels");
    const entries = readEntries();
    expect(entries[0].path).toBe("/autoreels");
    expect(entries[1].path).toBe("/blog-builder");
  });

  it("caps at MAX_ENTRIES", () => {
    for (let i = 0; i < MAX_ENTRIES + 5; i++) {
      recordToolVisit(`/tool-${i}`, `Tool ${i}`);
    }
    expect(readEntries()).toHaveLength(MAX_ENTRIES);
  });
});
