import { storagePut } from './storage';

async function main() {
  const result = await storagePut('test/hello.txt', Buffer.from('hello world'), 'text/plain');
  console.log('URL:', result.url);
  // Try to fetch it without auth
  const r = await fetch(result.url);
  console.log('Public access status:', r.status, r.statusText);
  const body = await r.text().catch(() => 'could not read body');
  console.log('Body preview:', body.substring(0, 200));
}
main().catch(e => console.error('Error:', e.message));
