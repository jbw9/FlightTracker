// Unified flight data types for both API and configuration data

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Airport {
  code: string;    // IATA code (e.g., "LAX")
  city: string;
  coordinates: [number, number]; // [latitude, longitude]
  icao?: string;   // ICAO code (e.g., "KLAX")
  name?: string;   // Full airport name
  timezone?: string; // Airport timezone
}

export interface LiveFlightData {
  // Position data
  latitude: number;
  longitude: number;
  altitude: number;     // in meters
  heading: number;      // in degrees (0-360)
  velocity: number;     // ground speed in m/s
  verticalRate?: number; // climb/descent rate in m/s
  
  // Aircraft identification
  icao24: string;       // Unique aircraft identifier
  callsign: string;     // Flight callsign/number
  
  // Status
  onGround: boolean;
  lastUpdate: Date;
  
  // Additional data
  country?: string;
  squawk?: string;      // Transponder code
}

export interface FlightStatus {
  status: 'scheduled' | 'boarding' | 'departed' | 'enroute' | 'delayed' | 'landed' | 'cancelled';
  actualDeparture?: Date;
  actualArrival?: Date;
  estimatedArrival?: Date;
  delay?: number;       // delay in minutes
}

export interface Flight {
  // Identification
  id: string;
  flightNumber?: string;
  callsign?: string;
  icao24?: string;      // Most reliable for tracking
  
  // Route
  from: Airport;
  to: Airport;
  
  // Schedule
  departure: string;    // ISO date string - scheduled
  arrival: string;      // ISO date string - scheduled
  
  // Aircraft details
  aircraft?: string;    // e.g., "Boeing 737-800"
  airline?: string;     // e.g., "American Airlines"
  registration?: string; // Aircraft registration (tail number)
  
  // Live data (populated by API)
  liveData?: LiveFlightData;
  flightStatus?: FlightStatus;
  
  // Calculated data
  progress?: number;    // 0-100 percentage
  estimatedPosition?: Coordinates;
  remainingDistance?: number; // in km
  estimatedTimeRemaining?: number; // in minutes
  
  // Configuration
  priority: 'high' | 'medium' | 'low';
  trackingEnabled: boolean;
  
  // Legacy status for backward compatibility
  status: 'completed' | 'current' | 'upcoming';
}

export interface FlightPath {
  coordinates: Coordinates[];
  distance: number;     // total distance in km
  bearing: number;      // initial bearing in degrees
}

export interface FlightTrackingData {
  flight: Flight;
  path: FlightPath;
  currentPosition: Coordinates;
  lastUpdated: Date;
  isLive: boolean;      // true if using live API data, false if estimated
  updateInterval: number; // milliseconds between updates
}

// API Response types for different services

export interface OpenSkyApiResponse {
  time: number;
  states: Array<[
    string,    // icao24
    string,    // callsign
    string,    // origin_country
    number,    // time_position
    number,    // last_contact
    number,    // longitude
    number,    // latitude
    number,    // baro_altitude
    boolean,   // on_ground
    number,    // velocity
    number,    // true_track
    number,    // vertical_rate
    number[],  // sensors
    number,    // geo_altitude
    string,    // squawk
    boolean,   // spi
    number     // position_source
  ]>;
}

// Utility types for flight operations

export interface FlightSearchParams {
  flightNumber?: string;
  callsign?: string;
  icao24?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  date?: Date;
}

export interface TrackingMetrics {
  totalFlights: number;
  activeFlights: number;
  lastUpdate: Date;
  apiCallsToday: number;
  successRate: number;
}

// Error types

export type FlightTrackingError = 
  | 'FLIGHT_NOT_FOUND'
  | 'API_RATE_LIMIT'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'INVALID_FLIGHT_DATA'
  | 'CONFIGURATION_ERROR';

export interface FlightError {
  type: FlightTrackingError;
  message: string;
  flightId?: string;
  timestamp: Date;
  retryAfter?: number; // seconds
}

// Helper type guards

export const isLiveFlightData = (data: any): data is LiveFlightData => {
  return data && 
    typeof data.latitude === 'number' &&
    typeof data.longitude === 'number' &&
    typeof data.icao24 === 'string' &&
    typeof data.callsign === 'string';
};

export const isValidFlight = (flight: any): flight is Flight => {
  return flight &&
    typeof flight.id === 'string' &&
    flight.from &&
    flight.to &&
    typeof flight.departure === 'string' &&
    typeof flight.arrival === 'string';
};

// Status calculation helpers

export const calculateFlightStatus = (
  flight: Flight,
  currentTime: Date = new Date()
): 'completed' | 'current' | 'upcoming' => {
  const departureTime = new Date(flight.departure);
  const arrivalTime = new Date(flight.arrival);
  
  if (currentTime < departureTime) {
    return 'upcoming';
  } else if (currentTime > arrivalTime) {
    return 'completed';
  } else {
    return 'current';
  }
};

export const isFlightActive = (flight: Flight, currentTime: Date = new Date()): boolean => {
  const status = calculateFlightStatus(flight, currentTime);
  return status === 'current';
};

export const shouldTrackFlight = (flight: Flight, currentTime: Date = new Date()): boolean => {
  return flight.trackingEnabled && 
    (isFlightActive(flight, currentTime) || calculateFlightStatus(flight, currentTime) === 'upcoming');
};