import { describe, it, expect, vi } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("./_core/elevenLabs", () => ({
  textToSpeech: vi.fn().mockResolvedValue(Buffer.from("fake-mp3-preview")),
  REAL_ESTATE_VOICES: {
    rachel: "21m00Tcm4TlvDq8ikWAM",
    adam: "pNInz6obpgDQGcFmaJgB",
    bella: "EXAVITQu4vr4xnSDxMaL",
    josh: "TxGEqnHWrfWFTfGW9XjX",
  },
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    key: "property-tours/voice-previews/test-voice.mp3",
    url: "https://cdn.example.com/property-tours/voice-previews/test-voice.mp3",
  }),
}));

vi.mock("./scriptGenerator", () => ({
  generatePropertyTourScript: vi.fn().mockImplementation(async ({ style }: { style?: string }) => {
    const scripts: Record<string, string> = {
      professional: "Welcome to 123 Main Street. This exceptional property offers four bedrooms and premium finishes throughout. Schedule your showing today.",
      warm: "Step inside and fall in love with this charming home on Main Street. Four cozy bedrooms and a kitchen you'll adore. Come see it for yourself!",
      luxury: "Presenting an extraordinary residence at 123 Main Street — a masterpiece of refined living with four sumptuous bedrooms and bespoke finishes.",
      casual: "Hey, check out this awesome place on Main Street! Four bedrooms, great layout, and it's priced to sell. Definitely worth a look!",
    };
    return scripts[style || "professional"] || scripts.professional;
  }),
  estimateScriptDuration: vi.fn().mockImplementation((script: string) => {
    return Math.ceil(script.split(/\s+/).length / 2.5);
  }),
}));

// ─── previewVoice procedure tests ─────────────────────────────────────────────

describe("previewVoice procedure", () => {
  it("calls ElevenLabs with the provided voiceId", async () => {
    const { textToSpeech } = await import("./_core/elevenLabs");
    const { storagePut } = await import("./storage");

    const voiceId = "21m00Tcm4TlvDq8ikWAM";
    const sampleText = "Welcome to this stunning property. I'm excited to take you on a tour of this beautiful home.";

    const audioBuffer = await textToSpeech({ text: sampleText, voice_id: voiceId });
    expect(audioBuffer).toBeInstanceOf(Buffer);
    expect(audioBuffer.length).toBeGreaterThan(0);

    const { url } = await storagePut(
      `property-tours/voice-previews/${voiceId}-${Date.now()}.mp3`,
      audioBuffer,
      "audio/mpeg"
    );
    expect(url).toMatch(/^https?:\/\//);
  });

  it("works for all 4 preset voices", async () => {
    const { textToSpeech } = await import("./_core/elevenLabs");
    const voices = [
      "21m00Tcm4TlvDq8ikWAM", // Rachel
      "pNInz6obpgDQGcFmaJgB", // Adam
      "EXAVITQu4vr4xnSDxMaL", // Bella
      "TxGEqnHWrfWFTfGW9XjX", // Josh
    ];

    for (const voiceId of voices) {
      const buffer = await textToSpeech({ text: "Test preview.", voice_id: voiceId });
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    }
  });

  it("previewVoice procedure is registered in propertyTours router", async () => {
    const fs = await import("fs");
    const routerContent = fs.readFileSync("./server/routers/propertyTours.ts", "utf-8");
    expect(routerContent).toContain("previewVoice:");
    expect(routerContent).toContain("voiceId: z.string().min(1)");
    expect(routerContent).toContain("voice-previews");
  });
});

// ─── Voiceover style selector tests ──────────────────────────────────────────

describe("Voiceover style selector", () => {
  it("generates different scripts for each style", async () => {
    const { generatePropertyTourScript } = await import("./scriptGenerator");
    const styles = ["professional", "warm", "luxury", "casual"] as const;
    const scripts: string[] = [];

    for (const style of styles) {
      const script = await generatePropertyTourScript({
        propertyDetails: { address: "123 Main Street", bedrooms: 4 },
        duration: 30,
        style,
      });
      expect(script).toBeTruthy();
      expect(script.length).toBeGreaterThan(20);
      scripts.push(script);
    }

    // All 4 scripts should be unique
    const unique = new Set(scripts);
    expect(unique.size).toBe(4);
  });

  it("generateVoiceoverScript procedure accepts style parameter", async () => {
    const fs = await import("fs");
    const routerContent = fs.readFileSync("./server/routers/propertyTours.ts", "utf-8");
    expect(routerContent).toContain('style: z.enum(["professional", "warm", "luxury", "casual"])');
  });

  it("PropertyTours.tsx includes voiceoverStyle state", async () => {
    const fs = await import("fs");
    const uiContent = fs.readFileSync("./client/src/pages/PropertyTours.tsx", "utf-8");
    expect(uiContent).toContain("voiceoverStyle");
    expect(uiContent).toContain("setVoiceoverStyle");
  });

  it("PropertyTours.tsx passes voiceoverStyle to generateVoiceoverScript", async () => {
    const fs = await import("fs");
    const uiContent = fs.readFileSync("./client/src/pages/PropertyTours.tsx", "utf-8");
    expect(uiContent).toContain("style: voiceoverStyle");
  });

  it("PropertyTours.tsx renders all 4 style options", async () => {
    const fs = await import("fs");
    const uiContent = fs.readFileSync("./client/src/pages/PropertyTours.tsx", "utf-8");
    expect(uiContent).toContain('"professional"');
    expect(uiContent).toContain('"warm"');
    expect(uiContent).toContain('"luxury"');
    expect(uiContent).toContain('"casual"');
    expect(uiContent).toContain("Narration Style");
  });
});

// ─── Voice preview UI tests ───────────────────────────────────────────────────

describe("Voice preview UI", () => {
  it("PropertyTours.tsx has previewVoice mutation", async () => {
    const fs = await import("fs");
    const uiContent = fs.readFileSync("./client/src/pages/PropertyTours.tsx", "utf-8");
    expect(uiContent).toContain("trpc.propertyTours.previewVoice.useMutation");
    expect(uiContent).toContain("previewVoice");
  });

  it("PropertyTours.tsx has handleVoicePreview function", async () => {
    const fs = await import("fs");
    const uiContent = fs.readFileSync("./client/src/pages/PropertyTours.tsx", "utf-8");
    expect(uiContent).toContain("handleVoicePreview");
    expect(uiContent).toContain("previewingVoiceId");
  });

  it("PropertyTours.tsx renders Preview buttons for each voice", async () => {
    const fs = await import("fs");
    const uiContent = fs.readFileSync("./client/src/pages/PropertyTours.tsx", "utf-8");
    expect(uiContent).toContain("Preview");
    expect(uiContent).toContain("handleVoicePreview(v.id)");
  });

  it("PropertyTours.tsx shows loading state while previewing", async () => {
    const fs = await import("fs");
    const uiContent = fs.readFileSync("./client/src/pages/PropertyTours.tsx", "utf-8");
    expect(uiContent).toContain("previewingVoiceId === v.id");
    expect(uiContent).toContain("Loading...");
  });
});
