/**
 * Social Media Posting Module
 * Handles posting to Facebook, LinkedIn, Instagram, and Twitter/X via their APIs
 * Supports both image posts and video posts
 */

import axios from 'axios';

export interface PostContent {
  text: string;
  imageUrl?: string;
  videoUrl?: string;  // For video posts (MP4 URL)
}

interface PostResult {
  success: boolean;
  platform: string;
  postId?: string;
  error?: string;
}

/**
 * Post to Facebook Page — supports text, image, or video
 */
export async function postToFacebook(
  pageAccessToken: string,
  pageId: string,
  content: PostContent
): Promise<PostResult> {
  try {
    if (content.videoUrl) {
      // Video post: use the /videos endpoint
      const url = `https://graph.facebook.com/v18.0/${pageId}/videos`;
      const params: any = {
        access_token: pageAccessToken,
        description: content.text,
        file_url: content.videoUrl,
      };
      const response = await axios.post(url, null, { params });
      return {
        success: true,
        platform: 'facebook',
        postId: response.data.id,
      };
    } else if (content.imageUrl) {
      // Image post
      const url = `https://graph.facebook.com/v18.0/${pageId}/photos`;
      const params: any = {
        access_token: pageAccessToken,
        caption: content.text,
        url: content.imageUrl,
      };
      const response = await axios.post(url, null, { params });
      return {
        success: true,
        platform: 'facebook',
        postId: response.data.id,
      };
    } else {
      // Text-only post
      const url = `https://graph.facebook.com/v18.0/${pageId}/feed`;
      const params: any = {
        access_token: pageAccessToken,
        message: content.text,
      };
      const response = await axios.post(url, null, { params });
      return {
        success: true,
        platform: 'facebook',
        postId: response.data.id,
      };
    }
  } catch (error: any) {
    console.error('[Facebook Post Error]', error.response?.data || error.message);
    return {
      success: false,
      platform: 'facebook',
      error: error.response?.data?.error?.message || error.message,
    };
  }
}

/**
 * Post to Instagram Business Account (via Facebook Graph API)
 * Supports both image and video (Reel) posts
 */
export async function postToInstagram(
  pageAccessToken: string,
  instagramBusinessAccountId: string,
  content: PostContent
): Promise<PostResult> {
  try {
    if (!content.imageUrl && !content.videoUrl) {
      return {
        success: false,
        platform: 'instagram',
        error: 'Instagram posts require an image or video',
      };
    }

    const containerUrl = `https://graph.facebook.com/v18.0/${instagramBusinessAccountId}/media`;

    let containerParams: any = {
      caption: content.text,
      access_token: pageAccessToken,
    };

    if (content.videoUrl) {
      // Video / Reel post
      containerParams.video_url = content.videoUrl;
      containerParams.media_type = 'REELS';
    } else {
      // Image post
      containerParams.image_url = content.imageUrl;
    }

    // Step 1: Create media container
    const containerResponse = await axios.post(containerUrl, null, {
      params: containerParams,
    });

    const creationId = containerResponse.data.id;

    // For video, we need to wait for processing before publishing
    if (content.videoUrl) {
      // Poll for video processing status (up to 60 seconds)
      let attempts = 0;
      while (attempts < 12) {
        await new Promise((r) => setTimeout(r, 5000));
        const statusRes = await axios.get(
          `https://graph.facebook.com/v18.0/${creationId}`,
          {
            params: {
              fields: 'status_code',
              access_token: pageAccessToken,
            },
          }
        );
        if (statusRes.data.status_code === 'FINISHED') break;
        if (statusRes.data.status_code === 'ERROR') {
          throw new Error('Instagram video processing failed');
        }
        attempts++;
      }
    }

    // Step 2: Publish the container
    const publishUrl = `https://graph.facebook.com/v18.0/${instagramBusinessAccountId}/media_publish`;
    const publishResponse = await axios.post(publishUrl, null, {
      params: {
        creation_id: creationId,
        access_token: pageAccessToken,
      },
    });

    return {
      success: true,
      platform: 'instagram',
      postId: publishResponse.data.id,
    };
  } catch (error: any) {
    console.error('[Instagram Post Error]', error.response?.data || error.message);
    return {
      success: false,
      platform: 'instagram',
      error: error.response?.data?.error?.message || error.message,
    };
  }
}

/**
 * Post to LinkedIn Profile or Company Page
 * Supports text, image, and video posts
 */
