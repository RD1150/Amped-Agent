import { describe, it, expect } from "vitest";

/**
 * Test D-ID API key validation
 * 
 * This test validates that the D-ID API key is correctly configured
 * by making a simple API call to check credits/account status.
 */
describe("D-ID API Integration", () => {
  it("should validate D-ID API key by checking credits", async () => {
    const apiKey = process.env.DID_API_KEY;
    
    expect(apiKey).toBeDefined();
    expect(apiKey).toContain(":");
    
    // Split the API key into username:password format
    const [username, password] = apiKey!.split(":");
    
    expect(username).toBeDefined();
    expect(password).toBeDefined();
    
    // Test the API key by calling the credits endpoint
    const response = await fetch("https://api.d-id.com/credits", {
      method: "GET",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
    });
    
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    
    // Verify we got a valid response with credits information
    expect(data).toBeDefined();
    expect(data).toHaveProperty("remaining");
    
    console.log("✅ D-ID API key validated successfully");
    console.log(`📊 Remaining credits: ${data.remaining}`);
  });
});
