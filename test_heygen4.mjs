// Test the photo avatar creation flow using the user's actual stored image URL
import mysql from 'mysql2/promise';

const key = process.env.HEYGEN_API_KEY;
const dbUrl = process.env.DATABASE_URL;

// Get the user's actual avatar image URL from the database
const conn = await mysql.createConnection(dbUrl);
const [rows] = await conn.execute(
  "SELECT avatarImageUrl FROM users WHERE email = 'rdshop70@gmail.com' AND avatarImageUrl IS NOT NULL LIMIT 1"
);
await conn.end();

if (rows.length === 0 || !rows[0].avatarImageUrl) {
  console.log("No avatar image URL found in database");
  process.exit(1);
}

const imageUrl = rows[0].avatarImageUrl;
console.log("Found image URL:", imageUrl.substring(0, 80) + "...");

// Download the image
console.log("\n--- Downloading image ---");
const imgRes = await fetch(imageUrl);
console.log("Download status:", imgRes.status);
if (!imgRes.ok) {
  console.log("Failed to download:", await imgRes.text());
  process.exit(1);
}
const contentType = imgRes.headers.get("content-type") || "image/jpeg";
const mimeType = contentType.includes("png") ? "image/png" : "image/jpeg";
const buffer = Buffer.from(await imgRes.arrayBuffer());
console.log("Image size:", buffer.length, "bytes, MIME:", mimeType);

// Upload to HeyGen
console.log("\n--- Uploading to HeyGen ---");
const uploadRes = await fetch("https://upload.heygen.com/v1/asset", {
  method: "POST",
  headers: { "X-Api-Key": key, "Content-Type": mimeType, accept: "application/json" },
  body: buffer
});
console.log("Upload status:", uploadRes.status);
const uploadText = await uploadRes.text();
console.log("Upload response:", uploadText.substring(0, 400));

let imageKey = null;
try {
  const parsed = JSON.parse(uploadText);
  imageKey = parsed.data?.image_key;
  console.log("image_key:", imageKey);
} catch(e) {
  console.log("Failed to parse upload response");
  process.exit(1);
}

if (!imageKey) {
  console.log("No image_key returned — upload may have failed");
  process.exit(1);
}

// Create avatar group
console.log("\n--- Creating avatar group ---");
const createRes = await fetch("https://api.heygen.com/v2/photo_avatar/avatar_group/create", {
  method: "POST",
  headers: { "X-Api-Key": key, accept: "application/json", "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Reena Dutta Avatar", image_key: imageKey })
});
console.log("Create status:", createRes.status);
const createText = await createRes.text();
console.log("Create response:", createText.substring(0, 400));

let groupId = null;
try {
  const parsed = JSON.parse(createText);
  groupId = parsed.data?.group_id;
  console.log("group_id:", groupId);
} catch(e) {}

if (groupId) {
  // Trigger training
  console.log("\n--- Triggering training ---");
  const trainRes = await fetch("https://api.heygen.com/v2/photo_avatar/train", {
    method: "POST",
    headers: { "X-Api-Key": key, accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ group_id: groupId })
  });
  console.log("Train status:", trainRes.status);
  const trainText = await trainRes.text();
  console.log("Train response:", trainText.substring(0, 300));

  // Check status
  console.log("\n--- Checking group status ---");
  const statusRes = await fetch(`https://api.heygen.com/v2/photo_avatar/avatar_group/${groupId}`, {
    headers: { "X-Api-Key": key, accept: "application/json" }
  });
  console.log("Status check:", statusRes.status);
  const statusText = await statusRes.text();
  console.log("Status response:", statusText.substring(0, 300));

  console.log("\n✅ New group_id to store:", groupId);
}
