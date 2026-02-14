import { imageToVideo } from "./server/_core/runwayAi.ts";

// Test with a clean property image (no watermarks)
const testImageUrl = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920";

console.log("🎬 Testing Runway ML image-to-video generation...");
console.log("Image URL:", testImageUrl);
console.log("Starting generation (this may take 1-3 minutes)...\n");

try {
  const videoUrl = await imageToVideo(
    testImageUrl,
    "Cinematic slow push-in camera movement revealing the architectural details, golden hour lighting, professional real estate cinematography",
    {
      aspectRatio: "16:9",
      duration: 5,
    }
  );
  
  console.log("\n✅ SUCCESS! Video generated:");
  console.log("Video URL:", videoUrl);
  console.log("\nYou can download and view this video to verify it has cinematic camera movement.");
  console.log("\n🎉 Runway integration is working! Full AI mode should now work without moderation issues.");
} catch (error) {
  console.error("\n❌ FAILED:", error.message);
  console.error("\nFull error:", error);
  process.exit(1);
}
