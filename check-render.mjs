import { readFileSync } from 'fs';

// Load env from .env file
const envPath = '/home/ubuntu/luxestate/.env';
let apiKey;
try {
  const envContent = readFileSync(envPath, 'utf8');
  const match = envContent.match(/CREATOMATE_API_KEY=(.+)/);
  if (match) apiKey = match[1].trim();
} catch {}

if (!apiKey) {
  // Try process.env
  apiKey = process.env.CREATOMATE_API_KEY;
}

if (!apiKey) {
  console.log('No CREATOMATE_API_KEY found');
  process.exit(1);
}

const renderId = process.argv[2] || '4653698d-51ea-4864-828c-518289d8722d';
const resp = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`, {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
const data = await resp.json();
console.log(JSON.stringify(data, null, 2));
