// Careful HeyGen API diagnostic
const key = process.env.HEYGEN_API_KEY;
if (!key) { console.error("HEYGEN_API_KEY not set"); process.exit(1); }
console.log("Key prefix:", key.substring(0, 12) + "...");
console.log("Key length:", key.length);

async function testEndpoint(label, url, options = {}) {
  console.log(`\n--- ${label} ---`);
  console.log("URL:", url);
  try {
    const res = await fetch(url, {
      headers: { "X-Api-Key": key, accept: "application/json" },
      ...options
    });
    console.log("HTTP Status:", res.status, res.statusText);
    const text = await res.text();
    console.log("Response (first 400 chars):", text.substring(0, 400));
  } catch (e) {
    console.log("Error:", e.message);
  }
}

// Test various endpoints
await testEndpoint("v1 avatars", "https://api.heygen.com/v1/avatar.list");
await testEndpoint("v2 avatars", "https://api.heygen.com/v2/avatars");
await testEndpoint("v2 photo_avatar list", "https://api.heygen.com/v2/photo_avatar");
await testEndpoint("v1 user info", "https://api.heygen.com/v1/user.info");
await testEndpoint("v2 user remaining quota", "https://api.heygen.com/v2/user/remaining_quota");
