import { readFileSync } from 'fs';

const envPath = '/home/ubuntu/luxestate/.env';
let apiKey;
try {
  const envContent = readFileSync(envPath, 'utf8');
  const match = envContent.match(/CREATOMATE_API_KEY=(.+)/);
  if (match) apiKey = match[1].trim();
} catch {}
if (!apiKey) apiKey = process.env.CREATOMATE_API_KEY;

// Test pan animation with direction
const renderScript = {
  output_format: "mp4",
  width: 1280,
  height: 720,
  frame_rate: 25,
  elements: [
    {
      type: "image",
      source: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920",
      track: 1,
      time: 0,
      duration: 5,
      fit: "cover",
      clip: true,
      animations: [
        { easing: "linear", type: "scale", scope: "element", start_scale: "105%", end_scale: "125%", fade: false },
        { easing: "linear", type: "pan", direction: "0deg", fade: false },
      ]
    },
    {
      type: "image",
      source: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920",
      track: 1,
      time: 5,
      duration: 5,
      fit: "cover",
      clip: true,
      animations: [
        { easing: "cubic-in-out", type: "fade", duration: 0.8, transition: true, fade: true },
        { easing: "linear", type: "scale", scope: "element", start_scale: "120%", end_scale: "100%", fade: false },
      ]
    }
  ]
};

const resp = await fetch('https://api.creatomate.com/v1/renders', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ source: renderScript }),
});
const data = await resp.json();
console.log("Response:", JSON.stringify(data, null, 2));

if (Array.isArray(data) && data[0]?.id) {
  const renderId = data[0].id;
  console.log("\nWaiting 12s then checking status...");
  await new Promise(r => setTimeout(r, 12000));
  const statusResp = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  const statusData = await statusResp.json();
  console.log("Status:", statusData.status);
  if (statusData.status === 'succeeded') {
    console.log("SUCCESS! Video URL:", statusData.url);
  } else if (statusData.status === 'failed') {
    console.log("FAILED:", statusData.error_message);
  } else {
    console.log("Still rendering... check manually:", renderId);
  }
}
