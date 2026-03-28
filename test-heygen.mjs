const key = process.env.HEYGEN_API_KEY;
if (!key) { console.log('No HEYGEN_API_KEY'); process.exit(1); }

// Step 1: Upload image asset
console.log('Step 1: Uploading image asset...');
const imgRes = await fetch('https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80');
const imgBuf = Buffer.from(await imgRes.arrayBuffer());

const uploadRes = await fetch('https://upload.heygen.com/v1/asset', {
  method: 'POST',
  headers: { 'x-api-key': key, 'Content-Type': 'image/jpeg' },
  body: imgBuf,
});
const uploadData = await uploadRes.json();
console.log('Upload:', JSON.stringify(uploadData.data));
const assetId = uploadData.data?.id;
if (!assetId) { console.log('Upload failed'); process.exit(1); }

// Step 2: Create a talking photo from the asset
console.log('\nStep 2: Creating talking photo...');
const tpRes = await fetch('https://api.heygen.com/v2/photo_avatar/photo/create', {
  method: 'POST',
  headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
  body: JSON.stringify({ image_asset_id: assetId }),
});
const tpData = await tpRes.json();
console.log('Talking photo create result:', JSON.stringify(tpData));

let talkingPhotoId = tpData.data?.talking_photo_id ?? tpData.data?.id;
if (!talkingPhotoId) {
  // Try alternate field names
  console.log('Full response:', JSON.stringify(tpData));
  process.exit(1);
}
console.log('Talking photo ID:', talkingPhotoId);

// Step 3: Generate video
console.log('\nStep 3: Generating video...');
const genRes = await fetch('https://api.heygen.com/v2/video/generate', {
  method: 'POST',
  headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    video_inputs: [{
      character: {
        type: 'talking_photo',
        talking_photo_id: talkingPhotoId,
      },
      voice: {
        type: 'text',
        input_text: 'Hello, this is a test of the Authority Content avatar video system.',
        voice_id: '2d5b0e6cf36f460aa7fc47e3eee4ba54',
      },
      background: { type: 'color', value: '#1a1a2e' },
    }],
    dimension: { width: 1280, height: 720 },
  }),
});
const genData = await genRes.json();
console.log('Generate result:', JSON.stringify(genData));

const videoId = genData.data?.video_id;
if (!videoId) { console.log('Generation failed'); process.exit(1); }
console.log('Video ID:', videoId);

// Step 4: Poll
console.log('\nStep 4: Polling (up to 2 min)...');
for (let i = 0; i < 24; i++) {
  await new Promise(r => setTimeout(r, 5000));
  const statusRes = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
    headers: { 'x-api-key': key },
  });
  const statusData = await statusRes.json();
  const status = statusData.data?.status;
  console.log(`  [${(i+1)*5}s] ${status}`);
  if (status === 'completed') {
    console.log('\nSUCCESS! Video URL:', statusData.data?.video_url);
    process.exit(0);
  }
  if (status === 'failed') {
    console.log('FAILED:', JSON.stringify(statusData));
    process.exit(1);
  }
}
console.log('Timed out — video_id:', videoId, '(still processing)');
