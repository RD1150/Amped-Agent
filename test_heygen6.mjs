// Test the CORRECT flow: create group WITH image_key, then find status endpoint
import mysql from 'mysql2/promise';

const key = process.env.HEYGEN_API_KEY;
const dbUrl = process.env.DATABASE_URL;

const conn = await mysql.createConnection(dbUrl);
const [rows] = await conn.execute(
  "SELECT avatarImageUrl FROM users WHERE email = 'rdshop70@gmail.com' AND avatarImageUrl IS NOT NULL LIMIT 1"
);
await conn.end();

const imageUrl = rows[0].avatarImageUrl;

// Step 1: Download + upload
const imgRes = await fetch(imageUrl);
const buffer = Buffer.from(await imgRes.arrayBuffer());
console.log("Image size:", buffer.length, "bytes");

const uploadRes = await fetch("https://upload.heygen.com/v1/asset", {
  method: "POST",
  headers: { "X-Api-Key": key, "Content-Type": "image/jpeg", accept: "application/json" },
  body: buffer
});
const uploadData = await uploadRes.json();
const imageKey = uploadData.data?.image_key;
console.log("image_key:", imageKey);

// Step 2: Create avatar group WITH image_key (this is what our code does)
console.log("\n--- Creating avatar group WITH image_key ---");
const createRes = await fetch("https://api.heygen.com/v2/photo_avatar/avatar_group/create", {
  method: "POST",
  headers: { "X-Api-Key": key, accept: "application/json", "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Reena Dutta", image_key: imageKey })
});
console.log("Create status:", createRes.status);
const createData = await createRes.json();
console.log("Create response:", JSON.stringify(createData).substring(0, 400));

// The group_id might be in data.group_id or data.id
const groupId = createData.data?.group_id || createData.data?.id;
console.log("group_id:", groupId);

if (!groupId) {
  console.log("❌ No group_id returned");
  process.exit(1);
}

// Step 3: Try to train immediately (image_key was passed at creation)
console.log("\n--- Training (image_key was in create body) ---");
const trainRes = await fetch("https://api.heygen.com/v2/photo_avatar/train", {
  method: "POST",
  headers: { "X-Api-Key": key, accept: "application/json", "Content-Type": "application/json" },
  body: JSON.stringify({ group_id: groupId })
});
console.log("Train status:", trainRes.status);
const trainText = await trainRes.text();
console.log("Train response:", trainText.substring(0, 300));

// Step 4: Find the correct status endpoint
console.log("\n--- Finding correct status endpoint ---");
const statusEndpoints = [
  `https://api.heygen.com/v2/photo_avatar/avatar_group/${groupId}`,
  `https://api.heygen.com/v2/photo_avatar/${groupId}`,
  `https://api.heygen.com/v1/photo_avatar.get?group_id=${groupId}`,
  `https://api.heygen.com/v2/photo_avatar/avatar_group/list`,
  `https://api.heygen.com/v2/photo_avatar/list`,
];
for (const ep of statusEndpoints) {
  const r = await fetch(ep, { headers: { "X-Api-Key": key, accept: "application/json" } });
  const t = await r.text();
  const preview = t.substring(0, 150).replace(/\n/g, ' ');
  console.log(`\n[${r.status}] ${ep}`);
  console.log("→", preview);
}

console.log("\n✅ group_id:", groupId);
