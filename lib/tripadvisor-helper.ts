import axios from 'axios';

const TRIPADVISOR_BASE_URL = 'https://api.content.tripadvisor.com/api/v1';
const API_KEY = process.env.TRIPADVISOR_API_KEY;

interface LocationSearchParams {
  searchQuery: string;
  category?: string;
  language?: string;
}

interface ActivitySearchParams {
  locationId: string;
  category?: string;
  language?: string;
}

export async function searchLocation(params: LocationSearchParams) {
  try {
    const response = await axios.get(`${TRIPADVISOR_BASE_URL}/location/search`, {
      params: {
        key: API_KEY,
        searchQuery: params.searchQuery,
        category: params.category || 'attractions',
        language: params.language || 'en'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('TripAdvisor location search error:', error);
    throw new Error('Failed to search location');
  }
}

export async function getLocationDetails(locationId: string) {
  try {
    const response = await axios.get(
      `${TRIPADVISOR_BASE_URL}/location/${locationId}/details`,
      {
        params: {
          key: API_KEY,
          language: 'en',
          currency: 'USD'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('TripAdvisor location details error:', error);
    throw new Error('Failed to get location details');
  }
}

export async function searchActivities(params: ActivitySearchParams) {
  try {
    // First get the location
    const locationSearch = await searchLocation({ 
      searchQuery: params.locationId 
    });
    
    if (!locationSearch.data || locationSearch.data.length === 0) {
      return [];
    }

    const locationId = locationSearch.data[0].location_id;

    // Then get activities for that location
    const response = await axios.get(
      `${TRIPADVISOR_BASE_URL}/location/${locationId}/details`,
      {
        params: {
          key: API_KEY,
          language: params.language || 'en',
          currency: 'USD'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('TripAdvisor activity search error:', error);
    throw new Error('Failed to search activities');
  }
}

// Helper to get nearby attractions for group activities
export async function getNearbyAttractions(
  location: string,
  category: string = 'attractions'
) {
  try {
    const locationData = await searchLocation({ 
      searchQuery: location,
      category 
    });

    if (!locationData.data || locationData.data.length === 0) {
      return [];
    }

    // Get details for top locations
    const detailsPromises = locationData.data.slice(0, 20).map((loc: any) =>
      getLocationDetails(loc.location_id)
    );

    const details = await Promise.all(detailsPromises);
    return details.filter(d => d !== null);
  } catch (error) {
    console.error('TripAdvisor nearby attractions error:', error);
    return [];
  }
}
