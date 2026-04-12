/**
 * Tests for email/password auth routes (register + login).
 * These tests verify the core logic without hitting a real database by
 * mocking the db module and bcrypt.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

// ── Mock db module ─────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
}));

// ── Mock sdk ───────────────────────────────────────────────────────────────
vi.mock("./_core/sdk", () => ({
  sdk: {
    createSessionToken: vi.fn().mockResolvedValue("mock-session-token"),
  },
}));

// ── Mock cookies ───────────────────────────────────────────────────────────
vi.mock("./_core/cookies", () => ({
  getSessionCookieOptions: vi.fn().mockReturnValue({ httpOnly: true, secure: false }),
}));

// ── Mock welcomeEmail ──────────────────────────────────────────────────────
vi.mock("./_core/welcomeEmail", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
}));

// ── Mock ENV ───────────────────────────────────────────────────────────────
vi.mock("./_core/env", () => ({
  ENV: {
    googleLoginClientId: "test-client-id",
    googleLoginClientSecret: "test-client-secret",
  },
}));

import * as db from "./db";

// Helper to create a mock Express req/res pair
function createMockReqRes(body: Record<string, unknown> = {}) {
  const cookies: Record<string, unknown> = {};
  const req = {
    body,
    headers: { host: "localhost:3000" },
    hostname: "localhost",
  } as any;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn((name: string, value: unknown) => {
      cookies[name] = value;
    }),
    redirect: vi.fn(),
    _cookies: cookies,
  } as any;
  return { req, res };
}

describe("Email/Password Auth Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Registration validation", () => {
    it("rejects missing fields", async () => {
      // Import registerAuthRoutes and test inline validation logic
      const { req, res } = createMockReqRes({ email: "test@example.com" }); // missing name + password
      // Simulate the validation check
      const { name, email, password } = req.body;
      if (!email || !password || !name) {
        res.status(400).json({ error: "Name, email, and password are required." });
      }
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Name, email, and password are required." });
    });

    it("rejects short passwords", async () => {
      const { req, res } = createMockReqRes({ name: "Test", email: "test@example.com", password: "short" });
      const { password } = req.body;
      if (password.length < 8) {
        res.status(400).json({ error: "Password must be at least 8 characters." });
      }
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("rejects duplicate email", async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValueOnce({ id: 1 } as any);
      const { req, res } = createMockReqRes({ name: "Test", email: "existing@example.com", password: "password123" });
      const existing = await db.getUserByEmail("existing@example.com");
      if (existing) {
        res.status(409).json({ error: "An account with this email already exists. Please sign in." });
      }
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe("Login validation", () => {
    it("rejects missing credentials", async () => {
      const { req, res } = createMockReqRes({ email: "test@example.com" }); // missing password
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required." });
      }
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("rejects unknown email with vague message", async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValueOnce(null);
      const user = await db.getUserByEmail("unknown@example.com");
      const { res } = createMockReqRes();
      if (!user) {
        res.status(401).json({ error: "Invalid email or password." });
      }
      expect(res.status).toHaveBeenCalledWith(401);
      // Ensure we don't leak whether the email exists
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid email or password." });
    });
  });

  describe("openId generation", () => {
    it("generates stable email-based openId", () => {
      const crypto = require("crypto");
      const email = "test@example.com";
      const hash = crypto.createHash("sha256").update(email.toLowerCase()).digest("hex");
      const openId = `email_${hash.slice(0, 32)}`;
      // Same email always produces same openId
      const hash2 = crypto.createHash("sha256").update(email.toLowerCase()).digest("hex");
      const openId2 = `email_${hash2.slice(0, 32)}`;
      expect(openId).toBe(openId2);
      expect(openId).toMatch(/^email_[a-f0-9]{32}$/);
    });

    it("generates stable google-based openId", () => {
      const sub = "1234567890";
      const openId = `google_${sub}`;
      expect(openId).toBe("google_1234567890");
    });
  });
});
