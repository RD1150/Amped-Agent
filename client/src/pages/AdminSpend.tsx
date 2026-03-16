import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Redirect } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { DollarSign, TrendingUp, Zap, AlertCircle } from "lucide-react";

const SERVICE_COLORS: Record<string, string> = {
  creatomate: "#6366f1",
  elevenlabs: "#f59e0b",
  runway: "#10b981",
  kling: "#3b82f6",
  openai: "#8b5cf6",
  did: "#ef4444",
  shotstack: "#94a3b8",
};

const SERVICE_LABELS: Record<string, string> = {
  creatomate: "Creatomate",
  elevenlabs: "ElevenLabs",
  runway: "Runway",
  kling: "Kling AI",
  openai: "OpenAI / LLM",
  did: "D-ID",
  shotstack: "Shotstack (legacy)",
};

const FEATURE_LABELS: Record<string, string> = {
  property_tour: "Property Tour",
  auto_reel: "AutoReel",
  ai_clip: "AI Clip",
  tts: "Text-to-Speech",
  llm: "LLM Generation",
  cinematic_walkthrough: "Cinematic Walkthrough",
  avatar: "Agent Avatar",
};

function formatCost(val: number): string {
  return `$${Number(val).toFixed(4)}`;
}

function formatCostShort(val: number): string {
  if (val >= 1) return `$${Number(val).toFixed(2)}`;
  return `$${Number(val).toFixed(4)}`;
}

export default function AdminSpend() {
  const { user } = useAuth();
  const [months, setMonths] = useState(3);

  const { data, isLoading } = trpc.admin.getSpendAnalytics.useQuery({ months });

  if (user && user.role !== "admin") {
    return <Redirect to="/" />;
  }

  if (isLoading || !data) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">AI Spend Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-24 bg-muted rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Build pie chart data
  const pieData = data.byService.map((s) => ({
    name: SERVICE_LABELS[s.service] ?? s.service,
    value: Number(s.totalCost),
    service: s.service,
  }));

  // Build monthly bar chart data
  const monthMap: Record<string, Record<string, number>> = {};
  for (const row of data.monthlySpend) {
    if (!monthMap[row.month]) monthMap[row.month] = {};
    monthMap[row.month][row.service] = Number(row.totalCost);
  }
  const monthlyData = Object.entries(monthMap).map(([month, services]) => ({
    month,
    ...services,
  }));

  const allServices = Array.from(new Set(data.monthlySpend.map((r) => r.service)));

  const totalCost = Number(data.totalCost);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">AI Spend Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Estimated costs across all AI services
          </p>
        </div>
        <div className="flex gap-2">
          {[1, 3, 6, 12].map((m) => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                months === m
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {m === 1 ? "1 mo" : `${m} mo`}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              Total Spend ({months}mo)
            </span>
          </div>
          <p className="text-3xl font-bold">{formatCostShort(totalCost)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Estimated based on unit pricing
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              Top Service
            </span>
          </div>
          {data.byService.length > 0 ? (
            <>
              <p className="text-2xl font-bold">
                {SERVICE_LABELS[data.byService[0].service] ?? data.byService[0].service}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCostShort(Number(data.byService[0].totalCost))} •{" "}
                {data.byService[0].callCount} calls
              </p>
            </>
          ) : (
            <p className="text-muted-foreground text-sm mt-2">No data yet</p>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              Avg Monthly Spend
            </span>
          </div>
          <p className="text-3xl font-bold">
            {formatCostShort(totalCost / months)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Over the last {months} month{months > 1 ? "s" : ""}
          </p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Spend by Service — Pie */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Spend by Service</h2>
          {pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No spend data yet</p>
              <p className="text-xs mt-1">
                Data will appear after your first AI generation
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.service}
                      fill={SERVICE_COLORS[entry.service] ?? "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => formatCost(val)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Monthly Spend — Stacked Bar */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Monthly Spend Trend</h2>
          {monthlyData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No spend data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(val: number) => formatCost(val)} />
                <Legend />
                {allServices.map((service) => (
                  <Bar
                    key={service}
                    dataKey={service}
                    name={SERVICE_LABELS[service] ?? service}
                    stackId="a"
                    fill={SERVICE_COLORS[service] ?? "#94a3b8"}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Per-Service Breakdown Table */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Service Breakdown</h2>
        {data.byService.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No data yet. Costs will appear here after your first AI generation.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 pr-4">Service</th>
                  <th className="text-right py-2 pr-4">Calls</th>
                  <th className="text-right py-2 pr-4">Units</th>
                  <th className="text-right py-2">Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.byService
                  .sort((a, b) => Number(b.totalCost) - Number(a.totalCost))
                  .map((row) => (
                    <tr key={row.service} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full inline-block"
                            style={{
                              background:
                                SERVICE_COLORS[row.service] ?? "#94a3b8",
                            }}
                          />
                          <span className="font-medium">
                            {SERVICE_LABELS[row.service] ?? row.service}
                          </span>
                        </div>
                      </td>
                      <td className="text-right py-3 pr-4 tabular-nums">
                        {row.callCount}
                      </td>
                      <td className="text-right py-3 pr-4 tabular-nums text-muted-foreground">
                        {Number(row.totalUnits).toFixed(1)}
                      </td>
                      <td className="text-right py-3 font-semibold tabular-nums">
                        {formatCostShort(Number(row.totalCost))}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Per-Feature Breakdown */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Cost by Feature</h2>
        {data.byFeature.length === 0 ? (
          <p className="text-muted-foreground text-sm">No data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 pr-4">Feature</th>
                  <th className="text-left py-2 pr-4">Service</th>
                  <th className="text-right py-2 pr-4">Calls</th>
                  <th className="text-right py-2">Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.byFeature.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">
                      {FEATURE_LABELS[row.feature] ?? row.feature}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant="secondary"
                        style={{
                          background: `${SERVICE_COLORS[row.service] ?? "#94a3b8"}22`,
                          color: SERVICE_COLORS[row.service] ?? "#94a3b8",
                          border: `1px solid ${SERVICE_COLORS[row.service] ?? "#94a3b8"}44`,
                        }}
                      >
                        {SERVICE_LABELS[row.service] ?? row.service}
                      </Badge>
                    </td>
                    <td className="text-right py-3 pr-4 tabular-nums">
                      {row.callCount}
                    </td>
                    <td className="text-right py-3 font-semibold tabular-nums">
                      {formatCostShort(Number(row.totalCost))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground mt-6 text-center">
        Costs are estimates based on standard pricing. Actual billing may differ.
        Check each service's dashboard for exact charges.
      </p>
    </div>
  );
}
