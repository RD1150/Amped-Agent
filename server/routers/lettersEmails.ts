/**
 * lettersEmails.ts
 * Letters & Emails Library — browse, personalize, and save pre-written real estate templates.
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { personas, savedLetters } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import {
  LETTER_TEMPLATES,
  getCategories,
  getHolidayMonths,
  personalizeTemplate,
  type LetterCategory,
} from "../../shared/letterTemplates";
import { TRPCError } from "@trpc/server";

export const lettersEmailsRouter = router({
  // ─── Get all templates (optionally filtered) ────────────────────────────────
  getTemplates: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        type: z.enum(["email", "letter", "all"]).optional().default("all"),
        month: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(({ input }) => {
      let templates = [...LETTER_TEMPLATES];

      if (input.category && input.category !== "all") {
        templates = templates.filter((t) => t.category === input.category);
      }

      if (input.type && input.type !== "all") {
        templates = templates.filter((t) => t.type === input.type);
      }

      if (input.month) {
        templates = templates.filter((t) => t.month === input.month);
      }

      if (input.search) {
        const q = input.search.toLowerCase();
        templates = templates.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.subject.toLowerCase().includes(q) ||
            t.body.toLowerCase().includes(q) ||
            t.tags?.some((tag) => tag.toLowerCase().includes(q))
        );
      }

      return {
        templates,
        total: templates.length,
        categories: getCategories(),
        months: getHolidayMonths(),
      };
    }),

  // ─── Get a single template personalized with agent's persona ────────────────
  getPersonalized: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        recipientFirstName: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const persona = await db
        .select()
        .from(personas)
        .where(eq(personas.userId, ctx.user.id))
        .limit(1);

      const p = persona[0];
      const template = LETTER_TEMPLATES.find((t) => t.id === input.templateId);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      const personalizedBody = personalizeTemplate(template.body, {
        firstName: input.recipientFirstName || "there",
        agentName: p?.agentName || ctx.user.name || "Your Agent",
        brokerage: p?.brokerageName || p?.brokerage || "",
        city: p?.primaryCity || "",
        phone: p?.phoneNumber || "",
        agentEmail: ctx.user.email || "",
      });

      return {
        ...template,
        personalizedBody,
        agentName: p?.agentName || ctx.user.name || "",
        brokerage: p?.brokerageName || p?.brokerage || "",
        city: p?.primaryCity || "",
        phone: p?.phoneNumber || "",
        agentEmail: ctx.user.email || "",
      };
    }),

  // ─── Save a used/customized letter ──────────────────────────────────────────
  saveUsed: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        templateTitle: z.string(),
        templateCategory: z.string(),
        content: z.string(),
        recipientName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.insert(savedLetters).values({
        userId: ctx.user.id,
        letterType: input.templateId,
        letterLabel: input.templateTitle,
        letterCategory: input.templateCategory,
        recipientName: input.recipientName || null,
        content: input.content,
      });
      return { success: true };
    }),

  // ─── Get saved letters for this user ────────────────────────────────────────
  getSaved: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const letters = await db
      .select()
      .from(savedLetters)
      .where(eq(savedLetters.userId, ctx.user.id))
      .orderBy(desc(savedLetters.createdAt))
      .limit(20);
    return letters;
  }),

  // ─── Get categories and months for sidebar ──────────────────────────────────
  getMeta: protectedProcedure.query(() => {
    return {
      categories: getCategories(),
      months: getHolidayMonths(),
      totalTemplates: LETTER_TEMPLATES.length,
    };
  }),
});
