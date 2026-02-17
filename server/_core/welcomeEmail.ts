import { notifyOwner } from "./notification";

export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
}

/**
 * Send welcome email to new user after onboarding completion
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  const { userName, userEmail } = data;
  
  const emailContent = `
🎉 **New User Completed Onboarding!**

**Name:** ${userName}
**Email:** ${userEmail}

The user has successfully completed the onboarding flow and is ready to start creating content!

**Next Steps for User:**
- Generate their first Authority Post
- Create a talking avatar reel
- Set up social media connections
- Explore Property Tours

---
*This is an automated notification from Authority Content*
  `.trim();
  
  try {
    // Notify owner about new user completion
    const success = await notifyOwner({
      title: `New User: ${userName} completed onboarding`,
      content: emailContent,
    });
    
    return success;
  } catch (error) {
    console.error("[WelcomeEmail] Failed to send:", error);
    return false;
  }
}
