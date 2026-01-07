import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";

describe("Facebook OAuth Credentials", () => {
  it("should have valid Facebook App ID and Secret configured", async () => {
    // Check that credentials are set
    expect(ENV.facebookAppId).toBeDefined();
    expect(ENV.facebookAppSecret).toBeDefined();
    expect(ENV.facebookAppId).not.toBe("");
    expect(ENV.facebookAppSecret).not.toBe("");

    // Validate App ID format (should be numeric)
    expect(ENV.facebookAppId).toMatch(/^\d+$/);

    // Validate App Secret format (should be alphanumeric, 32 chars)
    expect(ENV.facebookAppSecret).toMatch(/^[a-f0-9]{32}$/);

    // Test Facebook Graph API - verify app exists
    // Using app access token format: APP_ID|APP_SECRET
    const appAccessToken = `${ENV.facebookAppId}|${ENV.facebookAppSecret}`;
    
    // Try to get app info - this will fail if credentials are invalid
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${ENV.facebookAppId}?access_token=${appAccessToken}&fields=id,name`
    );

    const data = await response.json();

    // If credentials are invalid, Facebook returns an error
    if (data.error) {
      throw new Error(
        `Facebook API Error: ${data.error.message} (Code: ${data.error.code}). ` +
        `This usually means the App ID or App Secret is incorrect.`
      );
    }

    // Valid response should have the app ID
    expect(data.id).toBe(ENV.facebookAppId);
    console.log(`✓ Facebook App validated: ${data.name} (ID: ${data.id})`);
  }, 10000); // 10 second timeout for API call
});
