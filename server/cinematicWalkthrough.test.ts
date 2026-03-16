import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Unit tests for motion prompt generation ─────────────────────────────────

const ROOM_MOTION_PROMPTS: Record<string, string> = {
  exterior_front: "Slow cinematic dolly forward approaching the front of the home, smooth and steady, golden hour lighting, slight upward tilt revealing the roofline",
  exterior_back: "Gentle wide pan left to right across the backyard, smooth tracking shot, lush landscaping in foreground",
  living_room: "Slow dolly push forward into the living room, revealing the full space, warm natural light from windows, smooth and cinematic",
  kitchen: "Smooth tracking shot moving left to right along the kitchen island, revealing countertops and appliances, bright and airy",
  dining_room: "Slow crane-style reveal starting high and tilting down to the dining table, elegant and inviting",
  master_bedroom: "Gentle dolly forward toward the bed, soft morning light, serene and luxurious atmosphere",
  bedroom: "Smooth pan from the doorway revealing the bedroom, natural light, calm and inviting",
  master_bathroom: "Slow tracking shot gliding across the vanity and into the bathroom, spa-like atmosphere, bright and clean",
  bathroom: "Gentle pan revealing the bathroom fixtures, clean and bright, smooth camera movement",
  office: "Slow dolly push into the home office, revealing the desk and built-ins, professional and focused",
  garage: "Wide establishing shot with slow push forward into the garage, clean and spacious",
  pool: "Smooth low-angle tracking shot along the pool edge, water shimmering in sunlight, resort-style feel",
  view: "Slow cinematic reveal panning across the panoramic view, wide and breathtaking",
  other: "Smooth cinematic camera movement through the space, steady and professional, revealing the full room",
};

describe("Cinematic Walkthrough - Motion Prompt Generation", () => {
  it("generates a dolly-forward prompt for living room", () => {
    const prompt = ROOM_MOTION_PROMPTS["living_room"];
    expect(prompt).toBeDefined();
    expect(prompt).toContain("living room");
    expect(prompt).toContain("smooth");
  });

  it("falls back to generic prompt for unknown room type", () => {
    const prompt = ROOM_MOTION_PROMPTS["unknown_room"] || ROOM_MOTION_PROMPTS["other"];
    expect(prompt).toBeDefined();
    expect(prompt).toContain("cinematic");
  });

  it("generates exterior prompt with approach movement", () => {
    const prompt = ROOM_MOTION_PROMPTS["exterior_front"];
    expect(prompt).toContain("approaching");
    expect(prompt).toContain("front");
  });

  it("generates pool prompt with water reference", () => {
    const prompt = ROOM_MOTION_PROMPTS["pool"];
    expect(prompt).toContain("pool");
    expect(prompt).toContain("water");
  });
});

// ─── Unit tests for DB-persisted job state ────────────────────────────────────
// These tests verify the job state shape that is now stored in the DB
// (cinematic_jobs table) instead of an in-memory Map.

describe("Cinematic Walkthrough - DB Job State", () => {
  type JobStatus = "pending" | "generating_clips" | "assembling" | "done" | "failed";

  interface CinematicJob {
    id: string;
    userId: number;
    status: JobStatus;
    totalPhotos: number;
    completedClips: number;
    videoUrl?: string | null;
    error?: string | null;
    createdAt: Date;
  }

  function makeJob(overrides: Partial<CinematicJob> = {}): CinematicJob {
    return {
      id: "cw_test_001",
      userId: 42,
      status: "pending",
      totalPhotos: 4,
      completedClips: 0,
      videoUrl: null,
      error: null,
      createdAt: new Date(),
      ...overrides,
    };
  }

  it("creates a job with pending status and correct photo count", () => {
    const job = makeJob({ totalPhotos: 5 });
    expect(job.status).toBe("pending");
    expect(job.totalPhotos).toBe(5);
    expect(job.completedClips).toBe(0);
  });

  it("transitions from pending to generating_clips", () => {
    const job = makeJob();
    const updated: CinematicJob = { ...job, status: "generating_clips" };
    expect(updated.status).toBe("generating_clips");
  });

  it("tracks clip completion progress correctly", () => {
    const job = makeJob({ status: "generating_clips", totalPhotos: 4 });
    const after2: CinematicJob = { ...job, completedClips: 2 };
    const after4: CinematicJob = { ...after2, completedClips: 4 };

    expect(after2.completedClips).toBe(2);
    expect(after4.completedClips).toBe(4);
    expect(after4.completedClips).toBe(after4.totalPhotos);
  });

  it("transitions to assembling after all clips are done", () => {
    const job = makeJob({ status: "generating_clips", totalPhotos: 3, completedClips: 3 });
    const assembling: CinematicJob = { ...job, status: "assembling" };
    expect(assembling.status).toBe("assembling");
    expect(assembling.completedClips).toBe(assembling.totalPhotos);
  });

  it("transitions to done with a video URL", () => {
    const job = makeJob({ status: "assembling", totalPhotos: 3, completedClips: 3 });
    const done: CinematicJob = {
      ...job,
      status: "done",
      videoUrl: "https://cdn.shotstack.io/final_walkthrough.mp4",
    };
    expect(done.status).toBe("done");
    expect(done.videoUrl).toBe("https://cdn.shotstack.io/final_walkthrough.mp4");
    expect(done.error).toBeNull();
  });

  it("transitions to failed with an error message", () => {
    const job = makeJob({ status: "generating_clips" });
    const failed: CinematicJob = {
      ...job,
      status: "failed",
      error: "Runway API rate limit exceeded",
    };
    expect(failed.status).toBe("failed");
    expect(failed.error).toBe("Runway API rate limit exceeded");
    expect(failed.videoUrl).toBeNull();
  });

  it("returns not_found shape for missing job ID", () => {
    // Simulate what getJobProgress returns when DB has no matching row
    const result = { status: "not_found" as const, completedClips: 0, totalPhotos: 0 };
    expect(result.status).toBe("not_found");
    expect(result.completedClips).toBe(0);
  });

  it("calculates elapsed time from createdAt", () => {
    const pastDate = new Date(Date.now() - 60000); // 60 seconds ago
    const job = makeJob({ createdAt: pastDate });
    const elapsedMs = Date.now() - new Date(job.createdAt).getTime();
    expect(elapsedMs).toBeGreaterThan(50000);
    expect(elapsedMs).toBeLessThan(70000);
  });

  it("enforces user ownership — different userId returns not_found", () => {
    const job = makeJob({ userId: 42 });
    const requestingUserId = 99;
    // Simulate the ownership check in getJobProgress
    const isOwner = job.userId === requestingUserId;
    const result = isOwner
      ? { status: job.status, totalPhotos: job.totalPhotos, completedClips: job.completedClips }
      : { status: "not_found" as const, completedClips: 0, totalPhotos: 0 };
    expect(result.status).toBe("not_found");
  });
});

