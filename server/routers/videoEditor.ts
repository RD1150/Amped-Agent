/**
 * Video Editor Router
 *
 * Procedures:
 * - videoEditor.create        — create a new edit project from a source video URL
 * - videoEditor.getAll        — list all edit projects for the current user
 * - videoEditor.get           — get a single project by ID
 * - videoEditor.updateConfig  — save the edit config (tracks, trim, etc.)
 * - videoEditor.render        — submit a Creatomate render job
 * - videoEditor.pollStatus    — poll render job status
 * - videoEditor.generateYTMeta — AI-generate YouTube title/description/tags
 * - videoEditor.delete        — delete a project
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { videoEditProjects } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { storagePut } from "../storage";
import { randomBytes } from "crypto";

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const brollLayerSchema = z.object({
  id: z.string(),
  mediaUrl: z.string(),       // image or video URL
  mediaType: z.enum(["image", "video"]),
  startTime: z.number(),      // seconds into base video
  endTime: z.number(),        // seconds into base video
  opacity: z.number().min(0).max(1).default(1), // 1 = full cover, 0.5 = overlay
  fit: z.enum(["cover", "contain"]).default("cover"),
});

const textLayerSchema = z.object({
  id: z.string(),
  text: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  position: z.enum(["top", "center", "bottom"]).default("bottom"),
  style: z.enum(["bold-white", "subtitle-bar", "headline", "cta"]).default("bold-white"),
  fontSize: z.number().default(40),
});

const musicTrackSchema = z.object({
  url: z.string(),
  volume: z.number().min(0).max(1).default(0.3), // auto-duck to 30%
  fadeOut: z.number().default(2), // seconds
});

const editConfigSchema = z.object({
  brollLayers: z.array(brollLayerSchema).default([]),
  textLayers: z.array(textLayerSchema).default([]),
  musicTrack: musicTrackSchema.nullable().default(null),
  logoEnabled: z.boolean().default(true),
  captionsEnabled: z.boolean().default(true),
  format: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
});

export type EditConfig = z.infer<typeof editConfigSchema>;
export type BrollLayer = z.infer<typeof brollLayerSchema>;
export type TextLayer = z.infer<typeof textLayerSchema>;

// ─── Creatomate render builder ─────────────────────────────────────────────────

function buildCreatomateScript(
  baseVideoUrl: string,
  trimStart: number,
  trimEnd: number | null,
  config: EditConfig,
  logoUrl: string | null,
) {
  const duration = trimEnd != null ? trimEnd - trimStart : undefined;

  // Aspect ratio → width/height
  const dimensions: Record<string, { width: number; height: number }> = {
    "16:9": { width: 1920, height: 1080 },
    "9:16": { width: 1080, height: 1920 },
    "1:1": { width: 1080, height: 1080 },
  };
  const { width, height } = dimensions[config.format] ?? dimensions["16:9"];

  const elements: object[] = [];

  // ── Track 1: Base video ──────────────────────────────────────────────────
  elements.push({
    type: "video",
    source: baseVideoUrl,
    time: 0,
    ...(duration ? { duration } : {}),
    trim_start: trimStart,
    fit: "cover",
    volume: "100%",
  });

  // ── Track 2: B-roll overlays ─────────────────────────────────────────────
  for (const layer of config.brollLayers) {
    const layerDuration = layer.endTime - layer.startTime;
    if (layerDuration <= 0) continue;
    elements.push({
      type: layer.mediaType,
      source: layer.mediaUrl,
      time: layer.startTime - trimStart,
      duration: layerDuration,
      fit: layer.fit,
      opacity: layer.opacity,
      animations: [
        { type: "fade", duration: 0.3, easing: "linear" },
        { type: "fade", duration: 0.3, easing: "linear", reversed: true },
      ],
    });
  }

  // ── Track 3: Text overlays ───────────────────────────────────────────────
  const positionMap: Record<string, string> = {
    top: "5% 5%",
    center: "50% 50%",
    bottom: "50% 88%",
  };
  const styleMap: Record<string, object> = {
    "bold-white": { font_weight: "700", color: "#FFFFFF", shadow_color: "rgba(0,0,0,0.7)", shadow_blur: 8 },
    "subtitle-bar": { font_weight: "600", color: "#FFFFFF", background_color: "rgba(0,0,0,0.65)", background_x_padding: "8%", background_y_padding: "4%" },
    "headline": { font_weight: "800", color: "#FFFFFF", font_size_maximum: "7vmin", shadow_color: "rgba(0,0,0,0.8)", shadow_blur: 12 },
    "cta": { font_weight: "700", color: "#FFFFFF", background_color: "#F97316", background_x_padding: "6%", background_y_padding: "3%", border_radius: "8px" },
  };

  for (const layer of config.textLayers) {
    const layerDuration = layer.endTime - layer.startTime;
    if (layerDuration <= 0 || !layer.text.trim()) continue;
    elements.push({
      type: "text",
      text: layer.text,
      time: layer.startTime - trimStart,
      duration: layerDuration,
      x_alignment: "50%",
      y_alignment: positionMap[layer.position] ?? "50% 88%",
      font_size: layer.fontSize,
      ...(styleMap[layer.style] ?? styleMap["bold-white"]),
      animations: [
        { type: "fade", duration: 0.25, easing: "linear" },
        { type: "fade", duration: 0.25, easing: "linear", reversed: true },
      ],
    });
  }

  // ── Track 4: Music ───────────────────────────────────────────────────────
  if (config.musicTrack) {
    elements.push({
      type: "audio",
      source: config.musicTrack.url,
      time: 0,
      ...(duration ? { duration } : {}),
      volume: `${Math.round(config.musicTrack.volume * 100)}%`,
      audio_fade_out: config.musicTrack.fadeOut,
    });
  }

  // ── Track 5: Logo watermark ──────────────────────────────────────────────
  if (config.logoEnabled && logoUrl) {
    elements.push({
      type: "image",
      source: logoUrl,
      time: 0,
      ...(duration ? { duration } : {}),
      x: "92%",
      y: "6%",
      width: "12%",
      height: "auto",
      opacity: 0.85,
    });
  }

  return {
    output_format: "mp4",
    width,
    height,
    elements,
  };
}

// ─── Router ────────────────────────────────────────────────────────────────────

export const videoEditorRouter = router({
  /** Create a new edit project */
  create: protectedProcedure
    .input(z.object({
      title: z.string().default("Untitled Edit"),
      baseVideoUrl: z.string().url(),
      baseVideoKey: z.string().optional(),
      baseVideoDuration: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [result] = await db.insert(videoEditProjects).values({
        userId: ctx.user.id,
        title: input.title,
        baseVideoUrl: input.baseVideoUrl,
        baseVideoKey: input.baseVideoKey ?? null,
        baseVideoDuration: input.baseVideoDuration?.toString() ?? "0",
        editConfig: JSON.stringify(editConfigSchema.parse({})),
      });
      const id = (result as { insertId: number }).insertId;
      return { id };
    }),

  /** List all projects for the current user */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(videoEditProjects)
      .where(eq(videoEditProjects.userId, ctx.user.id))
      .orderBy(desc(videoEditProjects.updatedAt));
  }),

  /** Get a single project */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [project] = await db
        .select()
        .from(videoEditProjects)
        .where(and(eq(videoEditProjects.id, input.id), eq(videoEditProjects.userId, ctx.user.id)))
        .limit(1);
      if (!project) throw new Error("Project not found");
      return project;
    }),

  /** Save the edit config */
  updateConfig: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      trimStart: z.number().optional(),
      trimEnd: z.number().nullable().optional(),
      baseVideoDuration: z.number().optional(),
      editConfig: editConfigSchema.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const updates: Record<string, unknown> = {};
      if (input.title !== undefined) updates.title = input.title;
      if (input.trimStart !== undefined) updates.trimStart = input.trimStart.toString();
      if (input.trimEnd !== undefined) updates.trimEnd = input.trimEnd?.toString() ?? null;
      if (input.baseVideoDuration !== undefined) updates.baseVideoDuration = input.baseVideoDuration.toString();
      if (input.editConfig !== undefined) updates.editConfig = JSON.stringify(input.editConfig);
      await db
        .update(videoEditProjects)
        .set(updates)
        .where(and(eq(videoEditProjects.id, input.id), eq(videoEditProjects.userId, ctx.user.id)));
      return { success: true };
    }),

  /** Submit a Creatomate render job */
  render: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [project] = await db
        .select()
        .from(videoEditProjects)
        .where(and(eq(videoEditProjects.id, input.id), eq(videoEditProjects.userId, ctx.user.id)))
        .limit(1);
      if (!project) throw new Error("Project not found");

      const config: EditConfig = project.editConfig
        ? editConfigSchema.parse(JSON.parse(project.editConfig))
        : editConfigSchema.parse({});

      const trimStart = Number(project.trimStart ?? 0);
      const trimEnd = project.trimEnd != null ? Number(project.trimEnd) : null;

      // Get logo URL from persona if available
      let logoUrl: string | null = null;
      try {
        const { getPersonaByUserId } = await import("../db");
        const persona = await getPersonaByUserId(ctx.user.id);
        logoUrl = persona?.headshotUrl ?? null;
      } catch { /* no persona */ }

      const script = buildCreatomateScript(
        project.baseVideoUrl,
        trimStart,
        trimEnd,
        config,
        logoUrl,
      );

      // Submit to Creatomate
      const apiKey = process.env.CREATOMATE_API_KEY;
      if (!apiKey) throw new Error("Creatomate API key not configured");

      const response = await fetch("https://api.creatomate.com/v1/renders", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source: script }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Creatomate error: ${err}`);
      }

      const renders = await response.json() as Array<{ id: string; status: string }>;
      const jobId = renders[0]?.id;
      if (!jobId) throw new Error("No render job ID returned");

      await db
        .update(videoEditProjects)
        .set({ status: "rendering", renderJobId: jobId })
        .where(eq(videoEditProjects.id, input.id));

      return { jobId };
    }),

  /** Poll Creatomate render status */
  pollStatus: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [project] = await db
        .select()
        .from(videoEditProjects)
        .where(and(eq(videoEditProjects.id, input.id), eq(videoEditProjects.userId, ctx.user.id)))
        .limit(1);
      if (!project) throw new Error("Project not found");
      if (!project.renderJobId) return { status: project.status, outputUrl: project.outputUrl };

      // If already done/failed, return cached status
      if (project.status === "done" || project.status === "failed") {
        return { status: project.status, outputUrl: project.outputUrl };
      }

      // Poll Creatomate
      const apiKey = process.env.CREATOMATE_API_KEY;
      if (!apiKey) throw new Error("Creatomate API key not configured");

      const response = await fetch(`https://api.creatomate.com/v1/renders/${project.renderJobId}`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });

      if (!response.ok) return { status: project.status, outputUrl: project.outputUrl };

      const render = await response.json() as { status: string; url?: string };

      if (render.status === "succeeded" && render.url) {
        // Save output URL to S3 for permanence
        let outputUrl = render.url;
        try {
          const videoRes = await fetch(render.url);
          const buffer = Buffer.from(await videoRes.arrayBuffer());
          const key = `video-edits/${ctx.user.id}/${randomBytes(8).toString("hex")}.mp4`;
          const { url } = await storagePut(key, buffer, "video/mp4");
          outputUrl = url;
          await db.update(videoEditProjects).set({ status: "done", outputUrl, outputKey: key }).where(eq(videoEditProjects.id, input.id));
        } catch {
          await db.update(videoEditProjects).set({ status: "done", outputUrl }).where(eq(videoEditProjects.id, input.id));
        }
        return { status: "done", outputUrl };
      }

      if (render.status === "failed") {
        await db.update(videoEditProjects).set({ status: "failed" }).where(eq(videoEditProjects.id, input.id));
        return { status: "failed", outputUrl: null };
      }

      return { status: "rendering", outputUrl: null };
    }),

  /** AI-generate YouTube metadata */
  generateYTMeta: protectedProcedure
    .input(z.object({
      id: z.number(),
      topic: z.string().optional(), // optional hint about video topic
      market: z.string().optional(), // agent's market area
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [project] = await db
        .select()
        .from(videoEditProjects)
        .where(and(eq(videoEditProjects.id, input.id), eq(videoEditProjects.userId, ctx.user.id)))
        .limit(1);
      if (!project) throw new Error("Project not found");

      const prompt = `You are an expert YouTube SEO strategist for real estate agents.

Generate optimized YouTube metadata for a real estate agent video.

Video title hint: "${project.title}"
Topic: "${input.topic ?? "real estate tips"}"
Agent's market: "${input.market ?? "local real estate market"}"

Return a JSON object with these exact fields:
{
  "title": "SEO-optimized YouTube title (max 60 chars, include market + keyword)",
  "description": "Full YouTube description (300-500 words). Include: hook paragraph, what viewers will learn (3-5 bullet points), about the agent section, call to action, relevant hashtags at the end)",
  "tags": ["array", "of", "15-20", "relevant", "tags"],
  "thumbnailText": "Short punchy text for thumbnail overlay (max 6 words)"
}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a YouTube SEO expert. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
        responseFormat: { type: "json_object" } as { type: "json_object" },
      });

      const rawContent = response.choices?.[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : "{}";
      let meta: { title?: string; description?: string; tags?: string[]; thumbnailText?: string } = {};
      try { meta = JSON.parse(content); } catch { /* ignore */ }

      await db.update(videoEditProjects).set({
        ytTitle: meta.title ?? null,
        ytDescription: meta.description ?? null,
        ytTags: meta.tags ? JSON.stringify(meta.tags) : null,
      }).where(eq(videoEditProjects.id, input.id));

      return {
        title: meta.title ?? "",
        description: meta.description ?? "",
        tags: meta.tags ?? [],
        thumbnailText: meta.thumbnailText ?? "",
      };
    }),

  /** Delete a project */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .delete(videoEditProjects)
        .where(and(eq(videoEditProjects.id, input.id), eq(videoEditProjects.userId, ctx.user.id)));
      return { success: true };
    }),
});
