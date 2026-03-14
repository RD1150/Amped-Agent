/**
 * Test script: validates Full Cinematic mode Shotstack payload
 * Uses real sample image URLs to simulate a property tour generation
 */
import "dotenv/config";
import { generatePropertyTourVideo } from "../server/videoGenerator";

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1280&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1280&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1280&q=80",
];

async function main() {
  console.log("=== Testing Full Cinematic Mode ===\n");

  try {
    const result = await generatePropertyTourVideo({
      imageUrls: SAMPLE_IMAGES,
      propertyDetails: {
        address: "789 Beach Blvd, Malibu, CA 90265",
        price: "$5,000,000",
        beds: 5,
        baths: 4,
        sqft: 4200,
        propertyType: "Single Family",
        description: "Stunning oceanfront estate with panoramic views.",
      },
      template: "luxury",
      duration: 25,
      includeBranding: true,
      userId: 1,
      aspectRatio: "16:9",
      videoMode: "full-ai",
      enableVoiceover: false,
      movementSpeed: "slow",
      enableAvatarOverlay: false,
      avatarOverlayPosition: "bottom-left",
    });

    console.log("\n✅ Full Cinematic mode SUCCESS!");
    console.log(`   Render ID: ${result.renderId}`);
    console.log(`   Shotstack job submitted — video will be ready in ~2 min`);
  } catch (err: any) {
    console.error("\n❌ Full Cinematic mode FAILED:");
    console.error(err.message);
  }
}

main();
