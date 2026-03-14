import { getDb } from "../server/db";
import { users } from "../drizzle/schema";
import { isNotNull } from "drizzle-orm";
import { writeFileSync } from "fs";

const db = await getDb();
if (!db) { console.error("No DB"); process.exit(1); }

// First get total count
const countRows = await db.select({ id: users.id }).from(users).where(isNotNull(users.email));
console.log(`Total users with email: ${countRows.length}`);

// Export all using Drizzle ORM (no raw SQL column name issues)
const rows = await db.select({
  id: users.id,
  name: users.name,
  email: users.email,
  createdAt: users.createdAt,
  subscriptionStatus: users.subscriptionStatus,
  subscriptionTier: users.subscriptionTier,
}).from(users)
  .where(isNotNull(users.email));

const header = 'id,name,email,signup_date,subscription_status,subscription_tier';
const lines = rows.map((r) => {
  const name = (r.name || '').replace(/"/g, '').replace(/,/g, ' ');
  const email = (r.email || '').replace(/"/g, '').trim();
  const date = r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '';
  return `${r.id},"${name}","${email}",${date},${r.subscriptionStatus || 'inactive'},${r.subscriptionTier || ''}`;
});

const csv = [header, ...lines].join('\n');
writeFileSync('/home/ubuntu/authority_content_users.csv', csv);
console.log(`Exported ${rows.length} users to /home/ubuntu/authority_content_users.csv`);
