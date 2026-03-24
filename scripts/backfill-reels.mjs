/**
 * Backfill script: checks Creatomate render status for all processing reels
 * and updates the database with the video URL and completed status.
 *
 * Run with: node scripts/backfill-reels.mjs
 */
import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";

// Load env
dotenv.config({ path: ".env" });

const CREATOMATE_API_KEY = process.env.CREATOMATE_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!CREATOMATE_API_KEY) {
  console.error("Missing CREATOMATE_API_KEY");
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

async function checkCreatomateStatus(renderId) {
  const res = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`, {
    headers: {
      Authorization: `Bearer ${CREATOMATE_API_KEY}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Creatomate API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  // Parse DATABASE_URL for mysql2
  const url = new URL(DATABASE_URL);
  const conn = await createConnection({
    host: url.hostname,
    port: parseInt(url.port || "3306"),
    user: url.username,
    password: url.password,
    database: url.pathname.replace("/", ""),
    ssl: { rejectUnauthorized: false },
  });

  console.log("Connected to database.");

  // Get all processing reels with a renderId
  const [rows] = await conn.execute(
    "SELECT id, shotstackRenderId FROM ai_reels WHERE status = 'processing' AND shotstackRenderId IS NOT NULL AND shotstackRenderId != '' ORDER BY createdAt DESC"
  );

  console.log(`Found ${rows.length} processing reels to check.`);

  let updated = 0;
  let failed = 0;
  let stillRendering = 0;

  for (const row of rows) {
    const { id, shotstackRenderId } = row;
    try {
      console.log(`Checking reel #${id} (renderId: ${shotstackRenderId})...`);
      const data = await checkCreatomateStatus(shotstackRenderId);
      
      if (data.status === "succeeded" && data.url) {
        await conn.execute(
          "UPDATE ai_reels SET shotstackRenderUrl = ?, status = 'completed' WHERE id = ?",
          [data.url, id]
        );
        console.log(`  ✅ Reel #${id} updated: ${data.url}`);
        updated++;
      } else if (data.status === "failed") {
        await conn.execute(
          "UPDATE ai_reels SET status = 'failed' WHERE id = ?",
          [id]
        );
        console.log(`  ❌ Reel #${id} marked as failed`);
        failed++;
      } else {
        console.log(`  ⏳ Reel #${id} still in status: ${data.status}`);
        stillRendering++;
      }
    } catch (err) {
      console.error(`  ⚠️  Error checking reel #${id}: ${err.message}`);
      // Mark as failed if the render ID is no longer valid
      if (err.message.includes("404") || err.message.includes("not found")) {
        await conn.execute(
          "UPDATE ai_reels SET status = 'failed' WHERE id = ?",
          [id]
        );
        console.log(`  ❌ Reel #${id} marked as failed (render not found)`);
        failed++;
      }
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nBackfill complete:`);
  console.log(`  Updated to completed: ${updated}`);
  console.log(`  Marked as failed: ${failed}`);
  console.log(`  Still rendering: ${stillRendering}`);

  await conn.end();
}

main().catch(err => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
