/**
 * Tests for the music library
 * Verifies all tracks have valid, non-broken URLs
 */
import { describe, it, expect } from "vitest";
import { MUSIC_LIBRARY, getTrackById, getTracksByMood, getRecommendedTracks } from "./musicLibrary";

describe("Music Library", () => {
  it("should have at least 20 tracks", () => {
    expect(MUSIC_LIBRARY.length).toBeGreaterThanOrEqual(20);
  });

  it("should have no duplicate IDs", () => {
    const ids = MUSIC_LIBRARY.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("every track should have a non-empty URL", () => {
    for (const track of MUSIC_LIBRARY) {
      expect(track.url, `Track "${track.title}" (${track.id}) has empty URL`).toBeTruthy();
      expect(track.url.length, `Track "${track.title}" URL is too short`).toBeGreaterThan(10);
    }
  });

  it("every track URL should start with https://", () => {
    for (const track of MUSIC_LIBRARY) {
      expect(
        track.url.startsWith("https://"),
        `Track "${track.title}" URL does not start with https://: ${track.url}`
      ).toBe(true);
    }
  });

  it("no track URL should point to a broken stub (manuscdn session_file that returned 3242 bytes)", () => {
    // The broken stub URLs all came from the old session_file CDN with specific file hashes
    // We know these are broken: ldKAHjNzEGyBcwLg, qPnkteBOPzXGYEbX, vodICfVrojZqnwpZ, etc.
    const knownBrokenHashes = [
      "ldKAHjNzEGyBcwLg",
      "qPnkteBOPzXGYEbX",
      "vodICfVrojZqnwpZ",
      "lxAnJpMVPhZSSrLa",
      "MEfRcqASBZyQPEPN",
      "sYkBZWxKuHYAJXZU",
      "qVWSVoFvqDXTxYsz",
      "cNGvBxQXtzvzdgab",
      "TDMwuIjiGQWTANVh",
      "OImfXqTPQrQmhdsb",
      "NCbnVbKzELOxbKxA",
      "chqffOEDIxbnmBTk",
      "ULYqsrrZnJyUOEre",
      "YkpqJRSGZmcZBXyj",
      "FbifRQzUXUgxmKYs",
      "arYlRbXckERcxDzd",
      "qbVetGkiiPmYREmE",
      "TTUhZYPigsBXaSnJ",
      "zylrQSCMCbWtkpPZ",
      "BnSUxekKaewZjXmz",
    ];

    for (const track of MUSIC_LIBRARY) {
      for (const hash of knownBrokenHashes) {
        expect(
          track.url.includes(hash),
          `Track "${track.title}" (${track.id}) still uses broken URL hash ${hash}`
        ).toBe(false);
      }
    }
  });

  it("getTrackById should return the correct track", () => {
    const track = getTrackById("calm-piano-1");
    expect(track).toBeDefined();
    expect(track?.title).toBe("Carefree");
  });

  it("getTrackById should return undefined for unknown ID", () => {
    const track = getTrackById("nonexistent-track");
    expect(track).toBeUndefined();
  });

  it("getTracksByMood should return tracks matching the mood", () => {
    const luxuryTracks = getTracksByMood("luxurious");
    expect(luxuryTracks.length).toBeGreaterThan(0);
    for (const t of luxuryTracks) {
      expect(t.mood).toBe("luxurious");
    }
  });

  it("getRecommendedTracks should return tracks for each property type", () => {
    const types = ["luxury", "family", "modern", "commercial", "any"] as const;
    for (const type of types) {
      const tracks = getRecommendedTracks(type);
      expect(tracks.length, `No recommendations for type "${type}"`).toBeGreaterThan(0);
    }
  });
});
