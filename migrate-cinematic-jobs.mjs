import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const sql = `
CREATE TABLE IF NOT EXISTS \`cinematic_jobs\` (
  \`id\` varchar(64) NOT NULL,
  \`userId\` int NOT NULL,
  \`status\` enum('pending','generating_clips','assembling','done','failed') NOT NULL DEFAULT 'pending',
  \`totalPhotos\` int NOT NULL DEFAULT 0,
  \`completedClips\` int NOT NULL DEFAULT 0,
  \`videoUrl\` text,
  \`error\` text,
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
)
`;

try {
  await conn.execute(sql);
  console.log('✓ cinematic_jobs table created');
} catch (e) {
  if (e.message.includes('already exists')) {
    console.log('✓ cinematic_jobs table already exists');
  } else {
    console.error('✗ Error:', e.message);
    process.exit(1);
  }
}

await conn.end();
console.log('Migration complete');
