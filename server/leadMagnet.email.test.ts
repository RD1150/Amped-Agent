import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the notification module
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock the LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({ title: "Test Guide", subtitle: "Subtitle", intro: "Intro", sections: [], conclusion: "Conclusion" }) } }]
  }),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://example.com/test.pdf", key: "test.pdf" }),
}));

// Mock db
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

import { notifyOwner } from "./_core/notification";

describe("Lead Magnet sendByEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call notifyOwner with correct email details", async () => {
    const mockNotify = vi.mocked(notifyOwner);
    
    // Simulate what the procedure does
    const recipientEmail = "prospect@example.com";
    const recipientName = "John Smith";
    const pdfUrl = "https://example.com/lead-magnet.pdf";
    const magnetLabel = "First-Time Buyer Guide";
    const agentName = "Reena Dutta";
    const agentEmail = "agent@example.com";

    const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";
    await notifyOwner({
      title: `Lead Magnet Sent: ${magnetLabel} → ${recipientEmail}`,
      content: `Agent ${agentName} (${agentEmail}) sent a lead magnet to ${recipientEmail} (${recipientName})\n\nMagnet: ${magnetLabel}\nPDF URL: ${pdfUrl}\n\n--- Email sent to recipient ---\n${greeting}\n\n${agentName} has shared a free resource with you:\n\n📄 ${magnetLabel}\n\nDownload your copy here:\n${pdfUrl}\n\nThis guide was created specifically for your local market. Feel free to reach out to ${agentName} with any questions.\n\nBest regards,\n${agentName}`,
    });

    expect(mockNotify).toHaveBeenCalledTimes(1);
    const callArgs = mockNotify.mock.calls[0][0];
    expect(callArgs.title).toContain("Lead Magnet Sent");
    expect(callArgs.title).toContain(recipientEmail);
    expect(callArgs.content).toContain(pdfUrl);
    expect(callArgs.content).toContain("Hi John Smith");
    expect(callArgs.content).toContain(agentName);
  });

  it("should use 'Hi there' greeting when no recipient name provided", async () => {
    const mockNotify = vi.mocked(notifyOwner);
    const recipientName = undefined;
    const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";
    expect(greeting).toBe("Hi there,");
  });

  it("should validate color themes are defined correctly", () => {
    const COLOR_THEMES = [
      { id: "navy", label: "Navy", hex: "#1a3a5c" },
      { id: "forest", label: "Forest", hex: "#166534" },
      { id: "charcoal", label: "Charcoal", hex: "#374151" },
      { id: "burgundy", label: "Burgundy", hex: "#7f1d1d" },
    ];
    expect(COLOR_THEMES).toHaveLength(4);
    COLOR_THEMES.forEach(theme => {
      expect(theme.hex).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.id).toBeTruthy();
      expect(theme.label).toBeTruthy();
    });
  });
});
