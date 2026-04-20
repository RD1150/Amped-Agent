/**
 * Zapier Integration Router
 *
 * Provides:
 * - zapier.getKey      — returns the user's current webhook key (or null)
 * - zapier.generateKey — generates (or rotates) the user's webhook key
 * - zapier.revokeKey   — removes the webhook key
 *
 * The inbound webhook endpoint is registered separately in the Express app
 * at POST /api/zapier/webhook/:key
 */

import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

function generateWebhookKey(): string {
  return randomBytes(24).toString("hex"); // 48-char hex string
}

export const zapierRouter = router({
  /** Return the current webhook key for the logged-in user */
  getKey: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { key: null };
    const [user] = await db
      .select({ zapierWebhookKey: users.zapierWebhookKey })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    return { key: user?.zapierWebhookKey ?? null };
  }),

  /** Generate (or rotate) the webhook key */
  generateKey: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const newKey = generateWebhookKey();
    await db
      .update(users)
      .set({ zapierWebhookKey: newKey })
      .where(eq(users.id, ctx.user.id));
    return { key: newKey };
  }),

  /** Revoke the webhook key */
  revokeKey: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db
      .update(users)
      .set({ zapierWebhookKey: null })
      .where(eq(users.id, ctx.user.id));
    return { success: true };
  }),
});