export async function postToLinkedIn(
  accessToken: string,
  authorUrn: string, // e.g., "urn:li:person:ABC123" or "urn:li:organization:123456"
  content: PostContent
): Promise<PostResult> {
  try {
    const url = 'https://api.linkedin.com/v2/ugcPosts';

    let shareMediaCategory = 'NONE';
    let media: any[] = [];

    if (content.videoUrl) {
      shareMediaCategory = 'VIDEO';
      media = [
        {
          status: 'READY',
          description: { text: 'Real estate video' },
          media: content.videoUrl,
          title: { text: 'Property Video' },
        },
      ];
    } else if (content.imageUrl) {
      shareMediaCategory = 'IMAGE';
      media = [
        {
          status: 'READY',
          description: { text: 'Real estate content' },
          media: content.imageUrl,
          title: { text: 'Post Image' },
        },
      ];
    }

    const postData: any = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content.text },
          shareMediaCategory,
          ...(media.length > 0 ? { media } : {}),
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await axios.post(url, postData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    return {
      success: true,
      platform: 'linkedin',
      postId: response.data.id,
    };
  } catch (error: any) {
    console.error('[LinkedIn Post Error]', error.response?.data || error.message);
    return {
      success: false,
      platform: 'linkedin',
      error: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Post a tweet to Twitter/X via API v2
 * Uses OAuth 1.0a (user context) for posting tweets
 */
export async function postToTwitter(
  accessToken: string,
  accessTokenSecret: string,
  apiKey: string,
  apiSecret: string,
  content: PostContent
): Promise<PostResult> {
  try {
    const tweetUrl = 'https://api.twitter.com/2/tweets';

    // Truncate to 280 characters
    const tweetText = content.text.length > 280
      ? content.text.substring(0, 277) + '...'
      : content.text;

    const body: any = { text: tweetText };

    // Generate OAuth 1.0a signature
    const oauthHeader = generateOAuth1Header(
      'POST',
      tweetUrl,
      apiKey,
      apiSecret,
      accessToken,
      accessTokenSecret
    );

    const response = await axios.post(tweetUrl, body, {
      headers: {
        'Authorization': oauthHeader,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      platform: 'twitter',
      postId: response.data.data?.id,
    };
  } catch (error: any) {
    console.error('[Twitter Post Error]', error.response?.data || error.message);
    return {
      success: false,
      platform: 'twitter',
      error: error.response?.data?.detail || error.response?.data?.title || error.message,
    };
  }
}

/**
 * Generate OAuth 1.0a Authorization header for Twitter API v2
 * Uses built-in Node.js crypto — no external oauth library needed
 */
function generateOAuth1Header(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string
): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto');

  const oauthTimestamp = Math.floor(Date.now() / 1000).toString();
  const oauthNonce = crypto.randomBytes(16).toString('hex');

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: oauthNonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: oauthTimestamp,
    oauth_token: accessToken,
    oauth_version: '1.0',
  };

  // Build parameter string (sorted alphabetically)
  const paramString = Object.keys(oauthParams)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
    .join('&');

  // Build signature base string
  const signatureBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(paramString),
  ].join('&');

  // Build signing key
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(accessTokenSecret)}`;

  // Generate HMAC-SHA1 signature
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBase)
    .digest('base64');

  // Build Authorization header
  const authHeader =
    'OAuth ' +
    Object.keys(oauthParams)
      .sort()
      .map((key) => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ') +
    `, oauth_signature="${encodeURIComponent(signature)}"`;

  return authHeader;
}

/**
 * Post to multiple platforms
 */
export async function postToMultiplePlatforms(
  platforms: Array<{
    platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter';
    accessToken: string;
    accountId: string;
    authorUrn?: string; // For LinkedIn
    accessTokenSecret?: string; // For Twitter OAuth 1.0a
    apiKey?: string; // For Twitter OAuth 1.0a consumer key
    apiSecret?: string; // For Twitter OAuth 1.0a consumer secret
  }>,
  content: PostContent
): Promise<PostResult[]> {
  const results: PostResult[] = [];

  for (const platform of platforms) {
    let result: PostResult;

    switch (platform.platform) {
      case 'facebook':
        result = await postToFacebook(platform.accessToken, platform.accountId, content);
        break;
      case 'instagram':
        result = await postToInstagram(platform.accessToken, platform.accountId, content);
        break;
      case 'linkedin':
        result = await postToLinkedIn(
          platform.accessToken,
          platform.authorUrn || platform.accountId,
          content
        );
        break;
      case 'twitter':
        if (!platform.accessTokenSecret || !platform.apiKey || !platform.apiSecret) {
          result = {
            success: false,
            platform: 'twitter',
            error: 'Twitter requires API key, API secret, access token, and access token secret',
          };
        } else {
          result = await postToTwitter(
            platform.accessToken,
            platform.accessTokenSecret,
            platform.apiKey,
            platform.apiSecret,
            content
          );
        }
        break;
      default:
        result = {
          success: false,
          platform: platform.platform,
          error: 'Unsupported platform',
        };
    }

    results.push(result);
  }

  return results;
}
