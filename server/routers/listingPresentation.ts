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

  // ── Generate a listing presentation via Gamma ─────────────────────────────
  generate: protectedProcedure
    .input(z.object({
      propertyAddress: z.string().min(5, "Property address is required"),
      listingPrice: z.string(),
      bedrooms: z.string(),
      bathrooms: z.string(),
      squareFeet: z.string(),
      keyFeatures: z.string(),
      agentName: z.string(),
      agentStats: z.string().optional(),
      marketData: z.string().optional(),
      exportFormat: z.enum(["pdf", "pptx"]).default("pptx"),
      themeId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ENV.GAMMA_API_KEY) throw new Error("Gamma API key not configured. Please add it in Settings → Secrets.");

      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const title = `Listing Presentation — ${input.propertyAddress}`;

      // Build the prompt for Gamma
      const prompt = `Create a professional real estate listing presentation for:

**Property:** ${input.propertyAddress}
**Price:** ${input.listingPrice}
**Bedrooms:** ${input.bedrooms} | **Bathrooms:** ${input.bathrooms} | **Square Feet:** ${input.squareFeet}

**Key Features & Highlights:**
${input.keyFeatures}

**Listing Agent:** ${input.agentName}
${input.agentStats ? `**Agent Stats & Track Record:** ${input.agentStats}` : ""}
${input.marketData ? `**Market Data & Comparable Sales:** ${input.marketData}` : ""}

The presentation should include:
1. Cover slide with property address and price
2. Property overview and highlights
3. Photo showcase section
4. Key features and amenities
5. Market analysis and comparable sales
6. Why list with ${input.agentName} — agent bio and stats
7. Marketing plan (social media, video tours, open houses)
8. Next steps and call to action

Tone: Professional, luxury real estate. Audience: Home sellers.`;

      // Insert pending record
      await db.insert(listingPresentations).values({
        userId: ctx.user.id,
        title,
        propertyAddress: input.propertyAddress,
        status: "generating",
        exportFormat: input.exportFormat,
        inputData: JSON.stringify(input),
      });

      const [inserted] = await db
        .select({ id: listingPresentations.id })
        .from(listingPresentations)
        .where(and(
          eq(listingPresentations.userId, ctx.user.id),
          eq(listingPresentations.title, title)
        ))
        .orderBy(desc(listingPresentations.createdAt))
        .limit(1);

      const presentationId = inserted?.id;
      if (!presentationId) throw new Error("Failed to create presentation record");

      try {
        // Call Gamma API
        const gammaPayload: Record<string, unknown> = {
          inputText: prompt,
          textMode: "generate",
          format: "presentation",
          numCards: 10,
          exportAs: input.exportFormat,
          textOptions: {
            tone: "professional",
          },
          imageOptions: {
            source: "web",
          },
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
              const errMsg = status?.error?.message ?? "Gamma generation failed";
              throw new Error(errMsg);
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
