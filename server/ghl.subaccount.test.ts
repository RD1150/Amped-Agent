import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ENV } from './_core/env';

describe('GHL Sub-Account Creation', () => {
  beforeEach(() => {
    // Clear any mocks before each test
    vi.clearAllMocks();
  });

  it('should have required environment variables for sub-account creation', () => {
    expect(ENV.ghlAgencyApiKey).toBeTruthy();
    expect(ENV.ghlAgencyId).toBeTruthy();
    expect(ENV.ghlAgencyApiKey).toMatch(/^pit-/);
  });

  it('should be able to fetch location details using agency API key', async () => {
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
      console.log('[Test] Successfully validated agency location access');
    }
  }, 10000);

  it('should validate that GHL API supports location creation endpoint', async () => {
    // This test validates that the API endpoint exists and returns proper error format
    // We expect a 400/422 error because we're not sending valid data, but that confirms the endpoint exists
    const response = await fetch(
      `https://services.leadconnectorhq.com/locations/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ENV.ghlAgencyApiKey}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Intentionally minimal to test endpoint existence
          companyId: ENV.ghlAgencyId,
        }),
      }
    );

    // We expect either 400/422 (validation error) or 201 (success)
    // Both confirm the endpoint exists and is accessible
    expect([400, 422, 201, 200]).toContain(response.status);
    console.log(`[Test] Location creation endpoint accessible (status: ${response.status})`);
  }, 10000);
});
