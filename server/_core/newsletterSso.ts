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
}): string {
  const timestamp = Date.now();
  const payload = `${user.id}:${user.email}:${user.name}:${timestamp}`;
  
  // Generate HMAC-SHA256 signature
  const signature = crypto
    .createHmac("sha256", ENV.NEWSLETTER_SSO_SECRET)
    .update(payload)
    .digest("hex");
  
  const token = `${payload}:${signature}`;
  return token;
}

/**
 * Generate Newsletter Pro SSO URL with authentication token
 */
export function getNewsletterSsoUrl(user: {
  id: number;
  email: string;
  name: string;
}): string {
  const token = generateNewsletterSsoToken(user);
  const baseUrl = ENV.NEWSLETTER_PRO_URL;
  return `${baseUrl}/api/sso/callback?auth_token=${encodeURIComponent(token)}`;
}
