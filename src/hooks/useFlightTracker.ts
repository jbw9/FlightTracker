// React hook for managing flight tracking state and real-time updates

import { useState, useEffect, useCallback } from 'react';
import { flightTracker } from '../services/flightTracker';
import { FlightTrackingData, FlightError } from '../types/flight';
import { ENV, logDebug } from '../config/env';

interface UseFlightTrackerReturn {
  flightData: FlightTrackingData[];
  isLoading: boolean;
  isTracking: boolean;
  errors: FlightError[];
  stats: {
    totalFlights: number;
    liveFlights: number;
    activeFlights: number;
    lastUpdate: number;
    errors: number;
    isTracking: boolean;
  };
  
  // Actions
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  refreshFlight: (flightId: string) => Promise<void>;
  refreshAllFlights: () => Promise<void>;
  clearErrors: () => void;
}

export const useFlightTracker = (): UseFlightTrackerReturn => {
  const [flightData, setFlightData] = useState<FlightTrackingData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [errors, setErrors] = useState<FlightError[]>([]);
  const [stats, setStats] = useState({
    totalFlights: 0,
    liveFlights: 0,
    activeFlights: 0,
    lastUpdate: 0,
    errors: 0,
    isTracking: false
  });

  // Update flight data from service
  const updateFlightData = useCallback(() => {
    try {
      const trackedFlights = flightTracker.getTrackedFlights();
      const recentErrors = flightTracker.getRecentErrors();
      const trackingStats = flightTracker.getTrackingStats();

      setFlightData(trackedFlights);
      setErrors(recentErrors);
      setStats(trackingStats);
      setIsTracking(trackingStats.isTracking);

      logDebug('Flight data updated:', {
        flights: trackedFlights.length,
        errors: recentErrors.length,
        stats: trackingStats
      });
    } catch (error) {
      console.error('Error updating flight data:', error);
      setErrors(prev => [...prev, {
        type: 'CONFIGURATION_ERROR',
        message: 'Failed to update flight data from service',
        timestamp: new Date()
      }]);
    }
  }, []);

  // Start flight tracking
  const startTracking = useCallback(async () => {
    if (isTracking || isLoading) return;

    setIsLoading(true);
    try {
      logDebug('Starting flight tracking...');
      await flightTracker.startTracking();
      setIsTracking(true);
      updateFlightData();
      logDebug('Flight tracking started successfully');
    } catch (error) {
      console.error('Failed to start flight tracking:', error);
      setErrors(prev => [...prev, {
        type: 'CONFIGURATION_ERROR',
        message: 'Failed to start flight tracking service',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isTracking, isLoading, updateFlightData]);

  // Stop flight tracking
  const stopTracking = useCallback(() => {
    if (!isTracking) return;

    try {
      logDebug('Stopping flight tracking...');
      flightTracker.stopTracking();
      setIsTracking(false);
      logDebug('Flight tracking stopped');
    } catch (error) {
      console.error('Error stopping flight tracking:', error);
    }
  }, [isTracking]);

  // Refresh specific flight
  const refreshFlight = useCallback(async (flightId: string) => {
    try {
      logDebug(`Refreshing flight ${flightId}...`);
      await flightTracker.updateFlight(flightId);
      updateFlightData();
      logDebug(`Flight ${flightId} refreshed`);
    } catch (error) {
      console.error(`Error refreshing flight ${flightId}:`, error);
      setErrors(prev => [...prev, {
        type: 'API_ERROR',
        message: `Failed to refresh flight ${flightId}`,
        flightId,
        timestamp: new Date()
      }]);
    }
  }, [updateFlightData]);

  // Refresh all flights
  const refreshAllFlights = useCallback(async () => {
    if (!isTracking) return;

    try {
      logDebug('Refreshing all flights...');
      await flightTracker.updateAllFlights();
      updateFlightData();
      logDebug('All flights refreshed');
    } catch (error) {
      console.error('Error refreshing all flights:', error);
      setErrors(prev => [...prev, {
        type: 'API_ERROR',
        message: 'Failed to refresh all flights',
        timestamp: new Date()
      }]);
    }
  }, [isTracking, updateFlightData]);

  // Clear errors
  const clearErrors = useCallback(() => {
    flightTracker.clearErrors();
    setErrors([]);
  }, []);

  // Set up periodic updates
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      updateFlightData();
    }, ENV.MAP_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [isTracking, updateFlightData]);

  // Auto-start tracking if enabled
  useEffect(() => {
    if (ENV.ENABLE_REAL_TIME_TRACKING && !isTracking && !isLoading) {
      startTracking();
    }
  }, []);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      logDebug('Network connection restored');
      if (isTracking) {
        refreshAllFlights();
      }
    };

    const handleOffline = () => {
      logDebug('Network connection lost - switching to offline mode');
      setErrors(prev => [...prev, {
        type: 'NETWORK_ERROR',
        message: 'Network connection lost. Using cached/estimated positions.',
        timestamp: new Date()
      }]);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isTracking, refreshAllFlights]);

  // Error cleanup - remove old errors
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      setErrors(prev => prev.filter(error => error.timestamp > oneHourAgo));
    }, 5 * 60 * 1000); // Clean up every 5 minutes

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    flightData,
    isLoading,
    isTracking,
    errors,
    stats,
    startTracking,
    stopTracking,
    refreshFlight,
    refreshAllFlights,
    clearErrors
  };
};