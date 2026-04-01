import { describe, it, expect } from "vitest";

describe("Gamma API Key Validation", () => {
  it("should authenticate with the Gamma API and list themes", async () => {
    const apiKey = process.env.GAMMA_API_KEY;
    expect(apiKey, "GAMMA_API_KEY must be set").toBeTruthy();

    const response = await fetch("https://public-api.gamma.app/v1.0/themes", {
      headers: {
        "X-API-KEY": apiKey!,
      },
    });

    expect(response.status, `Gamma API returned ${response.status}`).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("data");
    expect(Array.isArray(data.data)).toBe(true);
    console.log(`✅ Gamma API key valid. Found ${data.data.length} theme(s).`);
  });
});
