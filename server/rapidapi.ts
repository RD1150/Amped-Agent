import { ENV } from "./_core/env";

/**
 * Fetch property data from US Real Estate Listings API (RapidAPI)
 * @param mlsId - MLS ID of the property (e.g., "168E2809889933")
 * @returns Property details including price, beds, baths, sqft, listing agent (NO photos for copyright compliance)
 */
export async function fetchPropertyData(mlsId: string) {
  const rapidApiKey = ENV.rapidApiKey;
  
  if (!rapidApiKey) {
    throw new Error("RAPIDAPI_KEY not configured");
  }

  try {
    console.log("[RapidAPI] Fetching MLS ID:", mlsId);
    
    // Fetch property by MLS ID
    const response = await fetch(
      `https://us-real-estate-listings.p.rapidapi.com/v2/property-by-mls?mlsId=${encodeURIComponent(mlsId)}`,
      {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": rapidApiKey,
          "X-RapidAPI-Host": "us-real-estate-listings.p.rapidapi.com",
        },
      }
    );

    console.log("[RapidAPI] Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[RapidAPI] Error response:", errorText);
      throw new Error(`RapidAPI request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log("[RapidAPI] Response data structure:", JSON.stringify(data).substring(0, 500));
    console.log("[RapidAPI] Has search?", !!data?.search);
    console.log("[RapidAPI] Has results?", !!data?.search?.results);
    console.log("[RapidAPI] Results length:", data?.search?.results?.length || 0);
    
    // API returns search results in data.search.results array
    if (!data || !data.search || !data.search.results || data.search.results.length === 0) {
      throw new Error("Property not found with this MLS ID. Please verify the MLS ID is correct and the property is currently listed.");
    }

    // Take the first result (most relevant match)
    const property = data.search.results[0];

    // Extract and normalize property data
    return {
      address: property.location?.address?.line || "",
      city: property.location?.address?.city || "",
      state: property.location?.address?.state_code || "",
      zipCode: property.location?.address?.postal_code || "",
      price: property.list_price || 0,
      beds: property.description?.beds || 0,
      baths: property.description?.baths || 0,
      sqft: property.description?.sqft || 0,
      propertyType: property.description?.type || "Single Family",
      description: property.description?.text || "",
      // Photos removed for copyright compliance - users must upload their own
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
    console.error("[RapidAPI] Error details:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}
