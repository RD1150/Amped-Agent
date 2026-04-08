const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

const res = await fetch('https://api.heygen.com/v2/avatars', {
  headers: { 'X-Api-Key': HEYGEN_API_KEY, 'accept': 'application/json' }
});
const data = await res.json();
const talkingPhotos = data?.data?.talking_photos || [];

const reenaAvatars = talkingPhotos.filter(p => 
  p.talking_photo_name?.toLowerCase().includes('reena')
);

console.log('Reena Dutta avatars:');
reenaAvatars.forEach(a => {
  console.log(`  ID: ${a.talking_photo_id}`);
  console.log(`  Name: ${a.talking_photo_name}`);
  console.log(`  Preview: ${a.preview_image_url?.split('?')[0]}`);
  console.log('');
});
