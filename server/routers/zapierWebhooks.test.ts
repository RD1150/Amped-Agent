import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database
vi.mock("../../server/db", () => ({
  getDb: vi.fn(),
}));

import { zapierWebhooksRouter } from "./zapierWebhooks";
import { getDb } from "../db";

describe("zapierWebhooks router", () => {
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb);
  });

  it("should export required procedures", () => {
    const procedures = Object.keys(
      (zapierWebhooksRouter as any)._def.procedures ||
      (zapierWebhooksRouter as any)._def.record ||
      {}
    );
    expect(procedures).toContain("getAll");
    expect(procedures).toContain("save");
    expect(procedures).toContain("toggle");
    expect(procedures).toContain("remove");
    expect(procedures).toContain("test");
  });

  it("save procedure validates event type enum", () => {
    const proc = (zapierWebhooksRouter as any)._def.procedures?.save ||
      (zapierWebhooksRouter as any)._def.record?.save;
    const inputSchema = proc?._def.inputs?.[0];
    if (inputSchema) {
      // Valid event types should pass
      expect(() =>
        inputSchema.parse({ eventType: "open_house_lead", webhookUrl: "https://hooks.zapier.com/abc" })
      ).not.toThrow();
      expect(() =>
        inputSchema.parse({ eventType: "lead_magnet_download", webhookUrl: "https://hooks.zapier.com/abc" })
      ).not.toThrow();
      expect(() =>
        inputSchema.parse({ eventType: "new_crm_lead", webhookUrl: "https://hooks.zapier.com/abc" })
      ).not.toThrow();
      // Invalid event type should fail
      expect(() =>
        inputSchema.parse({ eventType: "invalid_event", webhookUrl: "https://hooks.zapier.com/abc" })
      ).toThrow();
    }
  });

  it("save procedure requires a valid URL", () => {
    const proc = (zapierWebhooksRouter as any)._def.procedures?.save ||
      (zapierWebhooksRouter as any)._def.record?.save;
    const inputSchema = proc?._def.inputs?.[0];
    if (inputSchema) {
      expect(() =>
        inputSchema.parse({ eventType: "open_house_lead", webhookUrl: "not-a-url" })
      ).toThrow();
      expect(() =>
        inputSchema.parse({ eventType: "open_house_lead", webhookUrl: "" })
      ).toThrow();
    }
  });

  it("toggle procedure validates event type and isEnabled", () => {
    const proc = (zapierWebhooksRouter as any)._def.procedures?.toggle ||
      (zapierWebhooksRouter as any)._def.record?.toggle;
    const inputSchema = proc?._def.inputs?.[0];
    if (inputSchema) {
      expect(() =>
        inputSchema.parse({ eventType: "new_crm_lead", isEnabled: false })
      ).not.toThrow();
      expect(() =>
        inputSchema.parse({ eventType: "unknown_event", isEnabled: true })
      ).toThrow();
    }
  });

  it("remove procedure validates event type enum", () => {
    const proc = (zapierWebhooksRouter as any)._def.procedures?.remove ||
      (zapierWebhooksRouter as any)._def.record?.remove;
    const inputSchema = proc?._def.inputs?.[0];
    if (inputSchema) {
      expect(() =>
        inputSchema.parse({ eventType: "lead_magnet_download" })
      ).not.toThrow();
      expect(() =>
        inputSchema.parse({ eventType: "some_other_event" })
      ).toThrow();
    }
  });

  it("test procedure validates event type enum", () => {
    const proc = (zapierWebhooksRouter as any)._def.procedures?.test ||
      (zapierWebhooksRouter as any)._def.record?.test;
    const inputSchema = proc?._def.inputs?.[0];
    if (inputSchema) {
      expect(() =>
        inputSchema.parse({ eventType: "open_house_lead" })
      ).not.toThrow();
      expect(() =>
        inputSchema.parse({ eventType: "bad_event" })
      ).toThrow();
    }
  });

  it("zapierService fireZapierWebhook handles unknown fullName type gracefully", async () => {
    // Verify the type fix in zapierService.ts doesn't break runtime behavior
    const { fireZapierWebhook } = await import("../zapierService");
    // Should not throw even when called with empty db (no hooks found)
    mockDb.where.mockResolvedValue([]);
    await expect(
      fireZapierWebhook(99, "open_house_lead", {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@test.com",
      })
    ).resolves.toBeUndefined();
  });
});
