import { readFileSync } from 'fs';

// Load .env manually
try {
  const env = readFileSync('/home/ubuntu/luxestate/.env', 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch {}

const runwayKey = process.env.RUNWAY_API_KEY;
const creatomateKey = process.env.CREATOMATE_API_KEY;

console.log('RUNWAY_API_KEY:', runwayKey ? `present (${runwayKey.length} chars, starts: ${runwayKey.substring(0,8)}...)` : 'MISSING');
console.log('CREATOMATE_API_KEY:', creatomateKey ? `present (${creatomateKey.length} chars, starts: ${creatomateKey.substring(0,8)}...)` : 'MISSING');

// Test Runway API - try a real generation request
if (runwayKey) {
  console.log('\nTesting Runway API (image_to_video)...');
  try {
    const res = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${runwayKey}`,
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        model: 'gen4_turbo',
        promptImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1280',
        promptText: 'Slow cinematic dolly forward',
        duration: 5,
        ratio: '1280:720'
      })
    });
    console.log('Status:', res.status, res.statusText);
    const body = await res.text();
    console.log('Response:', body.substring(0, 500));
  } catch (e) {
    console.log('Error:', e.message);
  }
}

// Test Creatomate API
if (creatomateKey) {
  console.log('\nTesting Creatomate API (list renders)...');
  try {
    const res = await fetch('https://api.creatomate.com/v1/renders?limit=1&page=1', {
      headers: { 'Authorization': `Bearer ${creatomateKey}` }
    });
    console.log('Status:', res.status, res.statusText);
    if (res.ok) {
      const data = await res.json();
      console.log('Creatomate OK, renders count:', Array.isArray(data) ? data.length : 'N/A');
    } else {
      const body = await res.text();
      console.log('Error:', body.substring(0, 300));
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}
