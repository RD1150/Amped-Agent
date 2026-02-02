import { describe, it, expect } from "vitest";
import {
  createTalkingAvatar,
  getTalkStatus,
  getRemainingCredits,
  generateAvatarIntro,
} from "./did-service";

/**
 * Test D-ID Service Module
 * 
 * These tests validate the D-ID API integration functions.
 * Note: Some tests may take time as they wait for video generation.
 */
describe("D-ID Service", () => {
  it("should get remaining credits", async () => {
    const credits = await getRemainingCredits();
    
    expect(credits).toBeGreaterThanOrEqual(0);
    expect(typeof credits).toBe("number");
    
    console.log(`📊 D-ID Remaining Credits: ${credits}`);
  });

  it("should create a talking avatar video", async () => {
    // Use D-ID's default sample avatar image
    const avatarUrl = "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg";
    const script = "Hello! This is a test of the D-ID API integration.";
    
    const talkId = await createTalkingAvatar(avatarUrl, script);
    
    expect(talkId).toBeDefined();
    expect(typeof talkId).toBe("string");
    expect(talkId.length).toBeGreaterThan(0);
    
    console.log(`✅ Created talk with ID: ${talkId}`);
  }, 30000); // 30 second timeout

  it("should get talk status", async () => {
    // Use D-ID's default sample avatar image
    const avatarUrl = "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg";
    const script = "Testing status check.";
    
    const talkId = await createTalkingAvatar(avatarUrl, script);
    
    // Get status
    const status = await getTalkStatus(talkId);
    
    expect(status).toBeDefined();
    expect(status.id).toBe(talkId);
    expect(status.status).toMatch(/created|started|done/);
    
    console.log(`📊 Talk status: ${status.status}`);
  }, 30000);

  it("should generate a complete avatar intro video", async () => {
    // Use D-ID's default sample avatar image
    const avatarUrl = "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg";
    const script = "Welcome to Authority Content! I'm here to help you create amazing real estate videos.";
    
    console.log("⏳ Generating avatar video... this may take 30-60 seconds");
    
    const videoUrl = await generateAvatarIntro(avatarUrl, script);
    
    expect(videoUrl).toBeDefined();
    expect(typeof videoUrl).toBe("string");
    expect(videoUrl).toMatch(/^https?:\/\//);
    
    console.log(`✅ Avatar video generated successfully!`);
    console.log(`🎥 Video URL: ${videoUrl}`);
  }, 120000); // 2 minute timeout for full generation
});
