/**
 * CRM Pipeline Router
 *
 * Lightweight 5-stage lead pipeline:
 * New → Contacted → Nurturing → Appointment Set → Closed
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { crmLeads, crmLeadNotes } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { getPersonaByUserId } from "../db";
import { fireZapierWebhook } from "../zapierService";

const STAGES = ["new", "contacted", "nurturing", "appointment_set", "closed"] as const;
const SOURCES = ["open_house", "lead_magnet", "referral", "social", "website", "manual", "other"] as const;

export const crmRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        stage: z.enum(STAGES).optional(),
        includeArchived: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const conditions = [eq(crmLeads.userId, ctx.user.id)];
      if (!input.includeArchived) {
        conditions.push(eq(crmLeads.isArchived, false));
      }
      if (input.stage) {
        conditions.push(eq(crmLeads.stage, input.stage));
      }

      return db
        .select()
        .from(crmLeads)
        .where(and(...conditions))
        .orderBy(desc(crmLeads.createdAt))
        .limit(500);
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    return db
      .select()
      .from(crmLeads)
      .where(and(eq(crmLeads.userId, ctx.user.id), eq(crmLeads.isArchived, false)))
      .orderBy(desc(crmLeads.createdAt))
      .limit(500);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [lead] = await db
        .select()
        .from(crmLeads)
        .where(and(eq(crmLeads.id, input.id), eq(crmLeads.userId, ctx.user.id)))
        .limit(1);
      if (!lead) throw new Error("Lead not found");
      const notes = await db
        .select()
        .from(crmLeadNotes)
        .where(eq(crmLeadNotes.leadId, input.id))
        .orderBy(desc(crmLeadNotes.createdAt));
      return { ...lead, notes };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        stage: z.enum(STAGES).default("new"),
        source: z.enum(SOURCES).default("manual"),
        sourceRef: z.string().optional(),
        notes: z.string().optional(),
        tags: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [result] = await db.insert(crmLeads).values({
        userId: ctx.user.id,
        name: input.name,
        email: input.email,
        phone: input.phone,
        stage: input.stage,
        source: input.source,
        sourceRef: input.sourceRef,
        notes: input.notes,
        tags: input.tags,
        isArchived: false,
      });
      return { id: (result as any)?.id };
    }),

  updateStage: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        stage: z.enum(STAGES),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(crmLeads)
        .set({
          stage: input.stage,
          lastContactedAt: ["contacted", "appointment_set"].includes(input.stage)
            ? new Date()
            : undefined,
        })
        .where(and(eq(crmLeads.id, input.id), eq(crmLeads.userId, ctx.user.id)));
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        notes: z.string().optional(),
        tags: z.string().optional(),
        source: z.enum(SOURCES).optional(),
        sourceRef: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { id, ...data } = input;
      await db
        .update(crmLeads)
        .set(data)
        .where(and(eq(crmLeads.id, id), eq(crmLeads.userId, ctx.user.id)));
      return { success: true };
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(crmLeads)
        .set({ isArchived: true })
        .where(and(eq(crmLeads.id, input.id), eq(crmLeads.userId, ctx.user.id)));
      return { success: true };
    }),

  addNote: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
        content: z.string().min(1),
        noteType: z.enum(["note", "call", "email", "meeting", "ai_suggestion"]).default("note"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      // Verify ownership
      const [lead] = await db
        .select()
        .from(crmLeads)
        .where(and(eq(crmLeads.id, input.leadId), eq(crmLeads.userId, ctx.user.id)))
        .limit(1);
      if (!lead) throw new Error("Lead not found");

      const [result] = await db.insert(crmLeadNotes).values({
        leadId: input.leadId,
        userId: ctx.user.id,
        content: input.content,
        noteType: input.noteType,
      });

      // Update lastContactedAt if it's a call, email, or meeting
      if (["call", "email", "meeting"].includes(input.noteType)) {
        await db
          .update(crmLeads)
          .set({ lastContactedAt: new Date() })
          .where(eq(crmLeads.id, input.leadId));
      }

      return { id: (result as any)?.id };
    }),

  generateFollowUp: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
        channel: z.enum(["email", "text", "call_script"]).default("email"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [lead] = await db
        .select()
        .from(crmLeads)
        .where(and(eq(crmLeads.id, input.leadId), eq(crmLeads.userId, ctx.user.id)))
        .limit(1);
      if (!lead) throw new Error("Lead not found");

      const persona = await getPersonaByUserId(ctx.user.id);
      const agentName = persona?.agentName || "Your Agent";
      const city = persona?.primaryCity || "the area";

      const daysSinceContact = lead.lastContactedAt
        ? Math.floor((Date.now() - lead.lastContactedAt.getTime()) / 86400000)
        : null;

      const context = [
        `Lead Name: ${lead.name}`,
        lead.source ? `Source: ${lead.source.replace("_", " ")}` : "",
        lead.sourceRef ? `Source Detail: ${lead.sourceRef}` : "",
        `Current Stage: ${lead.stage.replace("_", " ")}`,
        daysSinceContact !== null ? `Days Since Last Contact: ${daysSinceContact}` : "",
        lead.notes ? `Notes: ${lead.notes}` : "",
        lead.tags ? `Tags: ${lead.tags}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const channelInstructions = {
        email: "Write a short, warm follow-up email (3-4 sentences max). Include subject line.",
        text: "Write a casual, friendly text message (under 160 characters if possible).",
        call_script: "Write a brief call script opener (30 seconds max). Include a conversation-starting question.",
      };

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a real estate follow-up expert helping agent ${agentName} in ${city} reconnect with leads. Write messages that feel personal, not salesy. Be warm, helpful, and specific to their situation.`,
          },
          {
            role: "user",
            content: `Generate a follow-up message for this lead:\n\n${context}\n\n${channelInstructions[input.channel]}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "follow_up",
            strict: true,
            schema: {
              type: "object",
              properties: {
                subject: { type: "string" },
                message: { type: "string" },
                tip: { type: "string" },
              },
              required: ["subject", "message", "tip"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      const result = JSON.parse(typeof content === "string" ? content : "{}");

      // Save as AI suggestion note
      await db.insert(crmLeadNotes).values({
        leadId: input.leadId,
        userId: ctx.user.id,
        content: `AI ${input.channel} suggestion: ${result.message}`,
        noteType: "ai_suggestion",
      });

      return result;
    }),

  // Summary stats for Decision Engine
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const leads = await db
      .select()
      .from(crmLeads)
      .where(and(eq(crmLeads.userId, ctx.user.id), eq(crmLeads.isArchived, false)));

    const now = Date.now();
    const staleThreshold = 14 * 24 * 60 * 60 * 1000; // 14 days

    const byStage = STAGES.reduce((acc, stage) => {
      acc[stage] = leads.filter((l) => l.stage === stage).length;
      return acc;
    }, {} as Record<string, number>);

    const staleLeads = leads.filter((l) => {
      if (l.stage === "closed") return false;
      const lastContact = l.lastContactedAt?.getTime() || l.createdAt.getTime();
      return now - lastContact > staleThreshold;
    });

    return {
      total: leads.length,
      byStage,
      staleCount: staleLeads.length,
      staleLeads: staleLeads.slice(0, 5).map((l) => ({
        id: l.id,
        name: l.name,
        stage: l.stage,
        daysSinceContact: Math.floor(
          (now - (l.lastContactedAt?.getTime() || l.createdAt.getTime())) / 86400000
        ),
      })),
    };
  }),
});
