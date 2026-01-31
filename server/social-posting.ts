/**
 * Social Media Posting Module
 * Handles posting to Facebook, LinkedIn, and Instagram via their APIs
 */

import axios from 'axios';

interface PostContent {
  text: string;
  imageUrl?: string;
}

interface PostResult {
  success: boolean;
  platform: string;
  postId?: string;
  error?: string;
}

/**
 * Post to Facebook Page
 */
export async function postToFacebook(
  pageAccessToken: string,
  pageId: string,
  content: PostContent
): Promise<PostResult> {
  try {
    const url = `https://graph.facebook.com/v18.0/${pageId}/photos`;
    
    const params: any = {
      access_token: pageAccessToken,
      caption: content.text,
    };

    if (content.imageUrl) {
      params.url = content.imageUrl;
    }

    const response = await axios.post(url, null, { params });

    return {
      success: true,
      platform: 'facebook',
      postId: response.data.id,
    };
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
 */
export async function postToInstagram(
  pageAccessToken: string,
  instagramBusinessAccountId: string,
  content: PostContent
): Promise<PostResult> {
  try {
    if (!content.imageUrl) {
      return {
        success: false,
        platform: 'instagram',
        error: 'Instagram posts require an image',
      };
    }

    // Step 1: Create media container
    const containerUrl = `https://graph.facebook.com/v18.0/${instagramBusinessAccountId}/media`;
    const containerResponse = await axios.post(containerUrl, null, {
      params: {
        image_url: content.imageUrl,
        caption: content.text,
        access_token: pageAccessToken,
      },
    });

    const creationId = containerResponse.data.id;

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
 */
export async function postToLinkedIn(
  accessToken: string,
  authorUrn: string, // e.g., "urn:li:person:ABC123" or "urn:li:organization:123456"
  content: PostContent
): Promise<PostResult> {
  try {
    const url = 'https://api.linkedin.com/v2/ugcPosts';

    const postData: any = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content.text,
          },
          shareMediaCategory: content.imageUrl ? 'IMAGE' : 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    // Add image if provided
    if (content.imageUrl) {
      // Note: LinkedIn requires images to be uploaded first via their asset upload API
      // For now, we'll skip image support and focus on text posts
      // Full implementation would require multi-step upload process
      postData.specificContent['com.linkedin.ugc.ShareContent'].media = [
        {
          status: 'READY',
          description: {
            text: 'Real estate content',
          },
          media: content.imageUrl,
          title: {
            text: 'Post Image',
          },
        },
      ];
    }

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
 * Post to multiple platforms
 */
export async function postToMultiplePlatforms(
  platforms: Array<{
    platform: 'facebook' | 'instagram' | 'linkedin';
    accessToken: string;
    accountId: string;
    authorUrn?: string; // For LinkedIn
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
