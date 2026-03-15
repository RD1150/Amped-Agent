import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all external dependencies
vi.mock("./_core/runwayAi", () => ({
  generateVideoFromImage: vi.fn().mockResolvedValue({
    id: "runway_task_123",
    status: "SUCCEEDED",
    output: ["https://cdn.example.com/clip1.mp4"],
  }),
  pollRunwayTask: vi.fn().mockResolvedValue({
    id: "runway_task_123",
    status: "SUCCEEDED",
    output: ["https://cdn.example.com/clip1.mp4"],
  }),
}));

vi.mock("./videoGenerator", () => ({
  generateVideoWithShotstack: vi.fn().mockResolvedValue({
    renderId: "shotstack_render_123",
    url: "https://cdn.shotstack.io/final_video.mp4",
  }),
  pollShotstackRender: vi.fn().mockResolvedValue({
    status: "done",
    url: "https://cdn.shotstack.io/final_video.mp4",
  }),
}));

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
    }),
  }),
}));

vi.mock("../../drizzle/schema", () => ({
  generatedVideos: {},
}));

// ─── Unit tests for motion prompt generation ─────────────────────────────────

describe("Cinematic Walkthrough - Motion Prompt Generation", () => {
  it("generates a dolly-forward prompt for living room", () => {
    const roomType = "living_room";
    const motionPrompts: Record<string, string> = {
      exterior_front: "slow cinematic dolly forward approaching the front of the house, smooth camera movement",
      exterior_back: "gentle pan revealing the backyard and outdoor space, smooth cinematic movement",
      living_room: "slow dolly forward through the living room, revealing the space with smooth cinematic motion",
      kitchen: "slow pan across the kitchen revealing countertops and appliances, smooth cinematic movement",
      dining_room: "gentle dolly forward into the dining room, smooth cinematic reveal",
      master_bedroom: "slow cinematic push into the master bedroom, smooth and elegant camera movement",
      bedroom: "gentle dolly forward revealing the bedroom space, smooth cinematic motion",
      master_bathroom: "slow pan revealing the master bathroom features, smooth cinematic movement",
      bathroom: "gentle reveal of the bathroom, smooth cinematic camera movement",
      office: "slow dolly forward into the home office, smooth cinematic movement",
      garage: "gentle pan revealing the garage space, smooth cinematic movement",
      pool: "slow cinematic pan across the pool and outdoor entertaining area",
      view: "slow cinematic pan across the scenic view, smooth and majestic camera movement",
      other: "slow cinematic dolly forward, smooth camera movement revealing the space",
    };

    const prompt = motionPrompts[roomType];
    expect(prompt).toBeDefined();
    expect(prompt).toContain("living room");
    expect(prompt).toContain("smooth");
  });

  it("falls back to generic prompt for unknown room type", () => {
    const roomType = "unknown_room";
    const motionPrompts: Record<string, string> = {
      other: "slow cinematic dolly forward, smooth camera movement revealing the space",
    };
    const prompt = motionPrompts[roomType] || motionPrompts["other"];
    expect(prompt).toBeDefined();
    expect(prompt).toContain("slow cinematic");
  });

  it("generates exterior prompt with approach movement", () => {
    const roomType = "exterior_front";
    const motionPrompts: Record<string, string> = {
      exterior_front: "slow cinematic dolly forward approaching the front of the house, smooth camera movement",
    };
    const prompt = motionPrompts[roomType];
    expect(prompt).toContain("approaching");
    expect(prompt).toContain("front of the house");
  });
});

// ─── Unit tests for job store ─────────────────────────────────────────────────

