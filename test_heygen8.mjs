// Understand what was created and test if it works as a talking photo
const key = process.env.HEYGEN_API_KEY;
const groupId = "452bb69219b0424c9a2c0aa09fd606a6";

// Get full status
console.log("=== Full group status ===");
const statusRes = await fetch(`https://api.heygen.com/v2/photo_avatar/${groupId}`, {
  headers: { "X-Api-Key": key, accept: "application/json" }
});
const statusData = await statusRes.json();
console.log(JSON.stringify(statusData, null, 2));

// Check if there's a "looks" field or similar
console.log("\n=== Keys in data ===");
console.log(Object.keys(statusData.data || {}));

// Try to use it directly as a talking photo avatar for video generation
console.log("\n=== Test video generation with this as talking_photo ===");
const videoRes = await fetch("https://api.heygen.com/v2/video/generate", {
  method: "POST",
  headers: { "X-Api-Key": key, accept: "application/json", "Content-Type": "application/json" },
  body: JSON.stringify({
    video_inputs: [{
      character: {
        type: "talking_photo",
        talking_photo_id: groupId,
      },
      voice: {
        type: "text",
        input_text: "Hello, this is a test.",
        voice_id: "1bd001e7e50f421d891986aad5158bc8"
      },
      background: { type: "color", value: "#ffffff" }
    }],
    title: "Test Video",
    dimension: { width: 720, height: 1280 }
  })
});
console.log("Video gen status:", videoRes.status);
const videoText = await videoRes.text();
console.log("Video gen response:", videoText.substring(0, 400));
