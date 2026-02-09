import { imageToVideo } from "./server/_core/lumaAi.js";

// Test with one of the demo images
const testImageUrl = "https://cdn.manus.space/property-1738977636799-c3e5b0c4f1c4c5a0.jpg";

console.log("🎬 Testing Luma AI image-to-video generation...");
console.log("Image URL:", testImageUrl);
console.log("Starting generation (this may take 1-3 minutes)...\n");

try {
  const videoUrl = await imageToVideo(
    testImageUrl,
    "Cinematic slow push-in camera movement revealing the architectural details, golden hour lighting, professional real estate cinematography",
    {
      aspectRatio: "9:16",
      resolution: "720p",
      model: "ray-flash-2",
    }
  );
  
  console.log("\n✅ SUCCESS! Video generated:");
  console.log("Video URL:", videoUrl);
  console.log("\nYou can download and view this video to verify it has cinematic camera movement.");
} catch (error) {
  console.error("\n❌ FAILED:", error.message);
  console.error("\nFull error:", error);
}
