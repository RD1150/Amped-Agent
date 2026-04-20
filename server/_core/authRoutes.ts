/**
 * authRoutes.ts
 * Registers email/password and Google OAuth login routes.
 * These are independent of Manus OAuth and allow any agent to sign up directly.
 */
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { nanoid } from "nanoid";

const SALT_ROUNDS = 12;

function getGoogleClient() {
  return new OAuth2Client(
    ENV.googleLoginClientId,
    ENV.googleLoginClientSecret
  );
}

/**
 * Returns the canonical origin (scheme + host) for this deployment.
 * Priority:
 *   1. APP_URL env var (most reliable — set this in your hosting dashboard)
 *   2. x-forwarded-proto + host headers (works after `trust proxy` is set)
 *   3. req.protocol + req.hostname (local dev fallback)
 *
 * In production, always forces https.
 */
function getOrigin(req: Request): string {
  if (ENV.appUrl) {
    return ENV.appUrl;
  }
  // After `app.set('trust proxy', 1)`, req.protocol correctly reflects
  // x-forwarded-proto, so this branch works on Cloud Run / Render.
  const host = req.headers.host || req.hostname;
  const proto = req.protocol || (ENV.isProduction ? "https" : "http");
  // Always force https in production, even if proxy header is missing
  const scheme = ENV.isProduction ? "https" : proto;
  const origin = `${scheme}://${host}`;
  if (ENV.isProduction) {
    console.log(`[Auth] getOrigin (no APP_URL set) → ${origin}`);
  }
  return origin;
}

/**
 * Generate a stable openId for email/password users based on their email.
 * Prefixed with "email_" to distinguish from Manus OAuth openIds.
 */
function emailOpenId(email: string): string {
  // Use a deterministic prefix so re-registration finds the same user
  const Buffer = require("buffer").Buffer;
  const hash = require("crypto").createHash("sha256").update(email.toLowerCase()).digest("hex");
  return `email_${hash.slice(0, 32)}`;
}

/**
 * Generate a stable openId for Google-login users based on their Google sub.
 */
function googleOpenId(googleSub: string): string {
  return `google_${googleSub}`;
}

