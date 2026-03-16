// Load env from webdev.sh.env
import { readFileSync } from 'fs';
try {
  const env = readFileSync('/opt/.manus/webdev.sh.env', 'utf8');
  for (const line of env.split('\n')) {
    const match = line.match(/^export\s+(\w+)="?([^"]*)"?$/);
    if (match) process.env[match[1]] = match[2];
  }
} catch (e) { console.log('Could not load webdev env:', e.message); }

const key = process.env.RUNWAY_API_KEY;
console.log('RUNWAY_API_KEY present:', !!key, '| Length:', key?.length ?? 0);
if (key) console.log('Key starts with:', key.substring(0, 8) + '...');

if (!key) {
  console.error('No RUNWAY_API_KEY found');
  process.exit(1);
}

console.log('\nTesting Runway API...');
const res = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`,
    'X-Runway-Version': '2024-11-06',
  },
  body: JSON.stringify({
    model: 'gen4_turbo',
    promptImage: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1280',
    promptText: 'Slow cinematic dolly forward into the living room',
    duration: 5,
    ratio: '1280:720',
  }),
});

console.log('HTTP Status:', res.status);
const text = await res.text();
console.log('Response body:', text.substring(0, 1000));
