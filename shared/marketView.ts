/**
 * Market View modes — the 5 time-period comparison options available
 * throughout the app (AI Reels, Market Insights, generated scripts).
 *
 * Each mode maps to:
 *   - A human-readable label shown in the UI pill selector
 *   - A short description shown as a subtitle under the label
 *   - A narration phrase used inside LLM prompts so the generated
 *     voiceover script references the correct comparison period
 */

export type MarketView =
  | 'this_month_vs_last'
  | 'month_over_month'
  | 'quarter_over_quarter'
  | 'year_over_year'
  | 'last_30_days';

export interface MarketViewOption {
  value: MarketView;
  label: string;
  description: string;
  /** Phrase injected into LLM prompts, e.g. "compared to last month" */
  narrationPhrase: string;
  /** Short label used in stat cards, e.g. "vs last month" */
  statLabel: string;
}

export const MARKET_VIEW_OPTIONS: MarketViewOption[] = [
  {
    value: 'this_month_vs_last',
    label: 'This Month vs Last Month',
    description: 'Current month-to-date vs same period last month',
    narrationPhrase: 'compared to the same period last month',
    statLabel: 'vs last month',
  },
  {
    value: 'month_over_month',
    label: 'Month over Month',
    description: 'Full last month vs the month before',
    narrationPhrase: 'month over month',
    statLabel: 'MoM',
  },
  {
    value: 'quarter_over_quarter',
    label: 'Quarter over Quarter',
    description: 'Last 90 days vs the 90 days before',
    narrationPhrase: 'quarter over quarter',
    statLabel: 'QoQ',
  },
  {
    value: 'year_over_year',
    label: 'Year over Year',
    description: 'Last 12 months vs prior 12 months',
    narrationPhrase: 'year over year',
    statLabel: 'YoY',
  },
  {
    value: 'last_30_days',
    label: 'Last 30 Days',
    description: 'Rolling 30-day window vs prior 30 days',
    narrationPhrase: 'over the last 30 days',
    statLabel: 'last 30d',
  },
];

export const DEFAULT_MARKET_VIEW: MarketView = 'this_month_vs_last';

/**
 * Look up a MarketViewOption by its value key.
 * Falls back to the default (this_month_vs_last) if not found.
 */
export function getMarketViewOption(value: MarketView): MarketViewOption {
  return (
    MARKET_VIEW_OPTIONS.find((o) => o.value === value) ??
    MARKET_VIEW_OPTIONS[0]
  );
}
