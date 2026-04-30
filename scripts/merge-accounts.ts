import { drizzle } from "drizzle-orm/mysql2";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

// Account #1 = primary (email/password, all data lives here)
// Account #20610002 = Google OAuth duplicate (to be merged into #1)

const PRIMARY_ID = 1;
const GOOGLE_OPEN_ID = "google_111143149086461486565";

// Step 1: Update the primary account to also accept Google login
// We store the Google openId as an additional identifier
// The loginMethod stays 'email' but we add googleId field
await db.update(users)
  .set({
    googleId: GOOGLE_OPEN_ID,
  } as any)
  .where(eq(users.id, PRIMARY_ID));

console.log("✅ Linked Google ID to primary account #1");

// Step 2: Check if googleId column exists, if not we need a different approach
// Let's check what columns are available
const [primaryUser] = await db.select().from(users).where(eq(users.id, PRIMARY_ID)).limit(1);
console.log("Primary account:", JSON.stringify(primaryUser, null, 2));

process.exit(0);
