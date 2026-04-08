import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { videoScripts } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

// ─── Scene schema ─────────────────────────────────────────────────────────────
export const sceneSchema = z.object({
  id: z.string(),
  spokenScript: z.string(),
  visualPrompt: z.string(),
  durationSec: z.number().optional(),
});
export type Scene = z.infer<typeof sceneSchema>;

// ─── Router ───────────────────────────────────────────────────────────────────
export const videoScriptBuilderRouter = router({
  /**
   * List all saved scripts for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await getDb();
    if (!drizzleDb) return [];
    const rows = await drizzleDb
      .select()
      .from(videoScripts)
      .where(eq(videoScripts.userId, ctx.user.id))
      .orderBy(desc(videoScripts.updatedAt))
      .limit(50);
    return rows.map((r: typeof videoScripts.$inferSelect) => ({
      ...r,
      scenes: JSON.parse(r.scenes || "[]") as Scene[],
    }));
  }),

  /**
   * Get a single script by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("Database unavailable");
      const [row] = await drizzleDb
        .select()
        .from(videoScripts)
        .where(and(eq(videoScripts.id, input.id), eq(videoScripts.userId, ctx.user.id)));
      if (!row) throw new Error("Script not found");
      return { ...row, scenes: JSON.parse(row.scenes || "[]") as Scene[] };
    }),

  /**
   * Create a new script (draft)
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        scenes: z.array(sceneSchema).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const fullScript = input.scenes.map((s) => s.spokenScript).join("\n\n");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("Database unavailable");
      const [result] = await drizzleDb.insert(videoScripts).values({
        userId: ctx.user.id,
        title: input.title,
        description: input.description ?? null,
        scenes: JSON.stringify(input.scenes),
        fullScript,
        status: "draft",
      });
      return { id: (result as any).insertId };
    }),

  /**
   * Update an existing script
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        scenes: z.array(sceneSchema).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("Database unavailable");
      const updates: Record<string, unknown> = {};
      if (input.title !== undefined) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.scenes !== undefined) {
        updates.scenes = JSON.stringify(input.scenes);
        updates.fullScript = input.scenes.map((s) => s.spokenScript).join("\n\n");
      }
      await drizzleDb
        .update(videoScripts)
        .set(updates)
        .where(and(eq(videoScripts.id, input.id), eq(videoScripts.userId, ctx.user.id)));
      return { success: true };
    }),

  /**
   * Delete a script
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("Database unavailable");
      await drizzleDb
        .delete(videoScripts)
        .where(and(eq(videoScripts.id, input.id), eq(videoScripts.userId, ctx.user.id)));
      return { success: true };
    }),

  /**
   * AI: Generate visual prompts for each scene from the spoken script
   */
  generateVisualPrompts: protectedProcedure
    .input(
      z.object({
        scenes: z.array(
          z.object({
            id: z.string(),
            spokenScript: z.string(),
          })
        ),
        agentName: z.string().optional(),
        videoType: z.enum(["intro", "market_update", "property_tour", "testimonial", "tips", "custom"]).default("custom"),
      })
    )
    .mutation(async ({ input }) => {
      const sceneList = input.scenes
        .map((s, i) => `Scene ${i + 1}: "${s.spokenScript}"`)
        .join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a professional video director and cinematographer specializing in real estate marketing videos.
For each spoken script line provided, write a concise visual direction note (1-2 sentences max) describing exactly what should appear on screen while that line is spoken.
Be specific and actionable — describe camera angles, B-roll footage, screen recordings, text overlays, or animations.
Return ONLY a JSON array in this exact format: [{"id": "scene_id", "visualPrompt": "description"}]
No extra text, no markdown, just the JSON array.`,
          },
          {
            role: "user",
            content: `Video type: ${input.videoType}
Agent name: ${input.agentName || "the agent"}

Write visual direction for each scene:
${sceneList}

Return JSON array with id and visualPrompt for each scene.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "visual_prompts",
            strict: true,
            schema: {
              type: "object",
              properties: {
                scenes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      visualPrompt: { type: "string" },
                    },
                    required: ["id", "visualPrompt"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["scenes"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : null;
      if (!content) throw new Error("No response from AI");
      const parsed = JSON.parse(content) as { scenes: { id: string; visualPrompt: string }[] };
      return parsed.scenes;
    }),

  /**
   * AI: Generate a full two-column script from a topic/brief
   */
  generateFromBrief: protectedProcedure
    .input(
      z.object({
        topic: z.string().min(1),
        videoType: z.enum(["intro", "market_update", "property_tour", "testimonial", "tips", "custom"]).default("custom"),
        targetDurationSec: z.number().default(60),
        agentName: z.string().optional(),
        city: z.string().optional(),
        tone: z.enum(["professional", "conversational", "authoritative", "warm"]).default("professional"),
      })
    )
    .mutation(async ({ input }) => {
      const approxScenes = Math.max(3, Math.round(input.targetDurationSec / 10));
      const wordsPerScene = Math.round((input.targetDurationSec / 60) * 150 / approxScenes);

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a professional video scriptwriter and director for real estate marketing videos.
Create a two-column video script: spoken words on the left, visual direction on the right.
Each scene should be ~${wordsPerScene} spoken words (about ${Math.round(wordsPerScene / 150 * 60)} seconds when read aloud).
Return ONLY valid JSON — no markdown, no extra text.`,
          },
          {
            role: "user",
            content: `Create a ${input.targetDurationSec}-second ${input.videoType} video script.
Topic: ${input.topic}
Agent: ${input.agentName || "a real estate agent"}
Market: ${input.city || "local market"}
Tone: ${input.tone}

Generate exactly ${approxScenes} scenes. Each scene has:
- spokenScript: the exact words to be spoken
- visualPrompt: what to show on screen while those words are spoken (B-roll, screen demo, text overlay, animation, etc.)
- durationSec: estimated seconds for this scene`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "video_script",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                scenes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      spokenScript: { type: "string" },
                      visualPrompt: { type: "string" },
                      durationSec: { type: "number" },
                    },
                    required: ["id", "spokenScript", "visualPrompt", "durationSec"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["title", "scenes"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : null;
      if (!content) throw new Error("No response from AI");
      const parsed = JSON.parse(content) as { title: string; scenes: Scene[] };
      return parsed;
    }),
});
