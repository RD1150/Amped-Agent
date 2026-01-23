import "dotenv/config";

console.log("Checking environment variables...\n");

const ghlAgencyKey = process.env.GHL_AGENCY_API_KEY;
const ghlLocationKey = process.env.GHL_LOCATION_API_KEY;

console.log("GHL_AGENCY_API_KEY:", ghlAgencyKey ? `${ghlAgencyKey.substring(0, 25)}...` : "MISSING");
console.log("GHL_LOCATION_API_KEY:", ghlLocationKey ? `${ghlLocationKey.substring(0, 25)}...` : "MISSING");

console.log("\nExpected Location Key: pit-34627269-a870-4f12-8f23-3e573830f8b0");
console.log("Actual Location Key:  ", ghlLocationKey || "MISSING");
console.log("\nMatch:", ghlLocationKey === "pit-34627269-a870-4f12-8f23-3e573830f8b0" ? "✅ YES" : "❌ NO");
