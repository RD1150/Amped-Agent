import { describe, it, expect, vi } from "vitest";
import { sendWelcomeEmail } from "./_core/welcomeEmail";

// Mock the emailService module so tests don't hit Resend API
vi.mock("./emailService", () => ({
  sendWelcomeEmail: vi.fn(),
}));

describe("Welcome Email", () => {
  it("should delegate to emailService and return true on success", async () => {
    const { sendWelcomeEmail: mockSend } = await import("./emailService");
    vi.mocked(mockSend).mockResolvedValue(true);

    const result = await sendWelcomeEmail({
      userName: "John Doe",
      userEmail: "john@example.com",
    });

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledWith({
      userName: "John Doe",
      userEmail: "john@example.com",
    });
  });

  it("should return false when emailService returns false", async () => {
    const { sendWelcomeEmail: mockSend } = await import("./emailService");
    vi.mocked(mockSend).mockResolvedValue(false);

    const result = await sendWelcomeEmail({
      userName: "Jane Smith",
      userEmail: "jane@example.com",
    });

    expect(result).toBe(false);
  });

  it("should handle errors gracefully and return false", async () => {
    const { sendWelcomeEmail: mockSend } = await import("./emailService");
    vi.mocked(mockSend).mockRejectedValue(new Error("Network error"));

    const result = await sendWelcomeEmail({
      userName: "Bob Johnson",
      userEmail: "bob@example.com",
    });

    expect(result).toBe(false);
  });
});
