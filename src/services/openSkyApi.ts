export interface OpenSkyFlightState {
  icao24: string;          // Unique ICAO 24-bit address of the transponder
  callsign: string | null; // Callsign of the vehicle (8 chars)
  origin_country: string;  // Country name inferred from the ICAO 24-bit address
  time_position: number | null; // Unix timestamp (seconds) for the last position update
  last_contact: number;    // Unix timestamp (seconds) for the last update in general
  longitude: number | null; // WGS-84 longitude in decimal degrees
  latitude: number | null;  // WGS-84 latitude in decimal degrees
  baro_altitude: number | null; // Barometric altitude in meters
  on_ground: boolean;      // true if aircraft is on ground (sends ADS-B surface position reports)
  velocity: number | null; // Velocity over ground in m/s
  true_track: number | null; // True track in decimal degrees clockwise from north (north=0°)
  vertical_rate: number | null; // Vertical rate in m/s (positive is climbing)
  sensors: number[] | null; // IDs of the receivers which contributed to this state vector
  geo_altitude: number | null; // Geometric altitude in meters
  squawk: string | null;   // The transponder code aka Squawk
  spi: boolean;           // Whether flight status indicates special purpose indicator
  position_source: number; // Origin of this state's position (0 = ADS-B, 1 = ASTERIX, 2 = MLAT)
}

export interface OpenSkyResponse {
  time: number;
  states: OpenSkyFlightState[] | null;
}

export interface ProcessedFlightData {
  icao24: string;
  callsign: string;
  latitude: number;
  longitude: number;
  altitude: number; // in meters
  velocity: number; // in m/s
  heading: number; // in degrees
  onGround: boolean;
  lastUpdate: Date;
  country: string;
}

class OpenSkyNetworkService {
  private readonly BASE_URL = 'https://opensky-network.org/api';
  private readonly CACHE_DURATION = 10000; // 10 seconds cache
  private cache: Map<string, { data: ProcessedFlightData; timestamp: number }> = new Map();

  /**
   * Get all current flight states
   */
  async getAllFlights(): Promise<ProcessedFlightData[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/states/all`);
      
      if (!response.ok) {
        throw new Error(`OpenSky API error: ${response.status} ${response.statusText}`);
      }

      const data: OpenSkyResponse = await response.json();
      
      if (!data.states) {
        return [];
      }

      return data.states
        .filter(this.isValidFlightState)
        .map(this.processFlightState);
    } catch (error) {
      console.error('Error fetching all flights:', error);
      throw new Error('Failed to fetch flight data from OpenSky Network');
    }
  }

  /**
   * Get flight by callsign (flight number)
   */
  async getFlightByCallsign(callsign: string): Promise<ProcessedFlightData | null> {
    const cacheKey = `callsign_${callsign}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // First try to get all flights and filter by callsign
      const allFlights = await this.getAllFlights();
      const flight = allFlights.find(f => 
        f.callsign.trim().toUpperCase() === callsign.trim().toUpperCase()
      );

      if (flight) {
        this.cache.set(cacheKey, { data: flight, timestamp: Date.now() });
        return flight;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching flight ${callsign}:`, error);
      return null;
    }
  }

  /**
   * Get flights by ICAO 24-bit address
   */
  async getFlightByIcao24(icao24: string): Promise<ProcessedFlightData | null> {
    const cacheKey = `icao24_${icao24}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.BASE_URL}/states/all?icao24=${icao24}`);
      
      if (!response.ok) {
        throw new Error(`OpenSky API error: ${response.status} ${response.statusText}`);
      }

      const data: OpenSkyResponse = await response.json();
      
      if (!data.states || data.states.length === 0) {
        return null;
      }

      const state = data.states[0];
      if (!this.isValidFlightState(state)) {
        return null;
      }

      const processedFlight = this.processFlightState(state);
      this.cache.set(cacheKey, { data: processedFlight, timestamp: Date.now() });
      
      return processedFlight;
    } catch (error) {
      console.error(`Error fetching flight ${icao24}:`, error);
      return null;
    }
  }

  /**
   * Get flights within a bounding box (useful for specific regions)
   */
  async getFlightsInBounds(
    minLat: number, 
    maxLat: number, 
    minLon: number, 
    maxLon: number
  ): Promise<ProcessedFlightData[]> {
    try {
      const url = `${this.BASE_URL}/states/all?lamin=${minLat}&lamax=${maxLat}&lomin=${minLon}&lomax=${maxLon}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`OpenSky API error: ${response.status} ${response.statusText}`);
      }

      const data: OpenSkyResponse = await response.json();
      
      if (!data.states) {
        return [];
      }

      return data.states
        .filter(this.isValidFlightState)
        .map(this.processFlightState);
    } catch (error) {
      console.error('Error fetching flights in bounds:', error);
      throw new Error('Failed to fetch bounded flight data from OpenSky Network');
    }
  }

  /**
   * Validate flight state has required data
   */
  private isValidFlightState(state: OpenSkyFlightState): boolean {
    return (
      state.latitude !== null &&
      state.longitude !== null &&
      state.callsign !== null &&
      state.callsign.trim() !== '' &&
      !state.on_ground // Only airborne flights
    );
  }

  /**
   * Process raw OpenSky state into our format
   */
  private processFlightState(state: OpenSkyFlightState): ProcessedFlightData {
    return {
      icao24: state.icao24,
      callsign: (state.callsign || '').trim(),
      latitude: state.latitude!,
      longitude: state.longitude!,
      altitude: state.baro_altitude || state.geo_altitude || 0,
      velocity: state.velocity || 0,
      heading: state.true_track || 0,
      onGround: state.on_ground,
      lastUpdate: new Date(state.last_contact * 1000),
      country: state.origin_country
    };
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const openSkyService = new OpenSkyNetworkService();