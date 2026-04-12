import { useParams } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, MapPin, DollarSign, Home, ExternalLink } from "lucide-react";

export default function PublicPresentation() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);

  const { data: pres, isLoading, error } = trpc.listingPresentation.getPublic.useQuery(
    { id },
    { enabled: id > 0, retry: false }
  );

  // Inject SEO meta tags dynamically when presentation data loads
  useEffect(() => {
    if (!pres) return;
    const address = pres.propertyAddress || "Property Presentation";
    const agent = pres.agentName || "Your Agent";
    const price = pres.listingPrice ? ` · Listed at $${pres.listingPrice}` : "";
    const title = `${address}${price} — Presented by ${agent}`;
    const description = `View the listing presentation for ${address}. Presented by ${agent}. Schedule a call to learn more.`;
    const ogImage = pres.agentHeadshotUrl || "";

    // Update document title
    document.title = title;

    // Helper to set or create a meta tag
    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', "name", "description");
    (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.setAttribute("content", description);

    setMeta('meta[property="og:title"]', "property", "og:title");
    (document.querySelector('meta[property="og:title"]') as HTMLMetaElement)?.setAttribute("content", title);

    setMeta('meta[property="og:description"]', "property", "og:description");
    (document.querySelector('meta[property="og:description"]') as HTMLMetaElement)?.setAttribute("content", description);

    setMeta('meta[property="og:type"]', "property", "og:type");
    (document.querySelector('meta[property="og:type"]') as HTMLMetaElement)?.setAttribute("content", "website");

    if (ogImage) {
      setMeta('meta[property="og:image"]', "property", "og:image");
      (document.querySelector('meta[property="og:image"]') as HTMLMetaElement)?.setAttribute("content", ogImage);
    }

    setMeta('meta[name="twitter:card"]', "name", "twitter:card");
    (document.querySelector('meta[name="twitter:card"]') as HTMLMetaElement)?.setAttribute("content", "summary_large_image");

    setMeta('meta[name="twitter:title"]', "name", "twitter:title");
    (document.querySelector('meta[name="twitter:title"]') as HTMLMetaElement)?.setAttribute("content", title);

    setMeta('meta[name="twitter:description"]', "name", "twitter:description");
    (document.querySelector('meta[name="twitter:description"]') as HTMLMetaElement)?.setAttribute("content", description);

    // Restore defaults on unmount
    return () => {
      document.title = "Amp'd Agent";
    };
  }, [pres]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto" />
          <p className="text-gray-500 text-sm">Loading presentation…</p>
        </div>
      </div>
    );
  }

  if (error || !pres) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="text-6xl">🏠</div>
          <h1 className="text-2xl font-bold text-gray-900">Presentation Not Found</h1>
          <p className="text-gray-500">
            This presentation may have been removed or the link may be incorrect. Please contact your agent for a new link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* Property info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-amber-500/10 rounded-lg p-2 shrink-0">
              <Home className="h-5 w-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              {pres.propertyAddress && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600 truncate">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{pres.propertyAddress}</span>
                </div>
              )}
              {pres.listingPrice && (
                <div className="flex items-center gap-1 text-base font-semibold text-gray-900">
                  <DollarSign className="h-4 w-4" />
                  {pres.listingPrice}
                </div>
              )}
            </div>
          </div>

          {/* Agent info + CTA */}
          <div className="flex items-center gap-3 shrink-0">
            {pres.agentHeadshotUrl && (
              <img
                src={pres.agentHeadshotUrl}
                alt={pres.agentName ?? "Agent"}
                className="h-9 w-9 rounded-full object-cover border border-gray-200"
              />
            )}
            <div className="hidden sm:block">
              {pres.agentName && (
                <p className="text-sm font-semibold text-gray-900">{pres.agentName}</p>
              )}
              {pres.agentBio && (
                <p className="text-xs text-gray-500 max-w-[200px] truncate">{pres.agentBio}</p>
              )}
            </div>
            {pres.bookingUrl && (
              <Button
                asChild
                size="sm"
                className="bg-amber-500 hover:bg-amber-400 text-black font-semibold gap-1.5"
              >
                <a href={pres.bookingUrl} target="_blank" rel="noopener noreferrer">
                  <Calendar className="h-4 w-4" />
                  Schedule a Call
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Gamma presentation iframe */}
      {pres.gammaUrl ? (
        <div className="w-full" style={{ height: "calc(100vh - 61px)" }}>
          <iframe
            src={pres.gammaUrl}
            title={pres.title}
            className="w-full h-full border-0"
            allow="fullscreen"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center" style={{ height: "calc(100vh - 61px)" }}>
          <div className="text-center space-y-4 max-w-md px-6">
            <div className="text-6xl">📄</div>
            <h2 className="text-xl font-bold text-gray-900">Presentation Unavailable</h2>
            <p className="text-gray-500">
              The presentation content is not available yet. Please check back later or contact your agent.
            </p>
            {pres.bookingUrl && (
              <Button asChild className="bg-amber-500 hover:bg-amber-400 text-black font-semibold gap-2">
                <a href={pres.bookingUrl} target="_blank" rel="noopener noreferrer">
                  <Calendar className="h-4 w-4" />
                  Schedule a Call with {pres.agentName || "Your Agent"}
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-100 px-4 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Powered by <span className="font-semibold text-amber-600">AmpedAgent</span>
          </p>
          {pres.bookingUrl && (
            <a
              href={pres.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-600 hover:underline flex items-center gap-1"
            >
              <Calendar className="h-3 w-3" />
              Schedule a Call
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
