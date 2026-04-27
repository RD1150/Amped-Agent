/**
 * Amped Agent — Transactional Email Service (Resend)
 *
 * All user-facing emails go through this module.
 * Falls back to owner notifications if RESEND_API_KEY is not set.
 */
import { Resend } from "resend";
import { ENV } from "./_core/env";
import { notifyOwner } from "./_core/notification";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!ENV.resendApiKey) return null;
  if (!_resend) _resend = new Resend(ENV.resendApiKey);
  return _resend;
}

const FROM = `Amped Agent <${ENV.fromEmail}>`;
const BRAND_COLOR = "#f97316"; // orange-500
const SITE_URL = "https://ampedagent.app";

// ─── Shared HTML shell ────────────────────────────────────────────────────────

function emailShell(preheader: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Amped Agent</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <!-- preheader -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a1a 0%,#2a1a0a 100%);padding:32px 40px;border-bottom:1px solid #2a2a2a;">
            <a href="${SITE_URL}" style="text-decoration:none;">
              <span style="font-size:22px;font-weight:700;color:#ffffff;">Amped</span><span style="font-size:22px;font-weight:700;color:${BRAND_COLOR};"> Agent</span>
            </a>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;color:#e5e5e5;font-size:15px;line-height:1.7;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #2a2a2a;text-align:center;color:#666;font-size:12px;">
            <p style="margin:0 0 8px;">© ${new Date().getFullYear()} Amped Agent · <a href="${SITE_URL}" style="color:#666;text-decoration:underline;">ampedagent.app</a></p>
            <p style="margin:0;">You're receiving this because you have an account on Amped Agent.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin:24px 0 8px;padding:14px 28px;background:${BRAND_COLOR};color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;border-radius:8px;">${text}</a>`;
}

function greeting(name: string): string {
  return `<p style="margin:0 0 16px;">Hi ${name},</p>`;
}

function signature(): string {
  return `<p style="margin:24px 0 0;color:#999;font-size:13px;">— The Amped Agent Team</p>`;
}

