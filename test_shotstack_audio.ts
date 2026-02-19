import { EditApi, ApiClient, Edit, Timeline, Track, Clip, AudioAsset, Output } from 'shotstack-sdk';

const shotstackApiKey = process.env.SHOTSTACK_API_KEY!;
const shotstackHost = process.env.SHOTSTACK_HOST || 'https://api.shotstack.io/stage';

// Test audio URL from manus-upload-file
const audioUrl = 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/iVcjZitIjYjHUeIx.mp3';

async function testAudioAccess() {
  console.log('🧪 Testing Shotstack audio access...');
  console.log('Audio URL:', audioUrl);
  
  const defaultClient = ApiClient.instance;
  const DeveloperKey = defaultClient.authentications['DeveloperKey'];
  DeveloperKey.apiKey = shotstackApiKey;
  defaultClient.basePath = shotstackHost;
  const api = new EditApi();

  // Create minimal audio-only clip
  const audioClip = new Clip();
  const audioAsset = new AudioAsset();
  audioAsset.src = audioUrl;
  audioClip.asset = audioAsset;
  audioClip.start = 0;
  audioClip.length = 5; // Just 5 seconds

  const track = new Track();
  track.clips = [audioClip];
  
  const timeline = new Timeline();
  timeline.background = '#000000';
  timeline.tracks = [track];

  const output = new Output();
  output.format = 'mp4';
  output.resolution = 'preview';

  const edit = new Edit();
  edit.timeline = timeline;
  edit.output = output;

  try {
    const response = await api.postRender(edit);
    console.log('✅ Render queued successfully:', response.response.id);
    
    // Poll for result
    while (true) {
      const status = await api.getRender(response.response.id, { data: false, merged: true });
      console.log('Status:', status.response.status);
      
      if (status.response.status === 'done') {
        console.log('✅ SUCCESS! Audio URL is accessible to Shotstack');
        console.log('Video URL:', status.response.url);
        break;
      } else if (status.response.status === 'failed') {
        console.log('❌ FAILED:', status.response.error);
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response?.body) {
      console.error('Response:', JSON.stringify(error.response.body, null, 2));
    }
  }
}

testAudioAccess();
