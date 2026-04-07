import mysql from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const conn = await mysql.createConnection(dbUrl);
const [rows] = await conn.execute(
  'SELECT id, userId, didAvatarId, status, createdAt FROM custom_avatar_twins LIMIT 10'
);
console.log('Avatar twins in DB:');
console.log(JSON.stringify(rows, null, 2));
await conn.end();
