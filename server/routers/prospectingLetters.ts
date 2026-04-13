/**
 * prospectingLetters.ts
 * Prospecting Letter Studio — AI-generated, tone-aware real estate prospecting letters.
 *
 * Covers all major letter types including sensitive situations (divorce, pre-foreclosure,
 * probate) with carefully crafted empathetic prompts.
 *
 * Each letter is auto-filled with the agent's Authority Profile branding.
 * Output is editable plain text that agents can copy, print, or mail.
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { personas, savedLetters } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

// ─── Letter type definitions ──────────────────────────────────────────────────

export const LETTER_TYPES = {
  // Distressed Situations
  pre_foreclosure: {
    label: "Pre-Foreclosure",
    category: "Distressed",
    tone: "empathetic",
    description: "Reach homeowners facing foreclosure with dignity and a clear path forward",
    icon: "🏠",
    inputLabel: "Property address or owner name (optional)",
    inputPlaceholder: "123 Main St, Springfield",
    systemPrompt: `You are a compassionate real estate professional writing a pre-foreclosure letter. 
Your goal is to offer genuine help — not to exploit a difficult situation. 
The tone must be warm, non-judgmental, and solution-focused. 
NEVER use words like "foreclosure notice," "public record," or "I saw your situation online" — these feel invasive. 
Instead, acknowledge that life brings unexpected challenges and position the agent as someone who has helped families navigate this before. 
Focus on: options available to them, the agent's experience with sensitive transactions, and the relief of having a trusted guide. 
The letter should feel like it was written by a neighbor who genuinely cares, not a sales pitch.`,
  },
  foreclosure: {
    label: "Foreclosure Notice",
    category: "Distressed",
    tone: "empathetic",
    description: "Post-foreclosure outreach for homeowners who may need to sell quickly",
    icon: "📋",
    inputLabel: "Property address (optional)",
    inputPlaceholder: "123 Main St, Springfield",
    systemPrompt: `You are a real estate professional writing a letter to a homeowner who has received a foreclosure notice. 
The tone must be calm, respectful, and focused on solutions — not on the legal situation. 
Acknowledge that this is a stressful time without dwelling on it. 
Offer concrete options: selling before the auction, negotiating with the lender, or exploring alternatives. 
Position the agent as an experienced guide who has helped others in similar situations find a dignified path forward. 
Avoid legal jargon. Keep the language human and accessible.`,
  },
  divorce: {
    label: "Divorce / Co-Owner",
    category: "Distressed",
    tone: "empathetic",
    description: "Sensitive outreach to co-owners navigating a property sale during divorce",
    icon: "🤝",
    inputLabel: "Property address (optional)",
    inputPlaceholder: "123 Main St, Springfield",
    systemPrompt: `You are a real estate professional writing a letter to homeowners who may be going through a divorce or separation that involves selling a shared property. 
This is one of the most sensitive letters an agent can write. 
The tone must be deeply respectful, neutral (not taking sides), and focused entirely on reducing complexity during an already difficult time. 
NEVER reference the divorce directly in a way that feels intrusive. 
Instead, acknowledge that major life transitions often involve property decisions and that having an experienced, neutral professional can make the process smoother for everyone involved. 
Emphasize: discretion, efficiency, fair market value, and the agent's experience with co-owner transactions. 
The letter should feel like a quiet offer of help, not a sales pitch.`,
  },
  probate: {
    label: "Probate / Estate",
    category: "Distressed",
    tone: "empathetic",
    description: "Compassionate outreach to estate executors managing inherited property",
    icon: "📜",
    inputLabel: "Property address or estate reference (optional)",
    inputPlaceholder: "123 Main St, Springfield",
    systemPrompt: `You are a real estate professional writing a letter to the executor or heir of an estate that includes real property. 
The tone must be respectful, patient, and compassionate — acknowledging that this person may be grieving while also managing complex responsibilities. 
NEVER lead with the property value or a sales pitch. 
Lead with acknowledgment of the weight of this responsibility and a genuine offer to simplify the process. 
Highlight: experience with estate sales, ability to handle the complexity, discretion, and the ability to work at the family's pace. 
The letter should feel like it was written by someone who understands both the emotional and practical dimensions of this situation.`,
  },
  // Listing Opportunities
  fsbo: {
    label: "FSBO",
    category: "Listing Opportunities",
    tone: "professional",
    description: "Reach For Sale By Owner sellers with a compelling case for representation",
    icon: "🏡",
    inputLabel: "Property address",
    inputPlaceholder: "123 Main St, Springfield",
    systemPrompt: `You are a real estate professional writing a letter to a For Sale By Owner (FSBO) seller. 
The tone should be respectful, confident, and value-focused — not condescending or pushy. 
Acknowledge their decision to sell independently and lead with genuine respect for their initiative. 
Then make a compelling, specific case for why working with a professional agent typically results in a higher net sale price, faster sale, and less stress. 
Use real data points where possible (average FSBO vs. agent-assisted sale price differential). 
Avoid generic claims. Be specific about what the agent brings: marketing reach, negotiation expertise, buyer qualification, and transaction management. 
End with a low-pressure offer to provide a free market analysis — no obligation.`,
  },
  expired: {
    label: "Expired Listing",
    category: "Listing Opportunities",
    tone: "professional",
    description: "Re-engage sellers whose listing expired without selling",
    icon: "⏰",
    inputLabel: "Property address",
    inputPlaceholder: "123 Main St, Springfield",
    systemPrompt: `You are a real estate professional writing a letter to a homeowner whose listing recently expired without selling. 
The tone should be empathetic first, then confident and solution-focused. 
Acknowledge that an expired listing is frustrating and that the seller likely had high hopes. 
Then pivot to a clear, specific diagnosis of why listings expire (pricing, marketing, presentation, agent communication) and what you would do differently. 
Avoid criticizing the previous agent directly. Focus on your approach and what makes it different. 
Be specific: mention your marketing strategy, your pricing methodology, and your communication commitment. 
End with a clear, easy call to action — a no-obligation conversation to review what happened and what's possible.`,
  },
  withdrawn: {
    label: "Withdrawn Listing",
    category: "Listing Opportunities",
    tone: "professional",
    description: "Reconnect with sellers who pulled their home off the market",
    icon: "↩️",
    inputLabel: "Property address",
    inputPlaceholder: "123 Main St, Springfield",
    systemPrompt: `You are a real estate professional writing a letter to a homeowner who withdrew their listing from the market. 
The tone should be understanding and curious — not pushy. 
Acknowledge that withdrawing a listing is a thoughtful decision and that there are many valid reasons to take a break from the market. 
Express genuine interest in understanding their situation and whether their goals have changed. 
If market conditions have shifted since they withdrew, mention that briefly. 
Offer a no-pressure conversation to review current market conditions and explore whether now might be a better time. 
Keep it short, warm, and respectful of their decision.`,
  },
  // Farm / Prospecting
  just_listed: {
    label: "Just Listed",
    category: "Farm / Prospecting",
    tone: "energetic",
    description: "Announce a new listing to the neighborhood to generate referrals and interest",
    icon: "🆕",
    inputLabel: "Property address",
    inputPlaceholder: "123 Main St, Springfield",
    systemPrompt: `You are a real estate professional writing a Just Listed announcement letter to neighbors near a new listing. 
The tone should be energetic, community-focused, and slightly urgent. 
Lead with the exciting news that a home in their neighborhood is now available. 
Highlight key features of the property (to be filled in by the agent). 
Then pivot to the opportunity for the neighbor: they may know someone who wants to live near them, and a sale in the neighborhood benefits everyone's property values. 
Include a brief market insight about current demand. 
End with an invitation to the open house (if applicable) and an offer to provide a free home value estimate for their own property.`,
  },
  just_sold: {
    label: "Just Sold",
    category: "Farm / Prospecting",
    tone: "confident",
    description: "Share a recent sale to demonstrate market activity and generate listing leads",
    icon: "✅",
    inputLabel: "Property address that sold",
    inputPlaceholder: "123 Main St, Springfield",
    systemPrompt: `You are a real estate professional writing a Just Sold announcement letter to neighbors near a recently sold property. 
The tone should be confident, informative, and community-minded. 
Lead with the exciting news that a home nearby just sold — and ideally mention the sale price or that it sold above asking (if true). 
Explain what this means for their neighborhood's property values. 
Then pivot to the opportunity: if they've been thinking about selling, now is a great time to understand what their home is worth in this market. 
Include a brief market insight about buyer demand in the area. 
End with a clear, easy call to action — a free, no-obligation home value analysis.`,
  },
  circle_prospecting: {
    label: "Circle Prospecting",
    category: "Farm / Prospecting",
    tone: "informative",
    description: "Reach homeowners in a specific neighborhood with market activity updates",
    icon: "🎯",
    inputLabel: "Neighborhood or street name",
    inputPlaceholder: "Maple Grove neighborhood",
    systemPrompt: `You are a real estate professional writing a circle prospecting letter to homeowners in a specific neighborhood. 
The tone should be informative, helpful, and community-focused — not salesy. 
Lead with genuine market intelligence: how many homes have sold in their area recently, average days on market, and whether prices are trending up or down. 
Position yourself as the local market expert who tracks this neighborhood closely. 
Then offer something of value: a free, personalized home value analysis based on the most recent comparable sales. 
Keep the sales pitch minimal — let the market data do the work. 
End with an easy, low-pressure call to action.`,
  },
  absentee_owner: {
    label: "Absentee Owner",
    category: "Farm / Prospecting",
    tone: "professional",
    description: "Reach out-of-area landlords who may be ready to sell their investment property",
    icon: "🏢",
    inputLabel: "Property address",
    inputPlaceholder: "123 Main St, Springfield",
    systemPrompt: `You are a real estate professional writing a letter to an absentee owner (out-of-area landlord) about their investment property. 
The tone should be professional, respectful, and business-minded. 
Acknowledge that managing a rental property from a distance can be challenging and that market conditions may have created an opportunity to maximize their return. 
Provide brief market context: current buyer demand, price appreciation in the area, and the potential for a strong sale. 
Offer to provide a free investment property analysis showing current market value vs. rental yield. 
Keep it concise and data-driven — this audience responds to ROI, not emotion.`,
  },
  new_to_neighborhood: {
    label: "New to Neighborhood",
    category: "Farm / Prospecting",
    tone: "warm",
    description: "Welcome new homeowners to the neighborhood and introduce yourself as the local expert",
    icon: "👋",
    inputLabel: "Neighborhood name",
    inputPlaceholder: "Maple Grove",
    systemPrompt: `You are a real estate professional writing a welcome letter to someone who recently moved into a neighborhood you farm. 
The tone should be warm, genuine, and community-focused — not a sales pitch. 
Welcome them to the neighborhood and share a few things that make the area special (local amenities, community events, etc.). 
Briefly introduce yourself as the local real estate expert who helped many of their neighbors find their homes. 
Offer to be a resource if they ever have questions about the neighborhood or the market. 
Keep it short and human. The goal is to plant a seed for a future relationship, not to sell anything today.`,
  },
  // Relationship / Referral
  past_client: {
    label: "Past Client Check-in",
    category: "Relationship / Referral",
    tone: "warm",
    description: "Reconnect with past clients to stay top of mind and generate referrals",
    icon: "💌",
    inputLabel: "Client name (optional)",
    inputPlaceholder: "John and Sarah",
    systemPrompt: `You are a real estate professional writing a check-in letter to a past client. 
The tone should be warm, genuine, and personal — not a form letter. 
Reference the transaction you did together (to be personalized by the agent). 
Express genuine interest in how they're enjoying their home. 
Share a brief market update relevant to their neighborhood. 
Then gently remind them that referrals are the lifeblood of your business and that you'd be honored to help anyone they know who is thinking about buying or selling. 
Keep it conversational and human. This letter should feel like a note from a trusted friend, not a marketing piece.`,
  },
  open_house_followup: {
    label: "Open House Follow-up",
    category: "Relationship / Referral",
    tone: "professional",
    description: "Follow up with open house visitors to nurture leads and generate referrals",
    icon: "🏠",
    inputLabel: "Property address",
    inputPlaceholder: "123 Main St, Springfield",
    systemPrompt: `You are a real estate professional writing a follow-up letter to someone who attended an open house. 
The tone should be professional, helpful, and low-pressure. 
Thank them for visiting and briefly highlight what makes the property special. 
Ask if they have any questions or would like to schedule a private showing. 
Then pivot to a broader offer: if this home isn't the right fit, you'd love to help them find the one that is. 
Include a brief market insight about current inventory and buyer competition. 
End with an easy call to action — a no-obligation conversation about their home search.`,
  },
} as const;

export type LetterTypeKey = keyof typeof LETTER_TYPES;

// ─── Router ──────────────────────────────────────────────────────────────────

export const prospectingLettersRouter = router({
  /** Get all available letter types */
  getLetterTypes: protectedProcedure.query(() => {
    return Object.entries(LETTER_TYPES).map(([key, val]) => ({
      key: key as LetterTypeKey,
      label: val.label,
      category: val.category,
      tone: val.tone,
      description: val.description,
      icon: val.icon,
      inputLabel: val.inputLabel,
      inputPlaceholder: val.inputPlaceholder,
    }));
  }),

  /** Generate a prospecting letter */
  generate: protectedProcedure
    .input(
      z.object({
        letterType: z.string(),
        targetInput: z.string().optional(), // address, name, neighborhood, etc.
        customContext: z.string().max(1000).optional(), // additional context from agent
        recipientName: z.string().optional(), // "Dear [Name]" personalization
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const letterDef = LETTER_TYPES[input.letterType as LetterTypeKey];
      if (!letterDef) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid letter type" });
      }

      // Pull agent branding from persona
      const [persona] = await db
        .select()
        .from(personas)
        .where(eq(personas.userId, ctx.user.id))
        .limit(1);

      const agentName = persona?.agentName ?? ctx.user.name ?? "Your Agent";
      const agentPhone = persona?.phoneNumber ?? "";
      const agentEmail = persona?.emailAddress ?? ctx.user.email ?? "";
      const agentBrokerage = persona?.brokerage ?? "";
      const agentCity = persona?.primaryCity ?? "";
      const agentWebsite = persona?.bookingUrl ?? "";

      // Build the user prompt
      const targetContext = input.targetInput
        ? `Property/Target: ${input.targetInput}`
        : "";
      const recipientLine = input.recipientName
        ? `Address the letter to: ${input.recipientName}`
        : "Use a warm, general salutation (e.g., 'Dear Neighbor,' or 'Dear Homeowner,')";
      const customContext = input.customContext
        ? `Additional context from the agent: ${input.customContext}`
        : "";

      const userPrompt = `Write a professional real estate prospecting letter of type: ${letterDef.label}.

Agent Information (use this for the signature block):
- Agent Name: ${agentName}
- Phone: ${agentPhone || "[Phone Number]"}
- Email: ${agentEmail || "[Email Address]"}
- Brokerage: ${agentBrokerage || "[Brokerage Name]"}
- City/Market: ${agentCity || "[City]"}
- Website/Booking: ${agentWebsite || ""}

${targetContext}
${recipientLine}
${customContext}

Requirements:
- Length: 3-4 paragraphs (approximately 250-350 words for the body)
- Format: Full letter format with date placeholder, salutation, body paragraphs, closing, and agent signature block
- Tone: ${letterDef.tone}
- Include a clear, specific call to action in the final paragraph
- The letter should feel personalized and human, not like a template
- Use [PLACEHOLDER] notation for any details the agent should customize (e.g., [specific sale price], [open house date])
- End with a professional signature block using the agent's information above

Write only the letter — no preamble, no explanation.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: letterDef.systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const letterContent =
        response?.choices?.[0]?.message?.content ?? "";

      if (!letterContent) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate letter content",
        });
      }

      return {
        letterType: input.letterType,
        letterLabel: letterDef.label,
        content: letterContent,
        agentName,
        agentPhone,
        agentEmail,
        agentBrokerage,
      };
    }),

  /** Save a generated letter to the user's history */
  save: protectedProcedure
    .input(
      z.object({
        letterType: z.string(),
        letterLabel: z.string(),
        letterCategory: z.string(),
        targetInput: z.string().optional(),
        recipientName: z.string().optional(),
        content: z.string().min(10),
        pdfUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [result] = await db.insert(savedLetters).values({
        userId: ctx.user.id,
        letterType: input.letterType,
        letterLabel: input.letterLabel,
        letterCategory: input.letterCategory,
        targetInput: input.targetInput ?? null,
        recipientName: input.recipientName ?? null,
        content: input.content,
        pdfUrl: input.pdfUrl ?? null,
      });
      return { id: (result as { insertId: number }).insertId };
    }),

  /** List all saved letters for the current user */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db
      .select()
      .from(savedLetters)
      .where(eq(savedLetters.userId, ctx.user.id))
      .orderBy(desc(savedLetters.createdAt));
  }),

  /** Delete a saved letter */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .delete(savedLetters)
        .where(
          eq(savedLetters.id, input.id)
        );
      return { success: true };
    }),
});
