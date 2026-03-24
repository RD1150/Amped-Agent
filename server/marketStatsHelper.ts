import { ENV } from './_core/env';

/**
 * Market Stats Helper
 * Integrates with US Real Estate API (RapidAPI) — Pro plan
 * Host: us-real-estate.p.rapidapi.com
 */

export interface MarketStatsData {
  location: string;
  medianPrice: number;
  priceChange: number; // Percentage change MoM (real, from sold homes)
  daysOnMarket: number;
  activeListings: number;
  listingsChange: number; // Percentage change MoM
  pricePerSqft: number;
  marketTemperature: 'hot' | 'balanced' | 'cold';
  insights: string[];
  lastUpdated: Date;
}

interface SoldHomesResponse {
  data: {
    home_search: {
      total: number;
      results: Array<{
        last_sold_price: number;
        last_sold_date: string;
        description: { sqft: number };
      }>;
    };
  };
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

    // Fetch REAL month-over-month price change from sold homes data
    let priceChange = 0;
    let listingsChange = 0;
    try {
      const now2 = new Date();
      // Current month: sold in the last 30 days
      const thirtyDaysAgo = Math.floor((now2.getTime() - 30 * 24 * 60 * 60 * 1000) / 1000);
      // Prior month: sold 30-60 days ago
      const sixtyDaysAgo = Math.floor((now2.getTime() - 60 * 24 * 60 * 60 * 1000) / 1000);

      const soldParams = new URLSearchParams({ city, limit: '200', offset: '0', sort: 'sold_date' });
      if (state_code) soldParams.set('state_code', state_code);

      const soldResp = await fetch(
        `https://us-real-estate.p.rapidapi.com/sold-homes?${soldParams.toString()}`,
        {
          headers: {
            'X-RapidAPI-Key': ENV.rapidApiKey,
            'X-RapidAPI-Host': 'us-real-estate.p.rapidapi.com',
          },
        }
      );

      if (soldResp.ok) {
        const soldData: SoldHomesResponse = await soldResp.json();
        const soldResults = soldData.data?.home_search?.results || [];

        // Split into current month (0-30 days ago) and prior month (30-60 days ago)
        const currentMonthPrices: number[] = [];
        const priorMonthPrices: number[] = [];

        for (const home of soldResults) {
          const soldPrice = home.last_sold_price;
          if (!soldPrice || soldPrice <= 0) continue;
          const soldTs = new Date(home.last_sold_date).getTime() / 1000;
          if (soldTs >= thirtyDaysAgo) {
            currentMonthPrices.push(soldPrice);
          } else if (soldTs >= sixtyDaysAgo) {
            priorMonthPrices.push(soldPrice);
          }
        }

        if (currentMonthPrices.length >= 3 && priorMonthPrices.length >= 3) {
          const currentMedian = calculateMedian(currentMonthPrices);
          const priorMedian = calculateMedian(priorMonthPrices);
          priceChange = parseFloat(((currentMedian - priorMedian) / priorMedian * 100).toFixed(1));
          listingsChange = parseFloat(((currentMonthPrices.length - priorMonthPrices.length) / priorMonthPrices.length * 100).toFixed(1));
          console.log(`[MarketStats] Real MoM priceChange for ${location}: ${priceChange}% (${currentMonthPrices.length} current, ${priorMonthPrices.length} prior month sales)`);
        } else {
          // Not enough sold data — fall back to a neutral 0% rather than a made-up number
          console.warn(`[MarketStats] Insufficient sold homes data for MoM calc (${currentMonthPrices.length} current, ${priorMonthPrices.length} prior). Defaulting to 0%.`);
          priceChange = 0;
          listingsChange = 0;
        }
      }
    } catch (soldErr) {
      console.warn('[MarketStats] Could not fetch sold homes for MoM calc:', soldErr);
      priceChange = 0;
      listingsChange = 0;
    }

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
