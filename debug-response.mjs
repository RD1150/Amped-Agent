import "dotenv/config";

const token = process.env.GHL_LOCATION_API_KEY;
const locationId = "zKv9BFukoAJJjAhPcOYn";

const response = await fetch(
  `https://services.leadconnectorhq.com/social-media-posting/${locationId}/accounts`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      Version: "2021-07-28",
    },
  }
);

const data = await response.json();

console.log("Full response structure:");
console.log(JSON.stringify(data, null, 2));

console.log("\n\nChecking paths:");
console.log("data.accounts:", data.accounts ? `Array(${data.accounts.length})` : "undefined");
console.log("data.data:", data.data ? "exists" : "undefined");
console.log("data.data.socialMediaAccounts:", data.data?.socialMediaAccounts ? "exists" : "undefined");
console.log("data.data.socialMediaAccounts.accounts:", data.data?.socialMediaAccounts?.accounts ? `Array(${data.data.socialMediaAccounts.accounts.length})` : "undefined");
