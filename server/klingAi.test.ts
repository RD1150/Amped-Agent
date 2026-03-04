import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";

/**
 * Kling AI API key validation tests
 * Tests JWT generation and basic API connectivity
 */

const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY ?? "";
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY ?? "";
const KLING_API_BASE = "https://api-singapore.klingai.com";

function generateKlingJWT(accessKey: string, secretKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: accessKey,
    exp: now + 1800,
    nbf: now - 5,
  };
  return jwt.sign(payload, secretKey, {
    algorithm: "HS256",
    header: { alg: "HS256", typ: "JWT" },
  });
}

describe("Kling AI API", () => {
  it("should have KLING_ACCESS_KEY configured", () => {
    expect(KLING_ACCESS_KEY).toBeTruthy();
    expect(KLING_ACCESS_KEY.length).toBeGreaterThan(10);
  });

  it("should have KLING_SECRET_KEY configured", () => {
    expect(KLING_SECRET_KEY).toBeTruthy();
    expect(KLING_SECRET_KEY.length).toBeGreaterThan(10);
  });

  it("should generate a valid JWT token", () => {
    if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
      console.warn("Skipping JWT test: keys not configured");
      return;
    }

    const token = generateKlingJWT(KLING_ACCESS_KEY, KLING_SECRET_KEY);
    expect(token).toBeTruthy();
    expect(token.split(".").length).toBe(3); // JWT has 3 parts

    // Verify the token can be decoded
    const decoded = jwt.decode(token) as Record<string, unknown>;
    expect(decoded.iss).toBe(KLING_ACCESS_KEY);
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("should successfully authenticate with Kling API", async () => {
    if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
      console.warn("Skipping API test: keys not configured");
      return;
    }

    const token = generateKlingJWT(KLING_ACCESS_KEY, KLING_SECRET_KEY);

    // Test with list tasks endpoint (lightweight, no credits used)
    const response = await fetch(`${KLING_API_BASE}/v1/videos/image2video?pageNum=1&pageSize=1`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // 200 = authenticated and working
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.code).toBe(0); // Kling API success code
    console.log(`[KlingAI Test] API response: code=${data.code}, message=${data.message}`);
  }, 15000); // 15 second timeout for network request
});
