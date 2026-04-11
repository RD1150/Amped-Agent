import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { listingPresentations } from "../../drizzle/schema";
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

// ── Shared input shape ────────────────────────────────────────────────────────

const draftInputSchema = z.object({
  id: z.number().int().optional(),
  title: z.string().min(1),
  // Property
  propertyAddress: z.string().optional(),
  listingPrice: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  squareFeet: z.string().optional(),
  lotSize: z.string().optional(),
  yearBuilt: z.string().optional(),
  propertyType: z.string().optional(),
  hoaFee: z.string().optional(),
  listingDescription: z.string().optional(),
  keyFeatures: z.string().optional(),
  // Photos
  photoUrls: z.string().optional(), // JSON string[]
  // CMA
  comparableSales: z.string().optional(), // JSON Comp[]
  marketOverview: z.string().optional(),
  suggestedPriceRange: z.string().optional(),
  pricingRationale: z.string().optional(),
  // Agent
  agentName: z.string().optional(),
  agentBio: z.string().optional(),
  agentStats: z.string().optional(),
  agentTestimonials: z.string().optional(), // JSON {author, text}[]
  // Marketing
  marketingChannels: z.string().optional(), // JSON string[]
  marketingDetails: z.string().optional(),
  openHouseStrategy: z.string().optional(),
  timelineToList: z.string().optional(),
  // Export
  exportFormat: z.enum(["pdf", "pptx"]).default("pptx"),
  themeId: z.string().optional(),
});

