import https from 'https';

const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY;
const SHOTSTACK_HOST = process.env.SHOTSTACK_HOST || 'https://api.shotstack.io/stage';

const photoUrls = [
  'https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/photo1_49f8dd66.jpg',
  'https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/photo5_197614a6.jpg',
  'https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/photo4_cb60c86b.jpg',
  'https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/photo6_459496ff.jpg',
  'https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/photo3_f9a38fb3.jpg',
];

const movements = [
  { start: 'top-left', end: 'bottom-right' },
  { start: 'top-right', end: 'bottom-left' },
  { start: 'bottom-left', end: 'top-right' },
  { start: 'center', end: 'top-left' },
  { start: 'bottom-right', end: 'center' },
];

const clips = photoUrls.map((url, i) => ({
  asset: { type: 'image', src: url },
  start: i * 4,
  length: 4.5,
  effect: `zoomIn`,
  transition: { in: 'fade', out: 'fade' },
}));

const payload = {
  timeline: {
    soundtrack: {
      src: 'https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/music/unminus/ambisax.mp3',
      effect: 'fadeInFadeOut',
    },
    tracks: [{ clips }],
  },
  output: {
    format: 'mp4',
    resolution: 'hd',
    aspectRatio: '16:9',
  },
};

function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(SHOTSTACK_HOST + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SHOTSTACK_API_KEY,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function poll(renderId) {
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const res = await makeRequest('GET', `/render/${renderId}`);
    const status = res.body?.response?.status;
    const url = res.body?.response?.url;
    console.log(`[${i+1}] Status: ${status}`);
    if (status === 'done') return url;
    if (status === 'failed') throw new Error('Render failed: ' + JSON.stringify(res.body));
  }
  throw new Error('Timeout waiting for render');
}

console.log('Submitting Shotstack render...');
const submitRes = await makeRequest('POST', '/render', payload);
console.log('Submit response:', JSON.stringify(submitRes.body, null, 2));

if (!submitRes.body?.response?.id) {
  console.error('Failed to get render ID');
  process.exit(1);
}

const renderId = submitRes.body.response.id;
console.log('Render ID:', renderId);
console.log('Polling for completion...');

const videoUrl = await poll(renderId);
console.log('\n✅ VIDEO READY:', videoUrl);
