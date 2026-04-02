import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { imageLibrary } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { storagePut } from "../storage";
import { invokeLLM } from "../_core/llm";

function randomSuffix() {
  return Math.random().toString(36).substring(2, 9);
}

export const imageLibraryRouter = router({
  // ── List all images for the current user ──────────────────────────────────
  list: protectedProcedure
    .input(z.object({
      propertyAddress: z.string().optional(),
      roomType: z.string().optional(),
      tag: z.string().optional(),
    }))
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(imageLibrary)
        .where(eq(imageLibrary.userId, ctx.user.id))
        .orderBy(desc(imageLibrary.createdAt));

      return rows.map((r) => ({
        ...r,
        tags: (() => {
          try { return JSON.parse(r.tags || "[]") as string[]; }
          catch { return [] as string[]; }
        })(),
      }));
    }),

  // ── Upload one or more images (base64) ────────────────────────────────────
  upload: protectedProcedure
    .input(z.object({
      images: z.array(z.object({
        filename: z.string(),
        mimeType: z.string().default("image/jpeg"),
        dataBase64: z.string(),
        sizeBytes: z.number().optional(),
        propertyAddress: z.string().optional(),
        roomType: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const results: { id: number; url: string; filename: string }[] = [];

      for (const img of input.images) {
        const buffer = Buffer.from(
          img.dataBase64.replace(/^data:image\/\w+;base64,/, ""),
          "base64"
        );
        const ext = img.filename.split(".").pop() || "jpg";
        const key = `image-library/${ctx.user.id}/${Date.now()}-${randomSuffix()}.${ext}`;
        const { url } = await storagePut(key, buffer, img.mimeType);

        await db.insert(imageLibrary).values({
          userId: ctx.user.id,
          filename: img.filename,
          s3Key: key,
          url,
          mimeType: img.mimeType,
          sizeBytes: img.sizeBytes ?? buffer.length,
          tags: "[]",
          propertyAddress: img.propertyAddress ?? null,
          roomType: img.roomType ?? null,
          hookGenerated: 0,
        });

        // Get the inserted ID
        const [inserted] = await db
          .select({ id: imageLibrary.id })
          .from(imageLibrary)
          .where(and(eq(imageLibrary.userId, ctx.user.id), eq(imageLibrary.s3Key, key)))
          .limit(1);

        results.push({ id: inserted?.id ?? 0, url, filename: img.filename });
      }

      return { uploaded: results };
    }),

  // ── Generate AI hook text for an image ───────────────────────────────────
  generateHook: protectedProcedure
    .input(z.object({
      imageId: z.number().int(),
      imageUrl: z.string().url(),
      roomType: z.string().optional(),
      propertyAddress: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [img] = await db
        .select()
        .from(imageLibrary)
        .where(and(eq(imageLibrary.id, input.imageId), eq(imageLibrary.userId, ctx.user.id)));
      if (!img) throw new Error("Image not found");

      const roomContext = input.roomType ? `This is a photo of the ${input.roomType}.` : "This is a property photo.";
      const addressContext = input.propertyAddress ? ` The property is at ${input.propertyAddress}.` : "";

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are an expert real estate copywriter. Write short, punchy hook text (max 12 words) for property photos. The hook should be compelling, evocative, and make buyers want to see more. No hashtags. No emojis. Just a powerful, clean line of text.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `${roomContext}${addressContext} Write a single compelling hook line (max 12 words) for this photo that would stop a buyer scrolling on social media.`,
              },
              {
                type: "image_url",
                image_url: { url: input.imageUrl, detail: "low" },
              },
            ] as any,
          },
        ],
      });

      const hookText = ((response as any).choices?.[0]?.message?.content ?? "")
        .replace(/^["']|["']$/g, "")
        .trim();

      await db
        .update(imageLibrary)
        .set({ hookText, hookGenerated: 1 })
        .where(eq(imageLibrary.id, input.imageId));

      return { hookText };
    }),

  // ── Update tags / metadata ────────────────────────────────────────────────
  update: protectedProcedure
    .input(z.object({
      imageId: z.number().int(),
      tags: z.array(z.string()).optional(),
      propertyAddress: z.string().optional(),
      roomType: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [img] = await db
        .select()
        .from(imageLibrary)
        .where(and(eq(imageLibrary.id, input.imageId), eq(imageLibrary.userId, ctx.user.id)));
      if (!img) throw new Error("Image not found");

      await db
        .update(imageLibrary)
        .set({
          ...(input.tags !== undefined ? { tags: JSON.stringify(input.tags) } : {}),
          ...(input.propertyAddress !== undefined ? { propertyAddress: input.propertyAddress } : {}),
          ...(input.roomType !== undefined ? { roomType: input.roomType } : {}),
        })
        .where(eq(imageLibrary.id, input.imageId));

      return { success: true };
    }),

  // ── Delete an image ───────────────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ imageId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [img] = await db
        .select()
        .from(imageLibrary)
        .where(and(eq(imageLibrary.id, input.imageId), eq(imageLibrary.userId, ctx.user.id)));
      if (!img) throw new Error("Image not found");

      await db.delete(imageLibrary).where(eq(imageLibrary.id, input.imageId));
      return { success: true };
    }),
});
