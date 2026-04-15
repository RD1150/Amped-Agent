import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Check, Phone, Clapperboard, Mic, Users, Building2, Star, Zap } from "lucide-react";
import { toast } from "sonner";
import { TRIAL_DAYS } from "@shared/pricingConstants";
import { useLocation } from "wouter";

const TIERS = [
  {
    id: "starter" as const,
    displayName: "Agent",
    tagline: "Start showing up consistently",
    monthlyPrice: 79,
    yearlyMonthly: 63,
    saving: 192,
    icon: Zap,
    features: [
      "Property Tour videos (Ken Burns style)",
      "Short-form reels for Instagram & TikTok",
      "Daily AI-written posts — market updates, tips, listings",
      "Listing Presentation builder",
      "Lead Magnet generator",
      "Market Insights with live stats",
      "Blog Builder with city rotation",
      "Content calendar & post scheduling",
      "3 social media connections",
      "Email support (48hr)",
    ],
    videos: { kenBurns: true, reels: true, avatarVideos: "Not included", cinematic: false, liveTour: false, voiceClone: false },
    popular: false,
    contactSales: false,
  },
  {
    id: "pro" as const,
    displayName: "Top Producer",
    tagline: "Dominate your market with video",
    monthlyPrice: 149,
    yearlyMonthly: 119,
    saving: 360,
    icon: Star,
    features: [
      "Everything in Agent, plus:",
      "10 videos with your face per month — no camera needed",
      "Cinematic property tours with AI motion",
      "Listing Launch Kit — one address, full marketing package",
      "Email drip sequences — automated follow-up",
      "CRM pipeline — track leads from open house to close",
      "Open house QR sign-in with auto follow-up",
      "Testimonial engine — turn closings into social proof",
      "Performance Coach — weekly AI strategy briefing",
      "3 hook options per reel",
      "Auto-generated captions with CTA",
      "Unlimited social media connections",
      "Priority support (24hr)",
    ],
    videos: { kenBurns: true, reels: true, avatarVideos: "10 / month", cinematic: true, liveTour: false, voiceClone: false },
    popular: true,
    contactSales: false,
  },
  {
    id: "authority" as const,
    displayName: "Market Leader",
    tagline: "Own your city — the complete suite",
    monthlyPrice: 249,
    yearlyMonthly: 199,
    saving: 600,
    icon: Clapperboard,
    features: [
      "Everything in Top Producer, plus:",
      "20 videos with your face per month",
      "Record a walkthrough — we edit it automatically",
      "Your voice, cloned — narrate any video without recording",
      "3 different looks for your digital twin",
      "Custom branding overlays on all content",
      "Advanced analytics & reporting",
      "Priority rendering",
      "Phone support (4hr response)",
    ],
    videos: { kenBurns: true, reels: true, avatarVideos: "20 / month", cinematic: true, liveTour: true, voiceClone: true },
    popular: false,
    contactSales: false,
  },
  {
    id: "team" as const,
    displayName: "Team",
    tagline: "One platform for your entire team",
    monthlyPrice: 399,
    yearlyMonthly: 319,
    saving: 960,
    icon: Users,
    features: [
      "Everything in Market Leader, plus:",
      "Up to 5 agent seats — each with their own login",
      "Shared content library — team templates, one brand",
      "Team admin dashboard — see all agent activity",
      "Unlimited videos with your face across the team",
      "Bulk listing launch — multiple listings at once",
      "Same-day priority support",
      "Team onboarding call included",
    ],
    videos: { kenBurns: true, reels: true, avatarVideos: "Unlimited", cinematic: true, liveTour: true, voiceClone: true },
    popular: false,
    contactSales: false,
  },
  {
    id: "brokerage" as const,
    displayName: "Brokerage",
    tagline: "Custom platform for 10+ agents",
    monthlyPrice: 0,
    yearlyMonthly: 0,
    saving: 0,
    icon: Building2,
    features: [
      "Everything in Team, plus:",
      "Unlimited agent seats",
      "Brokerage-wide branding — every agent, one brand",
      "White-label option — your name, not ours",
      "Broker admin view — all agent activity in one dashboard",
      "Bulk listing launch across all agents",
      "API access for MLS & CRM integration",
      "Dedicated account manager",
      "Custom onboarding for all agents",
      "Custom pricing based on team size",
    ],
    videos: { kenBurns: true, reels: true, avatarVideos: "Unlimited", cinematic: true, liveTour: true, voiceClone: true },
    popular: false,
    contactSales: true,
  },
] as const;

type TierId = typeof TIERS[number]["id"];

