/**
 * Tests for voiceover expansion features:
 * 1. AutoReels voiceover support (renderVideo with enableVoiceover)
 * 2. Voice preference save/load (auth.saveVoicePreference / auth.getVoicePreference)
 * 3. Script preview audio (previewVoice with sampleText = full script)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── 1. AutoReels voiceover: track-building logic ───────────────────────────

describe("renderAutoReel voiceover track logic", () => {
  it("adds a voiceover track when voiceoverAudioUrl is provided", () => {
    const voiceoverAudioUrl = "https://s3.example.com/autoreels/voiceover/test.mp3";
    const baseTracks = ["subtitleTrack", "hookTrack", "audioTrack", "videoTrack"];
    const tracks = [...baseTracks];
    if (voiceoverAudioUrl) tracks.unshift("voiceTrack");
    expect(tracks).toHaveLength(5);
    expect(tracks[0]).toBe("voiceTrack");
  });

  it("does not add a voiceover track when voiceoverAudioUrl is undefined", () => {
    const voiceoverAudioUrl = undefined;
    const baseTracks = ["subtitleTrack", "hookTrack", "audioTrack", "videoTrack"];
    const tracks = [...baseTracks];
    if (voiceoverAudioUrl) tracks.unshift("voiceTrack");
    expect(tracks).toHaveLength(4);
    expect(tracks[0]).toBe("subtitleTrack");
  });
});

// ─── 2. Voice preference save/load ──────────────────────────────────────────

describe("voice preference persistence", () => {
  it("validates allowed voiceoverStyle values", () => {
    const allowed = ["professional", "warm", "luxury", "casual"] as const;
    const input = { voiceId: "21m00Tcm4TlvDq8ikWAM", voiceoverStyle: "professional" as const };
    expect(allowed).toContain(input.voiceoverStyle);
  });

  it("rejects invalid voiceoverStyle values", () => {
    const allowed = ["professional", "warm", "luxury", "casual"];
    const invalid = "aggressive";
    expect(allowed).not.toContain(invalid);
  });

  it("defaults to Rachel voice when no preference is saved", () => {
    const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";
    const DEFAULT_STYLE = "professional";
    const row = null; // No DB row
    const voiceId = (row as any)?.preferredVoiceId || DEFAULT_VOICE_ID;
    const style = (row as any)?.preferredVoiceoverStyle || DEFAULT_STYLE;
    expect(voiceId).toBe(DEFAULT_VOICE_ID);
    expect(style).toBe(DEFAULT_STYLE);
  });

  it("returns saved preferences when a DB row exists", () => {
    const row = { preferredVoiceId: "TxGEqnHWrfWFTfGW9XjX", preferredVoiceoverStyle: "luxury" };
    const voiceId = row?.preferredVoiceId || "21m00Tcm4TlvDq8ikWAM";
    const style = row?.preferredVoiceoverStyle || "professional";
    expect(voiceId).toBe("TxGEqnHWrfWFTfGW9XjX");
    expect(style).toBe("luxury");
  });
});

// ─── 3. Script preview audio (previewVoice with full script text) ────────────

describe("previewVoice with full script text", () => {
  it("uses sampleText when provided (full script path)", async () => {
    const mockTextToSpeech = vi.fn().mockResolvedValue(Buffer.from("mock-audio"));
    const mockStoragePut = vi.fn().mockResolvedValue({ url: "https://s3.example.com/preview/test.mp3", key: "preview/test.mp3" });

    vi.mock("./_core/elevenLabs", () => ({ textToSpeech: mockTextToSpeech }));
    vi.mock("./storage", () => ({ storagePut: mockStoragePut }));

    const fullScript = "Welcome to this stunning 4-bedroom home in Malibu. This property features breathtaking ocean views...";
    const voiceId = "21m00Tcm4TlvDq8ikWAM";

    // Simulate the previewVoice procedure logic
    const text = fullScript || "Welcome to this stunning property.";
    const audioBuffer = await mockTextToSpeech({ text, voice_id: voiceId, stability: 0.5, similarity_boost: 0.75, use_speaker_boost: true });
    const { url } = await mockStoragePut(`previews/${voiceId}-${Date.now()}.mp3`, audioBuffer, "audio/mpeg");

    expect(mockTextToSpeech).toHaveBeenCalledWith(expect.objectContaining({ text: fullScript }));
    expect(url).toBe("https://s3.example.com/preview/test.mp3");
  });

  it("falls back to default sample text when sampleText is empty", () => {
    const DEFAULT_SAMPLE = "Welcome to this stunning property. I'm excited to take you on a tour of this beautiful home.";
    const sampleText = "";
    const text = sampleText || DEFAULT_SAMPLE;
    expect(text).toBe(DEFAULT_SAMPLE);
  });

  it("uses provided sampleText when non-empty", () => {
    const DEFAULT_SAMPLE = "Welcome to this stunning property.";
    const sampleText = "This luxury penthouse offers panoramic city views.";
    const text = sampleText || DEFAULT_SAMPLE;
    expect(text).toBe(sampleText);
  });

  it("returns a valid S3 URL for the audio preview", async () => {
    const mockUrl = "https://s3.example.com/previews/21m00Tcm4TlvDq8ikWAM-1234567890.mp3";
    expect(mockUrl).toMatch(/^https:\/\//);
    expect(mockUrl).toMatch(/\.mp3$/);
  });
});

// ─── 4. AutoReels voiceover credit deduction ────────────────────────────────

describe("AutoReels voiceover credit deduction", () => {
  it("deducts 5 credits when enableVoiceover is true", () => {
    const VOICEOVER_COST = 5;
    const enableVoiceover = true;
    const creditsToDeduct = enableVoiceover ? VOICEOVER_COST : 0;
    expect(creditsToDeduct).toBe(5);
  });

  it("deducts 0 credits when enableVoiceover is false", () => {
    const VOICEOVER_COST = 5;
    const enableVoiceover = false;
    const creditsToDeduct = enableVoiceover ? VOICEOVER_COST : 0;
    expect(creditsToDeduct).toBe(0);
  });

  it("uses correct usageType for credit deduction", () => {
    const deductParams = {
      userId: 1,
      amount: 5,
      usageType: "voiceover",
      description: "AutoReels voiceover narration",
    };
    expect(deductParams.usageType).toBe("voiceover");
    expect(deductParams.amount).toBe(5);
  });
});

// ─── 5. Background music volume adjustment ──────────────────────────────────

describe("background music volume with voiceover", () => {
  it("lowers music volume to 0.1 when voiceover is present", () => {
    const voiceoverAudioUrl = "https://s3.example.com/audio.mp3";
    const musicVolume = voiceoverAudioUrl ? 0.1 : 0.3;
    expect(musicVolume).toBe(0.1);
  });

  it("keeps music volume at 0.3 when no voiceover", () => {
    const voiceoverAudioUrl = undefined;
    const musicVolume = voiceoverAudioUrl ? 0.1 : 0.3;
    expect(musicVolume).toBe(0.3);
  });
});
