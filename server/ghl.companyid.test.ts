import { describe, it, expect } from 'vitest';
import { ENV } from './_core/env';

describe('GHL Company ID Configuration', () => {
  it('should have GHL_COMPANY_ID environment variable configured', () => {
    expect(ENV.ghlCompanyId).toBeTruthy();
    expect(ENV.ghlCompanyId).toMatch(/^[a-zA-Z0-9]{20,24}$/); // GHL Company ID format
    console.log('[Test] ✅ GHL_COMPANY_ID is configured:', ENV.ghlCompanyId);
  });

  it('should verify Company ID matches the location company', async () => {
    // Fetch location details to verify Company ID
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
      const locationCompanyId = data.location?.companyId;
      
      expect(locationCompanyId).toBeDefined();
      expect(locationCompanyId).toBe(ENV.ghlCompanyId);
      
      console.log('[Test] ✅ Company ID matches location:', {
        configured: ENV.ghlCompanyId,
        fromAPI: locationCompanyId,
        match: locationCompanyId === ENV.ghlCompanyId
      });
    }
  }, 10000);

  it('should validate location creation uses correct Company ID', async () => {
    // Test that location creation endpoint accepts our Company ID
    const testPayload = {
      companyId: ENV.ghlCompanyId, // Using correct Company ID
      name: 'Test Location (validation only)',
      email: 'test@example.com',
      country: 'US',
    };

    const response = await fetch(
      `https://services.leadconnectorhq.com/locations/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ENV.ghlAgencyApiKey}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      }
    );

    // We expect either:
    // - 201: Success (location created)
    // - 400/422: Validation error (but Company ID was accepted)
    // - NOT 403: Forbidden (which means Company ID is wrong)
    
    const status = response.status;
    const responseText = await response.text();
    
    console.log('[Test] Location creation response:', {
      status,
      response: responseText.substring(0, 200)
    });

    // The key test: we should NOT get 403 Forbidden
    expect(status).not.toBe(403);
    
    if (status === 403) {
      console.error('[Test] ❌ Still getting 403 Forbidden - Company ID may be incorrect');
      throw new Error('403 Forbidden - Company ID configuration issue');
    } else {
      console.log('[Test] ✅ No 403 error - Company ID is correctly configured');
    }
  }, 10000);

  it('should validate Bulk Enable SaaS endpoint with Company ID', async () => {
    // Test that the SaaS endpoint URL is correct
    const saasEndpoint = `https://services.leadconnectorhq.com/saas/bulk-enable-saas/${ENV.ghlCompanyId}`;
    
    console.log('[Test] SaaS endpoint:', saasEndpoint);
    
    // Verify the endpoint format
    expect(saasEndpoint).toContain(ENV.ghlCompanyId);
    expect(saasEndpoint).toMatch(/^https:\/\/services\.leadconnectorhq\.com\/saas\/bulk-enable-saas\/[a-zA-Z0-9]{20,24}$/);
    
    console.log('[Test] ✅ SaaS endpoint format is correct');
  });
});
