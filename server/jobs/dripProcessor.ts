/**
 * Drip Email Processor Job
 *
 * Runs daily at 8:00 AM UTC (midnight Pacific / 1 AM Mountain / 3 AM Eastern).
 * Finds all active drip enrollments whose nextSendAt is in the past and sends
 * the next email in their sequence, then advances them to the next step.
 *
 * This is a system-wide processor — it handles ALL users' enrollments in one pass.
 * The processAllDueEmails function in drip.ts handles the actual send logic.
 */
import cron from "node-cron";
import { processAllDueEmails } from "../routers/drip";

/**
 * Register the daily drip email processor cron job.
 * Call this once from the server startup.
 */
export function registerDripProcessorJob(): void {
  // Run daily at 8:00 AM UTC — processes ALL users' due drip emails
  cron.schedule("0 8 * * *", async () => {
    console.log("[DripProcessor] Running daily drip email queue...");
    try {
      // Pass no userId to process all users' enrollments
      const result = await processAllDueEmails();
      console.log(`[DripProcessor] Daily drip run complete — ${result.processed} email(s) sent`);
    } catch (err) {
      console.error("[DripProcessor] Error during daily drip run:", err);
    }
  });

  console.log("[DripProcessor] Drip processor job registered (daily at 8:00 AM UTC)");
}
