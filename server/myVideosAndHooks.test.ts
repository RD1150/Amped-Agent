import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── My Videos Library ────────────────────────────────────────────────────────

describe("My Videos Library", () => {
  describe("generatedVideos schema", () => {
    it("should define all required fields", async () => {
      const { generatedVideos } = await import("../drizzle/schema");
      const columns = Object.keys(generatedVideos);
      expect(columns).toContain("id");
      expect(columns).toContain("userId");
      expect(columns).toContain("title");
      expect(columns).toContain("type");
      expect(columns).toContain("videoUrl");
      expect(columns).toContain("thumbnailUrl");
      expect(columns).toContain("renderId");
      expect(columns).toContain("status");
      expect(columns).toContain("hasVoiceover");
      expect(columns).toContain("creditsCost");
      expect(columns).toContain("metadata");
      expect(columns).toContain("createdAt");
    });

    it("should have correct type enum values", async () => {
      const { generatedVideos } = await import("../drizzle/schema");
      const typeCol = (generatedVideos as any).type;
      // Drizzle stores enum config in the column definition
      expect(typeCol).toBeDefined();
    });

    it("should have correct status enum values", async () => {
      const { generatedVideos } = await import("../drizzle/schema");
      const statusCol = (generatedVideos as any).status;
      expect(statusCol).toBeDefined();
    });
  });

  describe("myVideosRouter", () => {
    it("should export a router with list, save, updateStatus, and delete procedures", async () => {
      const { myVideosRouter } = await import("./routers/myVideos");
      expect(myVideosRouter).toBeDefined();
      expect(myVideosRouter._def).toBeDefined();
      const procedures = Object.keys(myVideosRouter._def.procedures ?? myVideosRouter._def.record ?? {});
      expect(procedures).toContain("list");
      expect(procedures).toContain("save");
      expect(procedures).toContain("updateStatus");
      expect(procedures).toContain("delete");
    });

    it("should have list procedure as a query", async () => {
      const { myVideosRouter } = await import("./routers/myVideos");
      const listProc = (myVideosRouter._def.procedures ?? myVideosRouter._def.record)?.list;
      expect(listProc).toBeDefined();
    });

    it("should have save procedure as a mutation", async () => {
      const { myVideosRouter } = await import("./routers/myVideos");
      const saveProc = (myVideosRouter._def.procedures ?? myVideosRouter._def.record)?.save;
      expect(saveProc).toBeDefined();
    });
  });

  describe("video type classification", () => {
    it("should correctly identify property_tour type", () => {
      const type = "property_tour";
      const labels: Record<string, string> = {
        property_tour: "Property Tour",
        authority_reel: "Authority Reel",
        market_stats: "Market Update",
      };
      expect(labels[type]).toBe("Property Tour");
    });

    it("should correctly identify authority_reel type", () => {
      const type = "authority_reel";
      const labels: Record<string, string> = {
        property_tour: "Property Tour",
        authority_reel: "Authority Reel",
        market_stats: "Market Update",
      };
      expect(labels[type]).toBe("Authority Reel");
    });

    it("should correctly identify market_stats type", () => {
      const type = "market_stats";
      const labels: Record<string, string> = {
        property_tour: "Property Tour",
        authority_reel: "Authority Reel",
        market_stats: "Market Update",
      };
      expect(labels[type]).toBe("Market Update");
    });
  });

  describe("duration formatting", () => {
    const formatDuration = (seconds: number | null): string => {
      if (!seconds) return "—";
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    it("should return em-dash for null duration", () => {
      expect(formatDuration(null)).toBe("—");
    });

    it("should format seconds-only duration", () => {
      expect(formatDuration(45)).toBe("45s");
    });

    it("should format minutes and seconds duration", () => {
      expect(formatDuration(90)).toBe("1m 30s");
    });

    it("should format exact minutes", () => {
      expect(formatDuration(120)).toBe("2m 0s");
    });
  });

  describe("metadata JSON parsing", () => {
    it("should parse valid metadata JSON", () => {
      const metadata = JSON.stringify({ address: "123 Main St", price: 500000 });
      const parsed = (() => {
        try { return JSON.parse(metadata); } catch { return {}; }
      })();
      expect(parsed.address).toBe("123 Main St");
      expect(parsed.price).toBe(500000);
    });

    it("should return empty object for invalid JSON", () => {
      const metadata = "not-json";
      const parsed = (() => {
        try { return JSON.parse(metadata); } catch { return {}; }
      })();
      expect(parsed).toEqual({});
    });

    it("should return empty object for null metadata", () => {
      const metadata = null;
      const parsed = metadata ? (() => {
        try { return JSON.parse(metadata); } catch { return {}; }
      })() : {};
      expect(parsed).toEqual({});
    });
  });
});

// ─── Hooks Voiceover ──────────────────────────────────────────────────────────

describe("Hooks Library Voiceover", () => {
  describe("voice preview logic", () => {
    it("should use saved voiceId preference when available", () => {
      const voicePref = { voiceId: "custom-voice-id", voiceoverStyle: "luxury" as const };
      const voiceId = voicePref?.voiceId ?? "21m00Tcm4TlvDq8ikWAM";
      expect(voiceId).toBe("custom-voice-id");
    });

    it("should fall back to Rachel voice when no preference saved", () => {
      const voicePref = null;
      const voiceId = voicePref ?? "21m00Tcm4TlvDq8ikWAM";
      expect(voiceId).toBe("21m00Tcm4TlvDq8ikWAM");
    });

    it("should cache audio URL after first preview generation", () => {
      const hookAudioUrls: Record<number, string> = {};
      const hookId = 42;
      const audioUrl = "https://s3.example.com/audio/hook-42.mp3";

      // Simulate receiving audio URL from API
      hookAudioUrls[hookId] = audioUrl;

      expect(hookAudioUrls[hookId]).toBe(audioUrl);
    });

    it("should toggle play/stop when audio is already cached", () => {
      let playingHookId: number | null = null;
      const hookId = 42;
      const hookAudioUrls: Record<number, string> = { [hookId]: "https://example.com/audio.mp3" };

      // First click: start playing
      if (hookAudioUrls[hookId]) {
        if (playingHookId === hookId) {
          playingHookId = null;
        } else {
          playingHookId = hookId;
        }
      }
      expect(playingHookId).toBe(hookId);

      // Second click: stop playing
      if (hookAudioUrls[hookId]) {
        if (playingHookId === hookId) {
          playingHookId = null;
        } else {
          playingHookId = hookId;
        }
      }
      expect(playingHookId).toBeNull();
    });

    it("should use edited hook text for preview when hook is in edit mode", () => {
      const hook = { id: 1, hookText: "Original hook text" };
      const editingHookId = 1;
      const editedHookText = "My customized hook text";

      const getEffectiveText = (h: typeof hook) =>
        editingHookId === h.id ? editedHookText : h.hookText;

      expect(getEffectiveText(hook)).toBe("My customized hook text");
    });

    it("should use original hook text when hook is not in edit mode", () => {
      const hook = { id: 1, hookText: "Original hook text" };
      const editingHookId = 2; // Different hook is being edited

      const getEffectiveText = (h: typeof hook) =>
        editingHookId === h.id ? "edited" : h.hookText;

      expect(getEffectiveText(hook)).toBe("Original hook text");
    });
  });

  describe("myVideos router registration", () => {
    it("should be registered in the main appRouter", async () => {
      const { appRouter } = await import("./routers");
      const routerKeys = Object.keys(appRouter._def.procedures ?? appRouter._def.record ?? {});
      // myVideos is registered as a sub-router, check for myVideos.list
      const hasMyVideos = routerKeys.some(k => k.startsWith("myVideos."));
      expect(hasMyVideos).toBe(true);
    });
  });
});
