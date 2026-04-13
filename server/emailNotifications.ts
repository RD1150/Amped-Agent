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

/**
 * Send email notification to user
 * Currently uses owner notification system as a fallback
 * TODO: Integrate with SendGrid or similar email service
 */
export async function sendEmailNotification(params: EmailNotificationParams): Promise<boolean> {
  const { userEmail, userName, type, creditsRemaining, poolSize, overageCost } = params;

  let title = "";
  let content = "";

  if (type === "rate_limit") {
    title = "Daily Video Limit Reached";
    content = `Hi ${userName},\n\nYou've reached your daily limit of 10 property tour videos. This limit resets at midnight UTC.\n\nUpgrade to Professional or Authority tier for unlimited video generation!\n\nVisit https://authoritycontent.co/credits to upgrade.\n\nBest regards,\nAmped Agent Team`;
  } else if (type === "low_credits") {
    title = "Low Credits Warning";
    content = `Hi ${userName},\n\nYour credit balance is running low. You currently have ${creditsRemaining} credits remaining.\n\nPurchase more credits to continue creating amazing property tour videos:\n- Starter: $49 for 100 credits\n- Professional: $149 for 350 credits\n- Authority: $299 for 500 credits\n\nVisit https://authoritycontent.co/credits to purchase.\n\nBest regards,\nAmped Agent Team`;
  } else if (type === "pool_exhausted") {
    title = "Monthly Free Video Pool Exhausted";
    content = `Hi ${userName},\n\nYou've used all ${poolSize ?? 0} of your free videos for this month. Your pool resets in 30 days.\n\nTo keep generating videos right now, add credits to your account — each additional video costs just ${overageCost ?? 2} credits.\n\nVisit https://authoritycontent.co/credits to add credits.\n\nBest regards,\nAmped Agent Team`;
  } else if (type === "trial_expiry_warning") {
    const days = params.daysRemaining ?? 3;
    const expiryDate = params.trialEndsAt
      ? params.trialEndsAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : "in 3 days";
    title = `Your Authority Content Trial Ends in ${days} Day${days !== 1 ? "s" : ""}`;
    content = `Hi ${userName},\n\nJust a heads-up — your 14-day free trial of Authority Content ends on ${expiryDate}.\n\nDuring your trial you've had full access to:\n• Unlimited Property Tour videos\n• AI Reels & Avatar Videos\n• Live Tour editing\n• Blog Builder & Photo Library\n\nTo keep all of this, upgrade to a paid plan before your trial expires.\n\n👉 Upgrade now: https://authoritycontent.co/upgrade\n\nIf you have any questions, just reply to this email — we're here to help.\n\nBest regards,\nThe Authority Content Team`;
  }

  try {
    if (type === "trial_expiry_warning") {
      // For trial expiry warnings, send a detailed owner notification that includes
      // the full user-facing email content so it can be forwarded or used as a template
      await notifyOwner({
        title: `[Trial Expiry Warning] ${userName} — ${params.daysRemaining ?? 3} days left`,
        content: `Send this email to: ${userName} <${userEmail}>\nDays remaining: ${params.daysRemaining ?? 3}\nTrial ends: ${params.trialEndsAt?.toISOString() ?? "unknown"}\n\n--- Email to send ---\nSubject: ${title}\n\n${content}`,
      });
    } else {
      // For now, notify owner about user notifications
      // This is a temporary solution until proper email service is integrated
      await notifyOwner({
        title: `User Notification: ${title}`,
        content: `User: ${userName} (${userEmail})\n\n${content}`,
      });
    }

    // TODO: Replace with actual email sending logic
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: userEmail,
    //   from: 'notifications@authoritycontent.co',
    //   subject: title,
    //   text: content,
    // });

    console.log(`[Email] Notification queued for ${userEmail}: ${title}`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send notification to ${userEmail}:`, error);
    return false;
  }
}

/**
 * Send rate limit notification
 */
export async function sendRateLimitNotification(userEmail: string, userName: string): Promise<boolean> {
  return sendEmailNotification({
    userEmail,
    userName,
    type: "rate_limit",
  });
}

/**
 * Send pool exhausted notification
 */
export async function sendPoolExhaustedNotification(
  userEmail: string,
  userName: string,
  poolSize: number,
  overageCost: number
): Promise<boolean> {
  return sendEmailNotification({
    userEmail,
    userName,
    type: "pool_exhausted",
    poolSize,
    overageCost,
  });
}

/**
 * Send low credits notification
 */
export async function sendLowCreditsNotification(
  userEmail: string,
  userName: string,
  creditsRemaining: number
): Promise<boolean> {
  return sendEmailNotification({
    userEmail,
    userName,
    type: "low_credits",
    creditsRemaining,
  });
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
  return sendEmailNotification({
    userEmail,
    userName,
    type: "trial_expiry_warning",
    trialEndsAt,
    daysRemaining,
  });
}
