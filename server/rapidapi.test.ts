import { describe, it, expect } from 'vitest';
import { ENV } from './_core/env';

describe('RapidAPI Credentials', () => {
  it('should have valid RAPIDAPI_KEY configured', () => {
    expect(ENV.rapidApiKey).toBeDefined();
    expect(ENV.rapidApiKey).not.toBe('');
    expect(ENV.rapidApiKey.length).toBeGreaterThan(30);
  });

  it('should successfully fetch data from Realtor API', async () => {
    const response = await fetch(
      'https://realtor16.p.rapidapi.com/search/forsale?location=houston%2C%20tx&limit=1',
      {
        headers: {
          'x-rapidapi-host': 'realtor16.p.rapidapi.com',
          'x-rapidapi-key': ENV.rapidApiKey,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
    expect(data.properties).toBeDefined();
    expect(Array.isArray(data.properties)).toBe(true);
    expect(data.properties.length).toBeGreaterThan(0);
  }, 10000); // 10 second timeout for API call
});
