import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');

const accessKey = process.env.KLING_ACCESS_KEY;
const secretKey = process.env.KLING_SECRET_KEY;
console.log('KLING_ACCESS_KEY present:', !!accessKey, accessKey ? `(${accessKey.slice(0,8)}...)` : 'MISSING');
console.log('KLING_SECRET_KEY present:', !!secretKey, secretKey ? `(${secretKey.slice(0,8)}...)` : 'MISSING');

if (!accessKey || !secretKey) {
  console.error('ERROR: Kling keys not set in environment!');
  process.exit(1);
}

const now = Math.floor(Date.now() / 1000);
const token = jwt.sign({ iss: accessKey, exp: now + 1800, nbf: now - 5 }, secretKey, { algorithm: 'HS256' });
console.log('JWT token generated:', token.slice(0, 30) + '...');

const payload = {
  model_name: 'kling-v1-5',
  image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1280&q=80',
  prompt: 'Bold forward dolly push through the living room',
  cfg_scale: 0.5,
  mode: 'pro',
  aspect_ratio: '16:9',
  duration: '5',
  camera_control: { type: 'simple', config: { zoom: 8, tilt: 3, horizontal: 0, vertical: 0, pan: 0, roll: 0 } }
};

console.log('Sending payload:', JSON.stringify(payload, null, 2));

const res = await fetch('https://api-singapore.klingai.com/v1/videos/image2video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  body: JSON.stringify(payload)
});

const text = await res.text();
console.log('HTTP Status:', res.status);
console.log('Response:', text);
