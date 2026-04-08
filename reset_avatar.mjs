// Reset the stuck avatar so the user can re-upload cleanly
import mysql from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
const conn = await mysql.createConnection(dbUrl);

// Check current state
const [rows] = await conn.execute(
  "SELECT id, userId, didAvatarId, status, createdAt FROM customAvatarTwins WHERE userId IN (SELECT id FROM users WHERE email = 'rdshop70@gmail.com')"
);
console.log("Current avatar twins:", JSON.stringify(rows, null, 2));

// Delete all stuck/failed avatar records for this user so they get a clean slate
const [users] = await conn.execute(
  "SELECT id FROM users WHERE email = 'rdshop70@gmail.com'"
);
console.log("User IDs:", users.map(u => u.id));

for (const user of users) {
  const [result] = await conn.execute(
    "DELETE FROM customAvatarTwins WHERE userId = ?",
    [user.id]
  );
  console.log(`Deleted ${result.affectedRows} avatar twin(s) for user ${user.id}`);
}

await conn.end();
console.log("✅ Done — user can now re-upload their headshot for a fresh avatar");
