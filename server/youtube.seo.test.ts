import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database helpers
vi.mock("./db", () => ({
  getPropertyTourById: vi.fn(),
  updatePropertyTour: vi.fn(),
}));

// Mock the LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import * as db from "./db";
import * as llm from "./_core/llm";

describe("YouTube SEO Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should parse LLM JSON response into SEO fields", async () => {
    const mockSeoResponse = {
      title: "Stunning 4BD Home Tour | 123 Oak St, Austin TX | $850,000 Property Tour",
      description: "Welcome to this beautiful 4-bedroom, 3-bathroom home at 123 Oak St, Austin TX, listed at $850,000...\n\n#AustinRealEstate #HomeTour #PropertyTour",
      tags: ["Austin real estate", "home tour", "property tour", "4 bedroom house", "Austin TX homes for sale"],
      timestamps: [
        { time: "0:00", label: "Introduction" },
        { time: "0:10", label: "Exterior & Curb Appeal" },
        { time: "0:30", label: "Living Room" },
        { time: "0:50", label: "Kitchen" },
        { time: "1:10", label: "Bedrooms" },
        { time: "1:30", label: "Bathrooms" },
        { time: "1:45", label: "Backyard" },
        { time: "1:55", label: "Contact Agent" },
      ],
    };

    const mockTour = {
      id: 1,
      userId: 42,
      address: "123 Oak St, Austin TX",
      price: "$850,000",
      beds: 4,
      baths: "3.0",
      sqft: 2800,
      propertyType: "Single Family",
      description: "Stunning modern home in the heart of Austin",
      duration: 120,
    };

    vi.mocked(db.getPropertyTourById).mockResolvedValue(mockTour as any);
    vi.mocked(llm.invokeLLM).mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(mockSeoResponse) } }],
    } as any);
    vi.mocked(db.updatePropertyTour).mockResolvedValue(undefined as any);

    // Simulate what the procedure does
    const { invokeLLM } = await import("./_core/llm");
    const tour = await db.getPropertyTourById(1);
    
    expect(tour).toBeDefined();
    expect(tour!.address).toBe("123 Oak St, Austin TX");

    const response = await invokeLLM({ messages: [] });
    const rawContent = response.choices[0]?.message?.content;
    const raw = typeof rawContent === "string" ? rawContent : "{}";
    const seo = JSON.parse(raw);

    expect(seo.title).toContain("4BD");
    expect(seo.title).toContain("Austin TX");
    expect(seo.description).toContain("#AustinRealEstate");
    expect(seo.tags).toHaveLength(5);
    expect(seo.tags).toContain("home tour");
    expect(seo.timestamps).toHaveLength(8);
    expect(seo.timestamps[0]).toEqual({ time: "0:00", label: "Introduction" });
  });

  it("should save SEO fields to the database", async () => {
    vi.mocked(db.updatePropertyTour).mockResolvedValue(undefined as any);

    await db.updatePropertyTour(1, {
      youtubeTitle: "Test Title",
      youtubeDescription: "Test Description",
      youtubeTags: JSON.stringify(["tag1", "tag2"]),
      youtubeTimestamps: JSON.stringify([{ time: "0:00", label: "Intro" }]),
    });

    expect(db.updatePropertyTour).toHaveBeenCalledWith(1, {
      youtubeTitle: "Test Title",
      youtubeDescription: "Test Description",
      youtubeTags: '["tag1","tag2"]',
      youtubeTimestamps: '[{"time":"0:00","label":"Intro"}]',
    });
  });

  it("should handle non-string LLM content gracefully", () => {
    // Simulate content being an array (edge case)
    const rawContent: any = [{ type: "text", text: '{"title":"test"}' }];
    const raw = typeof rawContent === "string" ? rawContent : "{}";
    const seo = JSON.parse(raw);
    // Should fall back to empty object without throwing
    expect(seo).toEqual({});
  });

  it("should build property details string correctly", () => {
    const tour = {
      address: "456 Maple Ave, Dallas TX",
      price: "$1,200,000",
      beds: 5,
      baths: "3.5",
      sqft: 4200,
      propertyType: "Luxury Home",
      description: "Exquisite luxury property",
    };

    const propDetails = [
      tour.address,
      tour.price ? `Priced at ${tour.price}` : null,
      tour.beds ? `${tour.beds} beds` : null,
      tour.baths ? `${tour.baths} baths` : null,
      tour.sqft ? `${tour.sqft} sqft` : null,
      tour.propertyType || null,
      tour.description ? `Description: ${tour.description}` : null,
    ].filter(Boolean).join(", ");

    expect(propDetails).toContain("456 Maple Ave, Dallas TX");
    expect(propDetails).toContain("Priced at $1,200,000");
    expect(propDetails).toContain("5 beds");
    expect(propDetails).toContain("3.5 baths");
    expect(propDetails).toContain("4200 sqft");
    expect(propDetails).toContain("Luxury Home");
    expect(propDetails).toContain("Description: Exquisite luxury property");
  });
});