export default function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [, navigate] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();

  const createCheckout = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) window.open(data.url, "_blank");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
    },
  });

  const handleSubscribe = (tierId: TierId) => {
    if (tierId === "brokerage") { navigate("/contact"); return; }
    if (!user) { toast.error("Please sign in to subscribe"); return; }
    createCheckout.mutate({
      tier: tierId as any,
      billingPeriod: billing === "monthly" ? "monthly" : "annual",
      successUrl: `${window.location.origin}/dashboard`,
      cancelUrl: `${window.location.origin}/pricing`,
    });
  };

  const videoRows = [
    { label: "Property Tour videos", key: "kenBurns" as const, type: "bool" },
    { label: "Short-form reels", key: "reels" as const, type: "bool" },
    { label: "Videos with your face", key: "avatarVideos" as const, type: "string" },
    { label: "Cinematic AI tours", key: "cinematic" as const, type: "bool" },
    { label: "Record & auto-edit walkthrough", key: "liveTour" as const, type: "bool" },
    { label: "Voice cloning", key: "voiceClone" as const, type: "bool" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="pt-16 pb-10 text-center px-4">
        <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-600 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <span>🎉</span>
          <span>{TRIAL_DAYS}-day free trial — no credit card required</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          The marketing platform built for real estate agents
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
          Stop paying a marketing assistant $3,000/month. AmpedAgent does it all — posts, videos, emails, lead follow-up — every day, every channel.
        </p>
        <div className="inline-flex items-center bg-gray-100 rounded-full p-1 gap-1">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${billing === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${billing === "yearly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Annual
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            const price = billing === "yearly" ? tier.yearlyMonthly : tier.monthlyPrice;
            return (
              <div
                key={tier.id}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 ${tier.popular ? "border-orange-400 shadow-xl ring-2 ring-orange-400" : "border-gray-200 shadow-sm hover:shadow-md transition-shadow"}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow">MOST POPULAR</span>
                  </div>
                )}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-orange-500" />
                    </div>
                    <span className="font-bold text-gray-900">{tier.displayName}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{tier.tagline}</p>
                </div>

                <div className="mb-5">
                  {tier.contactSales ? (
                    <div>
                      <div className="text-3xl font-bold text-gray-900">Custom</div>
                      <div className="text-sm text-gray-500 mt-1">Starts ~$999/mo</div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-end gap-1">
                        <span className="text-3xl font-bold text-gray-900">${price}</span>
                        <span className="text-gray-500 text-sm mb-1">/mo</span>
                      </div>
                      {billing === "yearly" && tier.saving > 0 && (
                        <div className="text-xs text-green-600 font-medium mt-1">Save ${tier.saving}/year</div>
                      )}
                      {billing === "monthly" && tier.yearlyMonthly > 0 && (
                        <div className="text-xs text-gray-400 mt-1">or ${tier.yearlyMonthly}/mo billed annually</div>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={createCheckout.isPending}
                  className={`w-full mb-5 ${tier.popular ? "bg-orange-500 hover:bg-orange-600 text-white" : tier.contactSales ? "bg-gray-900 hover:bg-gray-800 text-white" : "bg-white border border-gray-300 text-gray-900 hover:bg-gray-50"}`}
                  variant={tier.popular ? "default" : "outline"}
                >
                  {tier.contactSales ? "Contact Sales" : `Start ${TRIAL_DAYS}-Day Trial`}
                </Button>

                <ul className="space-y-2.5 flex-1">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      {feature.startsWith("Everything in") ? (
                        <span className="text-xs font-semibold text-orange-500 uppercase tracking-wide mt-0.5">{feature}</span>
                      ) : (
                        <>
                          <Check className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Video comparison table */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Video features by plan</h2>
          <p className="text-gray-500 text-center mb-8">Every plan includes Ken Burns property tours and social reels. Upgrade for your face, your voice, and cinematic quality.</p>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-4 font-semibold text-gray-700 w-52">Video Feature</th>
                  {TIERS.map((t) => (
                    <th key={t.id} className={`px-4 py-4 text-center font-semibold ${t.popular ? "text-orange-600" : "text-gray-700"}`}>{t.displayName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {videoRows.map((row, i) => (
                  <tr key={row.key} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-5 py-3.5 text-gray-700 font-medium">{row.label}</td>
                    {TIERS.map((t) => {
                      const val = t.videos[row.key];
                      return (
                        <td key={t.id} className="px-4 py-3.5 text-center">
                          {row.type === "bool" ? (
                            val ? <Check className="w-5 h-5 text-orange-500 mx-auto" /> : <span className="text-gray-300 text-lg">—</span>
                          ) : (
                            <span className={`text-sm font-medium ${val === "Not included" ? "text-gray-300" : "text-gray-800"}`}>{val as string}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {[
            { title: "No credit card for trial", body: `Start your ${TRIAL_DAYS}-day free trial today. Cancel anytime before it ends — no charge.` },
            { title: "Replaces a $3,000/month assistant", body: "Posts, videos, emails, lead follow-up — all done by AI. Every day, every channel." },
            { title: "Cancel anytime", body: "No contracts, no lock-in. If it's not working for you, cancel in one click." },
          ].map((item) => (
            <div key={item.title} className="bg-orange-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.body}</p>
            </div>
          ))}
        </div>

        {/* Brokerage CTA */}
        <div className="mt-12 bg-gray-900 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-orange-400" />
              <span className="text-orange-400 font-semibold text-sm uppercase tracking-wide">Brokerages</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Running a team of 10+ agents?</h3>
            <p className="text-gray-400 max-w-lg">We build a custom platform for your brokerage — every agent under one brand, one admin dashboard, white-label option available. Pricing starts at $999/month.</p>
          </div>
          <Button onClick={() => navigate("/contact")} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold whitespace-nowrap">
            <Phone className="w-4 h-4 mr-2" />
            Talk to Sales
          </Button>
        </div>
      </div>
    </div>
  );
}
