import { readFileSync } from 'fs';

// Read .env manually
const envPath = '/home/ubuntu/luxestate/.env';
let heygenKey = '';
try {
  const env = readFileSync(envPath, 'utf8');
  for (const line of env.split('\n')) {
    if (line.startsWith('HEYGEN_API_KEY=')) {
      heygenKey = line.replace('HEYGEN_API_KEY=', '').trim().replace(/^["']|["']$/g, '');
    }
  }
} catch (e) {
  console.log('No .env file, will use env var');
  heygenKey = process.env.HEYGEN_API_KEY || '';
}

console.log('HeyGen key present:', !!heygenKey, heygenKey ? heygenKey.substring(0, 8) + '...' : 'MISSING');

if (!heygenKey) {
  console.log('ERROR: No HeyGen API key found');
  process.exit(1);
}

// Check all photo avatar groups
const resp = await fetch('https://api.heygen.com/v2/photo_avatar/avatar_group/list', {
  headers: {
    'x-api-key': heygenKey,
    'Content-Type': 'application/json',
  }
});

console.log('Status:', resp.status, resp.statusText);
const text = await resp.text();
console.log('\n=== Raw Response ===');
console.log(text.substring(0, 2000));

try {
  const data = JSON.parse(text);
  console.log('\n=== Parsed ===');
  console.log(JSON.stringify(data, null, 2));
} catch(e) {
  console.log('Could not parse as JSON');
}
