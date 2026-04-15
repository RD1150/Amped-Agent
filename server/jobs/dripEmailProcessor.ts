/**
 * Drip Email Processor Cron Job
 *
 * Runs daily at 8:00 AM UTC. Processes all drip enrollments that are due
 * (status = "active" AND nextSendAt <= now), sends the next email in the
 * sequence via Resend, and advances the enrollment to the next step.
 */

import cron from "node-cron";
import { processAllDueEmails } from "../routers/drip";

/**
 * Register the daily drip email processing cron job.
 * Call this once from the server startup.
 */
export function registerDripEmailJob(): void {
  // Run daily at 8:00 AM UTC (before the trial notification job at 9 AM)
  cron.schedule("0 8 * * *", async () => {
    console.log("[DripJob] Running daily drip email processing...");
    try {
      const result = await processAllDueEmails();
      console.log(`[DripJob] Processed ${result.processed} drip email(s)`);
    } catch (err) {
      console.error("[DripJob] Error during drip email processing:", err);
    }
  });

  console.log("[DripJob] Drip email processor registered (daily at 8:00 AM UTC)");
}
