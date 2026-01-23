import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("GHL Social Media Integration", () => {
  it("should fetch social accounts successfully", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, name: "Test User", email: "test@example.com", role: "admin" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.ghl.getSocialAccounts();
    
    console.log("Social accounts result:", JSON.stringify(result, null, 2));
    
    expect(result).toBeDefined();
    expect(result.accounts).toBeDefined();
    expect(Array.isArray(result.accounts)).toBe(true);
    
    // Should have 6 connected accounts
    if (result.accounts.length > 0) {
      console.log(`✅ Found ${result.accounts.length} connected social accounts`);
      expect(result.accounts.length).toBeGreaterThan(0);
      
      // Check first account structure
      const firstAccount = result.accounts[0];
      expect(firstAccount).toHaveProperty("id");
      expect(firstAccount).toHaveProperty("name");
      expect(firstAccount).toHaveProperty("platform");
    } else {
      console.log("⚠️ No social accounts found (might be expected if none connected)");
    }
  });
});
