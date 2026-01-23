import "dotenv/config";

const token = process.env.GHL_LOCATION_API_KEY;
const locationId = "zKv9BFukoAJJjAhPcOYn";

console.log("Testing GHL Social Accounts API...");
console.log("Location ID:", locationId);
console.log("Token:", token ? `${token.substring(0, 20)}...` : "MISSING");

const response = await fetch(
  `https://services.leadconnectorhq.com/social-media-posting/${locationId}/accounts`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      Version: "2021-07-28",
    },
  }
);

console.log("\nResponse Status:", response.status);
console.log("Response Headers:", Object.fromEntries(response.headers.entries()));

if (response.ok) {
  const data = await response.json();
  console.log("\n✅ SUCCESS! Accounts data:");
  console.log(JSON.stringify(data, null, 2));
  
  if (data.accounts && data.accounts.length > 0) {
    console.log(`\n✅ Found ${data.accounts.length} connected accounts!`);
  } else {
    console.log("\n⚠️ Response OK but no accounts in data");
  }
} else {
  const errorText = await response.text();
  console.log("\n❌ ERROR Response:");
  console.log(errorText);
}
