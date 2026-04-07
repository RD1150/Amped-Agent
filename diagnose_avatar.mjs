/**
 * Diagnostic script: check the actual HeyGen avatar group status
 * and optionally trigger training.
 * 
 * Usage: node diagnose_avatar.mjs [group_id]
 */

const HEYGEN_API = "https://api.heygen.com";
const heygenKey = process.env.HEYGEN_API_KEY;

if (!heygenKey) {
  console.error('ERROR: HEYGEN_API_KEY not set');
  process.exit(1);
}

console.log('HeyGen key:', heygenKey.substring(0, 8) + '...');

const groupId = process.argv[2];

if (!groupId) {
  // List all photo avatars to find the user's group
  console.log('\n=== Listing all photo avatars ===');
  const resp = await fetch(`${HEYGEN_API}/v2/photo_avatar`, {
    headers: {
      'X-Api-Key': heygenKey,
      'accept': 'application/json',
    }
  });
  console.log('Status:', resp.status);
  const text = await resp.text();
  console.log(text.substring(0, 3000));
  
  // Also try v1 endpoint
  console.log('\n=== Trying v1/avatar.list ===');
  const resp2 = await fetch(`${HEYGEN_API}/v1/avatar.list`, {
    headers: {
      'X-Api-Key': heygenKey,
      'accept': 'application/json',
    }
  });
  console.log('Status:', resp2.status);
  const text2 = await resp2.text();
  console.log(text2.substring(0, 3000));
} else {
  // Check specific group
  console.log(`\n=== Checking group ${groupId} ===`);
  const resp = await fetch(`${HEYGEN_API}/v2/photo_avatar/avatar_group/${groupId}`, {
    headers: {
      'X-Api-Key': heygenKey,
      'accept': 'application/json',
    }
  });
  console.log('Status:', resp.status);
  const text = await resp.text();
  console.log(text);
  
  // If still pending, trigger training
  const data = JSON.parse(text);
  const status = data?.data?.status;
  console.log('\nAvatar status:', status);
  
  if (status === 'pending' || status === 'processing') {
    console.log('\n=== Triggering training ===');
    const trainResp = await fetch(`${HEYGEN_API}/v2/photo_avatar/train`, {
      method: 'POST',
      headers: {
        'X-Api-Key': heygenKey,
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({ group_id: groupId }),
    });
    console.log('Train status:', trainResp.status);
    const trainText = await trainResp.text();
    console.log(trainText);
  }
}
