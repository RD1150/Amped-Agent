import { SectionOverview } from "./SectionOverview";
import {
  Sparkles,
  TrendingUp,
  Newspaper,
  Lightbulb,
  Mail,
  Calendar,
  FileText,
  Mic,
  GitBranch,
} from "lucide-react";

export default function EngageOverview() {
  return (
    <SectionOverview
      section={{
        title: "ENGAGE",
        subtitle: "Stay top of mind with your market",
        tagline:
          "Consistent, valuable content keeps you in front of your database so that when they're ready to buy or sell, you're the first person they call.",
        color: "green",
        tools: [
          {
            icon: Sparkles,
            label: "Post Builder",
            path: "/generate",
            description: "AI social posts that position you as the local expert",
            highlight: true,
          },
          {
            icon: TrendingUp,
            label: "Market Insights",
            path: "/market-stats",
            description: "Hyperlocal market data and neighborhood trend reports",
          },
          {
            icon: Newspaper,
            label: "Trending News",
            path: "/trending-news",
            description: "Turn real estate news into engaging social posts",
          },
          {
            icon: Lightbulb,
            label: "Expert Hooks",
            path: "/hooks",
            description: "Proven hook formulas to stop the scroll",
          },
          {
            icon: Mail,
            label: "Newsletter",
            path: "/newsletter",
            description: "Email newsletters that nurture your database",
            badge: "Authority",
          },
          {
            icon: Calendar,
            label: "Content Calendar",
            path: "/calendar",
            description: "Schedule and publish all your content",
          },
          {
            icon: FileText,
            label: "Letters & Emails",
            path: "/letters-emails",
            description: "60+ pre-written drip series, holiday & prospecting templates",
            badge: "Authority",
          },
          {
            icon: Mic,
            label: "Podcast & Book Builder",
            path: "/podcast-builder",
            description: "AI-narrated audio episodes and avatar videos from your expertise",
            badge: "New",
          },
          {
            icon: GitBranch,
            label: "Email Drip Sequences",
            path: "/drip-sequences",
            description: "Automated multi-step email sequences that nurture leads while you sleep",
            badge: "New",
          },
        ],
      }}
    />
  );
}
