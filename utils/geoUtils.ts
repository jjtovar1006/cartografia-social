import { LatLng } from '../types';

/**
 * Converts an array of LatLng points to a WKT Polygon string.
 * Format: POLYGON((lng lat, lng lat, ..., lng1 lat1))
 */
export const pointsToWKT = (points: LatLng[]): string => {
  if (points.length < 3) return '';

  const coords = points.map(p => `${p.lng} ${p.lat}`);
  coords.push(`${points[0].lng} ${points[0].lat}`); // Close loop

  return `POLYGON((${coords.join(', ')}))`;
};

/**
 * Parses a WKT Polygon string back to an array of LatLng objects.
 * Input: "POLYGON((-66.9 10.4, -66.8 10.4, ...))"
 */
export const wktToPoints = (wkt: string): LatLng[] => {
  try {
    if (!wkt || !wkt.startsWith('POLYGON')) return [];

    // Remove "POLYGON((" and "))" and split by comma
    const cleanContent = wkt.replace('POLYGON((', '').replace('))', '');
    const coordinatePairs = cleanContent.split(',');

    return coordinatePairs.map(pair => {
      const [lng, lat] = pair.trim().split(' ').map(Number);
      return { lat, lng };
    });
  } catch (e) {
    console.error("Error parsing WKT:", wkt, e);
    return [];
  }
};

/**
 * Calculates the centroid (approximate center) of a polygon.
 * Used to place a marker on the map for the community.
 */
export const getPolygonCentroid = (points: LatLng[]): LatLng | null => {
  if (!points || points.length === 0) return null;

  let latSum = 0;
  let lngSum = 0;

  points.forEach(p => {
    latSum += p.lat;
    lngSum += p.lng;
  });

  return {
    lat: latSum / points.length,
    lng: lngSum / points.length
  };
};

export const generateUniqueId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const getCurrentDateTime = (): string => {
  return new Date().toISOString();
};