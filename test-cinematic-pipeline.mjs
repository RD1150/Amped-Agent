// Full pipeline test for Cinematic Walkthrough
// Tests: Runway clip generation → Shotstack assembly → result

import { readFileSync } from 'fs';

// Load env from webdev.sh.env
try {
  const env = readFileSync('/opt/.manus/webdev.sh.env', 'utf8');
  for (const line of env.split('\n')) {
    const match = line.match(/^export\s+(\w+)="?([^"]*)"?$/);
    if (match) process.env[match[1]] = match[2];
  }
} catch (e) { console.log('env load error:', e.message); }

const RUNWAY_KEY = process.env.RUNWAY_API_KEY;
const SHOTSTACK_KEY = process.env.SHOTSTACK_API_KEY;
const SHOTSTACK_HOST = process.env.SHOTSTACK_HOST;

console.log('=== Environment Check ===');
console.log('RUNWAY_API_KEY:', RUNWAY_KEY ? `✓ (${RUNWAY_KEY.length} chars)` : '✗ MISSING');
console.log('SHOTSTACK_API_KEY:', SHOTSTACK_KEY ? `✓ (${SHOTSTACK_KEY.length} chars)` : '✗ MISSING');
console.log('SHOTSTACK_HOST:', SHOTSTACK_HOST || '✗ MISSING');

// Step 1: Generate a Runway clip
console.log('\n=== Step 1: Runway Clip Generation ===');
const runwayRes = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${RUNWAY_KEY}`,
    'X-Runway-Version': '2024-11-06',
  },
  body: JSON.stringify({
    model: 'gen4_turbo',
    promptImage: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1280',
    promptText: 'Slow cinematic dolly forward into the living room, warm natural light',
    duration: 5,
    ratio: '1280:720',
  }),
});

console.log('Runway status:', runwayRes.status);
const runwayData = await runwayRes.json();
console.log('Runway response:', JSON.stringify(runwayData));

if (!runwayRes.ok || !runwayData.id) {
  console.error('✗ Runway failed — stopping here');
  process.exit(1);
}

const taskId = runwayData.id;
console.log(`✓ Runway task created: ${taskId}`);
console.log('Polling for completion (this takes 1-3 minutes)...');

// Poll Runway task
let clipUrl = null;
for (let i = 0; i < 40; i++) {
  await new Promise(r => setTimeout(r, 8000));
  const pollRes = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
    headers: {
      'Authorization': `Bearer ${RUNWAY_KEY}`,
      'X-Runway-Version': '2024-11-06',
    },
  });
  const pollData = await pollRes.json();
  console.log(`  Poll ${i+1}: status=${pollData.status}`);
  
  if (pollData.status === 'SUCCEEDED') {
    clipUrl = pollData.output?.[0];
    console.log(`✓ Clip ready: ${clipUrl}`);
    break;
  }
  if (pollData.status === 'FAILED') {
    console.error('✗ Runway task failed:', pollData.failure);
    process.exit(1);
  }
}

if (!clipUrl) {
  console.error('✗ Runway timed out');
  process.exit(1);
}

// Step 2: Shotstack assembly
console.log('\n=== Step 2: Shotstack Assembly ===');
const shotstackPayload = {
  timeline: {
    background: '#000000',
    tracks: [
      {
        clips: [{
          asset: { type: 'video', src: clipUrl },
          start: 0,
          length: 5,
        }]
      },
      {
        clips: [{
          asset: {
            type: 'html',
            html: '<p style="font-family: Georgia; font-size: 28px; color: white; text-shadow: 2px 2px 8px rgba(0,0,0,0.8);">Living Room</p>',
            width: 600,
            height: 60,
          },
          start: 0.5,
          length: 2.5,
          position: 'bottomLeft',
          offset: { x: 0.05, y: 0.08 },
          transition: { in: 'fade', out: 'fade' },
        }]
      }
    ],
  },
  output: { format: 'mp4', resolution: 'hd', aspectRatio: '16:9' },
};

const ssRes = await fetch(`${SHOTSTACK_HOST}/render`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': SHOTSTACK_KEY,
  },
  body: JSON.stringify(shotstackPayload),
});

console.log('Shotstack status:', ssRes.status);
const ssData = await ssRes.json();
console.log('Shotstack response:', JSON.stringify(ssData));

if (!ssRes.ok) {
  console.error('✗ Shotstack failed');
  process.exit(1);
}

const renderId = ssData.response?.id;
console.log(`✓ Shotstack render started: ${renderId}`);
console.log('Polling for completion...');

// Poll Shotstack
for (let i = 0; i < 60; i++) {
  await new Promise(r => setTimeout(r, 10000));
  const pollRes = await fetch(`${SHOTSTACK_HOST}/render/${renderId}`, {
    headers: { 'x-api-key': SHOTSTACK_KEY },
  });
  const pollData = await pollRes.json();
  const { status, url } = pollData.response || {};
  console.log(`  Poll ${i+1}: status=${status}`);
  
  if (status === 'done' && url) {
    console.log(`\n✓ ✓ ✓ FULL PIPELINE SUCCESS!`);
    console.log(`Final video URL: ${url}`);
    process.exit(0);
  }
  if (status === 'failed') {
    console.error('✗ Shotstack render failed');
    process.exit(1);
  }
}

console.error('✗ Shotstack timed out');
process.exit(1);
