// Test add look endpoint with various URL formats
// Using the group created in previous test: 452bb69219b0424c9a2c0aa09fd606a6
const key = process.env.HEYGEN_API_KEY;
const groupId = "452bb69219b0424c9a2c0aa09fd606a6";
const imageKey = "image/26aab80828ac41b5b9724f4cd2431bbc/original.jpg";

async function post(label, url, body) {
  console.log(`\n--- ${label} ---`);
  const res = await fetch(url, {
    method: "POST",
    headers: { "X-Api-Key": key, accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  console.log(`[${res.status}]`, text.substring(0, 300));
  return { status: res.status, text };
}

// Try various add look endpoint formats
await post("add_look v2 photo_avatar/{id}/add_look", 
  `https://api.heygen.com/v2/photo_avatar/${groupId}/add_look`,
  { image_key: imageKey });

await post("add_look v2 photo_avatar/add_look", 
  `https://api.heygen.com/v2/photo_avatar/add_look`,
  { group_id: groupId, image_key: imageKey });

await post("add_look v2 photo_avatar/avatar_group/{id}/add_look", 
  `https://api.heygen.com/v2/photo_avatar/avatar_group/${groupId}/add_look`,
  { image_key: imageKey });

await post("add_look v2 photo_avatar/look/add", 
  `https://api.heygen.com/v2/photo_avatar/look/add`,
  { group_id: groupId, image_key: imageKey });

// Check current group status
console.log("\n--- Current group status ---");
const statusRes = await fetch(`https://api.heygen.com/v2/photo_avatar/${groupId}`, {
  headers: { "X-Api-Key": key, accept: "application/json" }
});
const statusText = await statusRes.text();
console.log(`[${statusRes.status}]`, statusText.substring(0, 500));
