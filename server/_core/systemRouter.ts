import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { ENV } from "./env";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  testLuma: adminProcedure
    .input(z.object({ imageUrl: z.string().url() }))
    .mutation(async ({ input }) => {
      const lumaKey = ENV.LUMA_API_KEY;
      if (!lumaKey) return { ok: false, error: "LUMA_API_KEY is empty or not set in production ENV" };

      // Step 1: Create generation
      const createRes = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lumaKey}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          model: "ray-flash-2",
          prompt: "Smooth cinematic dolly forward through a luxury living room",
          keyframes: { frame0: { type: "image", url: input.imageUrl } },
          duration: "5s",
          aspect_ratio: "16:9",
          resolution: "720p",
        }),
      });

      const createBody = await createRes.text();
      if (!createRes.ok) {
        return { ok: false, error: `Luma create failed: ${createRes.status} - ${createBody}`, keyPrefix: lumaKey.slice(0, 12) };
      }

      const gen = JSON.parse(createBody);
      return { ok: true, generationId: gen.id, state: gen.state, keyPrefix: lumaKey.slice(0, 12) };
    }),
});
