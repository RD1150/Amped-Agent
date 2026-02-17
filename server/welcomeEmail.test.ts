import { describe, it, expect, vi } from "vitest";
import { sendWelcomeEmail } from "./_core/welcomeEmail";
import * as notification from "./_core/notification";

vi.mock("./_core/notification");

describe("Welcome Email", () => {
  it("should send welcome email notification", async () => {
    const mockNotifyOwner = vi.spyOn(notification, "notifyOwner").mockResolvedValue(true);
    
    const result = await sendWelcomeEmail({
      userName: "John Doe",
      userEmail: "john@example.com",
    });
    
    expect(result).toBe(true);
    expect(mockNotifyOwner).toHaveBeenCalledWith({
      title: "New User: John Doe completed onboarding",
      content: expect.stringContaining("John Doe"),
    });
  });
  
  it("should handle notification failure gracefully", async () => {
    vi.spyOn(notification, "notifyOwner").mockResolvedValue(false);
    
    const result = await sendWelcomeEmail({
      userName: "Jane Smith",
      userEmail: "jane@example.com",
    });
    
    expect(result).toBe(false);
  });
  
  it("should handle errors gracefully", async () => {
    vi.spyOn(notification, "notifyOwner").mockRejectedValue(new Error("Network error"));
    
    const result = await sendWelcomeEmail({
      userName: "Bob Johnson",
      userEmail: "bob@example.com",
    });
    
    expect(result).toBe(false);
  });
});
