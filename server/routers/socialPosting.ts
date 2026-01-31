import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { postToMultiplePlatforms } from "../social-posting";

export const socialPostingRouter = router({
  /**
   * Post content to selected social media platforms immediately
   */
  postNow: protectedProcedure
    .input(z.object({
      contentPostId: z.number(),
      platforms: z.array(z.enum(["facebook", "instagram", "linkedin"])),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get the content post
      const post = await db.getContentPostById(input.contentPostId);
      if (!post) {
        throw new Error("Content post not found");
      }

      // Get user's connected integrations
      const integrations = await db.getIntegrationsByUserId(ctx.user.id);
      
      // Filter for requested platforms that are connected
      const connectedPlatforms = integrations.filter(
        (integration) =>
          input.platforms.includes(integration.platform as any) &&
          integration.isConnected &&
          integration.accessToken
      );

      if (connectedPlatforms.length === 0) {
        throw new Error("No connected platforms found. Please connect your social media accounts first.");
      }

      // Prepare posting data
      const platformsToPost = connectedPlatforms.map((integration) => {
        if (integration.platform === "facebook") {
          return {
            platform: "facebook" as const,
            accessToken: integration.facebookPageAccessToken || integration.accessToken!,
            accountId: integration.facebookPageId || integration.accountId!,
          };
        } else if (integration.platform === "instagram") {
          return {
            platform: "instagram" as const,
            accessToken: integration.facebookPageAccessToken || integration.accessToken!,
            accountId: integration.instagramBusinessAccountId!,
          };
        } else if (integration.platform === "linkedin") {
          return {
            platform: "linkedin" as const,
            accessToken: integration.accessToken!,
            accountId: integration.accountId!,
            authorUrn: integration.accountId!, // LinkedIn uses URN format
          };
        }
        throw new Error(`Unsupported platform: ${integration.platform}`);
      });

      // Post to all platforms
      const results = await postToMultiplePlatforms(platformsToPost, {
        text: post.content,
        imageUrl: post.imageUrl || undefined,
      });

      // Track which platforms succeeded
      const successfulPlatforms = results
        .filter((r) => r.success)
        .map((r) => r.platform);

      // Update post status
      if (successfulPlatforms.length > 0) {
        await db.updateContentPost(input.contentPostId, {
          status: "published",
          publishedAt: new Date(),
          postedPlatforms: JSON.stringify(successfulPlatforms),
        });
      }

      return {
        success: successfulPlatforms.length > 0,
        results,
        postedPlatforms: successfulPlatforms,
      };
    }),

  /**
   * Schedule content to be posted at a specific time
   */
  schedulePost: protectedProcedure
    .input(z.object({
      contentPostId: z.number(),
      scheduledAt: z.date(),
      platforms: z.array(z.enum(["facebook", "instagram", "linkedin"])),
    }))
    .mutation(async ({ input }) => {
      // Update the content post with schedule
      await db.updateContentPost(input.contentPostId, {
        status: "scheduled",
        scheduledAt: input.scheduledAt,
        platforms: JSON.stringify(input.platforms),
      });

      // Create calendar event
      const post = await db.getContentPostById(input.contentPostId);
      if (post) {
        await db.createCalendarEvent({
          userId: post.userId,
          contentPostId: input.contentPostId,
          title: post.title || "Scheduled Post",
          description: post.content.substring(0, 200),
          eventDate: input.scheduledAt,
          eventType: "post",
        });
      }

      return { success: true };
    }),

  /**
   * Get posting status for a content post
   */
  getPostingStatus: protectedProcedure
    .input(z.object({ contentPostId: z.number() }))
    .query(async ({ input }) => {
      const post = await db.getContentPostById(input.contentPostId);
      if (!post) {
        throw new Error("Content post not found");
      }

      const postedPlatforms = post.postedPlatforms
        ? JSON.parse(post.postedPlatforms)
        : [];

      return {
        status: post.status,
        scheduledAt: post.scheduledAt,
        publishedAt: post.publishedAt,
        postedPlatforms,
        targetPlatforms: post.platforms ? JSON.parse(post.platforms) : [],
      };
    }),
});
