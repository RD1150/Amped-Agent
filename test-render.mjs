import { readFileSync } from 'fs';

// Load env from .env file
const envPath = '/home/ubuntu/luxestate/.env';
let apiKey;
try {
  const envContent = readFileSync(envPath, 'utf8');
  const match = envContent.match(/CREATOMATE_API_KEY=(.+)/);
  if (match) apiKey = match[1].trim();
} catch {}
if (!apiKey) apiKey = process.env.CREATOMATE_API_KEY;

if (!apiKey) {
  console.log('No CREATOMATE_API_KEY found');
  process.exit(1);
}

// Simulate the exact payload that renderPropertyTour would send
// for 3 images, 15s duration, 16:9, standard mode, no voiceover, no avatar
const imageUrls = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920"
];
const width = 1920, height = 1080;
const duration = 15;
const durationPerImage = duration / imageUrls.length; // 5s each
const introCardLength = 2;
const introOffset = introCardLength;
const mainDuration = durationPerImage * imageUrls.length; // 15s
const totalDuration = introOffset + mainDuration + 3; // 20s

const elements = [];
let trackIdx = 1;

// Intro card (html)
const introCardHtml = `<div style="width:${width}px;height:${height}px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#0D1F3C 0%,#1a3a6b 100%);font-family:'Montserrat',sans-serif;"><div style="color:#C9A84C;font-size:48px;font-weight:700;">123 Main Street</div></div>`;
elements.push({
  type: "html",
  source: introCardHtml,
  track: trackIdx++,
  time: 0,
  duration: introCardLength,
  width,
  height,
});

// Photo track
const photoTrack = trackIdx++;
imageUrls.forEach((url, index) => {
  const clipStart = introOffset + index * durationPerImage;
  const clipLength = durationPerImage;
  const transitionAnims = index > 0 ? [{ type: "fade", duration: 0.8, fade: true }] : [];
  elements.push({
    type: "image",
    source: url,
    track: photoTrack,
    time: clipStart - (index > 0 ? 0.4 : 0),
    duration: clipLength + (index > 0 ? 0.4 : 0) + (index < imageUrls.length - 1 ? 0.4 : 0),
    fit: "cover",
    clip: true,
    animations: [...transitionAnims, 
      { easing: "linear", type: "scale", scope: "element", start_scale: "100%", end_scale: "120%", fade: false }
    ],
  });
});

// Outro card
const outroCardHtml = `<div style="width:${width}px;height:${height}px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);"><h2 style="color:#C9A962;font-size:42px;font-weight:bold;margin:0;">Ready to Schedule a Showing?</h2></div>`;
elements.push({
  type: "html",
  source: outroCardHtml,
  track: trackIdx++,
  time: introOffset + mainDuration,
  duration: 3,
  width,
  height,
  animations: [{ type: "fade", duration: 0.5, fade: true }],
});

// Address overlay
const overlayHtml = `<div style="width:${width}px;height:${height}px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:86px;box-sizing:border-box;font-family:'Montserrat',sans-serif;"><div style="background:rgba(0,0,0,0.5);border-radius:8px;padding:12px 24px;text-align:center;"><div style="color:#FFFFFF;font-size:42px;font-weight:700;line-height:1.2;">123 Main Street</div><div style="color:#C9A962;font-size:32px;font-weight:500;margin-top:4px;letter-spacing:1px;">$1,500,000 · 4 BD | 3 BA · 2,500 SQ FT</div></div></div>`;
elements.push({
  type: "html",
  source: overlayHtml,
  track: trackIdx++,
  time: introOffset,
  duration: mainDuration,
  width,
  height,
});

// Music
elements.push({
  type: "audio",
  source: "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/carefree_kevin_macleod_2e6f6d9a.mp3",
  track: trackIdx++,
  time: 0,
  duration: totalDuration,
  volume: '60%',
});

const renderScript = {
  output_format: "mp4",
  width,
  height,
  frame_rate: 25,
  snapshot_time: Math.min(introOffset + mainDuration * 0.25, totalDuration - 0.5),
  elements,
};

console.log("=== RENDER SCRIPT ===");
console.log(JSON.stringify(renderScript, null, 2));
console.log("\n=== ELEMENTS COUNT:", elements.length, "===");
elements.forEach((el, i) => {
  console.log(`Element ${i}: type=${el.type}, track=${el.track}`);
});

// Submit to Creatomate
console.log("\n=== SUBMITTING TO CREATOMATE ===");
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
