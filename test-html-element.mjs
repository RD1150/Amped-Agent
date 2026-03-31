import { readFileSync } from 'fs';

const envPath = '/home/ubuntu/luxestate/.env';
let apiKey;
try {
  const envContent = readFileSync(envPath, 'utf8');
  const match = envContent.match(/CREATOMATE_API_KEY=(.+)/);
  if (match) apiKey = match[1].trim();
} catch {}
if (!apiKey) apiKey = process.env.CREATOMATE_API_KEY;

if (!apiKey) { console.log('No CREATOMATE_API_KEY found'); process.exit(1); }

// Test if Creatomate accepts 'html' type elements
const renderScript = {
  output_format: "mp4",
  width: 1920,
  height: 1080,
  frame_rate: 25,
  elements: [
    {
      type: "html",
      source: "<div style='width:1920px;height:1080px;background:navy;display:flex;align-items:center;justify-content:center;'><h1 style='color:white;'>Test</h1></div>",
      track: 1,
      time: 0,
      duration: 2,
      width: 1920,
      height: 1080,
    },
    {
      type: "image",
      source: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920",
      track: 2,
      time: 0,
      duration: 3,
      fit: "cover",
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
