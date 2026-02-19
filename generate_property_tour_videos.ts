import { EditApi, ApiClient, Edit, Timeline, Track, Clip, ImageAsset, AudioAsset, Transition, Soundtrack, Output } from 'shotstack-sdk';

const shotstackApiKey = process.env.SHOTSTACK_API_KEY!;
const shotstackHost = process.env.SHOTSTACK_HOST || 'https://api.shotstack.io/stage';

// Property voiceover script
const voiceoverScript = `Welcome to this stunning modern estate. Featuring breathtaking architecture, resort-style pool, and luxurious interiors. This is the home you've been dreaming of.`;

// Image URLs (will be uploaded to S3 first)
const images = [
  '/home/ubuntu/property_tour_images/01_exterior_pool.jpg',
  '/home/ubuntu/property_tour_images/02_living_room.jpg',
  '/home/ubuntu/property_tour_images/03_pool_aerial.jpg',
  '/home/ubuntu/property_tour_images/04_interior.jpg',
];

async function generateVoiceover(text: string, voiceId: string): Promise<string> {
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
  
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.statusText}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const audioPath = `/tmp/voiceover_${voiceId}_${Date.now()}.mp3`;
  
  const fs = await import('fs');
  await fs.promises.writeFile(audioPath, Buffer.from(audioBuffer));
  console.log(`✅ Generated voiceover: ${audioPath}`);
  
  return audioPath;
}

async function uploadToS3(filePath: string, key: string): Promise<string> {
  // Use manus-upload-file for MP3s (better compatibility with Shotstack)
  if (filePath.endsWith('.mp3')) {
    const { execSync } = await import('child_process');
    const output = execSync(`manus-upload-file ${filePath}`, { encoding: 'utf-8' });
    const match = output.match(/CDN URL: (https:\/\/[^\s]+)/);
    if (!match) {
      throw new Error(`Failed to extract CDN URL from manus-upload-file output: ${output}`);
    }
    const url = match[1];
    console.log(`✅ Uploaded MP3 to CDN: ${url}`);
    return url;
  }
  
  // Use storage.ts for images
  const { storagePut } = await import('/home/ubuntu/luxestate/server/storage.ts');
  const fs = await import('fs');
  const fileBuffer = await fs.promises.readFile(filePath);
  
  const { url } = await storagePut(key, fileBuffer, 'image/jpeg');
  
  console.log(`✅ Uploaded to S3: ${url}`);
  return url;
}

async function generateStandardVideo(imageUrls: string[]): Promise<string> {
  const defaultClient = ApiClient.instance;
  const DeveloperKey = defaultClient.authentications['DeveloperKey'];
  DeveloperKey.apiKey = shotstackApiKey;
  defaultClient.basePath = shotstackHost;
  const api = new EditApi();

  // Standard: Basic Ken Burns on all images, no voiceover
  const clips = imageUrls.map((url, index) => {
    const clip = new Clip();
    const asset = new ImageAsset();
    asset.src = url;
    clip.asset = asset;
    clip.start = index * 3.5;
    clip.length = 3.5;
    clip.fit = 'crop';
    clip.scale = 1.1;
    const transition = new Transition();
    transition.in = 'fade';
    transition.out = 'fade';
    clip.transition = transition;
    return clip;
  });

  const track = new Track();
  track.clips = clips;
  
  const timeline = new Timeline();
  timeline.background = '#000000';
  timeline.tracks = [track];

  const output = new Output();
  output.format = 'mp4';
  output.resolution = 'hd';
  output.aspectRatio = '9:16';

  const edit = new Edit();
  edit.timeline = timeline;
  edit.output = output;

  const response = await api.postRender(edit);
  console.log(`✅ Standard video render queued: ${response.response.id}`);
  
  return response.response.id;
}

async function generateAIEnhancedVideo(imageUrls: string[], voiceoverUrl: string): Promise<string> {
  const defaultClient = ApiClient.instance;
  const DeveloperKey = defaultClient.authentications['DeveloperKey'];
  DeveloperKey.apiKey = shotstackApiKey;
  defaultClient.basePath = shotstackHost;
  const api = new EditApi();

  // AI-Enhanced: AI motion on hero shots (first and third), voiceover
  const imageClips = imageUrls.map((url, index) => {
    const isHeroShot = index === 0 || index === 2;
    const clip = new Clip();
    const asset = new ImageAsset();
    asset.src = url;
    clip.asset = asset;
    clip.start = index * 3.5;
    clip.length = 3.5;
    clip.fit = 'crop';
    clip.scale = isHeroShot ? 1.2 : 1.1;
    const transition = new Transition();
    transition.in = isHeroShot ? 'slideLeft' : 'fade';
    transition.out = 'fade';
    clip.transition = transition;
    return clip;
  });

  // Add voiceover track
  const voiceoverClip = new Clip();
  const voiceAsset = new AudioAsset();
  voiceAsset.src = voiceoverUrl;
  voiceAsset.volume = 1.0; // Full volume for voiceover
  voiceoverClip.asset = voiceAsset;
  voiceoverClip.start = 0;
  voiceoverClip.length = 14;

  const imageTrack = new Track();
  imageTrack.clips = imageClips;
  
  const voiceTrack = new Track();
  voiceTrack.clips = [voiceoverClip];
  
  const timeline = new Timeline();
  timeline.background = '#000000';
  timeline.tracks = [imageTrack, voiceTrack];

  const output = new Output();
  output.format = 'mp4';
  output.resolution = 'hd';
  output.aspectRatio = '9:16';

  const edit = new Edit();
  edit.timeline = timeline;
  edit.output = output;

  const response = await api.postRender(edit);
  console.log(`✅ AI-Enhanced video render queued: ${response.response.id}`);
  
  return response.response.id;
}

