import { describe, it, expect } from 'vitest';
import { ENV } from './_core/env';

describe('RapidAPI Credentials', () => {
  it('should have valid RAPIDAPI_KEY configured', () => {
    expect(ENV.rapidApiKey).toBeDefined();
    expect(ENV.rapidApiKey).not.toBe('');
    expect(ENV.rapidApiKey.length).toBeGreaterThan(30);
  });

  it('should successfully fetch data from US Real Estate API', async () => {
    const response = await fetch(
      'https://us-real-estate.p.rapidapi.com/v3/for-sale?city=houston&state_code=TX&limit=1&offset=0',
      {
        headers: {
          'X-RapidAPI-Host': 'us-real-estate.p.rapidapi.com',
          'X-RapidAPI-Key': ENV.rapidApiKey,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
    expect(data.data?.home_search?.results).toBeDefined();
    expect(Array.isArray(data.data.home_search.results)).toBe(true);
    expect(data.data.home_search.results.length).toBeGreaterThan(0);
  }, 10000); // 10 second timeout for API call
});
