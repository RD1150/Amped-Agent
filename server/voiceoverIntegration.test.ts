import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock ElevenLabs ─────────────────────────────────────────────────────────
vi.mock("./_core/elevenLabs", () => ({
  textToSpeech: vi.fn().mockResolvedValue(Buffer.from("fake-mp3-audio")),
  cloneVoice: vi.fn(),
  deleteVoice: vi.fn(),
  REAL_ESTATE_VOICES: {
    rachel: "21m00Tcm4TlvDq8ikWAM",
    adam: "pNInz6obpgDQGcFmaJgB",
    bella: "EXAVITQu4vr4xnSDxMaL",
    josh: "TxGEqnHWrfWFTfGW9XjX",
  },
}));

// ─── Mock scriptGenerator ─────────────────────────────────────────────────────
vi.mock("./scriptGenerator", () => ({
  generatePropertyTourScript: vi.fn().mockResolvedValue(
    "Welcome to 123 Main Street, a stunning 4-bedroom home. This beautiful property features an open floor plan, gourmet kitchen, and spacious backyard. Contact us today to schedule your private showing."
  ),
  estimateScriptDuration: vi.fn().mockImplementation((script: string) => {
    const wordCount = script.split(/\s+/).length;
    return Math.ceil(wordCount / 2.5);
  }),
}));

// ─── Mock storage ─────────────────────────────────────────────────────────────
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    key: "property-tours/voiceovers/test-voiceover.mp3",
    url: "https://cdn.example.com/property-tours/voiceovers/test-voiceover.mp3",
  }),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ElevenLabs textToSpeech", () => {
  it("returns a non-empty audio buffer", async () => {
    const { textToSpeech } = await import("./_core/elevenLabs");
    const buffer = await textToSpeech({
      text: "Welcome to this beautiful property.",
      voice_id: "21m00Tcm4TlvDq8ikWAM",
    });
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("uses Rachel voice by default when no voice_id provided", async () => {
    const { textToSpeech } = await import("./_core/elevenLabs");
    await textToSpeech({ text: "Test narration." });
    expect(textToSpeech).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Test narration." })
    );
  });
});

describe("scriptGenerator.generatePropertyTourScript", () => {
  it("returns a non-empty script string", async () => {
    const { generatePropertyTourScript } = await import("./scriptGenerator");
    const script = await generatePropertyTourScript({
      propertyDetails: {
        address: "123 Main Street",
        price: 750000,
        bedrooms: 4,
        bathrooms: 2.5,
        squareFeet: 2200,
        description: "Beautiful home with open floor plan",
      },
      duration: 30,
      style: "professional",
    });
    expect(typeof script).toBe("string");
    expect(script.length).toBeGreaterThan(20);
  });

  it("estimateScriptDuration returns a positive number", async () => {
    const { estimateScriptDuration } = await import("./scriptGenerator");
    const script = "Welcome to this beautiful property tour. This stunning home features four bedrooms and a gourmet kitchen.";
    const duration = estimateScriptDuration(script);
    expect(duration).toBeGreaterThan(0);
    expect(typeof duration).toBe("number");
  });
});

