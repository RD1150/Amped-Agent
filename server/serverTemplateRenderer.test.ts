import { describe, it, expect } from "vitest";
import { renderTemplate } from "./templateRenderer";
import { TEMPLATE_LIBRARY } from "../shared/templates";

describe("Server-side Template Renderer", () => {
  it("should render template with user branding", async () => {
    const template = TEMPLATE_LIBRARY.find(t => t.category === "buyers");
    if (!template) {
      throw new Error("No buyers template found");
    }

    const imageUrl = await renderTemplate({
      template,
      postText: "First-Time Homebuyer Tips",
      agentName: "Reena Dutta",
      licenseNumber: "02194500",
      brokerageName: "Y Realty",
      brokerageDRE: "02202700",
      phone: "(805) 340-2583",
      headshotUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/kKyyMZGdWJkTbQNx.jpeg",
    });

    expect(imageUrl).toBeDefined();
    expect(imageUrl).toContain("https://");
    expect(imageUrl).toContain("generated-posts/");
  }, 30000); // 30 second timeout for image processing

  it("should handle missing persona data gracefully", async () => {
    const template = TEMPLATE_LIBRARY.find(t => t.category === "sellers");
    if (!template) {
      throw new Error("No sellers template found");
    }

    const imageUrl = await renderTemplate({
      template,
      postText: "Just Listed",
      // No persona data provided
    });

    expect(imageUrl).toBeDefined();
    expect(imageUrl).toContain("https://");
  }, 30000);

  it("should render different template categories", async () => {
    const categories = ["buyers", "sellers", "investors"];
    
    for (const category of categories) {
      const template = TEMPLATE_LIBRARY.find(t => t.category === category);
      if (!template) continue;

      const imageUrl = await renderTemplate({
        template,
        postText: `Test ${category} post`,
      });

      expect(imageUrl).toBeDefined();
      expect(imageUrl).toContain("https://");
    }
  }, 60000);
});
