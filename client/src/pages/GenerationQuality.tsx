import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, MessageSquare, BarChart3 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";

const TOOL_LABELS: Record<string, string> = {
  full_avatar_video: "Avatar Video",
  ai_reels: "AI Reels",
  property_tour: "Property Tour",
  post_builder: "Post Builder",
  blog_builder: "Blog Builder",
  youtube_builder: "YouTube Builder",
  newsletter: "Newsletter",
  lead_magnet: "Lead Magnet",
  market_insights: "Market Insights",
  expert_hooks: "Expert Hooks",
  listing_presentation: "Listing Presentation",
  other: "Other",
};

function StarDisplay({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

function RatingBar({ count, total }: { count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function GenerationQuality() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.generationFeedback.ownerStats.useQuery(
    undefined,
    { enabled: user?.role === "admin" }
  );
  const { data: recent, isLoading: recentLoading } = trpc.generationFeedback.ownerRecent.useQuery(
    { limit: 50 },
    { enabled: user?.role === "admin" }
  );

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Admin access required.</p>
        <Link href="/" className="text-primary underline">Go home</Link>
      </div>
    );
  }

  const totalRatings = stats?.reduce((sum, s) => sum + Number(s.totalRatings), 0) ?? 0;
  const overallAvg =
    stats && stats.length > 0
      ? stats.reduce((sum, s) => sum + Number(s.avgRating) * Number(s.totalRatings), 0) / Math.max(totalRatings, 1)
      : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold">Generation Quality Dashboard</h1>
          <p className="text-sm text-muted-foreground">Internal ratings from agents — not visible to users</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Overall Avg Rating</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold">{overallAvg > 0 ? overallAvg.toFixed(1) : "—"}</span>
            {overallAvg > 0 && <StarDisplay rating={overallAvg} />}
          </div>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Ratings</p>
          <span className="text-3xl font-bold">{totalRatings}</span>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Tools Rated</p>
          <span className="text-3xl font-bold">{stats?.length ?? 0}</span>
        </Card>
      </div>

      {/* Per-tool breakdown */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          By Tool
        </h2>
        {statsLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : !stats || stats.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm">
            No ratings yet — they'll appear here after agents rate their first generation.
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.map((s) => {
              const avg = Number(s.avgRating);
              const total = Number(s.totalRatings);
              const ones = Number(s.oneStars);
              const twos = Number(s.twoStars);
              const threes = Number(s.threeStars);
              const fours = Number(s.fourStars);
              const fives = Number(s.fiveStars);
              return (
                <Card key={s.toolType} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{TOOL_LABELS[s.toolType] ?? s.toolType}</span>
                    <Badge variant="secondary">{total} rating{total !== 1 ? "s" : ""}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">{avg.toFixed(1)}</span>
                    <StarDisplay rating={avg} />
                  </div>
                  <div className="space-y-1">
                    {[
                      { label: "5★", count: fives },
                      { label: "4★", count: fours },
                      { label: "3★", count: threes },
                      { label: "2★", count: twos },
                      { label: "1★", count: ones },
                    ].map(({ label, count }) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5">{label}</span>
                        <RatingBar count={count} total={total} />
                        <span className="text-xs text-muted-foreground w-4">{count}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent individual ratings */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Recent Ratings
        </h2>
        {recentLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : !recent || recent.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm">No ratings yet.</Card>
        ) : (
          <div className="space-y-2">
            {recent.map((r) => (
              <Card key={r.id} className="p-3 flex items-start gap-4">
                <div className="flex-shrink-0">
                  <StarDisplay rating={r.rating} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{TOOL_LABELS[r.toolType] ?? r.toolType}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">User #{r.userId}</span>
                  </div>
                  {r.note && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">{r.note}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
