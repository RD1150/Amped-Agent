import { notifyOwner } from "./_core/notification";

interface EmailNotificationParams {
  userEmail: string;
  userName: string;
  type: "rate_limit" | "low_credits" | "pool_exhausted";
  creditsRemaining?: number;
  poolSize?: number;
  overageCost?: number;
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
  }

  try {
    // For now, notify owner about user notifications
    // This is a temporary solution until proper email service is integrated
    await notifyOwner({
      title: `User Notification: ${title}`,
      content: `User: ${userName} (${userEmail})\n\n${content}`,
    });

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

    console.log(`[Email] Notification sent to ${userEmail}: ${title}`);
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
