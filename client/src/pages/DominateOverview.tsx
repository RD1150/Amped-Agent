import { SectionOverview } from "./SectionOverview";
import {
  Heart,
  TrendingUp,
  FileVideo2,
  Users,
} from "lucide-react";

export default function DominateOverview() {
  return (
    <SectionOverview
      section={{
        title: "DOMINATE",
        subtitle: "Own your market and build authority",
        tagline:
          "These tools are for agents who want to be the undisputed expert in their market — building a brand so strong that clients seek you out instead of the other way around.",
        color: "red",
        tools: [
          {
            icon: Heart,
            label: "Brand Story",
            path: "/brand-story",
            description: "Craft your authentic agent brand narrative",
            highlight: true,
          },
          {
            icon: TrendingUp,
            label: "Market Dominance",
            path: "/coach",
            description: "AI-generated market authority report for your farm area",
            badge: "Authority",
          },
          {
            icon: FileVideo2,
            label: "My Videos",
            path: "/my-videos",
            description: "Your complete video library",
          },
          {
            icon: Users,
            label: "Referrals",
            path: "/dashboard",
            description: "Invite agents and earn 25 credits each",
          },
        ],
      }}
    />
  );
}
