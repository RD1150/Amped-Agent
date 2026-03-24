import { describe, it, expect } from 'vitest';
import {
  MARKET_VIEW_OPTIONS,
  DEFAULT_MARKET_VIEW,
  getMarketViewOption,
  type MarketView,
} from '../shared/marketView';

describe('MARKET_VIEW_OPTIONS', () => {
  it('has exactly 5 options', () => {
    expect(MARKET_VIEW_OPTIONS).toHaveLength(5);
  });

  it('contains all expected view keys', () => {
    const keys = MARKET_VIEW_OPTIONS.map((o) => o.value);
    expect(keys).toContain('this_month_vs_last');
    expect(keys).toContain('month_over_month');
    expect(keys).toContain('quarter_over_quarter');
    expect(keys).toContain('year_over_year');
    expect(keys).toContain('last_30_days');
  });

  it('every option has a non-empty label, description, narrationPhrase, and statLabel', () => {
    for (const opt of MARKET_VIEW_OPTIONS) {
      expect(opt.label.length).toBeGreaterThan(0);
      expect(opt.description.length).toBeGreaterThan(0);
      expect(opt.narrationPhrase.length).toBeGreaterThan(0);
      expect(opt.statLabel.length).toBeGreaterThan(0);
    }
  });
});

describe('DEFAULT_MARKET_VIEW', () => {
  it('is this_month_vs_last', () => {
    expect(DEFAULT_MARKET_VIEW).toBe('this_month_vs_last');
  });

  it('is a valid key in MARKET_VIEW_OPTIONS', () => {
    const keys = MARKET_VIEW_OPTIONS.map((o) => o.value);
    expect(keys).toContain(DEFAULT_MARKET_VIEW);
  });
});

describe('getMarketViewOption', () => {
  it('returns the correct option for each valid key', () => {
    for (const opt of MARKET_VIEW_OPTIONS) {
      const result = getMarketViewOption(opt.value as MarketView);
      expect(result.value).toBe(opt.value);
      expect(result.label).toBe(opt.label);
    }
  });

  it('falls back to the default option for an unknown key', () => {
    const result = getMarketViewOption('unknown_key' as MarketView);
    expect(result.value).toBe(DEFAULT_MARKET_VIEW);
  });

  it('year_over_year narration phrase contains "year over year"', () => {
    const opt = getMarketViewOption('year_over_year');
    expect(opt.narrationPhrase).toContain('year over year');
  });

  it('month_over_month statLabel is MoM', () => {
    const opt = getMarketViewOption('month_over_month');
    expect(opt.statLabel).toBe('MoM');
  });

  it('quarter_over_quarter statLabel is QoQ', () => {
    const opt = getMarketViewOption('quarter_over_quarter');
    expect(opt.statLabel).toBe('QoQ');
  });

  it('this_month_vs_last statLabel is "vs last month"', () => {
    const opt = getMarketViewOption('this_month_vs_last');
    expect(opt.statLabel).toBe('vs last month');
  });

  it('last_30_days narration phrase contains "30 days"', () => {
    const opt = getMarketViewOption('last_30_days');
    expect(opt.narrationPhrase).toContain('30 days');
  });
});