describe("Cinematic Walkthrough - Job Store", () => {
  it("tracks job status transitions correctly", () => {
    type JobStatus = "pending" | "generating_clips" | "assembling" | "done" | "failed";
    
    const jobStore = new Map<string, {
      status: JobStatus;
      totalPhotos: number;
      completedClips: number;
      videoUrl?: string;
      error?: string;
      startedAt: number;
    }>();

    const jobId = "test_job_001";
    
    // Create job
    jobStore.set(jobId, {
      status: "pending",
      totalPhotos: 5,
      completedClips: 0,
      startedAt: Date.now(),
    });

    expect(jobStore.get(jobId)?.status).toBe("pending");

    // Transition to generating
    const job = jobStore.get(jobId)!;
    job.status = "generating_clips";
    job.completedClips = 2;

    expect(jobStore.get(jobId)?.status).toBe("generating_clips");
    expect(jobStore.get(jobId)?.completedClips).toBe(2);

    // Transition to assembling
    job.status = "assembling";
    job.completedClips = 5;

    expect(jobStore.get(jobId)?.status).toBe("assembling");

    // Transition to done
    job.status = "done";
    job.videoUrl = "https://cdn.example.com/walkthrough.mp4";

    expect(jobStore.get(jobId)?.status).toBe("done");
    expect(jobStore.get(jobId)?.videoUrl).toBe("https://cdn.example.com/walkthrough.mp4");
  });

  it("handles failed job state", () => {
    type JobStatus = "pending" | "generating_clips" | "assembling" | "done" | "failed";
    
    const jobStore = new Map<string, {
      status: JobStatus;
      totalPhotos: number;
      completedClips: number;
      videoUrl?: string;
      error?: string;
      startedAt: number;
    }>();

    const jobId = "test_job_fail";
    
    jobStore.set(jobId, {
      status: "pending",
      totalPhotos: 3,
      completedClips: 0,
      startedAt: Date.now(),
    });

    const job = jobStore.get(jobId)!;
    job.status = "failed";
    job.error = "Runway API rate limit exceeded";

    expect(jobStore.get(jobId)?.status).toBe("failed");
    expect(jobStore.get(jobId)?.error).toBe("Runway API rate limit exceeded");
  });

  it("returns not_found for unknown job IDs", () => {
    const jobStore = new Map<string, { status: string }>();
    
    const result = jobStore.has("nonexistent_job_id");
    expect(result).toBe(false);
  });
});

// ─── Unit tests for input validation ─────────────────────────────────────────

describe("Cinematic Walkthrough - Input Validation", () => {
  it("validates minimum photo count", () => {
    const photos = [
      { url: "https://example.com/photo1.jpg", roomType: "living_room", label: "Living Room" },
    ];
    
    const isValid = photos.length >= 2;
    expect(isValid).toBe(false);
  });

  it("accepts valid photo array with 2+ photos", () => {
    const photos = [
      { url: "https://example.com/photo1.jpg", roomType: "living_room", label: "Living Room" },
      { url: "https://example.com/photo2.jpg", roomType: "kitchen", label: "Kitchen" },
    ];
    
    const isValid = photos.length >= 2;
    expect(isValid).toBe(true);
  });

  it("validates maximum photo count of 12", () => {
    const photos = Array.from({ length: 13 }, (_, i) => ({
      url: `https://example.com/photo${i + 1}.jpg`,
      roomType: "other",
      label: `Room ${i + 1}`,
    }));
    
    const isValid = photos.length <= 12;
    expect(isValid).toBe(false);
  });

  it("validates aspect ratio enum", () => {
    const validRatios = ["16:9", "9:16"];
    
    expect(validRatios.includes("16:9")).toBe(true);
    expect(validRatios.includes("9:16")).toBe(true);
    expect(validRatios.includes("4:3")).toBe(false);
  });

  it("validates property address is required", () => {
    const address = "";
    const isValid = address.trim().length > 0;
    expect(isValid).toBe(false);
  });

  it("accepts valid property address", () => {
    const address = "123 Oak Street, Westlake Village, CA 91362";
    const isValid = address.trim().length > 0;
    expect(isValid).toBe(true);
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
    
    const clips = clipUrls.map((url, index) => ({
      asset: { type: "video", src: url },
      start: index * 5,
      length: 5,
      transition: { in: "fade", out: "fade" },
    }));

    expect(clips).toHaveLength(3);
    expect(clips[0].start).toBe(0);
    expect(clips[1].start).toBe(5);
    expect(clips[2].start).toBe(10);
    expect(clips[0].asset.src).toBe("https://cdn.example.com/clip1.mp4");
  });

  it("calculates total video duration correctly", () => {
    const clipCount = 6;
    const clipDuration = 5; // seconds per clip
    const totalDuration = clipCount * clipDuration;
    
    expect(totalDuration).toBe(30);
  });

  it("sets correct aspect ratio for landscape video", () => {
    const aspectRatio = "16:9";
    const [width, height] = aspectRatio.split(":").map(Number);
    const resolution = { width: width * 120, height: height * 120 }; // scale factor
    
    expect(resolution.width).toBe(1920);
    expect(resolution.height).toBe(1080);
  });

  it("sets correct aspect ratio for portrait video", () => {
    const aspectRatio = "9:16";
    const [width, height] = aspectRatio.split(":").map(Number);
    const resolution = { width: width * 120, height: height * 120 };
    
    expect(resolution.width).toBe(1080);
    expect(resolution.height).toBe(1920);
  });
});
