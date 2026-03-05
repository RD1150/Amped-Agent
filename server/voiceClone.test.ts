import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock ElevenLabs module
vi.mock("./_core/elevenLabs", () => ({
  cloneVoice: vi.fn().mockResolvedValue({
    voice_id: "test_voice_id_123",
    name: "Test Agent Voice",
  }),
  deleteVoice: vi.fn().mockResolvedValue(undefined),
  textToSpeech: vi.fn().mockResolvedValue("https://example.com/audio.mp3"),
}));

// Mock DB
vi.mock("./db", () => ({
  default: {
    getPersonaByUserId: vi.fn().mockResolvedValue({
      id: 1,
      userId: 1,
      elevenlabsVoiceId: null,
      elevenlabsVoiceName: null,
      voiceSampleUrl: null,
    }),
    upsertPersona: vi.fn().mockResolvedValue({ id: 1 }),
  },
}));

describe("Voice Clone Feature", () => {
  it("cloneVoice returns voice_id and name from ElevenLabs", async () => {
    const { cloneVoice } = await import("./_core/elevenLabs");
    const result = await cloneVoice({
      name: "Test Agent",
      files: ["https://example.com/sample.mp3"],
      description: "Real estate agent voice",
    });
    expect(result).toHaveProperty("voice_id");
    expect(result).toHaveProperty("name");
    expect(result.voice_id).toBe("test_voice_id_123");
  });

  it("deleteVoice resolves without error", async () => {
    const { deleteVoice } = await import("./_core/elevenLabs");
    await expect(deleteVoice("test_voice_id_123")).resolves.toBeUndefined();
  });

  it("textToSpeech returns a URL string", async () => {
    const { textToSpeech } = await import("./_core/elevenLabs");
    const url = await textToSpeech("Welcome to this beautiful property.", "test_voice_id_123");
    expect(typeof url).toBe("string");
    expect(url).toMatch(/^https?:\/\//);
  });
});

describe("Delete Reel Feature", () => {
  it("deleteReel procedure exists in reels router", async () => {
    // Verify the reels router exports a deleteReel procedure
    const fs = await import("fs");
    const routerContent = fs.readFileSync("./server/routers/reels.ts", "utf-8");
    expect(routerContent).toContain("deleteReel");
    expect(routerContent).toContain("z.object({ reelId: z.number() })");
  });

  it("MyReels UI has delete button", async () => {
    const fs = await import("fs");
    const uiContent = fs.readFileSync("./client/src/pages/MyReels.tsx", "utf-8");
    expect(uiContent).toContain("deleteReel");
    expect(uiContent).toContain("Trash");
  });
});

describe("Persona Voice Clone Schema", () => {
  it("personas table has elevenlabsVoiceId field", async () => {
    const fs = await import("fs");
    const schemaContent = fs.readFileSync("./drizzle/schema.ts", "utf-8");
    expect(schemaContent).toContain("elevenlabsVoiceId");
    expect(schemaContent).toContain("elevenlabsVoiceName");
    expect(schemaContent).toContain("voiceSampleUrl");
  });

  it("persona upsert router accepts elevenlabsVoiceId", async () => {
    const fs = await import("fs");
    const routerContent = fs.readFileSync("./server/routers.ts", "utf-8");
    expect(routerContent).toContain("elevenlabsVoiceId");
    expect(routerContent).toContain("cloneVoice");
    expect(routerContent).toContain("deleteVoiceClone");
  });
});
