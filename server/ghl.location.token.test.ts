import { describe, it, expect } from "vitest";
import { ENV } from "./server/_core/env";

describe("GHL Location API Token Validation", () => {
  it("should have valid Location API token with social media scopes", async () => {
    const token = ENV.ghlAgencyApiKey;
    expect(token).toBeDefined();
    expect(token).toContain("pit-");

    // Test 1: Get location details (basic auth test)
    const locationId = "zKv9BFukoAJJjAhPcOYn";
    const locationResponse = await fetch(
      `https://services.leadconnectorhq.com/locations/${locationId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Version: "2021-07-28",
        },
      }
    );

    expect(locationResponse.status).toBe(200);
    const locationData = await locationResponse.json();
    expect(locationData.location).toBeDefined();
    console.log("✅ Location API access: SUCCESS");

    // Test 2: Try to access social media posts endpoint (the critical test)
    const postsResponse = await fetch(
      `https://services.leadconnectorhq.com/social-media-posting/posts?locationId=${locationId}&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Version: "2021-07-28",
        },
      }
    );

    console.log("Social Media Posts API Status:", postsResponse.status);
    
    if (postsResponse.status === 401) {
      const errorData = await postsResponse.json();
      console.error("❌ 401 Error:", JSON.stringify(errorData, null, 2));
      throw new Error(
        `Token still lacks social media scopes: ${JSON.stringify(errorData)}`
      );
    }

    // Should be 200 (success) or 404 (no posts yet, but API access works)
    expect([200, 404]).toContain(postsResponse.status);
    
    if (postsResponse.status === 200) {
      const postsData = await postsResponse.json();
      console.log("✅ Social Media Posts API access: SUCCESS");
      console.log("Posts data:", JSON.stringify(postsData, null, 2));
    } else {
      console.log("✅ Social Media Posts API access: SUCCESS (404 = no posts yet, but API works)");
    }
  }, 30000);
});
