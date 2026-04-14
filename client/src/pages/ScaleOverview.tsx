import { SectionOverview } from "./SectionOverview";
import {
  Youtube,
  Clapperboard,
  Shuffle,
  Upload,
  Link2,
} from "lucide-react";

export default function ScaleOverview() {
  return (
    <SectionOverview
      section={{
        title: "SCALE",
        subtitle: "Multiply your output without the work",
        tagline:
          "Create once, distribute everywhere. These tools let you produce more content in less time — so you can grow your brand without growing your workload.",
        color: "purple",
        tools: [
          {
            icon: Youtube,
            label: "YouTube Builder",
            path: "/youtube-video-builder",
            description: "Long-form avatar videos for YouTube — up to 15 min",
            highlight: true,
          },
          {
            icon: Clapperboard,
            label: "Script Builder",
            path: "/video-script-builder",
            description: "Write two-column scripts with visual direction",
          },
          {
            icon: Youtube,
            label: "YouTube Thumbnails",
            path: "/thumbnails",
            description: "Generate click-worthy thumbnails for every video",
          },
          {
            icon: Shuffle,
            label: "Repurpose Engine",
            path: "/repurpose",
            description: "Write once, publish everywhere — 5 formats from 1 idea",
            badge: "Authority",
          },
          {
            icon: Upload,
            label: "Bulk Import",
            path: "/bulk-import",
            description: "Import content ideas from CSV in bulk",
          },
          {
            icon: Link2,
            label: "Integrations",
            path: "/integrations",
            description: "Connect Facebook, Instagram, LinkedIn, GBP",
          },
        ],
      }}
    />
  );
}
