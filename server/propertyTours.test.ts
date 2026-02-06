import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

// Mock user for testing
const mockUser = {
  id: 1,
  openId: "test-user",
  name: "Test Agent",
  email: "test@example.com",
  loginMethod: "oauth",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  subscriptionTier: "starter" as const,
  subscriptionStatus: "inactive" as const,
  subscriptionEndDate: null,
  cancelAtPeriodEnd: false,
  ghlSubAccountId: null,
  ghlLocationId: null,
  ghlSubAccountCreatedAt: null,
  avatarImageUrl: null,
  avatarVideoUrl: null,
};

// Mock context
const createMockContext = (user: typeof mockUser | null = mockUser): Context => ({
  user,
  req: {} as any,
  res: {} as any,
});

describe("Property Tours", () => {
  describe("create", () => {
    it("should create a property tour with valid data", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const result = await caller.propertyTours.create({
        address: "123 Main St, Los Angeles, CA 90001",
        price: "$1,500,000",
        beds: 4,
        baths: 3.5,
        sqft: 3200,
        propertyType: "Single Family",
        description: "Beautiful modern home with pool",
        features: ["Pool", "Hardwood Floors", "Updated Kitchen"],
        imageUrls: [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg",
        ],
        template: "modern",
        duration: 30,
      });

      expect(result).toBeDefined();
      expect(result.address).toBe("123 Main St, Los Angeles, CA 90001");
      expect(result.price).toBe("$1,500,000");
      expect(result.beds).toBe(4);
      expect(result.status).toBe("pending");
      expect(result.includeBranding).toBe(true); // Default value
    });

    it("should create a property tour with branding disabled", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const result = await caller.propertyTours.create({
        address: "456 Test St, Los Angeles, CA 90001",
        imageUrls: ["https://example.com/image1.jpg"],
        template: "modern",
        duration: 30,
        includeBranding: false,
      });

      expect(result).toBeDefined();
      expect(result.includeBranding).toBe(false);
    });

    it("should create a property tour with branding enabled explicitly", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const result = await caller.propertyTours.create({
        address: "789 Test Ave, Los Angeles, CA 90001",
        imageUrls: ["https://example.com/image1.jpg"],
        template: "modern",
        duration: 30,
        includeBranding: true,
      });

      expect(result).toBeDefined();
      expect(result.includeBranding).toBe(true);
    });

    it("should create a property tour with custom aspect ratio", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const result = await caller.propertyTours.create({
        address: "Vertical Video Test",
        imageUrls: ["https://example.com/image1.jpg"],
        template: "modern",
        duration: 30,
        aspectRatio: "9:16",
      });

      expect(result).toBeDefined();
      expect(result.aspectRatio).toBe("9:16");
    });

    it("should create a property tour with background music", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const result = await caller.propertyTours.create({
        address: "Music Test Property",
        imageUrls: ["https://example.com/image1.jpg"],
        template: "luxury",
        duration: 45,
        musicTrack: "elegant",
      });

      expect(result).toBeDefined();
      expect(result.musicTrack).toBe("elegant");
    });

    it("should create a property tour with all custom options", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const result = await caller.propertyTours.create({
        address: "Full Options Test",
        imageUrls: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
        template: "cozy",
        duration: 60,
        includeBranding: false,
        aspectRatio: "1:1",
        musicTrack: "calm",
      });

      expect(result).toBeDefined();
      expect(result.aspectRatio).toBe("1:1");
      expect(result.musicTrack).toBe("calm");
      expect(result.includeBranding).toBe(false);
    });

    it("should create a property tour with 15 second duration", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const result = await caller.propertyTours.create({
        address: "Short Video Test",
        imageUrls: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
        template: "modern",
        duration: 15,
      });

      expect(result).toBeDefined();
      expect(result.duration).toBe(15);
    });

    it("should create a property tour with 30 second duration", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const result = await caller.propertyTours.create({
        address: "Medium Video Test",
        imageUrls: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
        template: "modern",
        duration: 30,
      });

      expect(result).toBeDefined();
      expect(result.duration).toBe(30);
    });

    it("should create a property tour with 60 second duration", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const result = await caller.propertyTours.create({
        address: "Long Video Test",
        imageUrls: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
        template: "modern",
        duration: 60,
      });

      expect(result).toBeDefined();
      expect(result.duration).toBe(60);
    });

    it("should create a property tour with luxury card template", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const result = await caller.propertyTours.create({
        address: "Luxury Template Test",
        imageUrls: ["https://example.com/image1.jpg"],
        template: "modern",
        duration: 30,
        cardTemplate: "luxury",
      });

      expect(result).toBeDefined();
      expect(result.cardTemplate).toBe("luxury");
    });

    it("should create a property tour with bold card template", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const result = await caller.propertyTours.create({
        address: "Bold Template Test",
        imageUrls: ["https://example.com/image1.jpg"],
        template: "modern",
        duration: 30,
        cardTemplate: "bold",
      });

      expect(result).toBeDefined();
      expect(result.cardTemplate).toBe("bold");
    });

    it("should create a property tour with contemporary card template", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const result = await caller.propertyTours.create({
        address: "Contemporary Template Test",
        imageUrls: ["https://example.com/image1.jpg"],
        template: "modern",
        duration: 30,
        cardTemplate: "contemporary",
      });

      expect(result).toBeDefined();
      expect(result.cardTemplate).toBe("contemporary");
    });

    it("should require address", async () => {
      const caller = appRouter.createCaller(createMockContext());

      await expect(
        caller.propertyTours.create({
          address: "",
          imageUrls: ["https://example.com/image1.jpg"],
          template: "modern",
          duration: 30,
        })
      ).rejects.toThrow();
    });

    it("should require at least one image", async () => {
      const caller = appRouter.createCaller(createMockContext());

      await expect(
        caller.propertyTours.create({
          address: "123 Main St",
          imageUrls: [],
          template: "modern",
          duration: 30,
        })
      ).rejects.toThrow();
    });
  });

  describe("list", () => {
    it("should return property tours for the current user", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Create a tour first
      await caller.propertyTours.create({
        address: "456 Oak Ave, Beverly Hills, CA 90210",
        price: "$3,000,000",
        beds: 5,
        baths: 4.5,
        sqft: 5000,
        imageUrls: ["https://example.com/image1.jpg"],
        template: "luxury",
        duration: 45,
      });

      const tours = await caller.propertyTours.list();

      expect(tours).toBeDefined();
      expect(Array.isArray(tours)).toBe(true);
      expect(tours.length).toBeGreaterThan(0);
    });
  });

  describe("getById", () => {
    it("should return a specific property tour", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Create a tour
      const created = await caller.propertyTours.create({
        address: "789 Beach Blvd, Malibu, CA 90265",
        price: "$5,000,000",
        imageUrls: ["https://example.com/image1.jpg"],
        template: "luxury",
        duration: 60,
      });

      const tour = await caller.propertyTours.getById({ tourId: created.id });

      expect(tour).toBeDefined();
      expect(tour.id).toBe(created.id);
      expect(tour.address).toBe("789 Beach Blvd, Malibu, CA 90265");
    });

    it("should throw error for non-existent tour", async () => {
      const caller = appRouter.createCaller(createMockContext());

      await expect(
        caller.propertyTours.getById({ tourId: 999999 })
      ).rejects.toThrow("Property tour not found");
    });
  });

  describe("delete", () => {
    it("should delete a property tour", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Create a tour
      const created = await caller.propertyTours.create({
        address: "321 Hill Dr, Hollywood, CA 90028",
        imageUrls: ["https://example.com/image1.jpg"],
        template: "modern",
        duration: 30,
      });

      // Delete it
      const result = await caller.propertyTours.delete({ tourId: created.id });

      expect(result.success).toBe(true);

      // Verify it's deleted
      await expect(
        caller.propertyTours.getById({ tourId: created.id })
      ).rejects.toThrow("Property tour not found");
    });
  });

  describe("uploadImages", () => {
    it("should upload images to S3", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Create a small test image (1x1 red pixel PNG)
      const testImageBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

      const result = await caller.propertyTours.uploadImages({
        images: [
          {
            filename: "test.png",
            data: testImageBase64,
            mimeType: "image/png",
          },
        ],
      });

      expect(result).toBeDefined();
      expect(result.urls).toBeDefined();
      expect(Array.isArray(result.urls)).toBe(true);
      expect(result.urls.length).toBe(1);
      expect(result.urls[0]).toContain("http");
    });
  });

  describe("authorization", () => {
    it("should not allow accessing another user's tour", async () => {
      const caller1 = appRouter.createCaller(createMockContext(mockUser));
      const caller2 = appRouter.createCaller(
        createMockContext({ ...mockUser, id: 2, openId: "test-user-2" })
      );

      // User 1 creates a tour
      const tour = await caller1.propertyTours.create({
        address: "Private Property",
        imageUrls: ["https://example.com/image1.jpg"],
        template: "modern",
        duration: 30,
      });

      // User 2 tries to access it
      await expect(
        caller2.propertyTours.getById({ tourId: tour.id })
      ).rejects.toThrow("Unauthorized");
    });

    it("should not allow deleting another user's tour", async () => {
      const caller1 = appRouter.createCaller(createMockContext(mockUser));
      const caller2 = appRouter.createCaller(
        createMockContext({ ...mockUser, id: 2, openId: "test-user-2" })
      );

      // User 1 creates a tour
      const tour = await caller1.propertyTours.create({
        address: "Private Property",
        imageUrls: ["https://example.com/image1.jpg"],
        template: "modern",
        duration: 30,
      });

      // User 2 tries to delete it
      await expect(
        caller2.propertyTours.delete({ tourId: tour.id })
      ).rejects.toThrow("Unauthorized");
    });
  });
});
