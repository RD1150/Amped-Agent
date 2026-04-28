import { ENV } from './_core/env';

/**
 * Market Stats Helper
 * Integrates with US Real Estate API via RapidAPI
 * Host: us-real-estate.p.rapidapi.com
 * Endpoint: GET /v3/for-sale?city=<city>&state_code=<ST>&limit=50
 *
 * NOTE: /v2/for-sale is broken (404). Use /v3/for-sale instead.
 */

export interface MarketStatsData {
  location: string;
  medianPrice: number;
  priceChange: number; // Percentage change YoY (estimated from market temp)
  daysOnMarket: number;
  activeListings: number;
  listingsChange: number; // Percentage change YoY (estimated from market temp)
  pricePerSqft: number;
  marketTemperature: 'hot' | 'balanced' | 'cold';
  insights: string[];
  lastUpdated: Date;
}

interface USRealEstateV3Property {
  list_price?: number;
  list_date?: string;
  description?: {
    sqft?: number;
    beds?: number;
    baths_full?: number;
    type?: string;
    year_built?: number;
    lot_sqft?: number;
  };
  flags?: {
    is_new_listing?: boolean;
    is_price_reduced?: boolean;
  };
}

interface USRealEstateV3Response {
  status: number;
  data?: {
    home_search?: {
      total?: number;
      results?: USRealEstateV3Property[];
    };
  };
}

/**
 * Parse location string into city and state_code for the API
 * Handles: "Westlake Village, CA" → { city: "Westlake Village", state_code: "CA" }
 */
function parseLocation(location: string): { city: string; state_code: string } {
  const parts = location.split(',').map(s => s.trim());
  if (parts.length >= 2) {
    return { city: parts[0], state_code: parts[1].substring(0, 2).toUpperCase() };
  }
  return { city: parts[0], state_code: '' };
}

/**
 * Fetch market data from US Real Estate API v3 (RapidAPI)
 */
export async function fetchMarketData(location: string): Promise<MarketStatsData> {
  const { city, state_code } = parseLocation(location);

  const params = new URLSearchParams({ city, limit: '50', offset: '0' });
  if (state_code) params.set('state_code', state_code);

  const response = await fetch(
    `https://us-real-estate.p.rapidapi.com/v3/for-sale?${params.toString()}`,
    {
      headers: {
        'X-RapidAPI-Key': ENV.rapidApiKey,
        'X-RapidAPI-Host': 'us-real-estate.p.rapidapi.com',
      },
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `US Real Estate API request failed: ${response.status} ${response.statusText}. ${body.substring(0, 200)}`
    );
  }

  const data: USRealEstateV3Response = await response.json();

  if (data.status !== 200) {
    throw new Error(`US Real Estate API returned status ${data.status} for "${location}"`);
  }

  const properties = data.data?.home_search?.results || [];
  const total = data.data?.home_search?.total || 0;

  if (properties.length === 0) {
    throw new Error(
      `No properties found for "${location}". Try a broader city name (e.g., "Los Angeles, CA").`
    );
  }

  // Extract prices
  const prices = properties.map(p => p.list_price ?? 0).filter(p => p > 50_000);

  if (prices.length === 0) {
    throw new Error(`No valid price data returned for "${location}".`);
  }

  const medianPrice = calculateMedian(prices);

  // Price per sqft
  const validSqftProps = properties.filter(
    p => (p.description?.sqft ?? 0) > 200 && (p.list_price ?? 0) > 0
  );
  const pricePerSqftValues = validSqftProps.map(
    p => p.list_price! / p.description!.sqft!
  );
  const pricePerSqft =
    pricePerSqftValues.length > 0
      ? Math.round(calculateMedian(pricePerSqftValues))
      : Math.round(medianPrice / 1800);

  // Days on market (from list_date)
  const now = new Date();
  const domValues = properties
    .map(p => {
      if (!p.list_date) return -1;
      const d = Math.floor(
        (now.getTime() - new Date(p.list_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      return d >= 0 && d < 1000 ? d : -1;
    })
    .filter(d => d >= 0);

  const daysOnMarket =
    domValues.length > 0
      ? Math.round(domValues.reduce((a, b) => a + b, 0) / domValues.length)
      : 30;

  // Market temperature
  let marketTemperature: 'hot' | 'balanced' | 'cold';
  if (daysOnMarket < 21) {
    marketTemperature = 'hot';
  } else if (daysOnMarket < 45) {
    marketTemperature = 'balanced';
  } else {
    marketTemperature = 'cold';
  }

  // Estimated YoY changes
  const priceChange =
    marketTemperature === 'hot' ? 8.5 : marketTemperature === 'balanced' ? 3.2 : -2.1;
  const listingsChange =
    marketTemperature === 'hot' ? -15.3 : marketTemperature === 'balanced' ? 5.2 : 12.8;

  // New listings / price reductions
  const newListings = properties.filter(p => p.flags?.is_new_listing).length;
  const priceReductions = properties.filter(p => p.flags?.is_price_reduced).length;

  const insights = generateInsights({
    medianPrice,
    daysOnMarket,
    activeListings: total,
    pricePerSqft,
    marketTemperature,
    newListings,
    priceReductions,
  });

  return {
    location,
    medianPrice,
    priceChange,
    daysOnMarket,
    activeListings: total,
    listingsChange,
    pricePerSqft,
    marketTemperature,
    insights,
    lastUpdated: new Date(),
  };
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
  newListings: number;
  priceReductions: number;
}): string[] {
  const insights: string[] = [];

  const priceFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(params.medianPrice);

  // Market temperature
  if (params.marketTemperature === 'hot') {
    insights.push(
      `This is a seller's market — homes are selling fast (avg ${params.daysOnMarket} days). Multiple offers are common.`
    );
  } else if (params.marketTemperature === 'balanced') {
    insights.push(
      `The market is balanced with homes averaging ${params.daysOnMarket} days to sell. Good conditions for both buyers and sellers.`
    );
  } else {
    insights.push(
      `This is a buyer's market — homes are taking longer to sell (avg ${params.daysOnMarket} days). More negotiating power for buyers.`
    );
  }

  // Inventory
  if (params.activeListings < 100) {
    insights.push(
      `Low inventory with only ${params.activeListings} active listings. Competition among buyers is high.`
    );
  } else if (params.activeListings < 500) {
    insights.push(
      `Moderate inventory with ${params.activeListings} active listings. Buyers have a reasonable selection.`
    );
  } else {
    insights.push(
      `Strong inventory with ${params.activeListings} active listings. Buyers have plenty of options.`
    );
  }

  // Price
  insights.push(
    `Median home price is ${priceFormatted}${params.pricePerSqft > 0 ? `, with a median of $${params.pricePerSqft}/sqft` : ''}.`
  );

  // New listings
  if (params.newListings > 0) {
    insights.push(
      `${params.newListings} new listings just hit the market — act fast before they're gone!`
    );
  }

  // Price reductions
  if (params.priceReductions > 0) {
    insights.push(
      `${params.priceReductions} properties have recent price reductions — great opportunities for buyers!`
    );
  }

  insights.push(`⚠️ Verify these numbers with your local MLS before publishing.`);

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
      console.log(`[MarketStats] Cache MISS for "${normalizedLocation}" — calling US Real Estate API v3`);
      const data = await fetchMarketData(location);

      const now = new Date();
      const expiresAt = new Date(now.getTime() + CACHE_DURATION_HOURS * 60 * 60 * 1000);

      // Upsert into DB cache (MySQL uses onDuplicateKeyUpdate instead of onConflictDoUpdate)
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
