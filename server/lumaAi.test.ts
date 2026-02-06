import { describe, it, expect } from "vitest";
import { ENV } from "./_core/env";

describe("Luma AI Integration", () => {
  it("should have LUMA_API_KEY configured", () => {
    // Verify API key is set
    expect(ENV.LUMA_API_KEY).toBeDefined();
    expect(ENV.LUMA_API_KEY).not.toBe("");
    expect(ENV.LUMA_API_KEY).toMatch(/^luma-/);
    
    // Verify it has the expected format (luma- prefix with UUID-like structure)
    const parts = ENV.LUMA_API_KEY.split("-");
    expect(parts.length).toBeGreaterThan(2);
    expect(parts[0]).toBe("luma");
  });
});
