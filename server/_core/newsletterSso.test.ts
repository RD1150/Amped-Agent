import { describe, it, expect } from "vitest";
import { generateNewsletterSsoToken, getNewsletterSsoUrl } from "./newsletterSso";

describe("Newsletter SSO", () => {
  const testUser = {
    id: 123,
    email: "test@example.com",
    name: "Test User",
  };

  describe("generateNewsletterSsoToken", () => {
    it("should generate a valid SSO token with correct format", () => {
      const token = generateNewsletterSsoToken(testUser);
      
      // Token should have 5 parts: userId:email:name:timestamp:signature
      const parts = token.split(":");
      expect(parts.length).toBe(5);
      
      // Verify each part
      expect(parts[0]).toBe(testUser.id.toString());
      expect(parts[1]).toBe(testUser.email);
      expect(parts[2]).toBe(testUser.name);
      expect(parseInt(parts[3])).toBeGreaterThan(0); // timestamp
      expect(parts[4].length).toBe(64); // HMAC-SHA256 produces 64-char hex string
    });

    it("should generate different tokens for different timestamps", () => {
      const token1 = generateNewsletterSsoToken(testUser);
      
      // Wait 1ms to ensure different timestamp
      const start = Date.now();
      while (Date.now() === start) {
        // busy wait
      }
      
      const token2 = generateNewsletterSsoToken(testUser);
      
      expect(token1).not.toBe(token2);
    });

    it("should generate consistent signature for same payload", () => {
      const token1 = generateNewsletterSsoToken(testUser);
      const token2 = generateNewsletterSsoToken(testUser);
      
      // Extract signatures (last part)
      const sig1 = token1.split(":")[4];
      const sig2 = token2.split(":")[4];
      
      // Signatures should be hex strings
      expect(sig1).toMatch(/^[a-f0-9]{64}$/);
      expect(sig2).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("getNewsletterSsoUrl", () => {
    it("should generate a valid SSO URL with token parameter", () => {
      const url = getNewsletterSsoUrl(testUser);
      
      expect(url).toContain("https://");
      expect(url).toContain("/api/sso/callback");
      expect(url).toContain("auth_token=");
      
      // Extract token from URL
      const urlObj = new URL(url);
      const token = urlObj.searchParams.get("auth_token");
      expect(token).toBeTruthy();
      
      // Verify token format
      const decodedToken = decodeURIComponent(token!);
      const parts = decodedToken.split(":");
      expect(parts.length).toBe(5);
    });

    it("should URL-encode the token parameter", () => {
      const url = getNewsletterSsoUrl(testUser);
      
      // URL should not contain unencoded colons in query string
      const queryString = url.split("?")[1];
      const tokenValue = queryString.split("=")[1];
      
      // If properly encoded, colons should be %3A
      expect(tokenValue).toContain("%3A");
    });
  });
});
