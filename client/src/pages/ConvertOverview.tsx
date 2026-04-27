import { SectionOverview } from "./SectionOverview";
import {
  Presentation,
  UserCheck,
  BookOpen,
  FolderOpen,
  Mail,
  LayoutGrid,
  Rocket,
  MessageSquareQuote,
  QrCode,
  Users,
} from "lucide-react";

export default function ConvertOverview() {
  return (
    <SectionOverview
      section={{
        title: "CONVERT",
        subtitle: "Win listings and close buyers",
        tagline:
          "Walk into every appointment with a polished presentation, branded guides, and proven prospecting letters that make you look like the obvious choice. Then capture every lead and keep them moving toward the close.",
        color: "orange",
        tools: [
          {
            icon: Presentation,
            label: "Listing Presentation",
            path: "/listing-presentation",
            description: "AI-generated listing appointment deck with CMA",
            highlight: true,
          },
          {
            icon: UserCheck,
            label: "Buyer Presentation",
            path: "/buyer-presentation",
            description: "Branded buyer consultation deck for first meetings",
          },
          {
            icon: BookOpen,
            label: "Guide Generator",
            path: "/guide-generator",
            description: "Branded Seller's Manual & Buyer's Guide — print-ready PDFs",
          },
          {
            icon: FolderOpen,
            label: "My Documents",
            path: "/my-documents",
            description: "Re-download your generated guides anytime",
          },
          {
            icon: Mail,
            label: "Prospecting Letters",
            path: "/prospecting-letters",
            description: "AI-crafted letters for FSBO, expired, pre-foreclosure, divorce, and more",
          },
          {
            icon: LayoutGrid,
            label: "Assets Hub",
            path: "/assets",
            description: "All your presentations and shareable assets in one place",
          },
          {
            icon: Rocket,
            label: "Listing Launch Kit",
            path: "/listing-launch-kit",
            description: "One address → 5 social posts, email blast, and more in seconds",
            badge: "New",
          },
          {
            icon: MessageSquareQuote,
            label: "Testimonial Engine",
            path: "/testimonials",
            description: "Request reviews and turn them into branded social posts automatically",
            badge: "New",
          },
          {
            icon: QrCode,
            label: "Open House Manager",
            path: "/open-house",
            description: "QR sign-in + automated follow-up emails for every visitor",
            badge: "New",
          },
          {
            icon: Users,
            label: "CRM Pipeline",
            path: "/crm",
            description: "5-stage lead pipeline from first contact to closed deal",
            badge: "New",
          },
        ],
      }}
    />
  );
}
