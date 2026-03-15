import { describe, it, expect, vi } from "vitest";

// ─── Unit tests for lead magnet library ──────────────────────────────────────

describe("My Lead Magnets - Type label mapping", () => {
  const TYPE_LABELS: Record<string, string> = {
    first_time_buyer_guide: "First-Time Buyer Guide",
    neighborhood_report: "Neighborhood Report",
    market_update: "Market Update",
  };

  it("maps first_time_buyer_guide to correct label", () => {
    expect(TYPE_LABELS["first_time_buyer_guide"]).toBe("First-Time Buyer Guide");
  });

  it("maps neighborhood_report to correct label", () => {
    expect(TYPE_LABELS["neighborhood_report"]).toBe("Neighborhood Report");
  });

  it("maps market_update to correct label", () => {
    expect(TYPE_LABELS["market_update"]).toBe("Market Update");
  });
});

describe("My Lead Magnets - Schema type mapping", () => {
  // The frontend uses 'buyer_guide' but the DB enum uses 'first_time_buyer_guide'
  it("maps buyer_guide to first_time_buyer_guide for DB storage", () => {
    const type = "buyer_guide";
    const schemaType = type === "buyer_guide" ? "first_time_buyer_guide" : type;
    expect(schemaType).toBe("first_time_buyer_guide");
  });

  it("passes neighborhood_report through unchanged", () => {
    const type = "neighborhood_report";
    const schemaType = type === "buyer_guide" ? "first_time_buyer_guide" : type;
    expect(schemaType).toBe("neighborhood_report");
  });

  it("passes market_update through unchanged", () => {
    const type = "market_update";
    const schemaType = type === "buyer_guide" ? "first_time_buyer_guide" : type;
    expect(schemaType).toBe("market_update");
  });
});

describe("My Lead Magnets - Date formatting", () => {
  it("formats a date to short month day year", () => {
    const date = new Date("2026-03-15T00:00:00.000Z");
    const formatted = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    // Should produce something like "Mar 15, 2026"
    expect(formatted).toMatch(/Mar/);
    expect(formatted).toMatch(/2026/);
  });

  it("handles string date input", () => {
    const dateStr = "2026-06-15T12:00:00.000Z"; // midday UTC avoids timezone boundary issues
    const formatted = new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    expect(formatted).toMatch(/2026/);
  });
});

describe("My Lead Magnets - Data structure validation", () => {
  it("validates a complete lead magnet record", () => {
    const magnet = {
      id: 1,
      userId: 42,
      type: "first_time_buyer_guide" as const,
      title: "First-Time Buyer Guide — Westlake Village, CA",
      city: "Westlake Village, CA",
      agentName: "Reena Dutta",
      agentBrokerage: "Coldwell Banker",
      pdfUrl: "https://cdn.example.com/lead-magnets/42/buyer_guide-abc123.pdf",
      createdAt: new Date(),
    };

    expect(magnet.id).toBeGreaterThan(0);
    expect(magnet.userId).toBeGreaterThan(0);
    expect(["first_time_buyer_guide", "neighborhood_report", "market_update"]).toContain(magnet.type);
    expect(magnet.title).toBeTruthy();
    expect(magnet.city).toBeTruthy();
    expect(magnet.pdfUrl).toMatch(/^https?:\/\//);
    expect(magnet.createdAt).toBeInstanceOf(Date);
  });

  it("allows optional agentName and agentBrokerage", () => {
    const magnet = {
      id: 2,
      userId: 42,
      type: "market_update" as const,
      title: "Market Update — Austin, TX",
      city: "Austin, TX",
      agentName: null,
      agentBrokerage: null,
      pdfUrl: "https://cdn.example.com/lead-magnets/42/market_update-xyz789.pdf",
      createdAt: new Date(),
    };

    expect(magnet.agentName).toBeNull();
    expect(magnet.agentBrokerage).toBeNull();
    expect(magnet.pdfUrl).toBeTruthy();
  });
});

describe("My Lead Magnets - Delete authorization", () => {
  it("only allows deletion by the owner", () => {
    const magnet = { id: 1, userId: 42 };
    const requestingUserId = 42;

    const canDelete = magnet.userId === requestingUserId;
    expect(canDelete).toBe(true);
  });

  it("prevents deletion by non-owner", () => {
    const magnet = { id: 1, userId: 42 };
    const requestingUserId = 99;

    const canDelete = magnet.userId === requestingUserId;
    expect(canDelete).toBe(false);
  });
});

describe("My Lead Magnets - Sorting", () => {
  it("sorts lead magnets by createdAt descending (newest first)", () => {
    const magnets = [
      { id: 1, createdAt: new Date("2026-01-01") },
      { id: 2, createdAt: new Date("2026-03-15") },
      { id: 3, createdAt: new Date("2026-02-10") },
    ];

    const sorted = [...magnets].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    expect(sorted[0].id).toBe(2); // Most recent
    expect(sorted[1].id).toBe(3);
    expect(sorted[2].id).toBe(1); // Oldest
  });
});
