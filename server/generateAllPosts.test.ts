import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock DB helpers used by generateAllPosts
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getPendingContentTemplates: vi.fn(),
    getContentTemplatesByBatchId: vi.fn(),
    getPersonaByUserId: vi.fn().mockResolvedValue(null),
    createContentPost: vi.fn().mockResolvedValue({ insertId: 42 }),
    updateContentTemplate: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock LLM so tests don't make real API calls
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Slide 1: Hook\n---SLIDE---\nSlide 2: Body" } }],
  }),
}));

import * as db from "./db";

function makeCtx(userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: "test-open-id",
      email: "agent@test.com",
      name: "Test Agent",
      loginMethod: "manus",
      role: "user",
        subscriptionStatus: "active" as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("contentTemplates.generateAllPosts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when no pending templates exist", async () => {
    (db.getPendingContentTemplates as any).mockResolvedValue([]);
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.contentTemplates.generateAllPosts({})).rejects.toThrow(
      "No pending templates found"
    );
  });

  it("returns a jobId and total count immediately", async () => {
    (db.getPendingContentTemplates as any).mockResolvedValue([
      { id: 1, userId: 1, hook: "Hook 1", contentType: "carousel", status: "pending" },
      { id: 2, userId: 1, hook: "Hook 2", contentType: "carousel", status: "pending" },
    ]);

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.contentTemplates.generateAllPosts({});

    expect(result.jobId).toBeTruthy();
    expect(typeof result.jobId).toBe("string");
    expect(result.total).toBe(2);
  });

  it("filters by batchId when provided", async () => {
    (db.getContentTemplatesByBatchId as any).mockResolvedValue([
      { id: 3, userId: 1, hook: "Batch Hook", contentType: "carousel", status: "pending" },
    ]);

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.contentTemplates.generateAllPosts({ batchId: "batch-abc" });

    expect(db.getContentTemplatesByBatchId).toHaveBeenCalledWith("batch-abc");
    expect(result.total).toBe(1);
  });

  it("excludes already-generated templates when filtering by batchId", async () => {
    (db.getContentTemplatesByBatchId as any).mockResolvedValue([
      { id: 4, userId: 1, hook: "Already done", contentType: "carousel", status: "generated" },
      { id: 5, userId: 1, hook: "Still pending", contentType: "carousel", status: "pending" },
    ]);

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.contentTemplates.generateAllPosts({ batchId: "batch-xyz" });

    // Only 1 pending template should be included
    expect(result.total).toBe(1);
  });
});

describe("contentTemplates.getJobProgress", () => {
  it("returns not_found for unknown jobId", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.contentTemplates.getJobProgress({ jobId: "nonexistent-job-id" });
    expect(result.status).toBe("not_found");
    expect(result.total).toBe(0);
  });

  it("returns running status immediately after job is started", async () => {
    (db.getPendingContentTemplates as any).mockResolvedValue([
      { id: 10, userId: 2, hook: "Test hook", contentType: "carousel", status: "pending" },
    ]);

    const caller = appRouter.createCaller(makeCtx(2));
    const { jobId } = await caller.contentTemplates.generateAllPosts({});

    const progress = await caller.contentTemplates.getJobProgress({ jobId });
    // Job should be running or done (setImmediate may have already completed in test env)
    expect(["running", "done"]).toContain(progress.status);
    expect(progress.total).toBe(1);
  });

  it("does not expose another user's job progress", async () => {
    (db.getPendingContentTemplates as any).mockResolvedValue([
      { id: 20, userId: 3, hook: "User 3 hook", contentType: "carousel", status: "pending" },
    ]);

    const callerUser3 = appRouter.createCaller(makeCtx(3));
    const { jobId } = await callerUser3.contentTemplates.generateAllPosts({});

    // User 4 tries to read user 3's job
    const callerUser4 = appRouter.createCaller(makeCtx(4));
    const result = await callerUser4.contentTemplates.getJobProgress({ jobId });
    expect(result.status).toBe("not_found");
  });
});
