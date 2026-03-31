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

const renderId = process.argv[2] || '947cd4a7-af6b-4030-8afb-21ad9d53cc3f';
// Try to get the source from the render
const resp = await fetch(`https://api.creatomate.com/v1/renders/${renderId}?include_source=true`, {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
const data = await resp.json();
console.log(JSON.stringify(data, null, 2));
