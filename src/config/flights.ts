// Flight configuration - Update this with your actual flight details
export interface FlightConfig {
  id: string;
  // Flight identification
  flightNumber?: string; // e.g., "AA123", "BA456"
  callsign?: string; // Alternative callsign if different from flight number
  icao24?: string; // Aircraft ICAO 24-bit address (most reliable for tracking)

  // Route information
  from: {
    code: string; // Airport IATA code
    city: string;
    coordinates: [number, number]; // [latitude, longitude]
  };
  to: {
    code: string;
    city: string;
    coordinates: [number, number];
  };

  // Scheduled times (used for fallback calculations)
  departure: string; // ISO date string
  arrival: string; // ISO date string

  // Aircraft details (optional, for display)
  aircraft?: string; // e.g., "Boeing 737", "Airbus A320"
  airline?: string; // e.g., "American Airlines"

  // Tracking preferences
  priority: "high" | "medium" | "low"; // Which flights to update most frequently
  trackingEnabled: boolean; // Whether to actively track this flight
}

export const FLIGHT_CONFIG: FlightConfig[] = [
  {
    id: "jl55-ord-nrt",
    flightNumber: "JL55",
    callsign: "JAL55",
    from: {
      code: "ORD",
      city: "Chicago",
      coordinates: [41.9742, -87.9073],
    },
    to: {
      code: "NRT",
      city: "Tokyo Narita",
      coordinates: [35.7647, 140.3864],
    },
    departure: "2025-06-24T12:30:00-05:00", // June 24, 12:30 PM CDT
    arrival: "2025-06-25T15:15:00+09:00", // June 25, 3:15 PM JST (12h 45m later)
    aircraft: "Boeing 777-300",
    airline: "Japan Airlines",
    priority: "high",
    trackingEnabled: true,
  },
  {
    id: "jl729-nrt-cgk",
    flightNumber: "JL729",
    callsign: "JAL729",
    from: {
      code: "NRT",
      city: "Tokyo Narita",
      coordinates: [35.7647, 140.3864],
    },
    to: {
      code: "CGK",
      city: "Jakarta",
      coordinates: [-6.1256, 106.6558],
    },
    departure: "2025-06-25T18:05:00+09:00", // June 25, 6:05 PM JST
    arrival: "2025-06-25T23:55:00+07:00", // June 25, 11:55 PM WIB (7h 50m later)
    aircraft: "Boeing 787-8",
    airline: "Japan Airlines",
    priority: "high",
    trackingEnabled: true,
  },
];

// Configuration for API polling and updates
export const TRACKING_CONFIG = {
  // Update intervals in milliseconds
  HIGH_PRIORITY_INTERVAL: 30000, // 30 seconds for high priority flights
  MEDIUM_PRIORITY_INTERVAL: 60000, // 1 minute for medium priority flights
  LOW_PRIORITY_INTERVAL: 300000, // 5 minutes for low priority flights

  // How long to keep trying to find a flight before giving up
  MAX_SEARCH_ATTEMPTS: 10,
  SEARCH_INTERVAL: 60000, // 1 minute between search attempts

  // Cache settings
  CACHE_DURATION: 10000, // 10 seconds

  // Fallback calculations
  ENABLE_ESTIMATED_POSITIONS: true, // Calculate estimated positions when no live data
  POSITION_UPDATE_INTERVAL: 1000, // 1 second for smooth position updates
};

// Airport database - Add more airports as needed
export const AIRPORTS = {
  LAX: {
    code: "LAX",
    city: "Los Angeles",
    coordinates: [34.0522, -118.2437] as [number, number],
  },
  JFK: {
    code: "JFK",
    city: "New York",
    coordinates: [40.6413, -73.7781] as [number, number],
  },
  LHR: {
    code: "LHR",
    city: "London",
    coordinates: [51.47, -0.4543] as [number, number],
  },
  NRT: {
    code: "NRT",
    city: "Tokyo Narita",
    coordinates: [35.7647, 140.3864] as [number, number],
  },
  CDG: {
    code: "CDG",
    city: "Paris",
    coordinates: [49.0097, 2.5479] as [number, number],
  },
  FRA: {
    code: "FRA",
    city: "Frankfurt",
    coordinates: [50.0379, 8.5622] as [number, number],
  },
  DXB: {
    code: "DXB",
    city: "Dubai",
    coordinates: [25.2532, 55.3657] as [number, number],
  },
  SIN: {
    code: "SIN",
    city: "Singapore",
    coordinates: [1.3644, 103.9915] as [number, number],
  },
  SYD: {
    code: "SYD",
    city: "Sydney",
    coordinates: [-33.9399, 151.1753] as [number, number],
  },
  ORD: {
    code: "ORD",
    city: "Chicago O'Hare",
    coordinates: [41.9742, -87.9073] as [number, number],
  },
  CGK: {
    code: "CGK",
    city: "Jakarta",
    coordinates: [-6.1256, 106.6558] as [number, number],
  },
};

// Helper functions
export const getFlightById = (id: string): FlightConfig | undefined => {
  return FLIGHT_CONFIG.find((flight) => flight.id === id);
};

export const getActiveFlights = (): FlightConfig[] => {
  return FLIGHT_CONFIG.filter((flight) => flight.trackingEnabled);
};

export const getFlightsByPriority = (
  priority: "high" | "medium" | "low"
): FlightConfig[] => {
  return FLIGHT_CONFIG.filter(
    (flight) => flight.priority === priority && flight.trackingEnabled
  );
};

export const getUpdateInterval = (
  priority: "high" | "medium" | "low"
): number => {
  switch (priority) {
    case "high":
      return TRACKING_CONFIG.HIGH_PRIORITY_INTERVAL;
    case "medium":
      return TRACKING_CONFIG.MEDIUM_PRIORITY_INTERVAL;
    case "low":
      return TRACKING_CONFIG.LOW_PRIORITY_INTERVAL;
    default:
      return TRACKING_CONFIG.MEDIUM_PRIORITY_INTERVAL;
  }
};

// Instructions for customization
export const CUSTOMIZATION_GUIDE = `
HOW TO CUSTOMIZE YOUR FLIGHTS:

1. Update FLIGHT_CONFIG array with your actual flight details:
   - Replace flight numbers with your real flights
   - Add ICAO24 codes if you know them (most reliable for tracking)
   - Update departure/arrival times with your actual schedule
   - Set priority levels based on importance

2. Finding ICAO24 codes:
   - Visit flightradar24.com or similar site
   - Search for your flight number
   - Look for the aircraft registration (e.g., N123AA)
   - The ICAO24 is derived from this registration

3. Tracking priority levels:
   - 'high': Updates every 30 seconds (use for current/next flights)
   - 'medium': Updates every 1 minute (use for upcoming flights)
   - 'low': Updates every 5 minutes (use for reference flights)

4. Adding new airports:
   - Add entries to AIRPORTS object with IATA code and coordinates
   - Find coordinates at https://airportdata.io or similar sites

5. Testing your configuration:
   - Set trackingEnabled: false to disable tracking temporarily
   - Use browser console to check for API errors
   - Verify flight numbers match exactly with airline format
`;

console.log(CUSTOMIZATION_GUIDE);
