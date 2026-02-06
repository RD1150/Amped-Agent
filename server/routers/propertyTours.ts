import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import { generatePropertyTourVideo, checkRenderStatus } from "../videoGenerator";
import { storagePut } from "../storage";
import { fetchPropertyData } from "../rapidapi";

export const propertyToursRouter = router({
  /**
   * Create a new property tour (without video generation yet)
   */
  create: protectedProcedure
    .input(
      z.object({
        address: z.string().min(1, "Address is required"),
        price: z.string().optional(),
        beds: z.number().int().min(0).optional(),
        baths: z.number().min(0).optional(),
        sqft: z.number().int().min(0).optional(),
        propertyType: z.string().optional(),
        description: z.string().optional(),
        features: z.array(z.string()).optional(),
        imageUrls: z.array(z.string().url()).min(1, "At least one image is required"),
        template: z.enum(["modern", "luxury", "cozy"]).default("modern"),
        duration: z.number().int().min(15).max(120).default(30),
        includeBranding: z.boolean().default(true),
        aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
        musicTrack: z.string().optional(),
        cardTemplate: z.enum(["modern", "luxury", "bold", "classic", "contemporary"]).default("modern"),
        includeIntroVideo: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tour = await db.createPropertyTour({
        userId: ctx.user.id,
        address: input.address,
        price: input.price,
        beds: input.beds,
        baths: input.baths ? input.baths.toString() : undefined,
        sqft: input.sqft,
        propertyType: input.propertyType,
        description: input.description,
        features: input.features ? JSON.stringify(input.features) : undefined,
        imageUrls: JSON.stringify(input.imageUrls),
        template: input.template,
        duration: input.duration,
        includeBranding: input.includeBranding,
        aspectRatio: input.aspectRatio,
        musicTrack: input.musicTrack,
        cardTemplate: input.cardTemplate,
        includeIntroVideo: input.includeIntroVideo,
        status: "pending",
      });

      return tour;
    }),

  /**
   * Generate video for a property tour
   */
  generateVideo: protectedProcedure
    .input(z.object({ tourId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      // Get the tour
      const tour = await db.getPropertyTourById(input.tourId);
      if (!tour) {
        throw new Error("Property tour not found");
      }

      // Verify ownership
      if (tour.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // Check if already processing or completed
      if (tour.status === "processing") {
        throw new Error("Video is already being generated");
      }
      if (tour.status === "completed" && tour.videoUrl) {
        return { videoUrl: tour.videoUrl, thumbnailUrl: tour.thumbnailUrl };
      }

      // Update status to processing
      await db.updatePropertyTour(input.tourId, { status: "processing" });

      try {
        // Parse image URLs
        const imageUrls = JSON.parse(tour.imageUrls) as string[];

        // Generate video with Shotstack (async)
        const { renderId } = await generatePropertyTourVideo({
          imageUrls,
          propertyDetails: {
            address: tour.address,
            price: tour.price || undefined,
            beds: tour.beds || undefined,
            baths: tour.baths ? parseFloat(tour.baths) : undefined,
            sqft: tour.sqft || undefined,
            propertyType: tour.propertyType || undefined,
            description: tour.description || undefined,
          },
          template: (tour.template as "modern" | "luxury" | "cozy") || "modern",
          duration: tour.duration || 30,
          includeBranding: tour.includeBranding ?? true,
          userId: ctx.user.id,
          aspectRatio: (tour.aspectRatio as "16:9" | "9:16" | "1:1") || "16:9",
          musicTrack: tour.musicTrack || undefined,
          cardTemplate: (tour.cardTemplate as "modern" | "luxury" | "bold" | "classic" | "contemporary") || "modern",
          includeIntroVideo: tour.includeIntroVideo ?? false,
        });

        // Store render ID for polling
        await db.updatePropertyTour(input.tourId, {
          videoUrl: renderId, // Store renderId temporarily
          status: "processing",
        });

        return { renderId };
      } catch (error) {
        // Update status to failed
        await db.updatePropertyTour(input.tourId, {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    }),

  /**
   * Check render status and update tour when complete
   */
  checkRenderStatus: protectedProcedure
    .input(z.object({ tourId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tour = await db.getPropertyTourById(input.tourId);
      if (!tour) {
        throw new Error("Property tour not found");
      }

      // Verify ownership
      if (tour.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // If already completed or failed, return current status
      if (tour.status === "completed" || tour.status === "failed") {
        return {
          status: tour.status,
          videoUrl: tour.videoUrl,
          thumbnailUrl: tour.thumbnailUrl,
          error: tour.errorMessage,
        };
      }

      // Check Shotstack render status
      if (tour.status === "processing" && tour.videoUrl) {
        const renderId = tour.videoUrl; // videoUrl temporarily stores renderId
        const renderStatus = await checkRenderStatus(renderId);

        if (renderStatus.status === "done" && renderStatus.url) {
          // Update tour with final video URL and thumbnail
          await db.updatePropertyTour(input.tourId, {
            videoUrl: renderStatus.url,
            thumbnailUrl: renderStatus.thumbnail,
            status: "completed",
          });

          return {
            status: "completed" as const,
            videoUrl: renderStatus.url,
            thumbnailUrl: renderStatus.thumbnail,
          };
        } else if (renderStatus.status === "failed") {
          await db.updatePropertyTour(input.tourId, {
            status: "failed",
            errorMessage: renderStatus.error || "Video generation failed",
          });

          return {
            status: "failed" as const,
            error: renderStatus.error,
          };
        }

        // Still processing
        return {
          status: "processing" as const,
        };
      }

      return {
        status: tour.status as any,
      };
    }),

  /**
   * Get all property tours for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const tours = await db.getPropertyToursByUserId(ctx.user.id);
    return tours;
  }),

  /**
   * Get a single property tour by ID
   */
  getById: protectedProcedure
    .input(z.object({ tourId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tour = await db.getPropertyTourById(input.tourId);
      if (!tour) {
        throw new Error("Property tour not found");
      }

      // Verify ownership
      if (tour.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      return tour;
    }),

  /**
   * Delete a property tour
   */
  delete: protectedProcedure
    .input(z.object({ tourId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const tour = await db.getPropertyTourById(input.tourId);
      if (!tour) {
        throw new Error("Property tour not found");
      }

      // Verify ownership
      if (tour.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      await db.deletePropertyTour(input.tourId);
      return { success: true };
    }),

  /**
   * Upload property images to S3
   */
  uploadImages: protectedProcedure
    .input(
      z.object({
        images: z.array(
          z.object({
            filename: z.string(),
            data: z.string(), // base64 encoded image data
            mimeType: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const uploadedUrls: string[] = [];

      for (const image of input.images) {
        // Decode base64
        const buffer = Buffer.from(image.data, "base64");

        // Generate unique key
        const ext = image.filename.split(".").pop() || "jpg";
        const key = `property-tours/${ctx.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        // Upload to S3
        const { url } = await storagePut(key, buffer, image.mimeType);
        uploadedUrls.push(url);
      }

      return { urls: uploadedUrls };
    }),

  /**
   * Fetch property data from RapidAPI by MLS ID
   */
  fetchPropertyData: protectedProcedure
    .input(
      z.object({
        mlsId: z.string().min(1, "MLS ID is required"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const propertyData = await fetchPropertyData(input.mlsId);
        return propertyData;
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to fetch property data. Please check the MLS ID and try again."
        );
      }
    }),
});
