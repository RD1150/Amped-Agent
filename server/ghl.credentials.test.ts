import { describe, it, expect } from 'vitest';
import { ENV } from './_core/env';

describe('GHL Credentials Validation', () => {
  it('should have GHL agency credentials configured', () => {
    expect(ENV.ghlAgencyApiKey).toBeTruthy();
    expect(ENV.ghlAgencyId).toBeTruthy();
    expect(ENV.ghlAgencyApiKey).toMatch(/^pit-/);
  });

  it('should validate GHL API key by fetching location info', async () => {
    const response = await fetch(
      `https://services.leadconnectorhq.com/locations/${ENV.ghlAgencyId}`,
      {
        headers: {
          'Authorization': `Bearer ${ENV.ghlAgencyApiKey}`,
          'Version': '2021-07-28',
        },
      }
    );

    expect(response.ok).toBe(true);
    
    if (response.ok) {
      const data = await response.json();
      expect(data.location).toBeDefined();
      expect(data.location.id).toBe(ENV.ghlAgencyId);
    }
  }, 10000); // 10 second timeout for API call
});
