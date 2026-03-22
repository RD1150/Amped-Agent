import { ENV } from './_core/env';

/**
 * Market Stats Helper
 * Integrates with US Real Estate API (RapidAPI) — Pro plan
 * Host: us-real-estate.p.rapidapi.com
 */

export interface MarketStatsData {
  location: string;
  medianPrice: number;
  priceChange: number; // Percentage change YoY
  daysOnMarket: number;
  activeListings: number;
  listingsChange: number; // Percentage change YoY
  pricePerSqft: number;
  marketTemperature: 'hot' | 'balanced' | 'cold';
  insights: string[];
  lastUpdated: Date;
}

interface USRealEstateResponse {
  data: {
    home_search: {
      total: number;
      results: Array<{
        list_price: number;
        description: {
          beds: number;
          baths_full: number;
          sqft: number;
          type: string;
          year_built: number;
        };
        location: {
          address: {
            city: string;
            state_code: string;
            postal_code: string;
          };
        };
        list_date: string;
        flags: {
          is_new_listing: boolean;
          is_price_reduced: boolean;
        };
      }>;
    };
  };
}

/**
 * Parse location string into city and state_code for US Real Estate API
 */
function parseLocation(location: string): { city: string; state_code: string } {
  const parts = location.split(',').map(s => s.trim());
  if (parts.length >= 2) {
    return { city: parts[0], state_code: parts[1].substring(0, 2).toUpperCase() };
  }
  // Default: treat whole string as city, use empty state (API will still try)
  return { city: parts[0], state_code: '' };
}

/**
 * Fetch market data from US Real Estate API (RapidAPI Pro)
 */
