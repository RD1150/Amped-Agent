// Fetch Reena Dutta's existing HeyGen avatar group and seed it into the database
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

async function heygenGet(path) {
  const res = await fetch(`https://api.heygen.com${path}`, {
    headers: { 'X-Api-Key': HEYGEN_API_KEY, 'accept': 'application/json' }
  });
  const text = await res.text();
  if (text.startsWith('<')) {
    console.log(`${path} → HTML response (404/error)`);
    return null;
  }
  const json = JSON.parse(text);
  console.log(`${path} → status ${res.status}, code ${json.code}`);
  return json;
}

// Try various endpoints to find the avatar group list
const endpoints = [
  '/v2/photo_avatar/avatar_group/list',
  '/v2/photo_avatar/list',
  '/v1/avatar.list',
  '/v2/avatars',
];

for (const ep of endpoints) {
  const data = await heygenGet(ep);
  if (data && data.data) {
    const items = data.data.avatar_group_list || data.data.avatars || data.data.talking_photos || data.data;
    if (Array.isArray(items) && items.length > 0) {
      console.log(`\n✅ Found items at ${ep}:`);
      console.log(JSON.stringify(items.slice(0, 3), null, 2));
    }
  }
}
