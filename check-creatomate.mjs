import { readFileSync } from 'fs';

try {
  const env = readFileSync('/home/ubuntu/luxestate/.env', 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch {}

const runwayKey = process.env.RUNWAY_API_KEY;
const creatomateKey = process.env.CREATOMATE_API_KEY;

// Cancel the test Runway task we created
const testTaskId = '78146894-876e-4033-824b-ba6b7066305e';
console.log('Cancelling test Runway task...');
try {
  const res = await fetch(`https://api.dev.runwayml.com/v1/tasks/${testTaskId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${runwayKey}`,
      'X-Runway-Version': '2024-11-06',
    }
  });
  console.log('Cancel status:', res.status);
} catch (e) {
  console.log('Cancel error (non-critical):', e.message);
}

// Test the exact Creatomate payload we use in production
console.log('\nTesting Creatomate render with exact production payload...');
const testPayload = {
  output_format: "mp4",
  source: {
    output_format: "mp4",
    width: 1920,
    height: 1080,
    duration: 8,
    elements: [
      {
        type: "video",
        source: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1280",
        time: 0,
        duration: 5,
        animations: [
          { time: 0, duration: 0.5, easing: "linear", type: "fade", fade: "in" },
          { time: 4.5, duration: 0.5, easing: "linear", type: "fade", fade: "out" }
        ]
      },
      {
        type: "text",
        text: "Test Room",
        time: 0.5,
        duration: 2.5,
        x_alignment: "0%",
        y_alignment: "85%",
        x: "8%",
        font_family: "Georgia",
        font_size: "36 vmin",
        font_color: "#ffffff"
      }
    ]
  }
};

try {
  const res = await fetch('https://api.creatomate.com/v1/renders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${creatomateKey}`,
    },
    body: JSON.stringify(testPayload)
  });
  console.log('Creatomate render status:', res.status, res.statusText);
  const body = await res.text();
  console.log('Response:', body.substring(0, 600));
} catch (e) {
  console.log('Error:', e.message);
}
