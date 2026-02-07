import { notifyOwner } from "./_core/notification";

interface EmailNotificationParams {
  userEmail: string;
  userName: string;
  type: "rate_limit" | "low_credits";
  creditsRemaining?: number;
}

/**
 * Send email notification to user
 * Currently uses owner notification system as a fallback
 * TODO: Integrate with SendGrid or similar email service
 */
export async function sendEmailNotification(params: EmailNotificationParams): Promise<boolean> {
  const { userEmail, userName, type, creditsRemaining } = params;

  let title = "";
  let content = "";

  if (type === "rate_limit") {
    title = "Daily Video Limit Reached";
    content = `Hi ${userName},\n\nYou've reached your daily limit of 10 property tour videos. This limit resets at midnight UTC.\n\nUpgrade to Professional or Agency tier for unlimited video generation!\n\nVisit https://authoritycontent.co/credits to upgrade.\n\nBest regards,\nAuthority Content Team`;
  } else if (type === "low_credits") {
    title = "Low Credits Warning";
    content = `Hi ${userName},\n\nYour credit balance is running low. You currently have ${creditsRemaining} credits remaining.\n\nPurchase more credits to continue creating amazing property tour videos:\n- Starter: $49 for 100 credits\n- Professional: $149 for 350 credits\n- Agency: $399 for 1,000 credits\n\nVisit https://authoritycontent.co/credits to purchase.\n\nBest regards,\nAuthority Content Team`;
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
