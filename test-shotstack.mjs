import { generatePropertyTourVideo } from "./server/videoGenerator.ts";

// Test with 3 photos from the user's property
const testData = {
  imageUrls: [
    "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/QtDebARPYPcRPZkW.png",
    "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/KiXOlDrnmepRFytp.png",
    "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/BTxSPorMTWIzgcyu.png",
  ],
  propertyDetails: {
    address: "5316 Lakeview Canyon Rd, Westlake Village, CA 91362",
    price: "$3,995,000",
    beds: 5,
    baths: 6,
    sqft: 7300,
  },
  template: "modern",
  duration: 15, // Short test video
  includeBranding: false,
  aspectRatio: "9:16",
  musicTrack: "upbeat",
};

console.log("Testing Shotstack API with fixed parameters...");
console.log("Images:", testData.imageUrls.length);
console.log("Aspect ratio:", testData.aspectRatio);

try {
  const result = await generatePropertyTourVideo(testData);
  console.log("\n✅ SUCCESS! Video generation started");
  console.log("Render ID:", result.renderId);
  console.log("\nThe fix worked! Shotstack accepted the request.");
} catch (error) {
  console.error("\n❌ FAILED:", error.message);
  console.error("\nThe fix didn't work. Need to investigate further.");
  process.exit(1);
}
