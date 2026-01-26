export type SocialPlatform = "instagram_feed" | "instagram_story" | "facebook" | "linkedin" | "twitter" | "multi";

export interface PlatformSize {
  width: number;
  height: number;
  aspectRatio: string;
  label: string;
}

export const PLATFORM_SIZES: Record<SocialPlatform, PlatformSize> = {
  instagram_feed: {
    width: 1080,
    height: 1080,
    aspectRatio: "1:1",
    label: "Instagram Feed (Square)"
  },
  instagram_story: {
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    label: "Instagram Stories (Vertical)"
  },
  facebook: {
    width: 1200,
    height: 630,
    aspectRatio: "1.91:1",
    label: "Facebook Post"
  },
  linkedin: {
    width: 1200,
    height: 627,
    aspectRatio: "1.91:1",
    label: "LinkedIn Post"
  },
  twitter: {
    width: 1200,
    height: 675,
    aspectRatio: "16:9",
    label: "X/Twitter Post"
  },
  multi: {
    width: 1080,
    height: 1080,
    aspectRatio: "1:1",
    label: "Multi-Platform (Square - works everywhere)"
  }
};

export function getPlatformSize(platform: SocialPlatform): PlatformSize {
  return PLATFORM_SIZES[platform];
}

export function getAllPlatforms(): SocialPlatform[] {
  return Object.keys(PLATFORM_SIZES) as SocialPlatform[];
}
