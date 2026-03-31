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

// Test text + shape elements instead of html
const renderScript = {
  output_format: "mp4",
  width: 1920,
  height: 1080,
  frame_rate: 25,
  elements: [
    // Background shape (dark gradient-like)
    {
      type: "shape",
      shape: "rectangle",
      fill_color: "#0D1F3C",
      track: 1,
      time: 0,
      duration: 3,
      width: "100%",
      height: "100%",
      x: "50%",
      y: "50%",
      x_alignment: "50%",
      y_alignment: "50%",
    },
    // Address text
    {
      type: "text",
      text: "123 Main Street",
      font_family: "Montserrat",
      font_size: "48px",
      font_weight: "700",
      fill_color: "#C9A84C",
      track: 2,
      time: 0,
      duration: 3,
      x: "50%",
      y: "45%",
      x_alignment: "50%",
      y_alignment: "50%",
    },
    // Price text
    {
      type: "text",
      text: "$1,500,000",
      font_family: "Montserrat",
      font_size: "36px",
      font_weight: "400",
      fill_color: "#FFFFFF",
      track: 3,
      time: 0,
      duration: 3,
      x: "50%",
      y: "58%",
      x_alignment: "50%",
      y_alignment: "50%",
    },
    // Main photo
    {
      type: "image",
      source: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920",
      track: 4,
      time: 3,
      duration: 4,
      fit: "cover",
    },
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