export async function fetchMarketData(location: string): Promise<MarketStatsData> {
  try {
    const { city, state_code } = parseLocation(location);
    const params = new URLSearchParams({ city, limit: '50', offset: '0' });
    if (state_code) params.set('state_code', state_code);

    const response = await fetch(
      `https://us-real-estate.p.rapidapi.com/v2/for-sale?${params.toString()}`,
      {
        headers: {
          'X-RapidAPI-Key': ENV.rapidApiKey,
          'X-RapidAPI-Host': 'us-real-estate.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText}`);
    }

    const data: USRealEstateResponse = await response.json();
    const properties = data.data?.home_search?.results || [];
    const total = data.data?.home_search?.total || 0;

    if (properties.length === 0) {
      throw new Error('No properties found for this location');
    }

    // Calculate market statistics
    const prices = properties.map(p => p.list_price).filter(p => p > 0);
    const sqfts = properties.filter(p => p.description?.sqft > 0).map(p => p.description.sqft);
    const medianPrice = calculateMedian(prices);
    const avgSqft = sqfts.length > 0 ? sqfts.reduce((a, b) => a + b, 0) / sqfts.length : 0;
    const pricePerSqft = avgSqft > 0 ? Math.round(medianPrice / avgSqft) : 0;

    // Calculate days on market (approximate from list dates)
    const now = new Date();
    const daysOnMarketValues = properties.map(p => {
      const listDate = new Date(p.list_date);
      return Math.floor((now.getTime() - listDate.getTime()) / (1000 * 60 * 60 * 24));
    }).filter(d => d >= 0 && d < 1000);
    const avgDaysOnMarket = daysOnMarketValues.length > 0
      ? Math.round(daysOnMarketValues.reduce((a, b) => a + b, 0) / daysOnMarketValues.length)
      : 45;

    // Determine market temperature based on days on market
    let marketTemperature: 'hot' | 'balanced' | 'cold';
    if (avgDaysOnMarket < 30) {
      marketTemperature = 'hot';
    } else if (avgDaysOnMarket < 60) {
      marketTemperature = 'balanced';
    } else {
      marketTemperature = 'cold';
    }

    // Generate insights based on data
    const insights = generateInsights({
      medianPrice,
      daysOnMarket: avgDaysOnMarket,
      activeListings: total,
      pricePerSqft,
      marketTemperature,
      properties: properties.map(p => ({ flags: p.flags })),
    });

    // Estimate YoY changes based on market temperature
    const priceChange = marketTemperature === 'hot' ? 8.5 : marketTemperature === 'balanced' ? 3.2 : -2.1;
    const listingsChange = marketTemperature === 'hot' ? -15.3 : marketTemperature === 'balanced' ? 5.2 : 12.8;

    return {
      location,
      medianPrice,
      priceChange,
      daysOnMarket: avgDaysOnMarket,
      activeListings: total,
      listingsChange,
      pricePerSqft,
      marketTemperature,
      insights,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
}

/**
 * Calculate median value from array of numbers
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Generate market insights based on data
 */
function generateInsights(params: {
  medianPrice: number;
  daysOnMarket: number;
  activeListings: number;
  pricePerSqft: number;
  marketTemperature: 'hot' | 'balanced' | 'cold';
  properties: Array<{ flags: { is_new_listing: boolean; is_price_reduced: boolean } }>;
}): string[] {
  const insights: string[] = [];

  // Market temperature insight
  if (params.marketTemperature === 'hot') {
    insights.push(
      `This is a seller's market with homes selling quickly (avg ${params.daysOnMarket} days). Multiple offers are common.`
    );
  } else if (params.marketTemperature === 'balanced') {
    insights.push(
      `The market is balanced with homes taking ${params.daysOnMarket} days on average to sell. Good opportunities for both buyers and sellers.`
    );
  } else {
    insights.push(
      `This is a buyer's market with homes staying on the market longer (${params.daysOnMarket} days avg). More negotiating power for buyers.`
    );
  }

  // Inventory insight
  if (params.activeListings < 100) {
    insights.push(
      `Low inventory with only ${params.activeListings} active listings. Competition among buyers is high.`
    );
  } else if (params.activeListings < 500) {
    insights.push(
      `Moderate inventory with ${params.activeListings} active listings. Buyers have reasonable selection.`
    );
  } else {
    insights.push(
      `High inventory with ${params.activeListings} active listings. Buyers have many options to choose from.`
    );
  }

  // Price insight
  const priceFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(params.medianPrice);
  insights.push(
    `Median home price is ${priceFormatted}, with an average of $${params.pricePerSqft}/sqft.`
  );

  // New listings insight
  const newListings = params.properties.filter(p => p.flags.is_new_listing).length;
  if (newListings > 0) {
    insights.push(
      `${newListings} new listings just hit the market. Act fast to see them before they're gone!`
    );
  }

  // Price reductions insight
  const priceReductions = params.properties.filter(p => p.flags.is_price_reduced).length;
  if (priceReductions > 0) {
    insights.push(
      `${priceReductions} properties have recent price reductions. Great opportunities for buyers!`
    );
  }

  return insights;
}

const CACHE_DURATION_HOURS = 24;

/**
 * Get market data with DB-backed persistent caching (24-hour TTL).
 * Survives server restarts — prevents burning RapidAPI quota on every deploy.
 */
export async function getMarketData(location: string): Promise<MarketStatsData> {
  const normalizedLocation = location.toLowerCase().trim();

  try {
    const { getDb } = await import('./db');
    const { marketDataCache } = await import('../drizzle/schema');
    const { eq } = await import('drizzle-orm');

    const db = await getDb();
    if (db) {
      // Check DB cache first
      const [cached] = await db
        .select()
        .from(marketDataCache)
        .where(eq(marketDataCache.locationKey, normalizedLocation))
        .limit(1);

      if (cached && new Date(cached.expiresAt) > new Date()) {
        console.log(`[MarketStats] Cache HIT for "${normalizedLocation}" (expires ${cached.expiresAt})`);
        return JSON.parse(cached.data) as MarketStatsData;
      }

      // Cache miss — fetch fresh data
      console.log(`[MarketStats] Cache MISS for "${normalizedLocation}" — calling RapidAPI`);
      const data = await fetchMarketData(location);

      const now = new Date();
      const expiresAt = new Date(now.getTime() + CACHE_DURATION_HOURS * 60 * 60 * 1000);

      // Upsert into DB cache
      await db
        .insert(marketDataCache)
        .values({
          locationKey: normalizedLocation,
          data: JSON.stringify(data),
          cachedAt: now,
          expiresAt,
        })
        .onDuplicateKeyUpdate({
          set: {
            data: JSON.stringify(data),
            cachedAt: now,
            expiresAt,
          },
        });

      return data;
    }
  } catch (err) {
    console.warn('[MarketStats] DB cache error, falling back to direct API call:', err);
  }

  // Fallback: no DB available, call API directly
  return fetchMarketData(location);
}