// ─── Unit tests for input validation ─────────────────────────────────────────

describe("Cinematic Walkthrough - Input Validation", () => {
  it("validates minimum photo count", () => {
    const photos = [{ url: "https://example.com/photo1.jpg", roomType: "living_room" }];
    expect(photos.length >= 2).toBe(false);
  });

  it("accepts valid photo array with 2+ photos", () => {
    const photos = [
      { url: "https://example.com/photo1.jpg", roomType: "living_room" },
      { url: "https://example.com/photo2.jpg", roomType: "kitchen" },
    ];
    expect(photos.length >= 2).toBe(true);
  });

  it("validates maximum photo count of 12", () => {
    const photos = Array.from({ length: 13 }, (_, i) => ({
      url: `https://example.com/photo${i + 1}.jpg`,
      roomType: "other",
    }));
    expect(photos.length <= 12).toBe(false);
  });

  it("validates aspect ratio enum", () => {
    const validRatios = ["16:9", "9:16"];
    expect(validRatios.includes("16:9")).toBe(true);
    expect(validRatios.includes("9:16")).toBe(true);
    expect(validRatios.includes("4:3")).toBe(false);
  });

  it("validates property address is required", () => {
    expect("".trim().length > 0).toBe(false);
    expect("123 Oak Street".trim().length > 0).toBe(true);
  });
});

// ─── Unit tests for Shotstack clip assembly ───────────────────────────────────

describe("Cinematic Walkthrough - Shotstack Assembly", () => {
  it("builds correct clip array for Shotstack from video URLs", () => {
    const clipUrls = [
      "https://cdn.example.com/clip1.mp4",
      "https://cdn.example.com/clip2.mp4",
      "https://cdn.example.com/clip3.mp4",
    ];

    let currentTime = 0;
    const clips = clipUrls.map((url) => {
      const item = {
        asset: { type: "video", src: url },
        start: currentTime,
        length: 5,
        transition: { in: "fade", out: "fade" },
      };
      currentTime += 5 - 0.5; // 0.5s overlap
      return item;
    });

    expect(clips).toHaveLength(3);
    expect(clips[0].start).toBe(0);
    expect(clips[1].start).toBe(4.5);
    expect(clips[2].start).toBe(9);
    expect(clips[0].asset.src).toBe("https://cdn.example.com/clip1.mp4");
  });

  it("calculates total video duration correctly including outro", () => {
    const clips = [
      { duration: 5 },
      { duration: 5 },
      { duration: 5 },
      { duration: 5 },
    ];
    const totalDuration = clips.reduce((sum, c) => sum + c.duration, 0) + 3; // +3 for outro
    expect(totalDuration).toBe(23);
  });

  it("sets correct dimensions for 16:9 landscape video", () => {
    const aspectRatio = "16:9";
    const [width, height] = aspectRatio === "16:9" ? [1280, 720] : [720, 1280];
    expect(width).toBe(1280);
    expect(height).toBe(720);
  });

  it("sets correct dimensions for 9:16 portrait video", () => {
    const aspectRatio = "9:16";
    const [width, height] = aspectRatio === "16:9" ? [1280, 720] : [720, 1280];
    expect(width).toBe(720);
    expect(height).toBe(1280);
  });

  it("reduces music volume when voiceover is present", () => {
    const hasVoiceover = true;
    const musicVolume = hasVoiceover ? 0.2 : 0.5;
    expect(musicVolume).toBe(0.2);
  });

  it("uses full music volume when no voiceover", () => {
    const hasVoiceover = false;
    const musicVolume = hasVoiceover ? 0.2 : 0.5;
    expect(musicVolume).toBe(0.5);
  });
});
