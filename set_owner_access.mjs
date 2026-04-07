import mysql from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) { console.error('DATABASE_URL not set'); process.exit(1); }

const conn = await mysql.createConnection(dbUrl);

// Check current user
const [before] = await conn.execute(
  'SELECT id, email, role, subscriptionTier FROM users WHERE email = ?',
  ['rdshop70@gmail.com']
);
console.log('Before:', JSON.stringify(before, null, 2));

if (before.length === 0) {
  console.log('User not found — may not have logged in yet');
  await conn.end();
  process.exit(0);
}

// Set agency tier + admin + zero out all usage counters (so limits reset to max)
// creditBalance set to 999999 so credit-gated features are always available
await conn.execute(
  `UPDATE users SET 
    role = 'admin',
    subscriptionTier = 'agency',
    subscriptionStatus = 'active',
    creditBalance = 999999,
    standardVideosThisMonth = 0,
    aiEnhancedVideosThisMonth = 0,
    fullAiVideosThisMonth = 0,
    cinematicPropertyToursThisMonth = 0,
    cinematicAuthorityReelsThisMonth = 0,
    dailyVideoCount = 0
   WHERE email = ?`,
  ['rdshop70@gmail.com']
);

const [after] = await conn.execute(
  'SELECT id, email, role, subscriptionTier, subscriptionStatus, creditBalance, standardVideosThisMonth, fullAiVideosThisMonth, cinematicPropertyToursThisMonth FROM users WHERE email = ?',
  ['rdshop70@gmail.com']
);
console.log('\nAfter:', JSON.stringify(after, null, 2));
console.log('\n✅ Done — rdshop70@gmail.com now has:');
console.log('   • Role: admin');
console.log('   • Tier: agency (unlimited everything)');
console.log('   • Status: active');
console.log('   • Credits: 999,999');
console.log('   • All video counters reset to 0');

await conn.end();
