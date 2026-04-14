/**
 * Public Open House Sign-In Page
 * Accessible at /oh/:slug — no login required.
 * Visitors scan the QR code at the open house and fill this out on their phone.
 *
 * Includes TCPA-compliant SMS consent checkbox per A2P 10DLC requirements.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  CheckCircle2,
  Loader2,
  MapPin,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  DollarSign,
} from "lucide-react";

export default function PublicOpenHouseSignIn() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    timeframe: "",
    preApproved: false,
    smsConsent: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const { data: ohInfo, isLoading: loadingInfo, error: infoError } = trpc.openHouse.getPublicInfo.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  const captureMutation = trpc.openHouse.capturePublicLead.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => {
      toast.error("Something went wrong", { description: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!form.email && !form.phone) {
      toast.error("Please enter an email or phone number so we can follow up");
      return;
    }
    captureMutation.mutate({
      slug: slug || "",
      name: form.name.trim(),
      email: form.email || undefined,
      phone: form.phone || undefined,
      timeframe: form.timeframe || undefined,
      preApproved: form.preApproved,
      smsConsent: form.smsConsent,
    });
  };

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center max-w-sm">
          <Home className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="font-semibold mb-1">Invalid Link</h2>
          <p className="text-sm text-muted-foreground">This open house link is not valid.</p>
        </Card>
      </div>
    );
  }

  if (loadingInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (infoError || !ohInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="p-8 text-center max-w-sm w-full">
          <Home className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="font-semibold mb-1">Open House Not Found</h2>
          <p className="text-sm text-muted-foreground">
            This open house may have ended or the link is incorrect.
          </p>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
        <Card className="p-8 text-center max-w-sm w-full shadow-lg">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">You're signed in!</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Thanks for visiting <strong>{ohInfo.address}</strong>. {ohInfo.agentName} will be in touch soon.
          </p>
          {form.smsConsent && form.phone && (
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 text-left">
              <p className="font-medium mb-1">SMS Follow-Up Confirmed</p>
              <p>You'll receive a few texts from {ohInfo.agentName}. Reply STOP at any time to unsubscribe.</p>
            </div>
          )}
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Powered by <span className="font-semibold text-orange-600">AmpedAgent</span>
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4 flex flex-col items-center justify-start pt-8">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-3">
            <Home className="w-4 h-4" />
            Open House Sign-In
          </div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{ohInfo.address}</h1>
          {ohInfo.agentName && (
            <p className="text-sm text-muted-foreground mt-1">Hosted by {ohInfo.agentName}</p>
          )}
        </div>

        {/* Property Details */}
        {(ohInfo.listingPrice || ohInfo.bedrooms || ohInfo.bathrooms) && (
          <Card className="p-3">
            <div className="flex items-center gap-4 text-sm flex-wrap">
              {ohInfo.listingPrice && (
                <span className="flex items-center gap-1 font-semibold text-green-700">
                  <DollarSign className="w-3.5 h-3.5" />
                  {ohInfo.listingPrice}
                </span>
              )}
              {ohInfo.bedrooms && (
                <span className="text-muted-foreground">{ohInfo.bedrooms} bed</span>
              )}
              {ohInfo.bathrooms && (
                <span className="text-muted-foreground">{ohInfo.bathrooms} bath</span>
              )}
            </div>
          </Card>
        )}

        {/* Sign-In Form */}
        <Card className="p-5 shadow-md">
          <h2 className="font-semibold text-base mb-4">Sign in to get updates on this home</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm">Full Name *</Label>
              <Input
                id="name"
                placeholder="Jane Smith"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@email.com"
                  className="pl-9"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 555-5555"
                  className="pl-9"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Timeframe */}
            <div className="space-y-1.5">
              <Label htmlFor="timeframe" className="text-sm flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                When are you looking to buy?
              </Label>
              <select
                id="timeframe"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.timeframe}
                onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
              >
                <option value="">Select a timeframe...</option>
                <option value="asap">As soon as possible</option>
                <option value="1-3 months">1–3 months</option>
                <option value="3-6 months">3–6 months</option>
                <option value="6-12 months">6–12 months</option>
                <option value="just looking">Just looking</option>
              </select>
            </div>

            {/* Pre-Approved */}
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-input hover:bg-muted/30 transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-orange-500"
                checked={form.preApproved}
                onChange={(e) => setForm({ ...form, preApproved: e.target.checked })}
              />
              <div>
                <p className="text-sm font-medium">I'm pre-approved for financing</p>
                <p className="text-xs text-muted-foreground">Helps your agent prioritize your search</p>
              </div>
            </label>

            {/* SMS Consent — TCPA Compliant */}
            {form.phone && (
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded accent-blue-600 mt-0.5 shrink-0"
                    checked={form.smsConsent}
                    onChange={(e) => setForm({ ...form, smsConsent: e.target.checked })}
                  />
                  <div>
                    <p className="text-sm font-medium text-blue-900 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Text me updates about this home
                    </p>
                    <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                      By checking this box, I consent to receive up to 3 automated text messages from {ohInfo.agentName || "this agent"} about this property and similar listings. Message and data rates may apply. Reply <strong>STOP</strong> to unsubscribe at any time. Reply <strong>HELP</strong> for help. This consent is not a condition of purchase.
                    </p>
                  </div>
                </label>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              disabled={captureMutation.isPending}
            >
              {captureMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-6">
          Your information is shared only with the listing agent.
          <br />
          Powered by <span className="font-semibold text-orange-600">AmpedAgent</span>
        </p>
      </div>
    </div>
  );
}
