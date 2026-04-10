/**
 * Unit tests for the editAndRerender video editing logic.
 * Tests the clip ordering, label override, and settings resolution logic
 * without hitting the database or Creatomate API.
 */

import { describe, it, expect } from "vitest";

// ─── Helpers (extracted from cinematicWalkthrough.ts logic) ───────────────────

type SavedClip = {
  url: string;
  roomLabel: string;
  duration: number;
  roomType: string;
  isFallback?: boolean;
};

type EditClipInput = {
  originalIndex: number;
  label?: string;
};

function buildEditedClips(savedClips: SavedClip[], editInputs: EditClipInput[]): SavedClip[] {
  return editInputs.map((c) => {
    const orig = savedClips[c.originalIndex];
    if (!orig) throw new Error(`Clip index ${c.originalIndex} not found`);
    return {
      ...orig,
      roomLabel: c.label ?? orig.roomLabel,
    };
  });
}

function resolveMusic(
  editMusicUrl: string | null | undefined,
  originalMusicUrl: string | undefined
): string | undefined {
  if (editMusicUrl === undefined) return originalMusicUrl; // keep original
  if (editMusicUrl === null) return undefined; // no music
  return editMusicUrl; // new track
}

function resolveOutro(
  editIncludeOutro: boolean | undefined,
  originalIncludeOutro: boolean | undefined
): boolean {
  if (editIncludeOutro !== undefined) return editIncludeOutro;
  return originalIncludeOutro ?? true;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

const SAVED_CLIPS: SavedClip[] = [
  { url: "https://cdn.example.com/clip0.mp4", roomLabel: "Front Exterior", duration: 5, roomType: "exterior_front" },
  { url: "https://cdn.example.com/clip1.mp4", roomLabel: "Living Room", duration: 5, roomType: "living_room" },
  { url: "https://cdn.example.com/clip2.mp4", roomLabel: "Kitchen", duration: 5, roomType: "kitchen" },
  { url: "https://cdn.example.com/clip3.mp4", roomLabel: "Master Bedroom", duration: 5, roomType: "master_bedroom", isFallback: true },
];

describe("editAndRerender — clip editing logic", () => {
  it("preserves original order when no reordering", () => {
    const result = buildEditedClips(SAVED_CLIPS, [
      { originalIndex: 0 },
      { originalIndex: 1 },
      { originalIndex: 2 },
    ]);
    expect(result).toHaveLength(3);
    expect(result[0].roomLabel).toBe("Front Exterior");
    expect(result[1].roomLabel).toBe("Living Room");
    expect(result[2].roomLabel).toBe("Kitchen");
  });

  it("reorders clips correctly", () => {
    const result = buildEditedClips(SAVED_CLIPS, [
      { originalIndex: 2 }, // Kitchen first
      { originalIndex: 0 }, // Exterior second
      { originalIndex: 1 }, // Living Room third
    ]);
    expect(result[0].roomLabel).toBe("Kitchen");
    expect(result[1].roomLabel).toBe("Front Exterior");
    expect(result[2].roomLabel).toBe("Living Room");
    // URLs should follow the reorder
    expect(result[0].url).toBe("https://cdn.example.com/clip2.mp4");
  });

  it("removes clips (subset selection)", () => {
    const result = buildEditedClips(SAVED_CLIPS, [
      { originalIndex: 0 },
      { originalIndex: 2 },
      // clip 1 and 3 removed
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].roomLabel).toBe("Front Exterior");
    expect(result[1].roomLabel).toBe("Kitchen");
  });

  it("overrides room label when label is provided", () => {
    const result = buildEditedClips(SAVED_CLIPS, [
      { originalIndex: 0, label: "Grand Entrance" },
      { originalIndex: 1 },
    ]);
    expect(result[0].roomLabel).toBe("Grand Entrance");
    expect(result[1].roomLabel).toBe("Living Room"); // unchanged
  });

  it("preserves isFallback flag from original clip", () => {
    const result = buildEditedClips(SAVED_CLIPS, [
      { originalIndex: 3 }, // isFallback: true
    ]);
    expect(result[0].isFallback).toBe(true);
  });

  it("throws when originalIndex is out of bounds", () => {
    expect(() =>
      buildEditedClips(SAVED_CLIPS, [{ originalIndex: 99 }])
    ).toThrow("Clip index 99 not found");
  });

  it("allows duplicate clips (same clip used twice)", () => {
    const result = buildEditedClips(SAVED_CLIPS, [
      { originalIndex: 0 },
      { originalIndex: 0 }, // same clip twice
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].url).toBe(result[1].url);
  });
});

describe("editAndRerender — music resolution", () => {
  it("keeps original music when editMusicUrl is undefined", () => {
    expect(resolveMusic(undefined, "https://cdn.example.com/music.mp3")).toBe("https://cdn.example.com/music.mp3");
  });

  it("removes music when editMusicUrl is null", () => {
    expect(resolveMusic(null, "https://cdn.example.com/music.mp3")).toBeUndefined();
  });

  it("uses new track when editMusicUrl is provided", () => {
    expect(resolveMusic("https://cdn.example.com/new-track.mp3", "https://cdn.example.com/old.mp3")).toBe("https://cdn.example.com/new-track.mp3");
  });
});

describe("editAndRerender — outro resolution", () => {
  it("uses editIncludeOutro when provided", () => {
    expect(resolveOutro(false, true)).toBe(false);
    expect(resolveOutro(true, false)).toBe(true);
  });

  it("falls back to original when editIncludeOutro is undefined", () => {
    expect(resolveOutro(undefined, false)).toBe(false);
    expect(resolveOutro(undefined, true)).toBe(true);
  });

  it("defaults to true when both are undefined", () => {
    expect(resolveOutro(undefined, undefined)).toBe(true);
  });
});
