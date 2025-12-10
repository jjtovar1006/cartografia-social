import { AreaRecord, CommunityStats } from '../types';

// Endpoints
const API_BASE_POLIGONO = '/api/poligono';
const API_STATS = '/api/stats';

/**
 * Helper to safely parse JSON from a response
 */
const safeRequest = async (url: string, options?: RequestInit): Promise<any> => {
  try {
    const response = await fetch(url, options);
    const text = await response.text();

    if (!response.ok) {
      console.warn(`API Error (${response.status}) for ${url}:`, text);
      throw new Error(`Server Error ${response.status}`);
    }

    // Handle empty responses
    if (!text.trim()) return null;
    return JSON.parse(text);
  } catch (error) {
    console.warn(`Request failed for ${url}:`, error);
    throw error;
  }
};

/**
 * Fetches stats for communities from CENSO_HOGARES
 */
export const fetchCommunityStats = async (): Promise<CommunityStats[]> => {
  try {
    const data = await safeRequest(API_STATS);
    if (Array.isArray(data)) {
        return data as CommunityStats[];
    }
    return [];
  } catch (error) {
    console.warn("Using demo data due to API error.");
    // Return demo data if API fails (404, Network Error, etc)
    return [
        { name: "Casco Central (Demo)", families: 45, population: 150 },
        { name: "Sector Norte (Demo)", families: 32, population: 110 },
        { name: "Sector Sur (Demo)", families: 28, population: 95 }
    ];
  }
};

/**
 * Saves a new area to Google Sheets
 */
export const saveAreaToSheet = async (data: AreaRecord): Promise<boolean> => {
  try {
    await safeRequest(`${API_BASE_POLIGONO}/crear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return true;
  } catch (error) {
    console.error("Failed to save area:", error);
    throw error;
  }
};

/**
 * Fetches all areas from Google Sheets
 */
export const fetchAreasFromSheet = async (): Promise<AreaRecord[]> => {
  try {
    const data = await safeRequest(`${API_BASE_POLIGONO}/listar`);
    
    // Ensure we always return an array
    if (Array.isArray(data)) {
      return data as AreaRecord[];
    }
    
    console.warn("API did not return an array:", data);
    return [];
  } catch (error) {
    console.error("Failed to fetch areas:", error);
    // Return empty array to allow the app to function (e.g. in offline/demo mode)
    return [];
  }
};

/**
 * Updates an existing area
 */
export const updateAreaInSheet = async (data: Partial<AreaRecord> & { ID_AREA: string }): Promise<boolean> => {
  try {
    await safeRequest(`${API_BASE_POLIGONO}/actualizar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return true;
  } catch (error) {
    console.error("Failed to update area:", error);
    throw error;
  }
};