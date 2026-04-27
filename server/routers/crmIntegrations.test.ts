import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database
vi.mock("../../server/db", () => ({
  getDb: vi.fn(),
}));

// Mock crmService
vi.mock("../../server/crmService", () => ({
  pushLeadToLofty: vi.fn(),
  pushLeadToFollowUpBoss: vi.fn(),
  pushLeadToKvcore: vi.fn(),
}));

import { crmIntegrationsRouter } from "./crmIntegrations";
import { getDb } from "../db";
import * as crmService from "../crmService";

describe("crmIntegrations router", () => {
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
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
      (crmIntegrationsRouter as any)._def.procedures ||
      (crmIntegrationsRouter as any)._def.record ||
      {}
    );
    expect(procedures).toContain("getAll");
    expect(procedures).toContain("save");
    expect(procedures).toContain("toggle");
    expect(procedures).toContain("remove");
    expect(procedures).toContain("test");
  });

  it("getAll procedure accepts valid input (no input required)", () => {
    // getAll is a query with no input - just verify it's defined
    const proc = (crmIntegrationsRouter as any)._def.procedures?.getAll ||
      (crmIntegrationsRouter as any)._def.record?.getAll;
    expect(proc).toBeDefined();
  });

  it("save procedure validates platform enum", () => {
    const proc = (crmIntegrationsRouter as any)._def.procedures?.save ||
      (crmIntegrationsRouter as any)._def.record?.save;
    expect(proc).toBeDefined();
    const inputSchema = proc._def.inputs?.[0];
    if (inputSchema) {
      // Valid platform should pass
      expect(() =>
        inputSchema.parse({ platform: "lofty", apiKey: "test-key", isEnabled: true })
      ).not.toThrow();
      // Invalid platform should fail
      expect(() =>
        inputSchema.parse({ platform: "invalid-crm", apiKey: "test-key", isEnabled: true })
      ).toThrow();
    }
  });

  it("save procedure rejects empty apiKey", () => {
    const proc = (crmIntegrationsRouter as any)._def.procedures?.save ||
      (crmIntegrationsRouter as any)._def.record?.save;
    const inputSchema = proc?._def.inputs?.[0];
    if (inputSchema) {
      expect(() =>
        inputSchema.parse({ platform: "lofty", apiKey: "", isEnabled: true })
      ).toThrow();
    }
  });

  it("toggle procedure validates platform and isEnabled", () => {
    const proc = (crmIntegrationsRouter as any)._def.procedures?.toggle ||
      (crmIntegrationsRouter as any)._def.record?.toggle;
    const inputSchema = proc?._def.inputs?.[0];
    if (inputSchema) {
      expect(() =>
        inputSchema.parse({ platform: "followupboss", isEnabled: false })
      ).not.toThrow();
      expect(() =>
        inputSchema.parse({ platform: "unknown", isEnabled: true })
      ).toThrow();
    }
  });

  it("remove procedure validates platform enum", () => {
    const proc = (crmIntegrationsRouter as any)._def.procedures?.remove ||
      (crmIntegrationsRouter as any)._def.record?.remove;
    const inputSchema = proc?._def.inputs?.[0];
    if (inputSchema) {
      expect(() => inputSchema.parse({ platform: "kvcore" })).not.toThrow();
      expect(() => inputSchema.parse({ platform: "salesforce" })).toThrow();
    }
  });

  it("test procedure validates platform enum", () => {
    const proc = (crmIntegrationsRouter as any)._def.procedures?.test ||
      (crmIntegrationsRouter as any)._def.record?.test;
    const inputSchema = proc?._def.inputs?.[0];
    if (inputSchema) {
      expect(() => inputSchema.parse({ platform: "lofty" })).not.toThrow();
      expect(() => inputSchema.parse({ platform: "hubspot" })).toThrow();
    }
  });
});
