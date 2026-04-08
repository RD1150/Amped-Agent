// Test the actual photo avatar creation flow
const key = process.env.HEYGEN_API_KEY;

async function test(label, url, method = "GET", body = null) {
  console.log(`\n--- ${label} ---`);
  const opts = {
    method,
    headers: { "X-Api-Key": key, accept: "application/json", "Content-Type": "application/json" }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text.substring(0, 500));
}

// Test 1: Upload a real image from a URL (simulate what the app does)
// First download a small test image
console.log("--- Downloading test image ---");
const imgRes = await fetch("https://via.placeholder.com/150.jpg");
console.log("Image download status:", imgRes.status);
const imgBuf = Buffer.from(await imgRes.arrayBuffer());
console.log("Image size:", imgBuf.length, "bytes");

// Test 2: Upload to HeyGen asset endpoint
console.log("\n--- Upload to HeyGen asset ---");
const uploadRes = await fetch("https://upload.heygen.com/v1/asset", {
  method: "POST",
  headers: { "X-Api-Key": key, "Content-Type": "image/jpeg", accept: "application/json" },
  body: imgBuf
});
console.log("Upload status:", uploadRes.status);
const uploadData = await uploadRes.text();
console.log("Upload response:", uploadData.substring(0, 300));

// Parse image_key if successful
let imageKey = null;
try {
  const parsed = JSON.parse(uploadData);
  imageKey = parsed.data?.image_key;
  console.log("image_key:", imageKey);
} catch(e) {}

if (imageKey) {
  // Test 3: Create avatar group
  console.log("\n--- Create avatar group ---");
  const createRes = await fetch("https://api.heygen.com/v2/photo_avatar/avatar_group/create", {
    method: "POST",
    headers: { "X-Api-Key": key, accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test Avatar", image_key: imageKey })
  });
  console.log("Create status:", createRes.status);
  const createData = await createRes.text();
  console.log("Create response:", createData.substring(0, 400));

  let groupId = null;
  try {
    const parsed = JSON.parse(createData);
    groupId = parsed.data?.group_id;
    console.log("group_id:", groupId);
  } catch(e) {}

  if (groupId) {
    // Test 4: Check group status
    await test("Avatar group status", `https://api.heygen.com/v2/photo_avatar/avatar_group/${groupId}`);
    
    // Test 5: Trigger training
    await test("Train avatar", "https://api.heygen.com/v2/photo_avatar/train", "POST", { group_id: groupId });
  }
}