const generateInputSchema = z.object({
  presentationId: z.number().int().optional(),
  // Property
  propertyAddress: z.string().min(5, "Property address is required"),
  listingPrice: z.string(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  squareFeet: z.string().optional(),
  lotSize: z.string().optional(),
  yearBuilt: z.string().optional(),
  propertyType: z.string().optional(),
  hoaFee: z.string().optional(),
  listingDescription: z.string().optional(),
  keyFeatures: z.string().optional(),
  // Photos
  photoUrls: z.array(z.string()).optional(),
  // CMA
  comparableSales: z.string().optional(), // JSON
  marketOverview: z.string().optional(),
  suggestedPriceRange: z.string().optional(),
  pricingRationale: z.string().optional(),
  // Agent
  agentName: z.string(),
  agentBio: z.string().optional(),
  agentStats: z.string().optional(),
  agentTestimonials: z.string().optional(), // JSON
  // Marketing
  marketingChannels: z.array(z.string()).optional(),
  marketingDetails: z.string().optional(),
  openHouseStrategy: z.string().optional(),
  timelineToList: z.string().optional(),
  // Export
  exportFormat: z.enum(["pdf", "pptx"]).default("pptx"),
  themeId: z.string().optional(),
});

// ── Build the Gamma prompt ────────────────────────────────────────────────────

function buildGammaPrompt(input: z.infer<typeof generateInputSchema>): string {
  const lines: string[] = [];

  lines.push(`Create a professional real estate listing presentation with exactly 15 slides for the following property and agent. Use a luxury, polished tone. Each slide should be visually distinct with clear headings and concise bullet points.\n`);

  // Property
  lines.push(`## PROPERTY INFORMATION`);
  lines.push(`Address: ${input.propertyAddress}`);
  lines.push(`Listing Price: ${input.listingPrice}`);
  if (input.propertyType) lines.push(`Type: ${input.propertyType}`);
  const specs = [
    input.bedrooms && `${input.bedrooms} Bedrooms`,
    input.bathrooms && `${input.bathrooms} Bathrooms`,
    input.squareFeet && `${input.squareFeet} sq ft`,
    input.lotSize && `Lot: ${input.lotSize}`,
    input.yearBuilt && `Built: ${input.yearBuilt}`,
    input.hoaFee && `HOA: ${input.hoaFee}`,
  ].filter(Boolean);
  if (specs.length) lines.push(`Specs: ${specs.join(" | ")}`);
  if (input.listingDescription) lines.push(`\nDescription:\n${input.listingDescription}`);
  if (input.keyFeatures) lines.push(`\nKey Features & Highlights:\n${input.keyFeatures}`);

  // CMA
  lines.push(`\n## MARKET DATA & PRICING STRATEGY`);
  if (input.marketOverview) lines.push(`Market Overview:\n${input.marketOverview}`);
  if (input.suggestedPriceRange) lines.push(`Suggested List Price Range: ${input.suggestedPriceRange}`);
  if (input.pricingRationale) lines.push(`Pricing Rationale: ${input.pricingRationale}`);

  try {
    const comps = JSON.parse(input.comparableSales ?? "[]") as Array<{
      address: string; price: string; sqft: string; daysOnMarket: string; soldDate: string;
    }>;
    const validComps = comps.filter((c) => c.address);
    if (validComps.length > 0) {
      lines.push(`\nComparable Sales:`);
      validComps.forEach((c, i) => {
        const parts = [c.address, c.price && `Sold: ${c.price}`, c.sqft && `${c.sqft} sqft`, c.daysOnMarket && `${c.daysOnMarket} DOM`, c.soldDate].filter(Boolean);
        lines.push(`  Comp ${i + 1}: ${parts.join(" | ")}`);
      });
    }
  } catch { /* ignore parse errors */ }

  // Agent
  lines.push(`\n## LISTING AGENT`);
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

  // Marketing
  lines.push(`\n## MARKETING PLAN`);
  if (input.marketingChannels?.length) {
    lines.push(`Marketing Channels: ${input.marketingChannels.join(", ")}`);
  }
  if (input.marketingDetails) lines.push(`\nMarketing Details:\n${input.marketingDetails}`);
  if (input.openHouseStrategy) lines.push(`\nOpen House Strategy:\n${input.openHouseStrategy}`);
  if (input.timelineToList) lines.push(`\nTimeline to List:\n${input.timelineToList}`);

  // Slide structure
  lines.push(`\n## REQUIRED SLIDE STRUCTURE (15 slides)`);
  lines.push(`1. Cover — Property address, listing price, stunning hero image`);
  lines.push(`2. Property Overview — Key specs at a glance (beds/baths/sqft/type/year built)`);
  lines.push(`3. Property Highlights — Top 5–6 selling points with icons`);
  lines.push(`4. Photo Gallery — Showcase the best interior and exterior photos`);
  lines.push(`5. Floor Plan / Layout — Description of flow and layout`);
  lines.push(`6. Neighborhood & Location — Schools, amenities, walkability, lifestyle`);
  lines.push(`7. Market Snapshot — Current market conditions, inventory, price trends`);
  lines.push(`8. Comparable Sales — CMA table with 3–5 recent comps`);
  lines.push(`9. Pricing Strategy — Recommended list price range and rationale`);
  lines.push(`10. Why List With ${input.agentName} — Agent bio, credentials, stats`);
  lines.push(`11. Track Record — Key numbers: homes sold, avg DOM, list-to-sale ratio, volume`);
  lines.push(`12. Client Testimonials — 2–3 quotes from past sellers`);
  lines.push(`13. Marketing Plan — Channels, timeline, differentiators`);
  lines.push(`14. Open House & Launch Strategy — Broker preview, public open house, events`);
  lines.push(`15. Next Steps & Call to Action — Sign listing agreement, timeline, contact info`);

  return lines.join("\n");
}

// ── Router ────────────────────────────────────────────────────────────────────

export const listingPresentationRouter = router({

  // ── List presentations for current user ───────────────────────────────────
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(listingPresentations)
      .where(eq(listingPresentations.userId, ctx.user.id))
      .orderBy(desc(listingPresentations.createdAt));
  }),

  // ── Get themes from Gamma workspace ──────────────────────────────────────
  getThemes: protectedProcedure.query(async () => {
    if (!ENV.GAMMA_API_KEY) return [];
    try {
      const data = await gammaRequest("/themes", "GET");
      return (data?.data ?? []) as { id: string; name: string }[];
    } catch {
      return [];
    }
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
        propertyAddress: input.propertyAddress ?? null,
        listingPrice: input.listingPrice ?? null,
        bedrooms: input.bedrooms ?? null,
        bathrooms: input.bathrooms ?? null,
        squareFeet: input.squareFeet ?? null,
        lotSize: input.lotSize ?? null,
        yearBuilt: input.yearBuilt ?? null,
        propertyType: input.propertyType ?? null,
        hoaFee: input.hoaFee ?? null,
        listingDescription: input.listingDescription ?? null,
        keyFeatures: input.keyFeatures ?? null,
        photoUrls: input.photoUrls ?? null,
        comparableSales: input.comparableSales ?? null,
        marketOverview: input.marketOverview ?? null,
        suggestedPriceRange: input.suggestedPriceRange ?? null,
        pricingRationale: input.pricingRationale ?? null,
        agentName: input.agentName ?? null,
        agentBio: input.agentBio ?? null,
        agentStats: input.agentStats ?? null,
        agentTestimonials: input.agentTestimonials ?? null,
        marketingChannels: input.marketingChannels ?? null,
        marketingDetails: input.marketingDetails ?? null,
        openHouseStrategy: input.openHouseStrategy ?? null,
        timelineToList: input.timelineToList ?? null,
        exportFormat: input.exportFormat,
        inputData: JSON.stringify(input),
      };

      if (input.id) {
        // Verify ownership
        const [existing] = await db
          .select({ id: listingPresentations.id })
          .from(listingPresentations)
          .where(and(
            eq(listingPresentations.id, input.id),
            eq(listingPresentations.userId, ctx.user.id)
          ));
        if (!existing) throw new Error("Draft not found");

        await db
          .update(listingPresentations)
          .set(values)
          .where(eq(listingPresentations.id, input.id));
        return { id: input.id };
      } else {
        await db.insert(listingPresentations).values(values);
        const [inserted] = await db
          .select({ id: listingPresentations.id })
          .from(listingPresentations)
          .where(and(
            eq(listingPresentations.userId, ctx.user.id),
            eq(listingPresentations.status, "draft")
          ))
          .orderBy(desc(listingPresentations.createdAt))
          .limit(1);
        return { id: inserted!.id };
      }
    }),

  // ── Generate a listing presentation via Gamma ─────────────────────────────
  generate: protectedProcedure
    .input(generateInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ENV.GAMMA_API_KEY) throw new Error("Gamma API key not configured. Please add it in Settings → Secrets.");

      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const title = `Listing Presentation — ${input.propertyAddress}`;
      const prompt = buildGammaPrompt(input);

      let presentationId = input.presentationId;

      if (presentationId) {
        // Update the existing draft to "generating"
        const [existing] = await db
          .select({ id: listingPresentations.id })
          .from(listingPresentations)
          .where(and(
            eq(listingPresentations.id, presentationId),
            eq(listingPresentations.userId, ctx.user.id)
          ));
        if (!existing) throw new Error("Presentation not found");

        await db
          .update(listingPresentations)
          .set({
            title,
            status: "generating",
            propertyAddress: input.propertyAddress,
            listingPrice: input.listingPrice,
            bedrooms: input.bedrooms ?? null,
            bathrooms: input.bathrooms ?? null,
            squareFeet: input.squareFeet ?? null,
            lotSize: input.lotSize ?? null,
            yearBuilt: input.yearBuilt ?? null,
            propertyType: input.propertyType ?? null,
            hoaFee: input.hoaFee ?? null,
            listingDescription: input.listingDescription ?? null,
            keyFeatures: input.keyFeatures ?? null,
            photoUrls: input.photoUrls ? JSON.stringify(input.photoUrls) : null,
            comparableSales: input.comparableSales ?? null,
            marketOverview: input.marketOverview ?? null,
            suggestedPriceRange: input.suggestedPriceRange ?? null,
            pricingRationale: input.pricingRationale ?? null,
            agentName: input.agentName,
            agentBio: input.agentBio ?? null,
            agentStats: input.agentStats ?? null,
            agentTestimonials: input.agentTestimonials ?? null,
            marketingChannels: input.marketingChannels ? JSON.stringify(input.marketingChannels) : null,
            marketingDetails: input.marketingDetails ?? null,
            openHouseStrategy: input.openHouseStrategy ?? null,
            timelineToList: input.timelineToList ?? null,
            exportFormat: input.exportFormat,
            inputData: JSON.stringify(input),
          })
          .where(eq(listingPresentations.id, presentationId));
      } else {
        // Insert new record
        await db.insert(listingPresentations).values({
          userId: ctx.user.id,
          title,
          status: "generating",
          propertyAddress: input.propertyAddress,
          listingPrice: input.listingPrice,
          bedrooms: input.bedrooms ?? null,
          bathrooms: input.bathrooms ?? null,
          squareFeet: input.squareFeet ?? null,
          lotSize: input.lotSize ?? null,
          yearBuilt: input.yearBuilt ?? null,
          propertyType: input.propertyType ?? null,
          hoaFee: input.hoaFee ?? null,
          listingDescription: input.listingDescription ?? null,
          keyFeatures: input.keyFeatures ?? null,
          photoUrls: input.photoUrls ? JSON.stringify(input.photoUrls) : null,
          comparableSales: input.comparableSales ?? null,
          marketOverview: input.marketOverview ?? null,
          suggestedPriceRange: input.suggestedPriceRange ?? null,
          pricingRationale: input.pricingRationale ?? null,
          agentName: input.agentName,
          agentBio: input.agentBio ?? null,
          agentStats: input.agentStats ?? null,
          agentTestimonials: input.agentTestimonials ?? null,
          marketingChannels: input.marketingChannels ? JSON.stringify(input.marketingChannels) : null,
          marketingDetails: input.marketingDetails ?? null,
          openHouseStrategy: input.openHouseStrategy ?? null,
          timelineToList: input.timelineToList ?? null,
          exportFormat: input.exportFormat,
          inputData: JSON.stringify(input),
        });

        const [inserted] = await db
          .select({ id: listingPresentations.id })
          .from(listingPresentations)
          .where(and(
            eq(listingPresentations.userId, ctx.user.id),
            eq(listingPresentations.status, "generating")
          ))
          .orderBy(desc(listingPresentations.createdAt))
          .limit(1);

        presentationId = inserted?.id;
        if (!presentationId) throw new Error("Failed to create presentation record");
      }

      try {
        // Call Gamma API
        const gammaPayload: Record<string, unknown> = {
          inputText: prompt,
          textMode: "generate",
          format: "presentation",
          numCards: 15,
          exportAs: input.exportFormat,
          textOptions: { tone: "professional" },
          imageOptions: { source: "web" },
        };
        if (input.themeId) gammaPayload.themeId = input.themeId;

        const generation = await gammaRequest("/generations", "POST", gammaPayload);
        const gammaId: string = generation?.generationId ?? generation?.id ?? "";

        // Poll for completion (up to 3 minutes)
        let gammaUrl = "";
        let exportUrl = "";
        let attempts = 0;
        const maxAttempts = 36; // 36 × 5s = 3 min

        while (attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, 5000));
          attempts++;
          try {
            const status = await gammaRequest(`/generations/${gammaId}`, "GET");
            const state: string = status?.status ?? "";
            if (state === "completed") {
              gammaUrl = status?.gammaUrl ?? "";
              exportUrl = status?.exportUrl ?? "";
              break;
            } else if (state === "failed") {
              throw new Error(status?.error?.message ?? "Gamma generation failed");
            }
          } catch (pollErr) {
            if (attempts >= maxAttempts) throw pollErr;
          }
        }

        await db
          .update(listingPresentations)
          .set({ gammaId, gammaUrl, exportUrl, status: "completed" })
          .where(eq(listingPresentations.id, presentationId));

        return { id: presentationId, gammaUrl, exportUrl, status: "completed" };
      } catch (err) {
        await db
          .update(listingPresentations)
          .set({ status: "failed" })
          .where(eq(listingPresentations.id, presentationId));
        throw err;
      }
    }),

  // ── Delete a presentation ─────────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ presentationId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [pres] = await db
        .select()
        .from(listingPresentations)
        .where(and(
          eq(listingPresentations.id, input.presentationId),
          eq(listingPresentations.userId, ctx.user.id)
        ));
      if (!pres) throw new Error("Presentation not found");
      await db.delete(listingPresentations).where(eq(listingPresentations.id, input.presentationId));
      return { success: true };
    }),
});