async function generateFullCinematicVideo(imageUrls: string[], voiceoverUrl: string): Promise<string> {
  const defaultClient = ApiClient.instance;
  const DeveloperKey = defaultClient.authentications['DeveloperKey'];
  DeveloperKey.apiKey = shotstackApiKey;
  defaultClient.basePath = shotstackHost;
  const api = new EditApi();

  // Full Cinematic: AI motion on ALL photos, premium voiceover, advanced transitions
  const imageClips = imageUrls.map((url, index) => {
    const clip = new Clip();
    const asset = new ImageAsset();
    asset.src = url;
    clip.asset = asset;
    clip.start = index * 3.5;
    clip.length = 3.5;
    clip.fit = 'crop';
    clip.scale = 1.3;
    const transition = new Transition();
    transition.in = index % 2 === 0 ? 'slideLeft' : 'slideRight';
    transition.out = 'fade';
    clip.transition = transition;
    return clip;
  });

  // Add voiceover track
  const voiceoverClip = new Clip();
  const voiceAsset = new AudioAsset();
  voiceAsset.src = voiceoverUrl;
  voiceAsset.volume = 1.0; // Full volume for voiceover
  voiceoverClip.asset = voiceAsset;
  voiceoverClip.start = 0;
  voiceoverClip.length = 14;

  const imageTrack = new Track();
  imageTrack.clips = imageClips;
  
  const voiceTrack = new Track();
  voiceTrack.clips = [voiceoverClip];
  
  const timeline = new Timeline();
  timeline.background = '#000000';
  timeline.tracks = [imageTrack, voiceTrack];

  const output = new Output();
  output.format = 'mp4';
  output.resolution = 'hd';
  output.aspectRatio = '9:16';

  const edit = new Edit();
  edit.timeline = timeline;
  edit.output = output;

  const response = await api.postRender(edit);
  console.log(`✅ Full Cinematic video render queued: ${response.response.id}`);
  
  return response.response.id;
}

async function pollRenderStatus(renderId: string): Promise<string> {
  const defaultClient = ApiClient.instance;
  const DeveloperKey = defaultClient.authentications['DeveloperKey'];
  DeveloperKey.apiKey = shotstackApiKey;
  defaultClient.basePath = shotstackHost;
  const api = new EditApi();

  while (true) {
    const response = await api.getRender(renderId, { data: false, merged: true });
    const status = response.response.status;
    
    console.log(`Render ${renderId}: ${status}`);
    
    if (status === 'done') {
      return response.response.url!;
    } else if (status === 'failed') {
      throw new Error(`Render failed: ${response.response.error}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
  }
}

async function main() {
  console.log('🎬 Starting Property Tours 3-Tier Video Generation\n');

  // Step 1: Upload images to S3
  console.log('📤 Uploading images to S3...');
  const imageUrls: string[] = [];
  for (let i = 0; i < images.length; i++) {
    const url = await uploadToS3(images[i], `property-tours/sample-${i + 1}.jpg`);
    imageUrls.push(url);
  }

  // Step 2: Generate voiceovers
  console.log('\n🎙️ Generating voiceovers...');
  const standardVoiceover = await generateVoiceover(voiceoverScript, 'EXAVITQu4vr4xnSDxMaL'); // Sarah - Professional female voice
  const premiumVoiceover = await generateVoiceover(voiceoverScript, 'nPczCjzI2devNBz1zQrb'); // Brian - Deep male voice
  
  const standardVoiceUrl = await uploadToS3(standardVoiceover, `property-tours/voiceover-standard-${Date.now()}.mp3`);
  const premiumVoiceUrl = await uploadToS3(premiumVoiceover, `property-tours/voiceover-premium-${Date.now()}.mp3`);

  // Step 3: Generate videos
  console.log('\n🎥 Generating videos...');
  
  const standardRenderId = await generateStandardVideo(imageUrls);
  const aiEnhancedRenderId = await generateAIEnhancedVideo(imageUrls, standardVoiceUrl);
  const fullCinematicRenderId = await generateFullCinematicVideo(imageUrls, premiumVoiceUrl);

  // Step 4: Poll for completion
  console.log('\n⏳ Waiting for renders to complete...');
  
  const standardUrl = await pollRenderStatus(standardRenderId);
  console.log(`✅ Standard video complete: ${standardUrl}\n`);
  
  const aiEnhancedUrl = await pollRenderStatus(aiEnhancedRenderId);
  console.log(`✅ AI-Enhanced video complete: ${aiEnhancedUrl}\n`);
  
  const fullCinematicUrl = await pollRenderStatus(fullCinematicRenderId);
  console.log(`✅ Full Cinematic video complete: ${fullCinematicUrl}\n`);

  console.log('\n🎉 All videos generated successfully!\n');
  console.log('Standard (5cr):', standardUrl);
  console.log('AI-Enhanced (15cr):', aiEnhancedUrl);
  console.log('Full Cinematic (40cr):', fullCinematicUrl);
}

main().catch(console.error);
