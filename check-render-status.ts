import { checkRenderStatus } from "./server/videoGenerator";

const renderId = "1ab05405-4af0-4de8-a3a7-b30ad9b76485";

console.log("🔍 Checking render status for:", renderId);
console.log("Polling every 10 seconds...\n");

async function pollStatus() {
  let attempts = 0;
  const maxAttempts = 30; // 5 minutes max
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      const status = await checkRenderStatus(renderId);
      
      console.log(`[Attempt ${attempts}/${maxAttempts}] Status: ${status.status}`);
      
      if (status.status === "done") {
        console.log("\n✅ Video render complete!");
        console.log("📹 Video URL:", status.url);
        console.log("🖼️  Thumbnail URL:", status.thumbnail);
        console.log("\nDownloading video...");
        process.exit(0);
      } else if (status.status === "failed") {
        console.error("\n❌ Render failed!");
        console.error("Error:", status.error);
        process.exit(1);
      } else {
        console.log(`   Progress: ${status.status}...`);
      }
      
      // Wait 10 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 10000));
      
    } catch (error: any) {
      console.error("Error checking status:", error.message);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  console.error("\n⏱️  Timeout: Render took longer than expected");
  process.exit(1);
}

pollStatus();
