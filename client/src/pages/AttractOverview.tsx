import { SectionOverview } from "./SectionOverview";
import {
  Building2,
  Smartphone,
  Video,
  UserCircle,
  BookOpen,
  Images,
  Gift,
} from "lucide-react";

export default function AttractOverview() {
  return (
    <SectionOverview
      section={{
        title: "ATTRACT",
        subtitle: "Build your audience & get found",
        tagline:
          "Every tool in this section is designed to get you in front of buyers and sellers before your competition does — with video, content, and lead generation that works while you sleep.",
        color: "blue",
        tools: [
          {
            icon: Building2,
            label: "Property Tour",
            path: "/property-tours",
            description: "Cinematic listing videos that stop the scroll",
            highlight: true,
          },
          {
            icon: Smartphone,
            label: "Live Tour",
            path: "/live-tour",
            description: "Record a guided room-by-room walkthrough from your phone",
            badge: "Authority",
          },
          {
            icon: Video,
            label: "AI Reels",
            path: "/autoreels",
            description: "Short-form vertical video for Instagram, TikTok & Reels",
          },
          {
            icon: UserCircle,
            label: "Avatar Video",
            path: "/full-avatar-video",
            description: "Full talking-head video to introduce yourself to prospects",
            badge: "Authority",
          },
          {
            icon: BookOpen,
            label: "Blog Builder",
            path: "/blog-builder",
            description: "Hyperlocal SEO blog posts that rank and drive organic traffic",
          },
          {
            icon: Images,
            label: "Photo Library",
            path: "/image-library",
            description: "Upload and manage property photos with AI hooks",
          },
          {
            icon: Gift,
            label: "Lead Magnet",
            path: "/lead-magnet",
            description: "Branded PDF lead magnets for Facebook Lead Ads",
            badge: "Authority",
          },
        ],
      }}
    />
  );
}
