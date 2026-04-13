/**
 * Trial Notification Job
 *
 * Runs daily at 9:00 AM UTC.
 * Finds users whose trial ends in exactly 3 days and sends them a warning notification.
 * Also handles users whose trial ended yesterday and ensures they are downgraded.
 */
import cron from "node-cron";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { and, eq, gte, lte, isNotNull } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

/**
 * Find users whose trial ends in the next 3 days and notify them.
 */
async function sendTrialEndingWarnings(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[TrialJob] Database not available");
    return;
  }

  const now = new Date();

  // Window: trial ends between 2.5 and 3.5 days from now (to avoid double-sending)
  const windowStart = new Date(now.getTime() + 2.5 * 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 3.5 * 24 * 60 * 60 * 1000);

  const trialUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      trialEndsAt: users.trialEndsAt,
      subscriptionStatus: users.subscriptionStatus,
    })
    .from(users)
    .where(
      and(
        eq(users.subscriptionStatus, "trialing"),
        isNotNull(users.trialEndsAt),
        gte(users.trialEndsAt, windowStart),
        lte(users.trialEndsAt, windowEnd)
      )
    );

  console.log(`[TrialJob] Found ${trialUsers.length} users with trial ending in ~3 days`);

  for (const user of trialUsers) {
    const trialEnd = user.trialEndsAt!;
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const formattedDate = trialEnd.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Notify the platform owner so they can follow up with the user
    await notifyOwner({
      title: `Trial Ending Soon: ${user.name || user.email || `User #${user.id}`}`,
      content: `User ${user.name || "Unknown"} (${user.email || "no email"}) has ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left on their free trial.\n\nTrial ends: ${formattedDate}\n\nThey will be automatically downgraded to the Starter tier unless they subscribe.\n\nUser ID: ${user.id}`,
    });

    console.log(`[TrialJob] Sent trial warning notification for user ${user.id} (${user.email})`);
  }
}

/**
 * Find users whose trial has expired but are still marked as "trialing" and downgrade them.
 * This is a safety net — the Stripe webhook should handle this, but this catches any gaps.
 */
async function downgradeExpiredTrials(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = new Date();

  const expiredTrialUsers = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(
      and(
        eq(users.subscriptionStatus, "trialing"),
        isNotNull(users.trialEndsAt),
        lte(users.trialEndsAt, now)
      )
    );

  if (expiredTrialUsers.length === 0) return;

  console.log(`[TrialJob] Found ${expiredTrialUsers.length} users with expired trials to downgrade`);

  for (const user of expiredTrialUsers) {
    await db
      .update(users)
      .set({
        subscriptionStatus: "inactive",
        subscriptionTier: "starter",
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log(`[TrialJob] Downgraded expired trial for user ${user.id} (${user.email})`);

    await notifyOwner({
      title: `Trial Expired (Auto-Downgrade): ${user.name || user.email || `User #${user.id}`}`,
      content: `User ${user.name || "Unknown"} (${user.email || "no email"}) had their trial expire without converting.\n\nThey have been automatically downgraded to the Starter (inactive) tier.\n\nUser ID: ${user.id}`,
    });
  }
}

/**
 * Register the daily trial notification cron job.
 * Call this once from the server startup.
 */
export function registerTrialNotificationJob(): void {
  // Run daily at 9:00 AM UTC
  cron.schedule("0 9 * * *", async () => {
    console.log("[TrialJob] Running daily trial notification check...");
    try {
      await sendTrialEndingWarnings();
      await downgradeExpiredTrials();
      console.log("[TrialJob] Daily trial check complete");
    } catch (err) {
      console.error("[TrialJob] Error during trial notification job:", err);
    }
  });

  console.log("[TrialJob] Trial notification job registered (daily at 9:00 AM UTC)");
}
