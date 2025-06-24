// Main flight tracking service that combines configuration with live API data

import { openSkyService, ProcessedFlightData } from './openSkyApi';
import { FLIGHT_CONFIG, getActiveFlights, getUpdateInterval } from '../config/flights';
import { ENV, logDebug } from '../config/env';
import { 
  Flight, 
  FlightTrackingData, 
  LiveFlightData, 
  FlightError,
  FlightTrackingError,
  calculateFlightStatus,
  shouldTrackFlight 
} from '../types/flight';
import { 
  calculateEstimatedPosition, 
  generateFlightPath, 
  calculateDistance,
  calculateBearing 
} from '../lib/geoUtils';

class FlightTrackingService {
  private flightData: Map<string, FlightTrackingData> = new Map();
  private updateTimers: Map<string, NodeJS.Timeout> = new Map();
  private errorLog: FlightError[] = [];
  private isTracking = false;

  /**
   * Start tracking all enabled flights
   */
  async startTracking(): Promise<void> {
    if (this.isTracking) {
      logDebug('Flight tracking already started');
      return;
    }

    this.isTracking = true;
    logDebug('Starting flight tracking service');

    const activeFlights = getActiveFlights();
    
    for (const flightConfig of activeFlights) {
      await this.initializeFlight(flightConfig);
    }

    logDebug(`Initialized tracking for ${activeFlights.length} flights`);
  }

  /**
   * Stop all flight tracking
   */
  stopTracking(): void {
    if (!this.isTracking) return;

    logDebug('Stopping flight tracking service');
    
    // Clear all timers
    this.updateTimers.forEach(timer => clearInterval(timer));
    this.updateTimers.clear();
    
    this.isTracking = false;
    logDebug('Flight tracking stopped');
  }

  /**
   * Initialize tracking for a single flight
   */
  private async initializeFlight(flightConfig: any): Promise<void> {
    try {
      const flight = this.convertConfigToFlight(flightConfig);
      
      // Generate flight path
      const path = {
        coordinates: generateFlightPath(
          { latitude: flight.from.coordinates[0], longitude: flight.from.coordinates[1] },
          { latitude: flight.to.coordinates[0], longitude: flight.to.coordinates[1] }
        ),
        distance: calculateDistance(
          { latitude: flight.from.coordinates[0], longitude: flight.from.coordinates[1] },
          { latitude: flight.to.coordinates[0], longitude: flight.to.coordinates[1] }
        ),
        bearing: calculateBearing(
          { latitude: flight.from.coordinates[0], longitude: flight.from.coordinates[1] },
          { latitude: flight.to.coordinates[0], longitude: flight.to.coordinates[1] }
        )
      };

      // Get initial position (live or estimated)
      const currentPosition = await this.getCurrentPosition(flight);
      
      const trackingData: FlightTrackingData = {
        flight,
        path,
        currentPosition,
        lastUpdated: new Date(),
        isLive: false,
        updateInterval: getUpdateInterval(flight.priority)
      };

      // Try to get live data
      await this.updateLiveData(trackingData);
      
      this.flightData.set(flight.id, trackingData);

      // Set up periodic updates if flight should be tracked
      if (shouldTrackFlight(flight)) {
        this.scheduleUpdates(flight.id);
      }

      logDebug(`Initialized flight ${flight.id} (${flight.flightNumber || 'Unknown'})`);
    } catch (error) {
      this.logError('CONFIGURATION_ERROR', `Failed to initialize flight ${flightConfig.id}`, flightConfig.id);
      console.error('Error initializing flight:', error);
    }
  }

  /**
   * Convert flight configuration to Flight type
   */
  private convertConfigToFlight(config: any): Flight {
    return {
      id: config.id,
      flightNumber: config.flightNumber,
      callsign: config.callsign || config.flightNumber,
      icao24: config.icao24,
      from: {
        code: config.from.code,
        city: config.from.city,
        coordinates: config.from.coordinates
      },
      to: {
        code: config.to.code,
        city: config.to.city,
        coordinates: config.to.coordinates
      },
      departure: config.departure,
      arrival: config.arrival,
      aircraft: config.aircraft,
      airline: config.airline,
      priority: config.priority,
      trackingEnabled: config.trackingEnabled,
      status: calculateFlightStatus({
        departure: config.departure,
        arrival: config.arrival
      } as Flight)
    };
  }

  /**
   * Get current position (live or estimated)
   */
  private async getCurrentPosition(flight: Flight): Promise<{latitude: number, longitude: number}> {
    // Try to get live position first
    if (flight.icao24) {
      try {
        const liveData = await openSkyService.getFlightByIcao24(flight.icao24);
        if (liveData) {
          return { latitude: liveData.latitude, longitude: liveData.longitude };
        }
      } catch (error) {
        logDebug(`Live data not available for ICAO24 ${flight.icao24}, using estimated position`);
      }
    }

    if (flight.callsign) {
      try {
        const liveData = await openSkyService.getFlightByCallsign(flight.callsign);
        if (liveData) {
          return { latitude: liveData.latitude, longitude: liveData.longitude };
        }
      } catch (error) {
        logDebug(`Live data not available for callsign ${flight.callsign}, using estimated position`);
      }
    }

    // Fall back to estimated position
    const estimated = calculateEstimatedPosition(
      { latitude: flight.from.coordinates[0], longitude: flight.from.coordinates[1] },
      { latitude: flight.to.coordinates[0], longitude: flight.to.coordinates[1] },
      new Date(flight.departure),
      new Date(flight.arrival)
    );

    return estimated.position;
  }

