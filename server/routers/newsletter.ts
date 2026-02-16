import { router, protectedProcedure } from "../_core/trpc";
import { getNewsletterSsoUrl } from "../_core/newsletterSso";

export const newsletterRouter = router({
  /**
   * Generate Newsletter Pro SSO link for authenticated user
   * Returns deep link with authentication token
   */
  getSsoLink: protectedProcedure.query(async ({ ctx }) => {
    const ssoUrl = getNewsletterSsoUrl({
      id: ctx.user.id,
      email: ctx.user.email || "",
      name: ctx.user.name || "User",
    });
    
    return {
      url: ssoUrl,
      expiresIn: 300, // Token valid for 5 minutes
    };
  }),
});
