import { describe, it, expect } from "vitest";
import { ENV } from "./server/_core/env";

describe("GHL Location API Token - Social Media Access", () => {
  it("should access social media endpoints with Location token", async () => {
    const token = ENV.ghlLocationApiKey;
    const locationId = "zKv9BFukoAJJjAhPcOYn";

    expect(token).toBeDefined();
    expect(token).toContain("pit-");
    console.log("✅ Location API token loaded");

    // Test: Access social media accounts endpoint
    const accountsResponse = await fetch(
      `https://services.leadconnectorhq.com/social-media-posting/${locationId}/accounts`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Version: "2021-07-28",
        },
      }
    );

    console.log("Social Media Accounts API Status:", accountsResponse.status);

    if (accountsResponse.status === 401) {
      const errorData = await accountsResponse.json();
      console.error("❌ 401 Error:", JSON.stringify(errorData, null, 2));
      throw new Error(
        `Location token lacks social media scopes: ${JSON.stringify(errorData)}`
      );
    }

    // Should be 200 (success) or 404 (no accounts connected yet)
    expect([200, 404]).toContain(accountsResponse.status);

    if (accountsResponse.status === 200) {
      const accountsData = await accountsResponse.json();
      console.log("✅ Social Media Accounts API: SUCCESS");
      console.log("Connected accounts:", JSON.stringify(accountsData, null, 2));
    } else {
      console.log("✅ Social Media Accounts API: SUCCESS (404 = no accounts connected yet)");
    }

    // Test: Access social media posts endpoint
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
        `Location token lacks social media scopes: ${JSON.stringify(errorData)}`
      );
    }

    // Should be 200 (success) or 404 (no posts yet)
    expect([200, 404]).toContain(postsResponse.status);

    if (postsResponse.status === 200) {
      const postsData = await postsResponse.json();
      console.log("✅ Social Media Posts API: SUCCESS");
      console.log("Posts data:", JSON.stringify(postsData, null, 2));
    } else {
      console.log("✅ Social Media Posts API: SUCCESS (404 = no posts yet)");
    }

    console.log("\n🎉 ALL TESTS PASSED! Location token has social media access!");
  }, 30000);
});
