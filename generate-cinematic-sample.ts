import { generatePropertyTourVideo } from "./server/videoGenerator";

/**
 * Generate a sample Full Cinematic Property Tour video
 * This demonstrates the 75-credit tier with Runway AI-powered camera movements
 */

const propertyImages = [
  "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/uqLRluIKpFfYIAuh.jpeg", // Modern exterior with pool
  "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/zWKJrqrljAGhKcTl.jpg", // Luxury living room
  "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/ruULjVfFODozfSxP.jpg", // Modern kitchen
  "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/KNtJxYkNHzCqiKnx.jpg", // Exterior twilight
];

const propertyDetails = {
  address: "1234 Luxury Lane, Beverly Hills, CA 90210",
  price: "$4,995,000",
  beds: 5,
  baths: 6.5,
  sqft: 6800,
  propertyType: "Single Family",
  description: "Stunning modern masterpiece with resort-style amenities, chef's kitchen, and breathtaking architectural design. This luxury estate offers the ultimate California lifestyle.",
};

async function main() {
  console.log("🎬 Generating Full Cinematic Property Tour Sample");
  console.log("================================================\n");
  console.log("Property:", propertyDetails.address);
  console.log("Images:", propertyImages.length);
  console.log("Mode: Full Cinematic (full-ai)");
  console.log("Features:");
  console.log("  ✓ Runway AI camera movements on ALL photos");
  console.log("  ✓ ElevenLabs voiceover (Brian - cinematic voice)");
  console.log("  ✓ Dramatic pacing (6s per shot)");
  console.log("  ✓ Cinematic music track");
  console.log("  ✓ Smooth fade transitions\n");

  try {
    const result = await generatePropertyTourVideo({
      imageUrls: propertyImages,
      propertyDetails,
      template: "luxury",
      duration: 30,
      includeBranding: true,
      aspectRatio: "16:9",
      cardTemplate: "luxury",
      includeIntroVideo: false,
      videoMode: "full-ai", // Full Cinematic tier - ALL photos get Runway treatment
      enableVoiceover: true,
      voiceId: "nPczCjzI2devNBz1zQrb", // Brian - deep, cinematic voice
      movementSpeed: "slow", // Cinematic pacing
      musicTrack: "calm-piano", // Elegant background music
    });

    console.log("\n✅ Video generation started!");
    console.log("Render ID:", result.renderId);
    console.log("\nThis will take approximately:");
    console.log("  • Runway AI generation: ~3-5 minutes (4 photos × 5 seconds each)");
    console.log("  • ElevenLabs voiceover: ~30 seconds");
    console.log("  • Shotstack assembly: ~2-3 minutes");
    console.log("  • Total: ~6-9 minutes\n");
    console.log("💰 Cost breakdown:");
    console.log("  • Runway: 4 photos × $0.80 = $3.20");
    console.log("  • ElevenLabs: ~$0.05");
    console.log("  • Shotstack: ~$0.12");
    console.log("  • Total: ~$3.37 (charged as 75 credits)\n");
    console.log("📊 Profit margin: 93% (75cr = $7.50, cost = $3.37)");
    console.log("\nRender ID saved. You can check status in the Property Tours dashboard.");
  } catch (error: any) {
    console.error("\n❌ Error generating video:");
    console.error(error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  }
}

main();
