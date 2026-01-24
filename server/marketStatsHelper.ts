import { ENV } from './_core/env';

/**
 * Market Stats Helper
 * Integrates with RapidAPI Realtor API to fetch real market data
 * Free tier: 500 requests/month
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

interface RealtorAPIResponse {
  count: number;
  properties: Array<{
    list_price: number;
    description: {
      beds: number;
      baths_consolidated: string;
      sqft: number;
      lot_sqft: number;
      type: string;
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
}

/**
 * Fetch market data from RapidAPI Realtor API
 */
export async function fetchMarketData(location: string): Promise<MarketStatsData> {
  try {
    // Fetch current listings (limit to 50 for analysis)
    const response = await fetch(
      `https://realtor16.p.rapidapi.com/search/forsale?location=${encodeURIComponent(location)}&limit=50`,
      {
        headers: {
          'x-rapidapi-host': 'realtor16.p.rapidapi.com',
          'x-rapidapi-key': ENV.rapidApiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText}`);
    }

    const data: RealtorAPIResponse = await response.json();

    if (!data.properties || data.properties.length === 0) {
      throw new Error('No properties found for this location');
    }

    // Calculate market statistics
    const prices = data.properties.map(p => p.list_price);
    const sqfts = data.properties.filter(p => p.description.sqft > 0).map(p => p.description.sqft);
    const medianPrice = calculateMedian(prices);
    const avgSqft = sqfts.length > 0 ? sqfts.reduce((a, b) => a + b, 0) / sqfts.length : 0;
    const pricePerSqft = avgSqft > 0 ? Math.round(medianPrice / avgSqft) : 0;

    // Calculate days on market (approximate from list dates)
    const now = new Date();
    const daysOnMarketValues = data.properties.map(p => {
      const listDate = new Date(p.list_date);
      return Math.floor((now.getTime() - listDate.getTime()) / (1000 * 60 * 60 * 24));
    });
    const avgDaysOnMarket = Math.round(
      daysOnMarketValues.reduce((a, b) => a + b, 0) / daysOnMarketValues.length
    );

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
      activeListings: data.count,
      pricePerSqft,
      marketTemperature,
      properties: data.properties,
    });

    // Mock YoY changes (in production, would compare with historical data)
    const priceChange = marketTemperature === 'hot' ? 8.5 : marketTemperature === 'balanced' ? 3.2 : -2.1;
    const listingsChange = marketTemperature === 'hot' ? -15.3 : marketTemperature === 'balanced' ? 5.2 : 12.8;

    return {
      location,
      medianPrice,
      priceChange,
      daysOnMarket: avgDaysOnMarket,
      activeListings: data.count,
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
  properties: RealtorAPIResponse['properties'];
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

/**
 * Cache for market data to optimize API usage
 * Key: location, Value: { data, timestamp }
 */
const marketDataCache = new Map<
  string,
  { data: MarketStatsData; timestamp: number }
>();

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get market data with caching (24-hour cache to optimize API usage)
 */
export async function getMarketData(location: string): Promise<MarketStatsData> {
  const normalizedLocation = location.toLowerCase().trim();
  const cached = marketDataCache.get(normalizedLocation);

  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Fetch fresh data
  const data = await fetchMarketData(location);

  // Cache the result
  marketDataCache.set(normalizedLocation, {
    data,
    timestamp: Date.now(),
  });

  return data;
}
