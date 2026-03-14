/**
 * Test script: build the actual Shotstack payload our code generates
 * and submit it to see the real validation error.
 * Run with: node server/testShotstackPayload.mjs
 */

import { config } from 'dotenv';
config();

const SHOTSTACK_API_URL = process.env.SHOTSTACK_HOST || 'https://api.shotstack.io/v1';
const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY;

if (!SHOTSTACK_API_KEY) {
  console.error('SHOTSTACK_API_KEY not set');
  process.exit(1);
}

// Simulate what our videoGenerator.ts builds for a Standard Ken Burns video
// with 2 images, no voiceover, no cinematic effects
const testImageUrl = 'https://shotstack-assets.s3.amazonaws.com/logos/real-estate-white.png';

// Build clips the same way videoGenerator.ts does for Standard mode
function buildKenBurnsClip(imageUrl, index, total, start, duration) {
  const effects = ['zoomIn', 'zoomOut', 'slideLeft', 'slideRight', 'slideUp', 'slideDown'];
  const effect = effects[index % effects.length];
  
  const transition = {};
  if (index > 0) transition.in = 'fade';
  if (index < total - 1) transition.out = 'fade';
  
  const clip = {
    asset: { type: 'image', src: imageUrl },
    start,
    length: duration,
    effect,
  };
  
  // Only add transition if it has at least one property
  if (Object.keys(transition).length > 0) {
    clip.transition = transition;
  }
  
  return clip;
}

const imageUrls = [testImageUrl, testImageUrl];
const clipDuration = 5;
const introLength = 2;
const outroLength = 3;
const totalDuration = introLength + (imageUrls.length * clipDuration) + outroLength;

// Build base video clips
const baseVideoClips = imageUrls.map((url, i) => 
  buildKenBurnsClip(url, i, imageUrls.length, introLength + (i * clipDuration), clipDuration)
);

// Intro card (HTML)
const introCard = {
  asset: {
    type: 'html',
    html: '<div style="background:#1a1a2e;color:white;display:flex;align-items:center;justify-content:center;height:100%;font-family:Georgia,serif;font-size:32px;font-weight:bold;">123 Test Street</div>',
    width: 1920,
    height: 1080,
  },
  start: 0,
  length: introLength,
};

// Outro card (HTML)
const outroCard = {
  asset: {
    type: 'html',
    html: '<div style="background:#1a1a2e;color:white;display:flex;align-items:center;justify-content:center;height:100%;font-family:Georgia,serif;font-size:24px;">Contact Agent</div>',
    width: 1920,
    height: 1080,
  },
  start: introLength + (imageUrls.length * clipDuration),
  length: outroLength,
};

// Text overlay
const textOverlay = {
  asset: {
    type: 'html',
    html: '<div style="color:white;font-family:Arial,sans-serif;font-size:18px;padding:8px 16px;background:rgba(0,0,0,0.5);border-radius:4px;">123 Test Street</div>',
    width: 600,
    height: 60,
  },
  start: introLength,
  length: imageUrls.length * clipDuration,
  position: 'bottomLeft',
  offset: { x: 0.05, y: 0.05 },
};

// Build tracks: base video track + overlay track
const baseTrack = {
  clips: [introCard, ...baseVideoClips, outroCard],
};

const overlayTrack = {
  clips: [textOverlay],
};

const posterCapture = Math.min(Math.max(introLength + (clipDuration * 0.25), 1), totalDuration - 0.5);

const payload = {
  timeline: {
    background: '#000000',
    tracks: [overlayTrack, baseTrack],
  },
  output: {
    format: 'mp4',
    resolution: 'hd',
    quality: 'medium',
    fps: 25,
    poster: { capture: posterCapture },
  },
};

console.log('Submitting payload to Shotstack...');
console.log('Total duration:', totalDuration, 's');
console.log('Clips in base track:', baseTrack.clips.length);
console.log('Clips in overlay track:', overlayTrack.clips.length);
console.log('\nBase track clips:');
baseTrack.clips.forEach((c, i) => {
  console.log(`  [${i}] type=${c.asset.type} start=${c.start} length=${c.length} effect=${c.effect || 'none'} transition=${JSON.stringify(c.transition || {})}`);
});

const response = await fetch(`${SHOTSTACK_API_URL}/render`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': SHOTSTACK_API_KEY,
  },
  body: JSON.stringify(payload),
});

const result = await response.json();
console.log('\nShotstack response:', JSON.stringify(result, null, 2));

if (result.success) {
  console.log('\n✅ SUCCESS! Render queued with ID:', result.response.id);
} else {
  console.log('\n❌ FAILED:', result.message);
  if (result.response?.errors) {
    console.log('Errors:', JSON.stringify(result.response.errors, null, 2));
  }
}
