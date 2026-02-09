// Test Shotstack with real uploaded images
const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY;
const SHOTSTACK_API_URL = "https://api.shotstack.io/v1/stage";

const payload = {
  timeline: {
    tracks: [
      {
        clips: [
          {
            asset: {
              type: "image",
              src: "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/property-tours/property-1770617597416-4e24e2b95fe877a0.jpg"
            },
            start: 0,
            length: 3,
            fit: "cover",
            scale: 1,
            transition: {
              in: "fade",
              out: "fade"
            }
          }
        ]
      }
    ]
  },
  output: {
    format: "mp4",
    resolution: "hd",
    aspectRatio: "9:16"
  }
};

console.log("Testing Shotstack with real uploaded image...");
console.log("Payload:", JSON.stringify(payload, null, 2));

try {
  const response = await fetch(`${SHOTSTACK_API_URL}/render`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": SHOTSTACK_API_KEY
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  
  if (!response.ok) {
    console.error("❌ FAILED:", response.status, response.statusText);
    console.error("Response:", JSON.stringify(result, null, 2));
  } else {
    console.log("✅ SUCCESS! Render ID:", result.response.id);
  }
} catch (error) {
  console.error("❌ ERROR:", error.message);
}
