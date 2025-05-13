
/**
 * Game result calculation utilities
 */

/**
 * Calculate distance between two lat/lng points in kilometers using the Haversine formula
 */
export const calculateDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

/**
 * Calculate location accuracy percentage
 */
export const calculateLocationAccuracy = (distanceKm: number, maxRadiusKm: number = 1000): number => {
  const accuracy = 100 - (distanceKm / maxRadiusKm) * 100;
  return Math.max(0, Math.min(100, accuracy)); // Clamp between 0-100
};

/**
 * Calculate time accuracy percentage
 */
export const calculateTimeAccuracy = (guessYear: number, actualYear: number, maxYearsDifference: number = 100): number => {
  const yearDifference = Math.abs(guessYear - actualYear);
  const accuracy = 100 - (yearDifference / maxYearsDifference) * 100;
  return Math.max(0, Math.min(100, accuracy)); // Clamp between 0-100
};

/**
 * Calculate XP awarded based on accuracy
 */
export const calculateXP = (
  locationAccuracy: number, 
  timeAccuracy: number, 
  xpWhereMax: number = 150, 
  xpWhenMax: number = 150
): {
  xpWhere: number;
  xpWhen: number;
  xpTotal: number;
} => {
  const xpWhere = Math.round(locationAccuracy * xpWhereMax / 100);
  const xpWhen = Math.round(timeAccuracy * xpWhenMax / 100);
  const xpTotal = xpWhere + xpWhen;
  
  return { xpWhere, xpWhen, xpTotal };
};

/**
 * Get time difference description
 */
export const getTimeDifferenceDescription = (guessYear: number, actualYear: number): string => {
  const diff = Math.abs(guessYear - actualYear);
  if (diff === 0) return "Exact match!";
  
  const earlyOrLate = guessYear < actualYear ? "early" : "late";
  return `${diff} years too ${earlyOrLate}`;
};
