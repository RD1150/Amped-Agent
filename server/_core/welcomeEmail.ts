/**
 * Welcome email — delegates to the central emailService (Resend).
 * Kept as a thin wrapper so existing call-sites don't need to change.
 */
export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  try {
    const { sendWelcomeEmail: send } = await import("../emailService");
    return await send(data);
  } catch (error) {
    console.error("[WelcomeEmail] Failed:", error);
    return false;
  }
}
