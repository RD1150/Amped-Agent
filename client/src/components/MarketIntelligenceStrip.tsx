import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, RefreshCw, ChevronDown, ChevronUp, MessageSquare, AlertCircle } from "lucide-react";

export default function MarketIntelligenceStrip() {
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading, error, refetch } = trpc.coach.marketIntelligence.useQuery(
    undefined,
    { staleTime: 1000 * 60 * 30 } // cache for 30 minutes
  );

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 flex items-center gap-3 shadow-sm">
        <div className="w-7 h-7 rounded-full bg-[#0f172a] flex items-center justify-center shrink-0">
          <TrendingUp className="h-3.5 w-3.5 text-orange-400" />
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
      {/* Collapsed header — always visible, click to expand */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-full bg-[#0f172a] flex items-center justify-center shrink-0">
            <TrendingUp className="h-3.5 w-3.5 text-orange-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-0.5">
              Today's Market Insight
            </p>
            <p className="text-sm font-semibold text-slate-800 leading-snug truncate">
              {data.snapshot}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <button
            onClick={(e) => { e.stopPropagation(); refetch(); }}
            className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-slate-400" />
            : <ChevronDown className="h-4 w-4 text-slate-400" />
          }
        </div>
      </button>

      {/* Expanded detail — only shown when toggled */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 grid md:grid-cols-2 gap-4 bg-slate-50/50">
          {/* What it means */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <AlertCircle className="h-3 w-3 text-orange-500" />
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">What It Means</p>
            </div>
            <p className="text-sm text-slate-600 leading-snug">{data.meaning}</p>
          </div>
          {/* What to say */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquare className="h-3 w-3 text-emerald-600" />
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">What to Say</p>
            </div>
            <p className="text-sm text-slate-600 leading-snug italic">"{data.whatToSay}"</p>
          </div>
        </div>
      )}
    </div>
  );
}
