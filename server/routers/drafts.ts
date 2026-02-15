import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const draftsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.getDraftsByUserId(ctx.user.id);
  }),

  create: protectedProcedure
    .input(
      z.object({
        type: z.enum(["post", "reel", "tour"]),
        content: z.string(),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await db.createDraft({
        userId: ctx.user.id,
        type: input.type,
        content: input.content,
        imageUrl: input.imageUrl,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ draftId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteDraft(input.draftId);
      return { success: true };
    }),

  bulkDelete: protectedProcedure
    .input(z.object({ draftIds: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      await db.bulkDeleteDrafts(input.draftIds);
      return { success: true };
    }),
});
