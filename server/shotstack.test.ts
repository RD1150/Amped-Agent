import { describe, it, expect } from 'vitest';
import { EditApi, ApiClient, Edit, Timeline, Track, Clip, TitleAsset, Output } from 'shotstack-sdk';
import { ENV } from './_core/env';

describe('Shotstack API', () => {
  it('should validate API key by making a test render request', async () => {
    // Set API key
    const apiKey = ENV.SHOTSTACK_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe('');
    
    // Configure API client
    const defaultClient = ApiClient.instance;
    const DeveloperKey = defaultClient.authentications['DeveloperKey'];
    DeveloperKey.apiKey = apiKey;
    
    // Use sandbox environment for testing
    defaultClient.basePath = 'https://api.shotstack.io/stage';
    
    // Create API instance
    const api = new EditApi();
    
    try {
      // Create a minimal test render to validate credentials
      const edit = new Edit();
      const timeline = new Timeline();
      const track = new Track();
      const clip = new Clip();
      const asset = new TitleAsset();
      
      asset.text = 'Test';
      clip.asset = asset;
      clip.start = 0;
      clip.length = 1;
      
      track.clips = [clip];
      timeline.tracks = [track];
      
      const output = new Output();
      output.format = 'mp4';
      output.resolution = 'preview';
      
      edit.timeline = timeline;
      edit.output = output;
      
      // Submit render (will be queued but we just need to verify auth works)
      const response = await api.postRender(edit);
      
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.message).toBeDefined();
      expect(response.response).toBeDefined();
      expect(response.response.id).toBeDefined();
      
      console.log('✅ Shotstack API key validated successfully');
      console.log('   Render ID:', response.response.id);
    } catch (error: any) {
      console.error('❌ Shotstack API validation failed:', error.message);
      throw new Error(`Shotstack API key validation failed: ${error.message}`);
    }
  }, 30000); // 30 second timeout for API call
});
