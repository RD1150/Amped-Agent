// Find Reena Dutta's custom avatar in HeyGen
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

// /v2/avatars returns both avatars and talking_photos
const res = await fetch('https://api.heygen.com/v2/avatars', {
  headers: { 'X-Api-Key': HEYGEN_API_KEY, 'accept': 'application/json' }
});
const text = await res.text();
const data = JSON.parse(text);

const talkingPhotos = data?.data?.talking_photos || [];
console.log(`Total talking photos: ${talkingPhotos.length}`);
console.log('All talking photos:', JSON.stringify(talkingPhotos, null, 2));
