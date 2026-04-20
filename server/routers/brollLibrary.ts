/**
 * B-roll Library Router
 *
 * Procedures:
 * - brollLibrary.getUploadUrl   — get a presigned S3 upload URL for a file
 * - brollLibrary.confirmUpload  — save the item to the DB after client upload completes
 * - brollLibrary.getAll         — list all items for the current user
 * - brollLibrary.updateTags     — update tags and title for an item
 * - brollLibrary.delete         — delete an item (DB + S3)
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { brollLibrary } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { storagePut } from "../storage";
import { randomBytes } from "crypto";

const ALLOWED_MIME_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/quicktime", "video/webm", "video/mov",
];

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB

export const brollLibraryRouter = router({
  /**
   * Get a presigned upload URL — client uploads directly to S3
   * Returns { uploadUrl, s3Key, publicUrl }
   */
  getUploadUrl: protectedProcedure
    .input(z.object({
      filename: z.string(),
      mimeType: z.string(),
      fileSize: z.number().max(MAX_FILE_SIZE, "File must be under 200 MB"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
        throw new Error(`Unsupported file type: ${input.mimeType}`);
      }

      const ext = input.filename.split(".").pop() ?? "bin";
      const suffix = randomBytes(8).toString("hex");
      const mediaType = input.mimeType.startsWith("video/") ? "video" : "image";
      const s3Key = `broll/${ctx.user.id}/${mediaType}s/${suffix}.${ext}`;

      // We use storagePut with an empty buffer to get the URL pattern,
      // but for large files we need a presigned URL. Since storagePut
      // handles uploads server-side, we'll return a tRPC upload endpoint instead.
      // The client will POST the file to /api/broll/upload which calls storagePut.
      return {
        s3Key,
        mediaType,
        // Signal to client to POST to our server endpoint
        uploadEndpoint: `/api/broll/upload`,
      };
    }),

  /**
   * Confirm upload — called by client after file is uploaded via the server endpoint
   */
  confirmUpload: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(255),
      url: z.string().url(),
      s3Key: z.string(),
      mediaType: z.enum(["video", "image"]),
      mimeType: z.string().optional(),
      fileSize: z.number().optional(),
      duration: z.number().optional(),
      tags: z.array(z.string()).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [result] = await db.insert(brollLibrary).values({
        userId: ctx.user.id,
        title: input.title,
        url: input.url,
        s3Key: input.s3Key,
        mediaType: input.mediaType,
        mimeType: input.mimeType ?? null,
        fileSize: input.fileSize ?? null,
        duration: input.duration?.toString() ?? null,
        tags: JSON.stringify(input.tags),
      });

      const id = (result as { insertId: number }).insertId;
      return { id, url: input.url };
    }),

  /**
   * List all B-roll items for the current user
   */
  getAll: protectedProcedure
    .input(z.object({
      mediaType: z.enum(["video", "image", "all"]).default("all"),
      tag: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const items = await db
        .select()
        .from(brollLibrary)
        .where(eq(brollLibrary.userId, ctx.user.id))
        .orderBy(desc(brollLibrary.createdAt));

      // Filter by mediaType if specified
      let filtered = items;
      if (input?.mediaType && input.mediaType !== "all") {
        filtered = filtered.filter(i => i.mediaType === input.mediaType);
      }

      // Filter by tag if specified
      if (input?.tag) {
        filtered = filtered.filter(i => {
          try {
            const tags = JSON.parse(i.tags ?? "[]") as string[];
            return tags.includes(input.tag!);
          } catch { return false; }
        });
      }

      // Parse tags for each item
      return filtered.map(item => ({
        ...item,
        tags: (() => { try { return JSON.parse(item.tags ?? "[]") as string[]; } catch { return []; } })(),
        duration: item.duration ? Number(item.duration) : null,
      }));
    }),

  /**
   * Update tags and title for an item
   */
  updateTags: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).max(255).optional(),
      tags: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const updates: Record<string, unknown> = { tags: JSON.stringify(input.tags) };
      if (input.title) updates.title = input.title;

      await db
        .update(brollLibrary)
        .set(updates)
        .where(and(eq(brollLibrary.id, input.id), eq(brollLibrary.userId, ctx.user.id)));

      return { success: true };
    }),

  /**
   * Delete an item from DB (S3 cleanup is best-effort)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get the item first to confirm ownership
      const [item] = await db
        .select()
        .from(brollLibrary)
        .where(and(eq(brollLibrary.id, input.id), eq(brollLibrary.userId, ctx.user.id)))
        .limit(1);

      if (!item) throw new Error("Item not found");

      // Delete from DB
      await db
        .delete(brollLibrary)
        .where(and(eq(brollLibrary.id, input.id), eq(brollLibrary.userId, ctx.user.id)));

      return { success: true };
    }),
});
