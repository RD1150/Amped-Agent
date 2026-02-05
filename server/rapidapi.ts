import { ENV } from "./_core/env";

/**
 * Fetch property data from US Real Estate Listings API (RapidAPI)
 * @param address - Full property address (e.g., "123 Main St, Los Angeles, CA 90001")
 * @returns Property details including price, beds, baths, sqft, photos, listing agent
 */
export async function fetchPropertyData(address: string) {
  const rapidApiKey = ENV.rapidApiKey;
  
  if (!rapidApiKey) {
    throw new Error("RAPIDAPI_KEY not configured");
  }

  try {
    // Step 1: Search for property by address
    const searchResponse = await fetch(
      `https://us-real-estate-listings.p.rapidapi.com/search?location=${encodeURIComponent(address)}&limit=1`,
      {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": rapidApiKey,
          "X-RapidAPI-Host": "us-real-estate-listings.p.rapidapi.com",
        },
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`RapidAPI search failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.data || searchData.data.length === 0) {
      throw new Error("Property not found at this address");
    }

    const property = searchData.data[0];

    // Extract and normalize property data
    return {
      address: property.location?.address?.line || address,
      city: property.location?.address?.city || "",
      state: property.location?.address?.state_code || "",
      zipCode: property.location?.address?.postal_code || "",
      price: property.list_price || 0,
      beds: property.description?.beds || 0,
      baths: property.description?.baths || 0,
      sqft: property.description?.sqft || 0,
      propertyType: property.description?.type || "Single Family",
      description: property.description?.text || "",
      photos: (property.photos || []).map((photo: any) => photo.href).filter(Boolean),
      listingAgent: {
        name: property.advertisers?.[0]?.name || "",
        office: property.advertisers?.[0]?.office?.name || "",
        phone: property.advertisers?.[0]?.phone || "",
        email: property.advertisers?.[0]?.email || "",
      },
      mlsId: property.property_id || "",
      listingDate: property.list_date || "",
    };
  } catch (error) {
    console.error("[RapidAPI] Error fetching property data:", error);
    throw error;
  }
}
