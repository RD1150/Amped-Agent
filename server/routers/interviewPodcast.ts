import { z } from "zod";
import { protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { interviewGuests, interviewEpisodes } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

// ─── Static guest persona definitions ────────────────────────────────────────
const GUEST_PERSONAS = [
  {
    name: "Sarah Mitchell",
    role: "Home Stager",
    bio: "Award-winning home stager with 12 years of experience transforming properties to sell faster and for more money. Specializes in budget-friendly staging that maximizes buyer appeal.",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    voiceName: "Bella",
    avatarUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/guest-home-stager-k4Z6McrVAES9nTMf96eQ4S.webp",
    accentColor: "#d97706",
    sortOrder: 1,
  },
  {
    name: "Marcus Chen",
    role: "Mortgage Broker",
    bio: "Senior mortgage advisor with access to 40+ lenders. Helps buyers navigate rates, programs, and financing options to get the best deal in any market condition.",
    voiceId: "TxGEqnHWrfWFTfGW9XjX",
    voiceName: "Josh",
    avatarUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/guest-mortgage-broker-fZsktstbriVMdzdUkk9pfp.webp",
    accentColor: "#1d4ed8",
    sortOrder: 2,
  },
  {
    name: "Elena Vasquez",
    role: "Restaurant Reviewer",
    bio: "Local food critic and lifestyle writer covering the best dining experiences in the area. Her reviews help buyers understand the culinary culture and lifestyle of every neighborhood.",
    voiceId: "MF3mGyEYCl7XYWbV9V6O",
    voiceName: "Elli",
    avatarUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/guest-restaurant-reviewer-TeyhH4Rfi6FcsqwkVT2va8.webp",
    accentColor: "#dc2626",
    sortOrder: 3,
  },
  {
    name: "David Park",
    role: "Neighborhood Expert",
    bio: "Community historian and local advocate who knows every street, school, park, and hidden gem in the area. Helps buyers fall in love with the lifestyle, not just the house.",
    voiceId: "VR6AewLTigWG4xSOukaG",
    voiceName: "Arnold",
    avatarUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/guest-neighborhood-expert-YQJE36fHEXAN7qPqueVpfo.webp",
    accentColor: "#16a34a",
    sortOrder: 4,
  },
  {
    name: "Isabelle Laurent",
    role: "Interior Designer",
    bio: "Principal designer at Laurent Studio, specializing in residential transformations. Helps homeowners envision the potential of any space and understand design trends that add value.",
    voiceId: "pNInz6obpgDQGcFmaJgB",
    voiceName: "Nicole",
    avatarUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/guest-interior-designer-kjXAss7pohwUvQyQZr4G7M.webp",
    accentColor: "#7c3aed",
    sortOrder: 5,
  },
];

// ─── Helper: seed guests if table is empty ────────────────────────────────────
async function ensureGuestsSeeded() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select({ id: interviewGuests.id }).from(interviewGuests).limit(1);
  if (existing.length === 0) {
    for (const g of GUEST_PERSONAS) {
      await db.insert(interviewGuests).values(g);
    }
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const interviewPodcastRouter = {
  // Get all active guest personas
  getGuests: protectedProcedure.query(async () => {
    await ensureGuestsSeeded();
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    return db
      .select()
      .from(interviewGuests)
      .where(eq(interviewGuests.isActive, true))
      .orderBy(interviewGuests.sortOrder);
  }),

  // Generate an AI interview script for a given guest and topic
  generateScript: protectedProcedure
    .input(
      z.object({
        guestId: z.number(),
        topic: z.string().min(10).max(500),
        agentName: z.string().optional(),
        agentCity: z.string().optional(),
        numExchanges: z.number().min(4).max(10).default(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const guest = await db
        .select()
        .from(interviewGuests)
        .where(eq(interviewGuests.id, input.guestId))
        .limit(1);
      if (!guest[0]) throw new Error("Guest not found");

      const g = guest[0];
      const agentName = input.agentName || "your host";
      const agentCity = input.agentCity || "the local area";

      const systemPrompt = `You are a podcast script writer for a real estate agent's interview-style podcast. 
The host is ${agentName}, a real estate agent serving ${agentCity}.
The guest is ${g.name}, a ${g.role}. Their bio: ${g.bio}

Write a natural, engaging interview conversation. Keep each response concise (2-4 sentences). 
Be informative and helpful to home buyers and sellers. Use a warm, conversational tone.
Return ONLY valid JSON — no markdown, no code blocks.`;

      const userPrompt = `Create a ${input.numExchanges}-exchange interview on the topic: "${input.topic}"

Return a JSON object with this exact structure:
{
  "title": "Episode title (catchy, under 60 chars)",
  "description": "Episode description (2-3 sentences for show notes)",
  "exchanges": [
    { "speaker": "host", "text": "Question or intro from the agent" },
    { "speaker": "guest", "text": "Answer from ${g.name}" }
  ]
}

The first exchange must be the host introducing the guest. The last exchange must be the host thanking the guest and giving a call to action.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "interview_script",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                exchanges: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      speaker: { type: "string", enum: ["host", "guest"] },
                      text: { type: "string" },
                    },
                    required: ["speaker", "text"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["title", "description", "exchanges"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : null;
      if (!content) throw new Error("No script generated");

      let parsed: {
        title: string;
        description: string;
        exchanges: Array<{ speaker: string; text: string }>;
      };
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new Error("Failed to parse generated script");
      }

      // Save as a draft episode
      const insertResult = await db.insert(interviewEpisodes).values({
        userId: ctx.user.id,
        guestId: input.guestId,
        topic: parsed.title || input.topic,
        script: JSON.stringify(parsed),
        status: "draft",
      });
      const episodeId = (insertResult as unknown as [{ insertId: number }])[0].insertId;

      return { episodeId, ...parsed };
    }),

  // Get a single episode (for the review/edit page)
  getEpisode: protectedProcedure
    .input(z.object({ episodeId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const episode = await db
        .select()
        .from(interviewEpisodes)
        .where(
          and(
            eq(interviewEpisodes.id, input.episodeId),
            eq(interviewEpisodes.userId, ctx.user.id)
          )
        )
        .limit(1);
      if (!episode[0]) throw new Error("Episode not found");

      const guest = await db
        .select()
        .from(interviewGuests)
        .where(eq(interviewGuests.id, episode[0].guestId))
        .limit(1);

      return { episode: episode[0], guest: guest[0] ?? null };
    }),

  // Save an edited script and mark as approved
  approveScript: protectedProcedure
    .input(
      z.object({
        episodeId: z.number(),
        script: z.string(),
        topic: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(interviewEpisodes)
        .set({
          script: input.script,
          ...(input.topic ? { topic: input.topic } : {}),
          status: "approved",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(interviewEpisodes.id, input.episodeId),
            eq(interviewEpisodes.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  // List all episodes for the current user
  listEpisodes: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const episodes = await db
      .select()
      .from(interviewEpisodes)
      .where(eq(interviewEpisodes.userId, ctx.user.id))
      .orderBy(desc(interviewEpisodes.createdAt));

    const allGuests = await db.select().from(interviewGuests);
    const guestMap: Record<number, typeof allGuests[0]> = {};
    for (const g of allGuests) {
      guestMap[g.id] = g;
    }

    return episodes.map((ep) => ({
      ...ep,
      guest: guestMap[ep.guestId] ?? null,
    }));
  }),

  // Delete an episode
  deleteEpisode: protectedProcedure
    .input(z.object({ episodeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .delete(interviewEpisodes)
        .where(
          and(
            eq(interviewEpisodes.id, input.episodeId),
            eq(interviewEpisodes.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),
};
