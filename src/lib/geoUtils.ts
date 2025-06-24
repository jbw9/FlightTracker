// Geographic utilities for flight tracking calculations

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface FlightPosition extends Coordinates {
  altitude?: number;
  heading?: number;
  timestamp?: Date;
}

// Earth's radius in kilometers
const EARTH_RADIUS_KM = 6371;
const EARTH_RADIUS_NM = 3440.065; // Nautical miles

/**
 * Convert degrees to radians
 */
export const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Convert radians to degrees
 */
export const toDegrees = (radians: number): number => {
  return radians * (180 / Math.PI);
};

/**
 * Calculate great circle distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (point1: Coordinates, point2: Coordinates): number => {
  const lat1Rad = toRadians(point1.latitude);
  const lat2Rad = toRadians(point2.latitude);
  const deltaLatRad = toRadians(point2.latitude - point1.latitude);
  const deltaLonRad = toRadians(point2.longitude - point1.longitude);

  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

/**
 * Calculate great circle distance in nautical miles
 */
export const calculateDistanceNauticalMiles = (point1: Coordinates, point2: Coordinates): number => {
  return calculateDistance(point1, point2) * 0.539957; // Convert km to nautical miles
};

/**
 * Calculate bearing (direction) from point1 to point2
 * Returns bearing in degrees (0-360, where 0 is North)
 */
export const calculateBearing = (point1: Coordinates, point2: Coordinates): number => {
  const lat1Rad = toRadians(point1.latitude);
  const lat2Rad = toRadians(point2.latitude);
  const deltaLonRad = toRadians(point2.longitude - point1.longitude);

  const y = Math.sin(deltaLonRad) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLonRad);

  const bearingRad = Math.atan2(y, x);
  const bearingDeg = toDegrees(bearingRad);
  
  // Normalize to 0-360 degrees
  return (bearingDeg + 360) % 360;
};

/**
 * Calculate intermediate point along great circle path
 * @param start Starting coordinates
 * @param end Ending coordinates
 * @param fraction Fraction of the way along path (0.0 to 1.0)
 * @returns Intermediate coordinates
 */
export const calculateIntermediatePoint = (
  start: Coordinates,
  end: Coordinates,
  fraction: number
): Coordinates => {
  const lat1Rad = toRadians(start.latitude);
  const lon1Rad = toRadians(start.longitude);
  const lat2Rad = toRadians(end.latitude);
  const lon2Rad = toRadians(end.longitude);

  const distance = calculateDistance(start, end) / EARTH_RADIUS_KM; // Angular distance

  const a = Math.sin((1 - fraction) * distance) / Math.sin(distance);
  const b = Math.sin(fraction * distance) / Math.sin(distance);

  const x = a * Math.cos(lat1Rad) * Math.cos(lon1Rad) + b * Math.cos(lat2Rad) * Math.cos(lon2Rad);
  const y = a * Math.cos(lat1Rad) * Math.sin(lon1Rad) + b * Math.cos(lat2Rad) * Math.sin(lon2Rad);
  const z = a * Math.sin(lat1Rad) + b * Math.sin(lat2Rad);

  const latRad = Math.atan2(z, Math.sqrt(x * x + y * y));
  const lonRad = Math.atan2(y, x);

  return {
    latitude: toDegrees(latRad),
    longitude: toDegrees(lonRad)
  };
};

/**
 * Generate points along great circle path for visualization
 * @param start Starting coordinates
 * @param end Ending coordinates
 * @param numPoints Number of intermediate points to generate
 * @returns Array of coordinates along the path
 */
export const generateFlightPath = (
  start: Coordinates,
  end: Coordinates,
  numPoints: number = 100
): Coordinates[] => {
  const points: Coordinates[] = [start];
  
  for (let i = 1; i < numPoints - 1; i++) {
    const fraction = i / (numPoints - 1);
    points.push(calculateIntermediatePoint(start, end, fraction));
  }
  
  points.push(end);
  return points;
};

/**
 * Calculate current flight position based on departure and arrival times
 * @param departure Departure coordinates
 * @param arrival Arrival coordinates
 * @param departureTime Scheduled departure time
 * @param arrivalTime Scheduled arrival time
 * @param currentTime Current time
 * @returns Current estimated position and progress
 */
