// Test the CORRECT HeyGen photo avatar flow:
// 1. Upload image → image_key
// 2. Create avatar group → group_id  
// 3. Add look to group (image_key) → look_id  ← MISSING STEP
// 4. Train group → training starts
// 5. Poll status

import mysql from 'mysql2/promise';

const key = process.env.HEYGEN_API_KEY;
const dbUrl = process.env.DATABASE_URL;

// Get user's image
const conn = await mysql.createConnection(dbUrl);
const [rows] = await conn.execute(
  "SELECT avatarImageUrl FROM users WHERE email = 'rdshop70@gmail.com' AND avatarImageUrl IS NOT NULL LIMIT 1"
);
await conn.end();

const imageUrl = rows[0].avatarImageUrl;
console.log("Image URL:", imageUrl.substring(0, 80) + "...");

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

// Step 2: Create avatar group
const createRes = await fetch("https://api.heygen.com/v2/photo_avatar/avatar_group/create", {
  method: "POST",
  headers: { "X-Api-Key": key, accept: "application/json", "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Reena Dutta Test" })
});
const createData = await createRes.json();
console.log("Create response:", JSON.stringify(createData).substring(0, 200));
const groupId = createData.data?.group_id || createData.data?.id;
console.log("group_id:", groupId);

// Step 3: Add look to group
console.log("\n--- Adding look to group ---");
const addLookRes = await fetch(`https://api.heygen.com/v2/photo_avatar/avatar_group/${groupId}/add_look`, {
  method: "POST",
  headers: { "X-Api-Key": key, accept: "application/json", "Content-Type": "application/json" },
  body: JSON.stringify({ image_key: imageKey })
});
console.log("Add look status:", addLookRes.status);
const addLookText = await addLookRes.text();
console.log("Add look response:", addLookText.substring(0, 300));

// Step 4: Train
console.log("\n--- Training ---");
const trainRes = await fetch("https://api.heygen.com/v2/photo_avatar/train", {
  method: "POST",
  headers: { "X-Api-Key": key, accept: "application/json", "Content-Type": "application/json" },
  body: JSON.stringify({ group_id: groupId })
});
console.log("Train status:", trainRes.status);
const trainText = await trainRes.text();
console.log("Train response:", trainText.substring(0, 300));

// Step 5: Check status using different endpoint variants
console.log("\n--- Checking status (various endpoints) ---");
const endpoints = [
  `https://api.heygen.com/v2/photo_avatar/avatar_group/${groupId}`,
  `https://api.heygen.com/v2/photo_avatar/group/${groupId}`,
  `https://api.heygen.com/v1/photo_avatar.get?group_id=${groupId}`,
];
for (const ep of endpoints) {
  const r = await fetch(ep, { headers: { "X-Api-Key": key, accept: "application/json" } });
  const t = await r.text();
  console.log(`\n${ep}`);
  console.log("Status:", r.status, "→", t.substring(0, 200));
}

console.log("\n✅ group_id:", groupId);
