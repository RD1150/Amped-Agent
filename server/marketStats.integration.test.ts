import { describe, it, expect } from 'vitest';
import { getMarketData } from './marketStatsHelper';

describe('Market Stats Integration', () => {
  it('should fetch real market data for Houston, TX', async () => {
    const data = await getMarketData('houston, tx');
    
    expect(data).toBeDefined();
    expect(data.location).toBe('houston, tx');
    expect(data.medianPrice).toBeGreaterThan(0);
    expect(data.daysOnMarket).toBeGreaterThan(0);
    expect(data.activeListings).toBeGreaterThan(0);
    expect(data.pricePerSqft).toBeGreaterThan(0);
    expect(['hot', 'balanced', 'cold']).toContain(data.marketTemperature);
    expect(data.insights).toBeDefined();
    expect(Array.isArray(data.insights)).toBe(true);
    expect(data.insights.length).toBeGreaterThan(0);
  }, 15000); // 15 second timeout for API call

  it('should cache market data for repeated requests', async () => {
    const location = 'austin, tx';
    
    // First request - hits API
    const data1 = await getMarketData(location);
    
    // Second request - should return same cached data
    const data2 = await getMarketData(location);
    
    // Data should be identical (cache returns same values)
    expect(data1.medianPrice).toBe(data2.medianPrice);
    expect(data1.daysOnMarket).toBe(data2.daysOnMarket);
    expect(data1.activeListings).toBe(data2.activeListings);
  }, 30000); // 30 second timeout for two API calls

  it('should handle different location formats', async () => {
    // Test with city and state abbreviation
    const data1 = await getMarketData('dallas, tx');
    expect(data1).toBeDefined();
    expect(data1.medianPrice).toBeGreaterThan(0);
    
    // Test with another city and state
    const data2 = await getMarketData('miami, fl');
    expect(data2).toBeDefined();
    expect(data2.medianPrice).toBeGreaterThan(0);
  }, 30000); // 30 second timeout for two API calls
});