// ─── Core send helper ─────────────────────────────────────────────────────────

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  /** Used as owner fallback title when Resend is not configured */
  fallbackTitle?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const resend = getResend();

  if (resend) {
    try {
      const { error } = await resend.emails.send({
        from: FROM,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
      if (error) {
        console.error("[EmailService] Resend error:", error);
        return false;
      }
      console.log(`[EmailService] Sent "${params.subject}" to ${params.to}`);
      return true;
    } catch (err) {
      console.error("[EmailService] Failed to send via Resend:", err);
      return false;
    }
  }

  // Fallback: owner notification
  console.warn("[EmailService] RESEND_API_KEY not set — falling back to owner notification");
  try {
    await notifyOwner({
      title: params.fallbackTitle ?? params.subject,
      content: `[Email fallback — would have been sent to ${params.to}]\n\nSubject: ${params.subject}`,
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Welcome Email ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(params: {
  userName: string;
  userEmail: string;
}): Promise<boolean> {
  const { userName, userEmail } = params;

  const html = emailShell(
    "Welcome to Amped Agent — your AI-powered real estate authority platform is ready.",
    `${greeting(userName)}
    <p style="margin:0 0 16px;">Welcome to <strong>Amped Agent</strong> — the AI-powered platform built to turn real estate agents into local authorities.</p>
    <p style="margin:0 0 16px;">Here's what you can do right now:</p>
    <ul style="margin:0 0 16px;padding-left:20px;color:#ccc;">
      <li style="margin-bottom:8px;">🎯 <strong>Generate Authority Posts</strong> — hyper-local content that positions you as the expert</li>
      <li style="margin-bottom:8px;">🎬 <strong>Create Avatar Videos</strong> — AI-generated talking-head reels with your face & voice</li>
      <li style="margin-bottom:8px;">🏡 <strong>Build Property Tours</strong> — cinematic listing videos in minutes</li>
      <li style="margin-bottom:8px;">📅 <strong>Schedule & Publish</strong> — post to all your social channels from one place</li>
    </ul>
    ${btn("Go to Dashboard", `${SITE_URL}/dashboard`)}
    <p style="margin:16px 0 0;color:#999;font-size:13px;">If you have any questions, just reply to this email — we're here to help.</p>
    ${signature()}`
  );

  // Also notify owner
  notifyOwner({
    title: `New User: ${userName} joined`,
    content: `${userName} (${userEmail}) just created an account on Amped Agent.`,
  }).catch(() => {});

  return sendEmail({
    to: userEmail,
    subject: "Welcome to Amped Agent 🎉",
    html,
    fallbackTitle: `New user: ${userName} (${userEmail})`,
  });
}

// ─── Trial Expiry Warning ─────────────────────────────────────────────────────

export async function sendTrialExpiryWarning(params: {
  userName: string;
  userEmail: string;
  daysRemaining: number;
  trialEndsAt: Date;
}): Promise<boolean> {
  const { userName, userEmail, daysRemaining, trialEndsAt } = params;

  const expiryDate = trialEndsAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const urgencyColor = daysRemaining <= 1 ? "#ef4444" : daysRemaining <= 3 ? "#f97316" : "#eab308";
  const urgencyText =
    daysRemaining <= 1
      ? "⚠️ Your trial expires TOMORROW"
      : `⏳ Your trial ends in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`;

  const html = emailShell(
    `Your Amped Agent trial ends in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} — upgrade to keep your access.`,
    `${greeting(userName)}
    <div style="background:#1f1f1f;border-left:4px solid ${urgencyColor};padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 24px;">
      <p style="margin:0;font-weight:600;color:${urgencyColor};">${urgencyText}</p>
      <p style="margin:4px 0 0;color:#999;font-size:13px;">Trial expires: ${expiryDate}</p>
    </div>
    <p style="margin:0 0 16px;">During your trial you've had full access to everything in <strong>Amped Agent Authority</strong>:</p>
    <ul style="margin:0 0 16px;padding-left:20px;color:#ccc;">
      <li style="margin-bottom:6px;">✅ Unlimited Property Tour videos</li>
      <li style="margin-bottom:6px;">✅ AI Avatar Reels & Talking-Head Videos</li>
      <li style="margin-bottom:6px;">✅ Authority Post Generator</li>
      <li style="margin-bottom:6px;">✅ Blog Builder & Photo Library</li>
      <li style="margin-bottom:6px;">✅ Social Media Scheduler</li>
    </ul>
    <p style="margin:0 0 8px;">Don't lose access — upgrade now and keep building your authority.</p>
    ${btn("Upgrade My Plan", `${SITE_URL}/settings/billing`)}
    <p style="margin:16px 0 0;color:#999;font-size:13px;">Questions? Just reply to this email — we're happy to help.</p>
    ${signature()}`
  );

  return sendEmail({
    to: userEmail,
    subject: `Your Amped Agent trial ends in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} ⏳`,
    html,
    fallbackTitle: `[Trial Expiry] ${userName} — ${daysRemaining} days left`,
  });
}

// ─── Beta Invite Redeemed Confirmation ───────────────────────────────────────

export async function sendBetaWelcomeEmail(params: {
  userName: string;
  userEmail: string;
}): Promise<boolean> {
  const { userName, userEmail } = params;

  const html = emailShell(
    "You're in — welcome to the Amped Agent beta!",
    `${greeting(userName)}
    <p style="margin:0 0 16px;">Your beta invite code has been accepted. You now have <strong>full Authority access</strong> to Amped Agent — no credit card required.</p>
    <div style="background:#1a2a1a;border:1px solid #2a4a2a;border-radius:8px;padding:20px;margin:0 0 24px;">
      <p style="margin:0 0 8px;font-weight:600;color:#4ade80;">🎉 What you have access to:</p>
      <ul style="margin:0;padding-left:20px;color:#ccc;">
        <li style="margin-bottom:6px;">Authority Post Generator (unlimited)</li>
        <li style="margin-bottom:6px;">AI Avatar & Talking-Head Videos</li>
        <li style="margin-bottom:6px;">Cinematic Property Tours</li>
        <li style="margin-bottom:6px;">Blog Builder & Lead Magnets</li>
        <li style="margin-bottom:6px;">Social Media Scheduler</li>
      </ul>
    </div>
    <p style="margin:0 0 16px;">As a beta tester, your feedback is invaluable. If you find anything broken or have ideas, please reach out directly — we read every message.</p>
    ${btn("Start Creating", `${SITE_URL}/dashboard`)}
    ${signature()}`
  );

  return sendEmail({
    to: userEmail,
    subject: "You're in — welcome to the Amped Agent beta 🚀",
    html,
    fallbackTitle: `Beta user joined: ${userName} (${userEmail})`,
  });
}

// ─── Low Credits Warning ──────────────────────────────────────────────────────

export async function sendLowCreditsWarning(params: {
  userName: string;
  userEmail: string;
  creditsRemaining: number;
}): Promise<boolean> {
  const { userName, userEmail, creditsRemaining } = params;

  const html = emailShell(
    `You have ${creditsRemaining} credits left on Amped Agent.`,
    `${greeting(userName)}
    <p style="margin:0 0 16px;">Your Amped Agent credit balance is running low — you have <strong>${creditsRemaining} credits</strong> remaining.</p>
    <p style="margin:0 0 16px;">Credits are used for AI-enhanced video generation and advanced features. Top up now to keep creating without interruption.</p>
    ${btn("Add Credits", `${SITE_URL}/settings/billing`)}
    ${signature()}`
  );

  return sendEmail({
    to: userEmail,
    subject: `Low credits: ${creditsRemaining} remaining on Amped Agent`,
    html,
    fallbackTitle: `Low credits: ${userName} has ${creditsRemaining} credits`,
  });
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(params: {
  userName: string;
  userEmail: string;
  resetToken: string;
}): Promise<boolean> {
  const { userName, userEmail, resetToken } = params;
  const resetUrl = `${SITE_URL}/reset-password?token=${resetToken}`;

  const html = emailShell(
    "Reset your Amped Agent password",
    `${greeting(userName)}
    <p style="margin:0 0 16px;">We received a request to reset your password. Click the button below to choose a new one.</p>
    <p style="margin:0 0 16px;">This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
    ${btn("Reset My Password", resetUrl)}
    <p style="margin:16px 0 0;font-size:13px;color:#999;">Or copy and paste this URL into your browser:<br/><span style="color:#f97316;">${resetUrl}</span></p>
    ${signature()}`
  );

  return sendEmail({
    to: userEmail,
    subject: "Reset your Amped Agent password",
    html,
    fallbackTitle: `Password reset requested by ${userName} (${userEmail})`,
  });
}
