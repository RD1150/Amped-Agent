import crypto from "crypto";
import { ENV } from "./env";

/**
 * Generate SSO token for Newsletter Pro authentication
 * Token format: {userId}:{email}:{name}:{timestamp}:{signature}
 * Signature: HMAC-SHA256(secret, {userId}:{email}:{name}:{timestamp})
 */
export function generateNewsletterSsoToken(user: {
  id: number;
  email: string;
  name: string;
}): string | null {
  // Return null if SSO secret is not configured
  if (!ENV.NEWSLETTER_SSO_SECRET) {
    console.warn("[Newsletter SSO] NEWSLETTER_SSO_SECRET not configured");
    return null;
  }
  
  // Format userId as string with prefix (Newsletter Pro expects string format)
  const userId = `authority-user-${user.id}`;
  
  // URL-encode the name for signature generation (Newsletter Pro expects this)
  const encodedName = encodeURIComponent(user.name);
  
  const timestamp = Date.now();
  
  // Generate signature with URL-encoded name
  const message = `${userId}:${user.email}:${encodedName}:${timestamp}`;
  const signature = crypto
    .createHmac("sha256", ENV.NEWSLETTER_SSO_SECRET)
    .update(message)
    .digest("hex");
  
  // Token format: userId:email:encodedName:timestamp:signature
  const token = `${userId}:${user.email}:${encodedName}:${timestamp}:${signature}`;
  return token;
}

/**
 * Generate Newsletter Pro SSO URL with authentication token
 */
export function getNewsletterSsoUrl(user: {
  id: number;
  email: string;
  name: string;
}): string | null {
  const token = generateNewsletterSsoToken(user);
  
  // Return null if token generation failed (missing secret)
  if (!token) {
    return null;
  }
  
  const baseUrl = ENV.NEWSLETTER_PRO_URL;
  return `${baseUrl}/api/sso/callback?auth_token=${encodeURIComponent(token)}`;
}
