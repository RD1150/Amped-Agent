import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, RefreshCw, ArrowRight, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketIntelligenceStrip() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, isLoading, error, refetch } = trpc.coach.marketIntelligence.useQuery(
    undefined,
    { staleTime: 1000 * 60 * 30 } // cache for 30 minutes
  );

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 flex items-center gap-3 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center shrink-0">
          <TrendingUp className="h-4 w-4 text-orange-400" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading today's market insight...
        </div>
      </div>
    );
  }

  if (error || !data) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header strip */}
      <div className="bg-[#0f172a] px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-orange-400">
            Today's Market Insight
          </span>
        </div>
        <button
          onClick={() => { setRefreshKey(k => k + 1); refetch(); }}
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {/* Body */}
      <div className="divide-y md:divide-y-0 md:divide-x divide-slate-300 grid md:grid-cols-3">
        {/* Snapshot */}
        <div className="px-7 py-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Snapshot</p>
          <p className="text-base font-semibold text-slate-800 leading-relaxed">{data.snapshot}</p>
        </div>

        {/* What it means */}
        <div className="px-7 py-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">What It Means</p>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{data.whatItMeans}</p>
        </div>

        {/* What to say */}
        <div className="px-7 py-6 bg-slate-50">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">What to Say</p>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed italic">"{data.whatToSay}"</p>
        </div>
      </div>
    </div>
  );
}
