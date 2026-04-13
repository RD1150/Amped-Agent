import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test Agent",
    loginMethod: "manus",
    role: "user",
        subscriptionStatus: "active" as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("autoreels.customTemplates", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let createdTemplateId: number;

  beforeAll(() => {
    const ctx = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  it("should create a custom prompt template", async () => {
    const result = await caller.autoreels.createCustomTemplate({
      label: "Test Template",
      prompt: "This is a test prompt for automated testing",
    });

    expect(result).toBeDefined();
    // Store the ID for later tests (assuming the mutation returns an insertId or similar)
  });

  it("should list custom templates for user", async () => {
    const templates = await caller.autoreels.getCustomTemplates();

    expect(Array.isArray(templates)).toBe(true);
    // Should have at least the one we just created
    expect(templates.length).toBeGreaterThan(0);
    
    // Find our test template
    const testTemplate = templates.find(t => t.label === "Test Template");
    expect(testTemplate).toBeDefined();
    expect(testTemplate?.prompt).toBe("This is a test prompt for automated testing");
    
    if (testTemplate) {
      createdTemplateId = testTemplate.id;
    }
  });

  it("should delete a custom template", async () => {
    // Get templates before delete
    const beforeTemplates = await caller.autoreels.getCustomTemplates();
    const testTemplate = beforeTemplates.find(t => t.label === "Test Template");
    
    if (testTemplate) {
      await caller.autoreels.deleteCustomTemplate({ id: testTemplate.id });
      
      // Verify it's deleted
      const afterTemplates = await caller.autoreels.getCustomTemplates();
      const deletedTemplate = afterTemplates.find(t => t.id === testTemplate.id);
      expect(deletedTemplate).toBeUndefined();
    }
  });

  it("should reject template with empty label", async () => {
    await expect(
      caller.autoreels.createCustomTemplate({
        label: "",
        prompt: "Valid prompt",
      })
    ).rejects.toThrow();
  });

  it("should reject template with empty prompt", async () => {
    await expect(
      caller.autoreels.createCustomTemplate({
        label: "Valid Label",
        prompt: "",
      })
    ).rejects.toThrow();
  });
});
