
import React, { useState, useEffect } from 'react';
import { WorldMap } from '../components/WorldMap';
import { FlightInfo } from '../components/FlightInfo';
import { TimezoneSelector } from '../components/TimezoneSelector';
import { useFlightTracker } from '../hooks/useFlightTracker';
import { calculateFlightStatus } from '../types/flight';
import { Plane, AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';

const Index = () => {
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Use the flight tracker hook
  const {
    flightData,
    isLoading,
    isTracking,
    errors,
    stats,
    startTracking,
    stopTracking,
    refreshAllFlights,
    clearErrors
  } = useFlightTracker();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get current and next flights from real data
  const currentFlights = flightData.filter(data => 
    calculateFlightStatus(data.flight, currentTime) === 'current'
  );
  const upcomingFlights = flightData.filter(data => 
    calculateFlightStatus(data.flight, currentTime) === 'upcoming'
  );
  const currentFlight = currentFlights[0]?.flight;
  const nextFlight = upcomingFlights[0]?.flight;
  const finalDestination = flightData[flightData.length - 1]?.flight;

  // Calculate total remaining time to final destination
  const getTotalRemainingTime = () => {
    if (!finalDestination) return null;
    const finalArrival = new Date(finalDestination.arrival);
    const now = currentTime;
    const diff = finalArrival.getTime() - now.getTime();
    
    if (diff <= 0) return "Journey Complete";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m to ${finalDestination.to.city}`;
    }
    return `${hours}h ${minutes}m to ${finalDestination.to.city}`;
  };

  // Get tracking status display
  const getTrackingStatus = () => {
    if (isLoading) return { text: 'Starting...', color: 'text-yellow-600', icon: RefreshCw, animate: 'animate-spin' };
    if (!isTracking) return { text: 'Offline', color: 'text-gray-600', icon: WifiOff, animate: '' };
    if (!isOnline) return { text: 'No Network', color: 'text-red-600', icon: WifiOff, animate: '' };
    if (errors.length > 0) return { text: 'Issues', color: 'text-orange-600', icon: AlertCircle, animate: '' };
    return { text: 'Live Tracking', color: 'text-green-600', icon: Wifi, animate: '' };
  };

  const trackingStatus = getTrackingStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Flight Tracker
                </h1>
                <p className="text-sm text-gray-600">Track my journey around the world</p>
              </div>
            </div>

            {/* Live Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
                <trackingStatus.icon 
                  className={`w-3 h-3 ${trackingStatus.color} ${trackingStatus.animate}`} 
                />
                <span className={`text-sm font-medium ${trackingStatus.color}`}>
                  {trackingStatus.text} • {currentTime.toLocaleTimeString()}
                </span>
              </div>
              
              {/* Control buttons */}
              <div className="flex items-center gap-2">
                {!isTracking ? (
                  <button
                    onClick={startTracking}
                    disabled={isLoading}
                    className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    Start Tracking
                  </button>
                ) : (
                  <button
                    onClick={refreshAllFlights}
                    disabled={isLoading}
                    className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                )}
                
                {errors.length > 0 && (
                  <button
                    onClick={clearErrors}
                    className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-medium hover:bg-red-600 transition-colors flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    Clear ({errors.length})
                  </button>
                )}
              </div>
              
              <TimezoneSelector 
                selectedTimezone={selectedTimezone}
                onTimezoneChange={setSelectedTimezone}
              />
            </div>
          </div>

          {/* Total Journey Time */}
          {getTotalRemainingTime() && (
            <div className="mt-3 text-center">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full px-6 py-2">
                <Plane className="w-4 h-4" />
                <span className="font-medium">{getTotalRemainingTime()}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Flight Information Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <FlightInfo 
            flight={currentFlight}
            title="Current Flight"
            timezone={selectedTimezone}
            currentTime={currentTime}
            type="current"
          />
          <FlightInfo 
            flight={nextFlight}
            title="Next Flight"
            timezone={selectedTimezone}
            currentTime={currentTime}
            type="upcoming"
          />
        </div>

        {/* World Map */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <WorldMap 
            flightData={flightData}
            currentTime={currentTime}
          />
        </div>

      </main>
    </div>
  );
};

export default Index;
