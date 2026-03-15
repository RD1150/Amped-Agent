import { describe, it, expect } from "vitest";

describe("Google OAuth credentials", () => {
  it("GOOGLE_CLIENT_ID should be set and have correct format", () => {
    const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
    expect(clientId).not.toBe("");
    // Google client IDs end with .apps.googleusercontent.com
    expect(clientId).toMatch(/\.apps\.googleusercontent\.com$/);
  });

  it("GOOGLE_CLIENT_SECRET should be set and have correct format", () => {
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
    expect(clientSecret).not.toBe("");
    // Google client secrets start with GOCSPX-
    expect(clientSecret).toMatch(/^GOCSPX-/);
  });
});
