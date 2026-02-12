import { describe, it, expect } from "vitest";
import { renderTemplate } from "./templateRenderer";
import { TEMPLATE_LIBRARY } from "../shared/templates";

describe("Template Style Samples", () => {
  const persona = {
    agentName: "Reena Dutta",
    licenseNumber: "02194500",
    brokerageName: "Y Realty",
    brokerageDRE: "02202700",
    phone: "(805) 340-2583",
    headshotUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/kKyyMZGdWJkTbQNx.jpeg",
  };

  it("should generate luxury buyers template with CTA", async () => {
    const template = TEMPLATE_LIBRARY.find(t => t.category === "luxury_buyers");
    if (!template) throw new Error("Template not found");

    const imageUrl = await renderTemplate({
      template,
      postText: "LUXURY LIVING AWAITS",
      ctaText: "Schedule Your Private Tour",
      ...persona,
    });

    expect(imageUrl).toBeDefined();
    expect(imageUrl).toContain("https://");
    console.log("\n✅ Luxury Buyers:", imageUrl);
  }, 30000);

  it("should generate first-time sellers template with CTA", async () => {
    const template = TEMPLATE_LIBRARY.find(t => t.category === "first_time_sellers");
    if (!template) throw new Error("Template not found");

    const imageUrl = await renderTemplate({
      template,
      postText: "READY TO SELL YOUR HOME?",
      ctaText: "Get Your Free Home Valuation",
      ...persona,
    });

    expect(imageUrl).toBeDefined();
    expect(imageUrl).toContain("https://");
    console.log("\n✅ First-Time Sellers:", imageUrl);
  }, 30000);

  it("should generate investors template with CTA", async () => {
    const template = TEMPLATE_LIBRARY.find(t => t.category === "investors");
    if (!template) throw new Error("Template not found");

    const imageUrl = await renderTemplate({
      template,
      postText: "INVESTMENT OPPORTUNITY",
      ctaText: "View ROI Calculator",
      ...persona,
    });

    expect(imageUrl).toBeDefined();
    expect(imageUrl).toContain("https://");
    console.log("\n✅ Investors:", imageUrl);
  }, 30000);

  it("should generate expired listings template with CTA", async () => {
    const template = TEMPLATE_LIBRARY.find(t => t.category === "expireds");
    if (!template) throw new Error("Template not found");

    const imageUrl = await renderTemplate({
      template,
      postText: "YOUR HOME DESERVES BETTER",
      ctaText: "Let's Talk Strategy",
      ...persona,
    });

    expect(imageUrl).toBeDefined();
    expect(imageUrl).toContain("https://");
    console.log("\n✅ Expired Listings:", imageUrl);
  }, 30000);

  it("should generate buyers template with CTA", async () => {
    const template = TEMPLATE_LIBRARY.find(t => t.category === "buyers");
    if (!template) throw new Error("Template not found");

    const imageUrl = await renderTemplate({
      template,
      postText: "FIND YOUR DREAM HOME",
      ctaText: "Start Your Search Today",
      ...persona,
    });

    expect(imageUrl).toBeDefined();
    expect(imageUrl).toContain("https://");
    console.log("\n✅ Buyers:", imageUrl);
  }, 30000);
});
