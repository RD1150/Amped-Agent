/**
 * Full end-to-end test of the new renderPropertyTour function
 * Tests that the new text+shape elements work correctly with Creatomate
 */
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

// Simulate the exact payload that renderPropertyTour now sends
// for 3 images, 15s duration, 16:9, standard mode, modern template
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

// ── Intro card (background + text layers) ─────────────────────────────────
const introCardTrack = trackIdx++;
// Background
elements.push({
  type: "shape",
  shape: "rectangle",
  fill_color: "#0D1F3C",
  track: introCardTrack,
  time: 0,
  duration: introCardLength,
  width: "100%",
  height: "100%",
  x: "50%",
  y: "50%",
  x_alignment: "50%",
  y_alignment: "50%",
});
// Gold accent bar
elements.push({
  type: "shape",
  shape: "rectangle",
  fill_color: "#C9A84C",
  track: introCardTrack,
  time: 0,
  duration: introCardLength,
  width: "80px",
  height: "2px",
  x: "50%",
  y: "56%",
  x_alignment: "50%",
  y_alignment: "50%",
});
// Address text
elements.push({
  type: "text",
  text: "123 Luxury Estate Drive, Beverly Hills, CA 90210",
  font_family: "Montserrat",
  font_size: "52px",
  font_weight: "700",
  fill_color: "#C9A84C",
  track: introCardTrack,
  time: 0,
  duration: introCardLength,
  x: "50%",
  y: "42%",
  width: "85%",
  x_alignment: "50%",
  y_alignment: "50%",
});
// Price text
elements.push({
  type: "text",
  text: "$4,500,000",
  font_family: "Montserrat",
  font_size: "38px",
  font_weight: "400",
  fill_color: "#FFFFFF",
  track: introCardTrack,
  time: 0,
  duration: introCardLength,
  x: "50%",
  y: "62%",
  width: "85%",
  x_alignment: "50%",
  y_alignment: "50%",
});
// Agent name
elements.push({
  type: "text",
  text: "John Smith | Luxury Properties",
  font_family: "Montserrat",
  font_size: "24px",
  font_weight: "500",
  fill_color: "#C9A962",
  track: introCardTrack,
  time: 0,
  duration: introCardLength,
  x: "50%",
  y: "75%",
  width: "85%",
  x_alignment: "50%",
  y_alignment: "50%",
});

// ── Photo track with Ken Burns ─────────────────────────────────────────────
const photoTrack = trackIdx++;
const kenBurnsPresets = [
  [{ easing: "linear", type: "scale", scope: "element", start_scale: "100%", end_scale: "120%", fade: false }],
  [{ easing: "linear", type: "scale", scope: "element", start_scale: "125%", end_scale: "105%", fade: false }, { easing: "linear", type: "x-position", start_x: "4%", end_x: "-4%", fade: false }],
  [{ easing: "linear", type: "scale", scope: "element", start_scale: "115%", end_scale: "115%", fade: false }, { easing: "linear", type: "x-position", start_x: "-5%", end_x: "5%", fade: false }],
];
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
    animations: [...transitionAnims, ...kenBurnsPresets[index % kenBurnsPresets.length]],
  });
});

// ── Outro card ─────────────────────────────────────────────────────────────
const outroStart = introOffset + mainDuration;
const outroCardTrack = trackIdx++;
elements.push({
  type: "shape",
  shape: "rectangle",
  fill_color: "#0D1F3C",
  track: outroCardTrack,
  time: outroStart,
  duration: 3,
  width: "100%",
  height: "100%",
  x: "50%",
  y: "50%",
  x_alignment: "50%",
  y_alignment: "50%",
  animations: [{ type: "fade", duration: 0.5, fade: true }],
});
elements.push({
  type: "text",
  text: "Ready to Schedule a Showing?",
  font_family: "Montserrat",
  font_size: "44px",
  font_weight: "700",
  fill_color: "#C9A84C",
  track: outroCardTrack,
  time: outroStart,
  duration: 3,
  x: "50%",
  y: "35%",
  width: "85%",
  x_alignment: "50%",
  y_alignment: "50%",
  animations: [{ type: "fade", duration: 0.5, fade: true }],
});
elements.push({
  type: "text",
  text: "John Smith",
  font_family: "Montserrat",
  font_size: "32px",
  font_weight: "600",
  fill_color: "#C9A962",
  track: outroCardTrack,
  time: outroStart,
  duration: 3,
  x: "50%",
  y: "52%",
  width: "85%",
  x_alignment: "50%",
  y_alignment: "50%",
  animations: [{ type: "fade", duration: 0.5, fade: true }],
});
elements.push({
  type: "text",
  text: "(310) 555-0100",
  font_family: "Montserrat",
  font_size: "24px",
  font_weight: "400",
  fill_color: "#FFFFFF",
  track: outroCardTrack,
  time: outroStart,
  duration: 3,
  x: "50%",
  y: "64%",
  width: "85%",
  x_alignment: "50%",
  y_alignment: "50%",
  animations: [{ type: "fade", duration: 0.5, fade: true }],
});

// ── Property overlay ───────────────────────────────────────────────────────
const overlayTrack = trackIdx++;
elements.push({
  type: "shape",
  shape: "rectangle",
  fill_color: "rgba(0,0,0,0.55)",
  border_radius: "8px",
  track: overlayTrack,
  time: introOffset,
  duration: mainDuration,
  width: "75%",
  height: "14%",
  x: "50%",
  y: "88%",
  x_alignment: "50%",
  y_alignment: "50%",
});
elements.push({
  type: "text",
  text: "123 Luxury Estate Drive, Beverly Hills, CA 90210",
  font_family: "Montserrat",
  font_size: "42px",
  font_weight: "700",
  fill_color: "#FFFFFF",
  track: overlayTrack,
  time: introOffset,
  duration: mainDuration,
  x: "50%",
  y: "85%",
  width: "80%",
  x_alignment: "50%",
  y_alignment: "50%",
});
elements.push({
  type: "text",
  text: "$4,500,000 · 5 BD | 4 BA · 5,200 SQ FT",
  font_family: "Montserrat",
  font_size: "32px",
  font_weight: "500",
  fill_color: "#C9A962",
  track: overlayTrack,
  time: introOffset,
  duration: mainDuration,
  x: "50%",
  y: "93%",
  width: "80%",
  x_alignment: "50%",
  y_alignment: "50%",
});

// ── Music ──────────────────────────────────────────────────────────────────
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

console.log("=== Submitting full Ken Burns render test ===");
console.log("Elements:", elements.length);
elements.forEach((el, i) => console.log(`  [${i}] type=${el.type}, track=${el.track}`));

const resp = await fetch('https://api.creatomate.com/v1/renders', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ source: renderScript }),
});
const data = await resp.json();
console.log("\nResponse:", JSON.stringify(data, null, 2));

if (Array.isArray(data) && data[0]?.id) {
  const renderId = data[0].id;
  console.log("\nWaiting 10s then checking status...");
  await new Promise(r => setTimeout(r, 10000));
  const statusResp = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  const statusData = await statusResp.json();
  console.log("Status:", statusData.status);
  if (statusData.status === 'succeeded') {
    console.log("✅ SUCCESS! Video URL:", statusData.url);
  } else if (statusData.status === 'failed') {
    console.log("❌ FAILED:", statusData.error_message);
  } else {
    console.log("Still rendering... check manually:", renderId);
  }
}
