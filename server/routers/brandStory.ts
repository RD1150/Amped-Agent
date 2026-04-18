import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { brandStories } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

export const brandStoryRouter = router({
  /**
   * Generate brand story outputs from interview answers
   */
  generate: protectedProcedure
    .input(
      z.object({
        whyRealEstate: z.string().min(10),
        mostMemorableWin: z.string().min(10),
        whatMakesYouDifferent: z.string().min(10),
        whoYouServe: z.string().min(5),
        yourMarket: z.string().min(5),
        personalFact: z.string().min(5),
        agentName: z.string().optional(),
        city: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const agentRef = input.agentName ? `Agent name: ${input.agentName}` : "";
      const cityRef = input.city ? `Primary market: ${input.city}` : "";

      const systemPrompt = `You are a professional brand copywriter specializing in real estate agent personal branding. 
You craft authentic, compelling brand stories that help agents stand out in crowded markets. 
Your writing is warm, specific, and avoids generic real estate clichés. 
You write in first person as the agent. 
Format your response as valid JSON only.`;

      const userPrompt = `Create a complete brand story package for a real estate agent based on their interview answers.
${agentRef}
${cityRef}

Interview Answers:
1. Why did you get into real estate? "${input.whyRealEstate}"
2. Most memorable client win: "${input.mostMemorableWin}"
3. What makes you different: "${input.whatMakesYouDifferent}"
4. Who you serve: "${input.whoYouServe}"
5. What makes your market unique: "${input.yourMarket}"
6. One personal fact: "${input.personalFact}"

Generate all five brand story outputs. Rules:
- Write in first person ("I", "my", "me")
- Be specific and personal — avoid generic phrases like "I'm passionate about helping clients"
- Make it sound like a real human wrote it, not AI
- Each output serves a different purpose and length

Return ONLY valid JSON in this exact format:
{
  "shortBio": "2-3 sentence bio for social media profiles (under 200 characters ideally)",
  "longBio": "Full brand story in 400-600 words — narrative arc from why you started to who you serve today",
  "elevatorPitch": "30-second verbal pitch (about 75 words) — what you say when someone asks what you do",
  "socialCaption": "Instagram/Facebook intro post (150-200 words) — casual, personal, ends with a soft CTA",
  "linkedinSummary": "LinkedIn About section (250-350 words) — professional but personal, includes a clear value proposition"
}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "brand_story",
            strict: true,
            schema: {
              type: "object",
              properties: {
                shortBio: { type: "string" },
                longBio: { type: "string" },
                elevatorPitch: { type: "string" },
                socialCaption: { type: "string" },
                linkedinSummary: { type: "string" },
              },
              required: ["shortBio", "longBio", "elevatorPitch", "socialCaption", "linkedinSummary"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices[0]?.message?.content;
      const raw = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
      if (!raw) throw new Error("No response from AI");

      const parsed = JSON.parse(raw);

      // Save to database (upsert — one brand story per user, overwrite if exists)
      const database = await getDb();
      const existing = await database!
        .select()
        .from(brandStories)
        .where(eq(brandStories.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        await database!.update(brandStories).set({
          whyRealEstate: input.whyRealEstate,
          mostMemorableWin: input.mostMemorableWin,
          whatMakesYouDifferent: input.whatMakesYouDifferent,
          whoYouServe: input.whoYouServe,
          yourMarket: input.yourMarket,
          personalFact: input.personalFact,
          shortBio: parsed.shortBio,
          longBio: parsed.longBio,
          elevatorPitch: parsed.elevatorPitch,
          socialCaption: parsed.socialCaption,
          linkedinSummary: parsed.linkedinSummary,
        }).where(eq(brandStories.userId, ctx.user.id));

        const [updated] = await database!.select().from(brandStories).where(eq(brandStories.userId, ctx.user.id)).limit(1);
        return updated;
      } else {
        const insertResult = await database!.insert(brandStories).values({
          userId: ctx.user.id,
          whyRealEstate: input.whyRealEstate,
          mostMemorableWin: input.mostMemorableWin,
          whatMakesYouDifferent: input.whatMakesYouDifferent,
          whoYouServe: input.whoYouServe,
          yourMarket: input.yourMarket,
          personalFact: input.personalFact,
          shortBio: parsed.shortBio,
          longBio: parsed.longBio,
          elevatorPitch: parsed.elevatorPitch,
          socialCaption: parsed.socialCaption,
          linkedinSummary: parsed.linkedinSummary,
        }).returning();
        const [newStory] = await database!.select().from(brandStories).where(eq(brandStories.id, inserted[0]?.id)).limit(1);
        return newStory;
      }
    }),

  /**
   * Get the current user's saved brand story (if any)
   */
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    const [story] = await database!
      .select()
      .from(brandStories)
      .where(eq(brandStories.userId, ctx.user.id))
      .limit(1);
    return story ?? null;
  }),

  /**
   * Delete the current user's brand story
   */
  delete: protectedProcedure.mutation(async ({ ctx }) => {
    const database = await getDb();
    await database!.delete(brandStories).where(eq(brandStories.userId, ctx.user.id));
    return { success: true };
  }),
});
