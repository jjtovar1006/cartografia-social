import { AreaRecord, CommunityStats } from '../types';

// In Vercel, relative paths work automatically when hosted on the same domain
// Consolidated endpoints under /api/poligono to ensure reliable routing
const API_BASE_POLIGONO = '/api/poligono';

/**
 * Helper to safely parse JSON from a response
 */
const safeRequest = async (url: string, options?: RequestInit): Promise<any> => {
  const response = await fetch(url, options);
  const text = await response.text();

  if (!response.ok) {
    // Try to extract error message from JSON body, fallback to status text
    try {
      const jsonError = JSON.parse(text);
      throw new Error(jsonError.error || `Server Error ${response.status}`);
    } catch (e) {
      // If parsing fails, use the raw text (truncated)
      throw new Error(`Request failed (${response.status}): ${text.substring(0, 100)}`);
    }
  }

  try {
    // Handle empty responses
    if (!text.trim()) return null;
    return JSON.parse(text);
  } catch (e) {
    console.error("Invalid JSON response:", text.substring(0, 200));
    throw new Error("Invalid JSON response from server");
  }
};

/**
 * Fetches stats for communities from CENSO_HOGARES
 */
export const fetchCommunityStats = async (): Promise<CommunityStats[]> => {
  try {
    // Updated to use the new file location
    const data = await safeRequest(`${API_BASE_POLIGONO}/stats`);
    if (Array.isArray(data)) {
        return data as CommunityStats[];
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch community stats:", error);
    // Return empty array instead of crashing
    return [];
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