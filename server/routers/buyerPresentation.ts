import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { buyerPresentations, personas, presentationViews } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { ENV } from "../_core/env";

const GAMMA_API_BASE = "https://public-api.gamma.app/v1.0";

async function gammaRequest(path: string, method: string, body?: object) {
  const res = await fetch(`${GAMMA_API_BASE}${path}`, {
    method,
    headers: {
      "X-API-KEY": ENV.GAMMA_API_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gamma API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Draft input schema ────────────────────────────────────────────────────────

const draftInputSchema = z.object({
  id: z.number().int().optional(),
  title: z.string().min(1),
  // Buyer Details
  buyerName: z.string().optional(),
  buyerType: z.string().optional(),
  priceRange: z.string().optional(),
  targetAreas: z.string().optional(), // JSON string[]
  desiredBedrooms: z.string().optional(),
  desiredBathrooms: z.string().optional(),
  mustHaves: z.string().optional(),
  niceToHaves: z.string().optional(),
  timeline: z.string().optional(),
  // Market Snapshot
  marketCity: z.string().optional(),
  marketState: z.string().optional(),
  marketOverview: z.string().optional(),
  avgDaysOnMarket: z.string().optional(),
  avgListPrice: z.string().optional(),
  inventoryLevel: z.string().optional(),
  // Financing
  financingNotes: z.string().optional(),
  lenderName: z.string().optional(),
  lenderContact: z.string().optional(),
  // Agent
  agentName: z.string().optional(),
  agentBio: z.string().optional(),
  agentStats: z.string().optional(),
  agentTestimonials: z.string().optional(),
  // Process
  processSteps: z.string().optional(), // JSON string[]
  buyerConcerns: z.string().optional(),
  // Export
  exportFormat: z.enum(["pdf", "pptx"]).default("pptx"),
});

const generateInputSchema = z.object({
  presentationId: z.number().int().optional(),
  // Buyer Details
  buyerName: z.string().optional(),
  buyerType: z.string().min(1, "Buyer type is required"),
  priceRange: z.string().optional(),
  targetAreas: z.array(z.string()).optional(),
  desiredBedrooms: z.string().optional(),
  desiredBathrooms: z.string().optional(),
  mustHaves: z.string().optional(),
  niceToHaves: z.string().optional(),
  timeline: z.string().optional(),
  // Market
  marketCity: z.string().min(1, "Market city is required"),
  marketState: z.string().optional(),
  marketOverview: z.string().optional(),
  avgDaysOnMarket: z.string().optional(),
  avgListPrice: z.string().optional(),
  inventoryLevel: z.string().optional(),
  // Financing
  financingNotes: z.string().optional(),
  lenderName: z.string().optional(),
  lenderContact: z.string().optional(),
  // Agent
  agentName: z.string(),
  agentBio: z.string().optional(),
  agentStats: z.string().optional(),
  agentTestimonials: z.string().optional(),
  // Process
  processSteps: z.array(z.string()).optional(),
  buyerConcerns: z.string().optional(),
  // Export
  exportFormat: z.enum(["pdf", "pptx"]).default("pptx"),
  themeId: z.string().optional(),
});

// ── Build the Gamma prompt ────────────────────────────────────────────────────

function buildBuyerGammaPrompt(input: z.infer<typeof generateInputSchema>): string {
  const lines: string[] = [];

  lines.push(`Create a professional real estate buyer consultation presentation with exactly 12 slides for the following buyer profile and agent. Use a warm, trustworthy, and expert tone. Each slide should be visually distinct with clear headings and concise bullet points.\n`);

  // Buyer Profile
  lines.push(`## BUYER PROFILE`);
  if (input.buyerName) lines.push(`Buyer Name: ${input.buyerName}`);
  lines.push(`Buyer Type: ${input.buyerType}`);
  if (input.priceRange) lines.push(`Price Range: ${input.priceRange}`);
  if (input.timeline) lines.push(`Timeline: ${input.timeline}`);
  if (input.targetAreas?.length) lines.push(`Target Areas: ${input.targetAreas.join(", ")}`);
  const specs = [
    input.desiredBedrooms && `${input.desiredBedrooms} Bedrooms`,
    input.desiredBathrooms && `${input.desiredBathrooms} Bathrooms`,
  ].filter(Boolean);
  if (specs.length) lines.push(`Desired Specs: ${specs.join(" | ")}`);
  if (input.mustHaves) lines.push(`\nMust-Haves:\n${input.mustHaves}`);
  if (input.niceToHaves) lines.push(`\nNice-to-Haves:\n${input.niceToHaves}`);

  // Market Snapshot
  lines.push(`\n## MARKET SNAPSHOT`);
  lines.push(`Market: ${input.marketCity}${input.marketState ? `, ${input.marketState}` : ""}`);
  if (input.marketOverview) lines.push(`Overview:\n${input.marketOverview}`);
  if (input.avgDaysOnMarket) lines.push(`Average Days on Market: ${input.avgDaysOnMarket}`);
  if (input.avgListPrice) lines.push(`Average List Price: ${input.avgListPrice}`);
  if (input.inventoryLevel) lines.push(`Inventory Level: ${input.inventoryLevel}`);

  // Financing
  lines.push(`\n## FINANCING OVERVIEW`);
  if (input.financingNotes) lines.push(input.financingNotes);
  if (input.lenderName) lines.push(`Preferred Lender: ${input.lenderName}${input.lenderContact ? ` — ${input.lenderContact}` : ""}`);

  // Agent
  lines.push(`\n## YOUR AGENT`);
  lines.push(`Agent: ${input.agentName}`);
  if (input.agentBio) lines.push(`Bio:\n${input.agentBio}`);
  if (input.agentStats) lines.push(`\nStats & Track Record:\n${input.agentStats}`);

  try {
    const testimonials = JSON.parse(input.agentTestimonials ?? "[]") as Array<{ author: string; text: string }>;
    const validTestimonials = testimonials.filter((t) => t.text);
    if (validTestimonials.length > 0) {
      lines.push(`\nClient Testimonials:`);
      validTestimonials.forEach((t) => {
        lines.push(`  "${t.text}" — ${t.author}`);
      });
    }
  } catch { /* ignore */ }

  // Process Steps
  if (input.processSteps?.length) {
    lines.push(`\n## BUYING PROCESS STEPS`);
    input.processSteps.forEach((step, i) => {
      lines.push(`  Step ${i + 1}: ${step}`);
    });
  }
  if (input.buyerConcerns) lines.push(`\nCommon Buyer Concerns & How I Address Them:\n${input.buyerConcerns}`);

  // Slide structure
  lines.push(`\n## REQUIRED SLIDE STRUCTURE (12 slides)`);
  lines.push(`1. Cover — Welcome slide with agent name, photo, and tagline`);
  lines.push(`2. About ${input.agentName} — Bio, credentials, why buyers choose them`);
  lines.push(`3. My Promise to You — What the buyer can expect from working with this agent`);
  lines.push(`4. The Home Buying Process — Step-by-step overview (search → offer → close)`);
  lines.push(`5. Understanding the Market — Current conditions in ${input.marketCity}: inventory, prices, competition`);
  lines.push(`6. Your Buyer Profile — Summary of what we're looking for (price, areas, must-haves)`);
  lines.push(`7. Financing 101 — Pre-approval, loan types, down payment options, what to expect`);
  lines.push(`8. Making a Winning Offer — Strategy, escalation clauses, contingencies`);
  lines.push(`9. Inspections & Due Diligence — What to expect, what to watch for`);
  lines.push(`10. Closing Process — Timeline, costs, what happens at the table`);
  lines.push(`11. Client Testimonials — 2–3 quotes from past buyers`);
  lines.push(`12. Next Steps & Call to Action — Sign buyer agreement, schedule search, contact info`);

  return lines.join("\n");
}

// ── Router ────────────────────────────────────────────────────────────────────

export const buyerPresentationRouter = router({

  // ── List presentations for current user ───────────────────────────────────
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(buyerPresentations)
      .where(eq(buyerPresentations.userId, ctx.user.id))
      .orderBy(desc(buyerPresentations.createdAt));
  }),

  // ── Save / update a draft ─────────────────────────────────────────────────
  saveDraft: protectedProcedure
    .input(draftInputSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const values = {
        userId: ctx.user.id,
        title: input.title,
        status: "draft" as const,
        buyerName: input.buyerName ?? null,
        buyerType: input.buyerType ?? null,
        priceRange: input.priceRange ?? null,
        targetAreas: input.targetAreas ?? null,
        desiredBedrooms: input.desiredBedrooms ?? null,
        desiredBathrooms: input.desiredBathrooms ?? null,
        mustHaves: input.mustHaves ?? null,
        niceToHaves: input.niceToHaves ?? null,
        timeline: input.timeline ?? null,
        marketCity: input.marketCity ?? null,
        marketState: input.marketState ?? null,
        marketOverview: input.marketOverview ?? null,
        avgDaysOnMarket: input.avgDaysOnMarket ?? null,
        avgListPrice: input.avgListPrice ?? null,
        inventoryLevel: input.inventoryLevel ?? null,
        financingNotes: input.financingNotes ?? null,
        lenderName: input.lenderName ?? null,
        lenderContact: input.lenderContact ?? null,
        agentName: input.agentName ?? null,
        agentBio: input.agentBio ?? null,
        agentStats: input.agentStats ?? null,
        agentTestimonials: input.agentTestimonials ?? null,
        processSteps: input.processSteps ?? null,
        buyerConcerns: input.buyerConcerns ?? null,
        exportFormat: input.exportFormat,
        inputData: JSON.stringify(input),
      };

      if (input.id) {
        const [existing] = await db
          .select({ id: buyerPresentations.id })
          .from(buyerPresentations)
          .where(and(
            eq(buyerPresentations.id, input.id),
            eq(buyerPresentations.userId, ctx.user.id)
          ));
        if (!existing) throw new Error("Draft not found");

        await db
          .update(buyerPresentations)
          .set(values)
          .where(eq(buyerPresentations.id, input.id));
        return { id: input.id };
      } else {
        await db.insert(buyerPresentations).values(values);
        const [inserted] = await db
          .select({ id: buyerPresentations.id })
          .from(buyerPresentations)
          .where(and(
            eq(buyerPresentations.userId, ctx.user.id),
            eq(buyerPresentations.status, "draft")
          ))
          .orderBy(desc(buyerPresentations.createdAt))
          .limit(1);
        return { id: inserted!.id };
      }
    }),

  // ── Generate a buyer presentation via Gamma ───────────────────────────────
  generate: protectedProcedure
    .input(generateInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ENV.GAMMA_API_KEY) throw new Error("Gamma API key not configured. Please add it in Settings → Secrets.");

      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const buyerLabel = input.buyerName ? `for ${input.buyerName}` : "";
      const title = `Buyer Presentation ${buyerLabel} — ${input.marketCity}`.trim();
      const prompt = buildBuyerGammaPrompt(input);

      let presentationId = input.presentationId;

      const commonValues = {
        title,
        status: "generating" as const,
        buyerName: input.buyerName ?? null,
        buyerType: input.buyerType,
        priceRange: input.priceRange ?? null,
        targetAreas: input.targetAreas ? JSON.stringify(input.targetAreas) : null,
        desiredBedrooms: input.desiredBedrooms ?? null,
        desiredBathrooms: input.desiredBathrooms ?? null,
        mustHaves: input.mustHaves ?? null,
        niceToHaves: input.niceToHaves ?? null,
        timeline: input.timeline ?? null,
        marketCity: input.marketCity,
        marketState: input.marketState ?? null,
        marketOverview: input.marketOverview ?? null,
        avgDaysOnMarket: input.avgDaysOnMarket ?? null,
        avgListPrice: input.avgListPrice ?? null,
        inventoryLevel: input.inventoryLevel ?? null,
        financingNotes: input.financingNotes ?? null,
        lenderName: input.lenderName ?? null,
        lenderContact: input.lenderContact ?? null,
        agentName: input.agentName,
        agentBio: input.agentBio ?? null,
        agentStats: input.agentStats ?? null,
        agentTestimonials: input.agentTestimonials ?? null,
        processSteps: input.processSteps ? JSON.stringify(input.processSteps) : null,
        buyerConcerns: input.buyerConcerns ?? null,
        exportFormat: input.exportFormat,
        inputData: JSON.stringify(input),
      };

      if (presentationId) {
        const [existing] = await db
          .select({ id: buyerPresentations.id })
          .from(buyerPresentations)
          .where(and(
            eq(buyerPresentations.id, presentationId),
            eq(buyerPresentations.userId, ctx.user.id)
          ));
        if (!existing) throw new Error("Presentation not found");
        await db.update(buyerPresentations).set(commonValues).where(eq(buyerPresentations.id, presentationId));
      } else {
        await db.insert(buyerPresentations).values({ userId: ctx.user.id, ...commonValues });
        const [inserted] = await db
          .select({ id: buyerPresentations.id })
          .from(buyerPresentations)
          .where(and(
            eq(buyerPresentations.userId, ctx.user.id),
            eq(buyerPresentations.status, "generating")
          ))
          .orderBy(desc(buyerPresentations.createdAt))
          .limit(1);
        presentationId = inserted?.id;
        if (!presentationId) throw new Error("Failed to create presentation record");
      }

      try {
        const gammaPayload: Record<string, unknown> = {
          inputText: prompt,
          textMode: "generate",
          format: "presentation",
          numCards: 12,
          exportAs: input.exportFormat,
          textOptions: { tone: "professional" },
          imageOptions: { source: "web" },
        };
        if (input.themeId) gammaPayload.themeId = input.themeId;

        const generation = await gammaRequest("/generations", "POST", gammaPayload);
        const gammaId: string = generation?.generationId ?? generation?.id ?? "";

        // Poll for completion (up to 3 minutes)
        let gammaUrl = "";
        let attempts = 0;
        const maxAttempts = 36;

        while (attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, 5000));
          attempts++;
          try {
            const status = await gammaRequest(`/generations/${gammaId}`, "GET");
            const state: string = status?.status ?? "";
            if (state === "completed") {
              gammaUrl = status?.gammaUrl ?? "";
              break;
            } else if (state === "failed") {
              throw new Error(status?.error?.message ?? "Gamma generation failed");
            }
          } catch (pollErr) {
            if (attempts >= maxAttempts) throw pollErr;
          }
        }

        // Try to get thumbnail
        let thumbnailUrl = "";
        try {
          const previewRes = await gammaRequest(`/generations/${gammaId}/preview`, "GET");
          thumbnailUrl = previewRes?.previewUrl ?? previewRes?.thumbnailUrl ?? "";
        } catch { /* optional */ }

        await db
          .update(buyerPresentations)
          .set({ gammaId, gammaUrl, status: "completed", thumbnailUrl: thumbnailUrl || null })
          .where(eq(buyerPresentations.id, presentationId));

        return { id: presentationId, gammaUrl, thumbnailUrl, status: "completed" };
      } catch (err) {
        await db
          .update(buyerPresentations)
          .set({ status: "failed" })
          .where(eq(buyerPresentations.id, presentationId));
        throw err;
      }
    }),

  // ── Public page for buyers (no auth required) ────────────────────────────
  getPublic: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [pres] = await db
        .select()
        .from(buyerPresentations)
        .where(and(
          eq(buyerPresentations.id, input.id),
          eq(buyerPresentations.status, "completed")
        ))
        .limit(1);
      if (!pres) throw new Error("Presentation not found");

      // Get the agent's persona for booking URL and headshot
      const [personaRow] = await db
        .select({ bookingUrl: personas.bookingUrl, agentName: personas.agentName, headshotUrl: personas.headshotUrl })
        .from(personas)
        .where(eq(personas.userId, pres.userId))
        .limit(1);

      // Track the view
      await db.insert(presentationViews).values({
        presentationId: pres.id,
        presentationType: "buyer",
      }).catch(() => {}); // non-critical

      return {
        id: pres.id,
        title: pres.title,
        buyerName: pres.buyerName,
        marketCity: pres.marketCity,
        marketState: pres.marketState,
        gammaUrl: pres.gammaUrl,
        thumbnailUrl: pres.thumbnailUrl,
        agentName: pres.agentName || personaRow?.agentName || null,
        agentHeadshotUrl: personaRow?.headshotUrl || null,
        agentBio: pres.agentBio,
        bookingUrl: personaRow?.bookingUrl || null,
      };
    }),

  // ── Delete a presentation ─────────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ presentationId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [pres] = await db
        .select()
        .from(buyerPresentations)
        .where(and(
          eq(buyerPresentations.id, input.presentationId),
          eq(buyerPresentations.userId, ctx.user.id)
        ));
      if (!pres) throw new Error("Presentation not found");
      await db.delete(buyerPresentations).where(eq(buyerPresentations.id, input.presentationId));
      return { success: true };
    }),
});