async function issueSession(req: Request, res: Response, openId: string, name: string) {
  const sessionToken = await sdk.createSessionToken(openId, {
    name,
    expiresInMs: ONE_YEAR_MS,
  });
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

export function registerAuthRoutes(app: Express) {
  // ── Invite Code Validation (public, pre-registration check) ───────────────
  app.post("/api/auth/validate-invite", async (req: Request, res: Response) => {
    try {
      const { code } = req.body as { code?: string };
      if (!code || !code.trim()) {
        res.status(400).json({ valid: false, error: "Invite code is required." });
        return;
      }
      const record = await db.getValidInviteCode(code.trim());
      if (!record) {
        res.json({ valid: false, error: "Invalid, expired, or already used invite code." });
        return;
      }
      res.json({ valid: true, label: record.label || null });
    } catch (error) {
      console.error("[Auth] Invite code validation failed:", error);
      res.status(500).json({ valid: false, error: "Validation failed. Please try again." });
    }
  });

  // ── Email/Password Registration ────────────────────────────────────────────
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, email, password, referralCode, inviteCode } = req.body as {
        name?: string;
        email?: string;
        password?: string;
        referralCode?: string;
        inviteCode?: string;
      };

      if (!email || !password || !name) {
        res.status(400).json({ error: "Name, email, and password are required." });
        return;
      }
      if (password.length < 8) {
        res.status(400).json({ error: "Password must be at least 8 characters." });
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existing = await db.getUserByEmail(normalizedEmail);
      if (existing) {
        res.status(409).json({ error: "An account with this email already exists. Please sign in." });
        return;
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const openId = emailOpenId(normalizedEmail);

      await db.upsertUser({
        openId,
        name: name.trim(),
        email: normalizedEmail,
        loginMethod: "email",
        lastSignedIn: new Date(),
        passwordHash,
      } as any);

      // Apply referral code if provided
      let referralApplied = false;
      if (referralCode && referralCode.trim()) {
        try {
          const newUser = await db.getUserByOpenId(openId);
          const referrer = await db.getUserByReferralCode(referralCode.trim());
          if (newUser && referrer && referrer.id !== newUser.id) {
            await db.applyReferral(newUser.id, referrer.id);
            referralApplied = true;
          }
        } catch (e) {
          console.warn("[Auth] Referral application failed (non-fatal):", e);
        }
      }

      // Apply beta invite code if provided — grants Authority access
      let inviteCodeApplied = false;
      if (inviteCode && inviteCode.trim()) {
        try {
          const codeRecord = await db.getValidInviteCode(inviteCode.trim());
          const newUser = await db.getUserByOpenId(openId);
          if (codeRecord && newUser) {
            await db.grantBetaInviteAccess(newUser.id);
            await db.redeemInviteCode(codeRecord.id, newUser.id);
            inviteCodeApplied = true;
            console.log(`[Auth] Beta invite code '${inviteCode.trim()}' redeemed by user ${newUser.id}`);
          }
        } catch (e) {
          console.warn("[Auth] Invite code application failed (non-fatal):", e);
        }
      }

      // Generate referral code for new user
      try {
        const newUser = await db.getUserByOpenId(openId);
        if (newUser) await db.generateReferralCode(newUser.id);
      } catch (e) {
        console.warn("[Auth] Referral code generation failed (non-fatal):", e);
      }

      // Send welcome email (non-fatal)
      try {
        const { sendWelcomeEmail } = await import("./welcomeEmail");
        await sendWelcomeEmail({ userName: name.trim(), userEmail: normalizedEmail });
      } catch (e) {
        console.warn("[Auth] Welcome email failed (non-fatal):", e);
      }

      await issueSession(req, res, openId, name.trim());
      res.json({ success: true, referralApplied, inviteCodeApplied });
    } catch (error) {
      console.error("[Auth] Register failed:", error);
      res.status(500).json({ error: "Registration failed. Please try again." });
    }
  });

  // ── Email/Password Login ───────────────────────────────────────────────────
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required." });
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await db.getUserByEmail(normalizedEmail);

      if (!user || !user.passwordHash) {
        // Vague message to prevent user enumeration
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
      await issueSession(req, res, user.openId, user.name || "");
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      res.status(500).json({ error: "Login failed. Please try again." });
    }
  });

  // ── Google OAuth — Redirect to Google ─────────────────────────────────────
  app.get("/api/auth/google", (req: Request, res: Response) => {
    const client = getGoogleClient();
    const redirectUri = `${getOrigin(req)}/api/auth/google/callback`;

    // Pass referral code via state param (format: ref_CODE)
    const stateParam = req.query.state as string | undefined;

    const url = client.generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      redirect_uri: redirectUri,
      prompt: "select_account",
      state: stateParam,
    });
    res.redirect(302, url);
  });

  // ── Google OAuth — Callback ────────────────────────────────────────────
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    try {
      const code = req.query.code as string | undefined;
      if (!code) {
        res.status(400).json({ error: "Missing authorization code." });
        return;
      }
      // Must use the same redirect URI as the initial auth request.
      const redirectUri = `${getOrigin(req)}/api/auth/google/callback`;

      const client = getGoogleClient();
      const { tokens } = await client.getToken({ code, redirect_uri: redirectUri });
      client.setCredentials(tokens);

      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: ENV.googleLoginClientId,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.sub || !payload.email) {
        res.status(400).json({ error: "Invalid Google token payload." });
        return;
      }

      const openId = googleOpenId(payload.sub);
      const name = payload.name || payload.email.split("@")[0];
      const email = payload.email.toLowerCase();

      const existing = await db.getUserByOpenId(openId);
      const isNewUser = !existing;

      await db.upsertUser({
        openId,
        name,
        email,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      if (isNewUser) {
        // Generate referral code for the new user
        try {
          const newUser = await db.getUserByOpenId(openId);
          if (newUser) await db.generateReferralCode(newUser.id);
        } catch (e) {
          console.warn("[Auth] Referral code generation failed (non-fatal):", e);
        }

        // Apply referral code if passed via state param
        const stateParam = req.query.state as string | undefined;
        if (stateParam && stateParam.startsWith("ref_")) {
          const refCode = stateParam.slice(4);
          try {
            const newUser = await db.getUserByOpenId(openId);
            const referrer = await db.getUserByReferralCode(refCode);
            if (newUser && referrer && referrer.id !== newUser.id) {
              await db.applyReferral(newUser.id, referrer.id);
            }
          } catch (e) {
            console.warn("[Auth] Referral application failed (non-fatal):", e);
          }
        }

        try {
          const { sendWelcomeEmail } = await import("./welcomeEmail");
          await sendWelcomeEmail({ userName: name, userEmail: email });
        } catch (e) {
          console.warn("[Auth] Welcome email failed (non-fatal):", e);
        }
      }

      await issueSession(req, res, openId, name);
      res.redirect(302, "/");
    } catch (error) {
      console.error("[Auth] Google callback failed:", error);
      res.redirect(302, "/login?error=google_failed");
    }
  });

  // ── Forgot Password — Send Reset Email ────────────────────────────────────
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body as { email?: string };
      if (!email) {
        res.status(400).json({ error: "Email is required." });
        return;
      }
      const normalizedEmail = email.toLowerCase().trim();
      const user = await db.getUserByEmail(normalizedEmail);

      // Always return success to prevent user enumeration
      if (!user || !user.passwordHash) {
        res.json({ success: true });
        return;
      }

      // Generate a secure random token
      const crypto = require("crypto");
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store token on user record
      await db.setPasswordResetToken(user.id, token, expiresAt);

      // Send reset email (non-fatal)
      try {
        const { sendPasswordResetEmail } = await import("../emailService");
        await sendPasswordResetEmail({
          userName: user.name || "there",
          userEmail: normalizedEmail,
          resetToken: token,
        });
      } catch (e) {
        console.warn("[Auth] Password reset email failed (non-fatal):", e);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Forgot password failed:", error);
      res.status(500).json({ error: "Something went wrong. Please try again." });
    }
  });

  // ── Reset Password — Validate Token & Set New Password ───────────────────
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body as { token?: string; password?: string };
      if (!token || !password) {
        res.status(400).json({ error: "Token and new password are required." });
        return;
      }
      if (password.length < 8) {
        res.status(400).json({ error: "Password must be at least 8 characters." });
        return;
      }

      const user = await db.getUserByResetToken(token);
      if (!user || !user.passwordResetExpiresAt || new Date(user.passwordResetExpiresAt) < new Date()) {
        res.status(400).json({ error: "This reset link is invalid or has expired. Please request a new one." });
        return;
      }

      const bcrypt = require("bcryptjs");
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      await db.resetUserPassword(user.id, passwordHash);

      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Reset password failed:", error);
      res.status(500).json({ error: "Something went wrong. Please try again." });
    }
  });
}
