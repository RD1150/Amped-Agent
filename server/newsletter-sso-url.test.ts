import { describe, it, expect } from "vitest";
import { ENV } from "./server/_core/env";

describe("Newsletter Pro SSO Configuration", () => {
  it("should have NEWSLETTER_PRO_URL configured", () => {
    expect(ENV.NEWSLETTER_PRO_URL).toBeDefined();
    expect(ENV.NEWSLETTER_PRO_URL).toBeTruthy();
  });

  it("should use HTTPS protocol for Newsletter Pro URL", () => {
    expect(ENV.NEWSLETTER_PRO_URL).toMatch(/^https:\/\//);
  });

  it("should point to app.newsletterpro.app domain", () => {
    expect(ENV.NEWSLETTER_PRO_URL).toContain("app.newsletterpro.app");
  });

  it("should not have trailing slash in URL", () => {
    expect(ENV.NEWSLETTER_PRO_URL).not.toMatch(/\/$/);
  });
});
