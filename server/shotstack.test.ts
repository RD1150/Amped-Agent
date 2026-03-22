/**
 * Video Renderer Integration Tests
 *
 * The project migrated from Shotstack to Creatomate for video rendering.
 * These tests validate the Creatomate renderer configuration and API key.
 */
import { describe, it, expect } from "vitest";
import { ENV } from "./_core/env";

describe("Creatomate Video Renderer", () => {
  it("should have CREATOMATE_API_KEY configured", () => {
    const apiKey = ENV.CREATOMATE_API_KEY;
    expect(apiKey).toBeDefined();
    expect(typeof apiKey).toBe("string");
    expect(apiKey.length).toBeGreaterThan(0);
  });

  it("should have creatomateRenderer module with required exports", async () => {
    const fs = await import("fs");
    const rendererContent = fs.readFileSync(
      "./server/_core/creatomateRenderer.ts",
      "utf-8"
    );
    expect(rendererContent).toContain("renderAutoReel");
    expect(rendererContent).toContain("checkRenderStatus");
    expect(rendererContent).toContain("CREATOMATE_API_KEY");
  });

  it("should have videoGenerator module that uses creatomateRenderer", async () => {
    const fs = await import("fs");
    const generatorContent = fs.readFileSync(
      "./server/videoGenerator.ts",
      "utf-8"
    );
    expect(generatorContent).toContain("creatomateRenderer");
    // videoGenerator uses renderPropertyTour for property tours
    // and checkRenderStatus for polling render status
    expect(generatorContent).toContain("checkRenderStatus");
  });

  it("should validate Creatomate API key format", () => {
    const apiKey = ENV.CREATOMATE_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey.length).toBeGreaterThan(10);
  });

  it("should have render status polling logic", async () => {
    const fs = await import("fs");
    const rendererContent = fs.readFileSync(
      "./server/_core/creatomateRenderer.ts",
      "utf-8"
    );
    expect(rendererContent).toContain("queued");
    expect(rendererContent).toContain("rendering");
    expect(rendererContent).toContain("done");
    expect(rendererContent).toContain("failed");
  });
});
