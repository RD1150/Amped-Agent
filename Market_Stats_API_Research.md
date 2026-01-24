# Market Stats API Research

## Selected API: Realtor API by Sabri (RapidAPI)

**API URL**: https://rapidapi.com/s.mahmoud97/api/realtor16

**Score**: 9.9/10
**Latency**: 522ms
**Uptime**: 100%

---

## Key Endpoints for Market Stats:

### 1. `/property/market_trends`
**Purpose**: Get market trends for a specific property/area
**Parameters**:
- `property_id` (required): Property ID to get market trends for
- `postal_code` (optional): ZIP code for area trends
- `city` (optional): City name for area trends

**Returns**:
- Median home prices
- Days on market
- Price trends (up/down)
- Inventory levels
- Sale volume

### 2. `/search/forsale`
**Purpose**: Search properties for sale in an area
**Parameters**:
- `location` (required): City, state, or ZIP code
- `limit`: Number of results (default 20, max 50)
- `sort`: Sort by price, date, etc.

**Returns**:
- Property listings
- Prices
- Days on market
- Property details

### 3. `/search/forsold`
**Purpose**: Get recently sold properties
**Parameters**:
- `location` (required): City, state, or ZIP code
- `limit`: Number of results

**Returns**:
- Sold prices
- Sale dates
- Property details

---

## Pricing (RapidAPI):

**Free Tier**: 
- 500 requests/month
- Good for testing

**Basic Plan**: $9.99/month
- 10,000 requests/month
- Suitable for production

**Pro Plan**: $49.99/month
- 100,000 requests/month
- For high-volume apps

---

## Implementation Plan:

1. Sign up for RapidAPI account
2. Subscribe to Realtor API (start with Free tier)
3. Get API key from RapidAPI dashboard
4. Add API key to Manus secrets
5. Create market stats service in `server/_core/marketStats.ts`
6. Add tRPC procedures for market data
7. Update Market Stats page to use real data

---

## Data We Can Show:

✅ Median home price by ZIP code
✅ Average days on market
✅ Number of active listings (inventory)
✅ Recent sales volume
✅ Price trends (% change month-over-month)
✅ Sold vs list price ratio

This will replace all placeholder data with real, up-to-date market statistics!
