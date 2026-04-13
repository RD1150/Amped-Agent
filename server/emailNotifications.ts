/**
 * emailNotifications.ts — delegates all user-facing emails to emailService (Resend).
 * Existing call-sites are preserved; only the implementation changes.
 */
import {
  sendEmail,
  sendTrialExpiryWarning as _sendTrialExpiry,
  sendLowCreditsWarning,
} from "./emailService";
import { notifyOwner } from "./_core/notification";

interface EmailNotificationParams {
  userEmail: string;
  userName: string;
  type: "rate_limit" | "low_credits" | "pool_exhausted" | "trial_expiry_warning";
  creditsRemaining?: number;
  poolSize?: number;
  overageCost?: number;
  trialEndsAt?: Date;
  daysRemaining?: number;
}

export async function sendEmailNotification(params: EmailNotificationParams): Promise<boolean> {
  const { userEmail, userName, type } = params;

  if (type === "trial_expiry_warning") {
    return _sendTrialExpiry({
      userName,
      userEmail,
      daysRemaining: params.daysRemaining ?? 3,
      trialEndsAt: params.trialEndsAt ?? new Date(Date.now() + 3 * 86400000),
    });
  }

  if (type === "low_credits") {
    return sendLowCreditsWarning({
      userName,
      userEmail,
      creditsRemaining: params.creditsRemaining ?? 0,
    });
  }

  if (type === "rate_limit") {
    return sendEmail({
      to: userEmail,
      subject: "Daily video limit reached — Amped Agent",
      html: `<p>Hi ${userName},</p><p>You've reached your daily video limit. It resets at midnight UTC.</p><p><a href="https://ampedagent.app/settings/billing">Upgrade your plan</a> for unlimited generation.</p>`,
      fallbackTitle: `Rate limit hit: ${userName} (${userEmail})`,
    });
  }

  if (type === "pool_exhausted") {
    const poolSize = params.poolSize ?? 0;
    return sendEmail({
      to: userEmail,
      subject: "Monthly free video pool exhausted — Amped Agent",
      html: `<p>Hi ${userName},</p><p>You've used all ${poolSize} of your free videos this month. Add credits to keep creating.</p><p><a href="https://ampedagent.app/settings/billing">Add credits</a></p>`,
      fallbackTitle: `Pool exhausted: ${userName} (${userEmail})`,
    });
  }

  return false;
}

/** Send rate limit notification */
export async function sendRateLimitNotification(userEmail: string, userName: string): Promise<boolean> {
  return sendEmailNotification({ userEmail, userName, type: "rate_limit" });
}

/** Send pool exhausted notification */
export async function sendPoolExhaustedNotification(
  userEmail: string,
  userName: string,
  poolSize: number,
  overageCost: number
): Promise<boolean> {
  return sendEmailNotification({ userEmail, userName, type: "pool_exhausted", poolSize, overageCost });
}

/** Send low credits notification */
export async function sendLowCreditsNotification(
  userEmail: string,
  userName: string,
  creditsRemaining: number
): Promise<boolean> {
  return sendEmailNotification({ userEmail, userName, type: "low_credits", creditsRemaining });
}

/**
 * Send trial expiry warning to a user whose trial ends in N days.
 * Called by the daily trial notification cron job.
 */
export async function sendTrialExpiryWarning(
  userEmail: string,
  userName: string,
  trialEndsAt: Date,
  daysRemaining: number
): Promise<boolean> {
  return _sendTrialExpiry({ userName, userEmail, trialEndsAt, daysRemaining });
}
