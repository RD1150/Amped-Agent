/**
 * Twilio SMS Helper
 *
 * All SMS sending goes through this module.
 * Key rules:
 *  1. NEVER send to a number without smsConsent === true
 *  2. NEVER send to a number with smsOptedOut === true
 *  3. Every message must include opt-out instructions ("Reply STOP to unsubscribe")
 *  4. STOP replies are handled by the /api/twilio/webhook endpoint
 *
 * A2P 10DLC Registration Status: PENDING
 * Until registration is approved, messages may be filtered by carriers.
 * Do NOT use for bulk campaigns until A2P is approved.
 */

import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

/**
 * Returns true if Twilio is fully configured and ready to send.
 */
export function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken && fromNumber);
}

/**
 * Get the Twilio client. Throws if not configured.
 */
function getClient() {
  if (!isTwilioConfigured()) {
    throw new Error(
      "Twilio is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to your environment."
    );
  }
  return twilio(accountSid!, authToken!);
}

export interface SendSMSOptions {
  to: string;
  body: string;
  /** Must be true — caller is responsible for verifying consent before calling */
  consentVerified: boolean;
}

export interface SMSResult {
  success: boolean;
  sid?: string;
  error?: string;
}

/**
 * Send a single SMS message.
 * The caller MUST verify smsConsent === true AND smsOptedOut === false before calling.
 */
export async function sendSMS(options: SendSMSOptions): Promise<SMSResult> {
  const { to, body, consentVerified } = options;

  if (!consentVerified) {
    console.error("[SMS] Attempted to send without consent verification. Blocked.");
    return { success: false, error: "Consent not verified" };
  }

  if (!isTwilioConfigured()) {
    console.warn("[SMS] Twilio not configured — message not sent.");
    return { success: false, error: "Twilio not configured" };
  }

  // Normalize phone number to E.164 format
  const normalized = normalizePhone(to);
  if (!normalized) {
    return { success: false, error: `Invalid phone number: ${to}` };
  }

  // Append opt-out footer if not already present
  const messageWithOptOut = body.includes("STOP")
    ? body
    : `${body}\n\nReply STOP to unsubscribe.`;

  try {
    const client = getClient();
    const message = await client.messages.create({
      body: messageWithOptOut,
      from: fromNumber!,
      to: normalized,
    });
    console.log(`[SMS] Sent to ${normalized} — SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (err: any) {
    console.error(`[SMS] Failed to send to ${normalized}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Normalize a phone number to E.164 format (+1XXXXXXXXXX for US).
 * Returns null if the number cannot be normalized.
 */
export function normalizePhone(raw: string): string | null {
  // Strip all non-digit characters
  const digits = raw.replace(/\D/g, "");

  // US numbers: 10 digits → +1XXXXXXXXXX
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Already has country code: 11 digits starting with 1
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // International: 12+ digits — assume already has country code
  if (digits.length >= 12) {
    return `+${digits}`;
  }

  return null;
}

/**
 * Open House SMS templates — used for follow-up sequences.
 * All templates include the agent name and property address.
 */
export function openHouseSMSTemplate(params: {
  agentName: string;
  visitorName: string;
  address: string;
  messageNumber: 1 | 2 | 3;
  bookingUrl?: string;
}): string {
  const { agentName, visitorName, address, messageNumber, bookingUrl } = params;
  const firstName = visitorName.split(" ")[0];

  const templates: Record<number, string> = {
    1: `Hi ${firstName}! This is ${agentName}. Thanks for visiting ${address} today! I'd love to answer any questions. ${bookingUrl ? `Book a call: ${bookingUrl}` : "Just reply here!"}`,
    2: `Hi ${firstName}, ${agentName} here. Still thinking about ${address}? I can share comps and neighborhood info that might help. Want me to send those over?`,
    3: `${firstName}, last check-in from ${agentName} about ${address}. If you're still in the market, I'm here to help — no pressure. Just reply anytime.`,
  };

  return templates[messageNumber] || templates[1];
}