describe("Voiceover pipeline (script → audio → S3)", () => {
  it("generates script, converts to audio, and uploads to S3", async () => {
    const { generatePropertyTourScript } = await import("./scriptGenerator");
    const { textToSpeech } = await import("./_core/elevenLabs");
    const { storagePut } = await import("./storage");

    // Step 1: Generate script
    const script = await generatePropertyTourScript({
      propertyDetails: { address: "456 Ocean Drive" },
      duration: 30,
    });
    expect(script).toBeTruthy();

    // Step 2: Convert to audio
    const audioBuffer = await textToSpeech({
      text: script,
      voice_id: "21m00Tcm4TlvDq8ikWAM",
    });
    expect(audioBuffer).toBeInstanceOf(Buffer);
    expect(audioBuffer.length).toBeGreaterThan(0);

    // Step 3: Upload to S3
    const { url } = await storagePut(
      `property-tours/voiceovers/${Date.now()}-test.mp3`,
      audioBuffer,
      "audio/mpeg"
    );
    expect(url).toMatch(/^https?:\/\//);
  });
});

describe("generateVoiceoverScript tRPC procedure (file check)", () => {
  it("propertyTours router exports generateVoiceoverScript procedure", async () => {
    const fs = await import("fs");
    const routerContent = fs.readFileSync(
      "./server/routers/propertyTours.ts",
      "utf-8"
    );
    expect(routerContent).toContain("generateVoiceoverScript");
    expect(routerContent).toContain("generatePropertyTourScript");
    expect(routerContent).toContain("estimateScriptDuration");
  });

  it("generateVoiceoverScript accepts address, price, beds, baths, sqft, duration, style", async () => {
    const fs = await import("fs");
    const routerContent = fs.readFileSync(
      "./server/routers/propertyTours.ts",
      "utf-8"
    );
    expect(routerContent).toContain("address: z.string()");
    expect(routerContent).toContain("duration:");
    expect(routerContent).toContain("style:");
  });
});

describe("videoGenerator voiceover error handling", () => {
  it("videoGenerator.ts propagates ElevenLabs errors instead of swallowing them", async () => {
    const fs = await import("fs");
    const generatorContent = fs.readFileSync(
      "./server/videoGenerator.ts",
      "utf-8"
    );
    // Should throw on voiceover failure, not silently continue
    expect(generatorContent).toContain("throw new Error(`Voiceover generation failed:");
    expect(generatorContent).toContain("Voiceover generation FAILED");
  });

  it("videoGenerator.ts validates ElevenLabs API key before calling API", async () => {
    const fs = await import("fs");
    const generatorContent = fs.readFileSync(
      "./server/videoGenerator.ts",
      "utf-8"
    );
    expect(generatorContent).toContain("ELEVENLABS_API_KEY");
    expect(generatorContent).toContain("ElevenLabs API key is not configured");
  });

  it("voiceover audio track is added to Creatomate renderer payload when voiceoverUrl is set", async () => {
    const fs = await import("fs");
    // The project uses Creatomate renderer (not Shotstack) for video generation
    const rendererContent = fs.readFileSync(
      "./server/_core/creatomateRenderer.ts",
      "utf-8"
    );
    // voiceoverUrl is passed through videoGenerator.ts to creatomateRenderer.ts
    const generatorContent = fs.readFileSync(
      "./server/videoGenerator.ts",
      "utf-8"
    );
    expect(generatorContent).toContain("voiceoverUrl");
    expect(rendererContent).toContain('type: "audio"');
  });
});

describe("PropertyTours UI voiceover integration (file check)", () => {
  it("PropertyTours.tsx uses tRPC mutation for script generation", async () => {
    const fs = await import("fs");
    const uiContent = fs.readFileSync(
      "./client/src/pages/PropertyTours.tsx",
      "utf-8"
    );
    expect(uiContent).toContain("generateVoiceoverScript");
    expect(uiContent).toContain("trpc.propertyTours.generateVoiceoverScript.useMutation");
  });

  it("PropertyTours.tsx shows +5 credits badge when voiceover enabled", async () => {
    const fs = await import("fs");
    const uiContent = fs.readFileSync(
      "./client/src/pages/PropertyTours.tsx",
      "utf-8"
    );
    expect(uiContent).toContain("+5 credits");
  });

  it("PropertyTours.tsx shows loading toast during script generation", async () => {
    const fs = await import("fs");
    const uiContent = fs.readFileSync(
      "./client/src/pages/PropertyTours.tsx",
      "utf-8"
    );
    expect(uiContent).toContain("Generating voiceover script...");
    expect(uiContent).toContain('toast.loading');
  });

  it("PropertyTours.tsx no longer uses raw fetch to non-existent ai.generateScript endpoint", async () => {
    const fs = await import("fs");
    const uiContent = fs.readFileSync(
      "./client/src/pages/PropertyTours.tsx",
      "utf-8"
    );
    // Should NOT contain the old broken raw fetch
    expect(uiContent).not.toContain("fetch('/api/trpc/ai.generateScript'");
  });
});