  /**
   * Update live data for a flight
   */
  private async updateLiveData(trackingData: FlightTrackingData): Promise<void> {
    const { flight } = trackingData;
    let liveData: ProcessedFlightData | null = null;

    try {
      // Try ICAO24 first (most reliable)
      if (flight.icao24) {
        liveData = await openSkyService.getFlightByIcao24(flight.icao24);
      }
      
      // Fall back to callsign if ICAO24 doesn't work
      if (!liveData && flight.callsign) {
        liveData = await openSkyService.getFlightByCallsign(flight.callsign);
      }

      if (liveData) {
        // Update flight with live data
        flight.liveData = {
          latitude: liveData.latitude,
          longitude: liveData.longitude,
          altitude: liveData.altitude,
          heading: liveData.heading,
          velocity: liveData.velocity,
          icao24: liveData.icao24,
          callsign: liveData.callsign,
          onGround: liveData.onGround,
          lastUpdate: liveData.lastUpdate,
          country: liveData.country
        };

        trackingData.currentPosition = {
          latitude: liveData.latitude,
          longitude: liveData.longitude
        };
        trackingData.isLive = true;
        trackingData.lastUpdated = new Date();

        // Calculate progress based on live position
        const totalDistance = trackingData.path.distance;
        const remainingDistance = calculateDistance(
          trackingData.currentPosition,
          { latitude: flight.to.coordinates[0], longitude: flight.to.coordinates[1] }
        );
        flight.progress = Math.max(0, Math.min(100, ((totalDistance - remainingDistance) / totalDistance) * 100));

        logDebug(`Updated live data for flight ${flight.id}: ${flight.progress?.toFixed(1)}% complete`);
      } else {
        // Use estimated position
        await this.updateEstimatedPosition(trackingData);
      }
    } catch (error) {
      this.logError('API_ERROR', `Failed to update live data for flight ${flight.id}`, flight.id);
      await this.updateEstimatedPosition(trackingData);
    }
  }

  /**
   * Update estimated position when live data is not available
   */
  private async updateEstimatedPosition(trackingData: FlightTrackingData): Promise<void> {
    const { flight } = trackingData;
    
    const estimated = calculateEstimatedPosition(
      { latitude: flight.from.coordinates[0], longitude: flight.from.coordinates[1] },
      { latitude: flight.to.coordinates[0], longitude: flight.to.coordinates[1] },
      new Date(flight.departure),
      new Date(flight.arrival)
    );

    trackingData.currentPosition = estimated.position;
    flight.progress = estimated.progress;
    flight.estimatedTimeRemaining = estimated.remaining;
    trackingData.isLive = false;
    trackingData.lastUpdated = new Date();

    logDebug(`Updated estimated position for flight ${flight.id}: ${flight.progress?.toFixed(1)}% complete`);
  }

  /**
   * Schedule periodic updates for a flight
   */
  private scheduleUpdates(flightId: string): void {
    const trackingData = this.flightData.get(flightId);
    if (!trackingData) return;

    // Clear existing timer
    const existingTimer = this.updateTimers.get(flightId);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    // Set up new timer
    const timer = setInterval(async () => {
      const data = this.flightData.get(flightId);
      if (data && shouldTrackFlight(data.flight)) {
        await this.updateLiveData(data);
      } else {
        // Stop tracking this flight
        this.stopTrackingFlight(flightId);
      }
    }, trackingData.updateInterval);

    this.updateTimers.set(flightId, timer);
    logDebug(`Scheduled updates for flight ${flightId} every ${trackingData.updateInterval}ms`);
  }

  /**
   * Stop tracking a specific flight
   */
  private stopTrackingFlight(flightId: string): void {
    const timer = this.updateTimers.get(flightId);
    if (timer) {
      clearInterval(timer);
      this.updateTimers.delete(flightId);
    }
    logDebug(`Stopped tracking flight ${flightId}`);
  }

  /**
   * Get all tracked flights
   */
  getTrackedFlights(): FlightTrackingData[] {
    return Array.from(this.flightData.values());
  }

  /**
   * Get specific flight data
   */
  getFlightData(flightId: string): FlightTrackingData | undefined {
    return this.flightData.get(flightId);
  }

  /**
   * Force update of specific flight
   */
  async updateFlight(flightId: string): Promise<void> {
    const trackingData = this.flightData.get(flightId);
    if (trackingData) {
      await this.updateLiveData(trackingData);
    }
  }

  /**
   * Force update of all flights
   */
  async updateAllFlights(): Promise<void> {
    const updatePromises = Array.from(this.flightData.keys()).map(flightId => 
      this.updateFlight(flightId)
    );
    await Promise.all(updatePromises);
  }

  /**
   * Get tracking statistics
   */
  getTrackingStats() {
    const flights = this.getTrackedFlights();
    const liveFlights = flights.filter(f => f.isLive);
    const activeFlights = flights.filter(f => shouldTrackFlight(f.flight));
    
    return {
      totalFlights: flights.length,
      liveFlights: liveFlights.length,
      activeFlights: activeFlights.length,
      lastUpdate: Math.max(...flights.map(f => f.lastUpdated.getTime())),
      errors: this.errorLog.length,
      isTracking: this.isTracking
    };
  }

  /**
   * Log tracking errors
   */
  private logError(type: FlightTrackingError, message: string, flightId?: string): void {
    const error: FlightError = {
      type,
      message,
      flightId,
      timestamp: new Date()
    };
    
    this.errorLog.push(error);
    
    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }
    
    console.error(`Flight Tracking Error [${type}]:`, message, flightId ? `(Flight: ${flightId})` : '');
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): FlightError[] {
    return this.errorLog.slice(-limit);
  }

  /**
   * Clear error log
   */
  clearErrors(): void {
    this.errorLog = [];
  }
}

// Export singleton instance
export const flightTracker = new FlightTrackingService();