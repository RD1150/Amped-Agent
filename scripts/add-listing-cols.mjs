import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await conn.execute('SHOW COLUMNS FROM listing_presentations');
const existing = new Set(rows.map(r => r.Field));
console.log('Existing columns:', [...existing].join(', '));

const newCols = [
  "ALTER TABLE `listing_presentations` ADD `photoUrls` text",
  "ALTER TABLE `listing_presentations` ADD `comparableSales` text",
  "ALTER TABLE `listing_presentations` ADD `marketOverview` text",
  "ALTER TABLE `listing_presentations` ADD `suggestedPriceRange` varchar(200)",
  "ALTER TABLE `listing_presentations` ADD `pricingRationale` text",
  "ALTER TABLE `listing_presentations` ADD `agentName` varchar(255)",
  "ALTER TABLE `listing_presentations` ADD `agentHeadshotUrl` text",
  "ALTER TABLE `listing_presentations` ADD `agentBio` text",
  "ALTER TABLE `listing_presentations` ADD `agentStats` text",
  "ALTER TABLE `listing_presentations` ADD `agentTestimonials` text",
  "ALTER TABLE `listing_presentations` ADD `marketingChannels` text",
  "ALTER TABLE `listing_presentations` ADD `marketingDetails` text",
  "ALTER TABLE `listing_presentations` ADD `openHouseStrategy` text",
  "ALTER TABLE `listing_presentations` ADD `timelineToList` text",
  "ALTER TABLE `listing_presentations` ADD `creditsCost` int NOT NULL DEFAULT 0",
  "ALTER TABLE `listing_presentations` ADD `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
];

// Also modify status and exportFormat enums
const modifyCols = [
  "ALTER TABLE `listing_presentations` MODIFY COLUMN `exportFormat` enum('pdf','pptx') DEFAULT 'pptx'",
  "ALTER TABLE `listing_presentations` MODIFY COLUMN `status` enum('draft','generating','completed','failed') NOT NULL DEFAULT 'draft'",
];

for (const sql of modifyCols) {
  try {
    await conn.execute(sql);
    console.log('✅ Modified:', sql.substring(0, 80));
  } catch (e) {
    console.log('⚠️  Skip modify:', e.message.substring(0, 80));
  }
}

for (const sql of newCols) {
  // Extract column name from SQL
  const match = sql.match(/ADD `(\w+)`/);
  const colName = match?.[1];
  if (colName && existing.has(colName)) {
    console.log(`⏭️  Already exists: ${colName}`);
    continue;
  }
  try {
    await conn.execute(sql);
    console.log('✅ Added:', colName);
  } catch (e) {
    console.log('❌ Failed:', colName, '-', e.message.substring(0, 80));
  }
}

await conn.end();
console.log('\nDone!');