export const calculateEstimatedPosition = (
  departure: Coordinates,
  arrival: Coordinates,
  departureTime: Date,
  arrivalTime: Date,
  currentTime: Date = new Date()
): {
  position: Coordinates;
  progress: number; // 0-100
  elapsed: number; // minutes elapsed
  remaining: number; // minutes remaining
  totalFlightTime: number; // total flight time in minutes
} => {
  const totalFlightTimeMs = arrivalTime.getTime() - departureTime.getTime();
  const elapsedTimeMs = currentTime.getTime() - departureTime.getTime();
  
  // Calculate progress as a fraction (0-1)
  let progress = Math.max(0, Math.min(1, elapsedTimeMs / totalFlightTimeMs));
  
  // If flight hasn't started yet, progress is 0
  if (currentTime < departureTime) {
    progress = 0;
  }
  
  // If flight has landed, progress is 1
  if (currentTime > arrivalTime) {
    progress = 1;
  }
  
  const position = calculateIntermediatePoint(departure, arrival, progress);
  
  return {
    position,
    progress: progress * 100,
    elapsed: Math.max(0, elapsedTimeMs / (1000 * 60)),
    remaining: Math.max(0, (totalFlightTimeMs - elapsedTimeMs) / (1000 * 60)),
    totalFlightTime: totalFlightTimeMs / (1000 * 60)
  };
};

/**
 * Calculate distance from current position to destination
 */
export const calculateRemainingDistance = (
  currentPosition: Coordinates,
  destination: Coordinates
): {
  distanceKm: number;
  distanceNm: number;
  bearing: number;
} => {
  return {
    distanceKm: calculateDistance(currentPosition, destination),
    distanceNm: calculateDistanceNauticalMiles(currentPosition, destination),
    bearing: calculateBearing(currentPosition, destination)
  };
};

/**
 * Estimate arrival time based on current position and average speed
 * @param currentPosition Current aircraft position
 * @param destination Destination coordinates
 * @param groundSpeedKnots Average ground speed in knots
 * @returns Estimated arrival time
 */
export const estimateArrivalTime = (
  currentPosition: Coordinates,
  destination: Coordinates,
  groundSpeedKnots: number
): Date => {
  const remainingDistanceNm = calculateDistanceNauticalMiles(currentPosition, destination);
  const remainingTimeHours = remainingDistanceNm / groundSpeedKnots;
  const remainingTimeMs = remainingTimeHours * 60 * 60 * 1000;
  
  return new Date(Date.now() + remainingTimeMs);
};

/**
 * Convert coordinates to SVG map coordinates
 * Assumes equirectangular projection on a 1000x500 SVG
 */
export const projectToSVG = (
  coordinates: Coordinates,
  mapWidth: number = 1000,
  mapHeight: number = 500
): { x: number; y: number } => {
  // Simple equirectangular projection
  const x = ((coordinates.longitude + 180) / 360) * mapWidth;
  const y = ((90 - coordinates.latitude) / 180) * mapHeight;
  
  return { x, y };
};

/**
 * Convert SVG coordinates back to geographic coordinates
 */
export const projectFromSVG = (
  x: number,
  y: number,
  mapWidth: number = 1000,
  mapHeight: number = 500
): Coordinates => {
  const longitude = (x / mapWidth) * 360 - 180;
  const latitude = 90 - (y / mapHeight) * 180;
  
  return { latitude, longitude };
};

/**
 * Validate coordinates
 */
export const isValidCoordinates = (coordinates: Coordinates): boolean => {
  return (
    coordinates.latitude >= -90 &&
    coordinates.latitude <= 90 &&
    coordinates.longitude >= -180 &&
    coordinates.longitude <= 180
  );
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (coordinates: Coordinates): string => {
  const latDir = coordinates.latitude >= 0 ? 'N' : 'S';
  const lonDir = coordinates.longitude >= 0 ? 'E' : 'W';
  
  const lat = Math.abs(coordinates.latitude).toFixed(4);
  const lon = Math.abs(coordinates.longitude).toFixed(4);
  
  return `${lat}°${latDir}, ${lon}°${lonDir}`;
};

/**
 * Calculate average ground speed between two positions with timestamps
 */
export const calculateGroundSpeed = (
  position1: FlightPosition,
  position2: FlightPosition
): number | null => {
  if (!position1.timestamp || !position2.timestamp) {
    return null;
  }
  
  const distanceKm = calculateDistance(position1, position2);
  const timeHours = Math.abs(position2.timestamp.getTime() - position1.timestamp.getTime()) / (1000 * 60 * 60);
  
  if (timeHours === 0) return null;
  
  const speedKmh = distanceKm / timeHours;
  return speedKmh * 0.539957; // Convert to knots
};