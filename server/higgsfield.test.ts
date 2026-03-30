import { describe, it, expect } from "vitest";
import { ENV } from "./_core/env";

describe("Higgsfield credentials", () => {
  it("should have HIGGSFIELD_API_KEY set", () => {
    expect(ENV.HIGGSFIELD_API_KEY).toBeTruthy();
    expect(ENV.HIGGSFIELD_API_KEY.length).toBeGreaterThan(10);
  });

  it("should have HIGGSFIELD_KEY_ID set", () => {
    expect(ENV.HIGGSFIELD_KEY_ID).toBeTruthy();
    expect(ENV.HIGGSFIELD_KEY_ID.length).toBeGreaterThan(4);
  });

  it("should be able to reach Higgsfield Cloud API", async () => {
    const response = await fetch("https://cloud.higgsfield.ai/v1/models", {
      headers: {
        Authorization: `Bearer ${ENV.HIGGSFIELD_API_KEY}`,
      },
    });
    // 200 = valid key, 401 = invalid key, anything else = network/API issue
    expect([200, 401, 403, 404]).toContain(response.status);
    if (response.status === 401 || response.status === 403) {
      throw new Error("Higgsfield API key is invalid or unauthorized — please re-enter credentials");
    }
  });
});
