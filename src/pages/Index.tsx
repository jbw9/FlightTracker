import React, { useState, useEffect } from "react";
import { WorldMap } from "../components/WorldMap";
import { FlightInfo } from "../components/FlightInfo";
import { TimezoneSelector } from "../components/TimezoneSelector";
import { useFlightTracker } from "../hooks/useFlightTracker";
import { calculateFlightStatus } from "../types/flight";
import { Plane, AlertCircle, Wifi, WifiOff, RefreshCw } from "lucide-react";

const Index = () => {
  const [selectedTimezone, setSelectedTimezone] = useState("auto");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [detectedTimezone, setDetectedTimezone] =
    useState<string>("America/Chicago");

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
    clearErrors,
  } = useFlightTracker();

  // Auto-detect timezone on mount
  useEffect(() => {
    const detectTimezone = () => {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Map detected timezone to our supported timezones
      if (
        userTimezone.includes("Chicago") ||
        userTimezone.includes("Central")
      ) {
        setDetectedTimezone("America/Chicago");
      } else if (
        userTimezone.includes("Jakarta") ||
        userTimezone.includes("Indonesia")
      ) {
        setDetectedTimezone("Asia/Jakarta");
      } else {
        // Default to Chicago time for other locations
        setDetectedTimezone("America/Chicago");
      }
    };

    detectTimezone();
  }, []);

  // Get the effective timezone (auto-detected or manually selected)
  const getEffectiveTimezone = () => {
    return selectedTimezone === "auto" ? detectedTimezone : selectedTimezone;
  };

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

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Get current and next flights from real data
  const currentFlights = flightData.filter(
    (data) => calculateFlightStatus(data.flight, currentTime) === "current"
  );
  const upcomingFlights = flightData.filter(
    (data) => calculateFlightStatus(data.flight, currentTime) === "upcoming"
  );

  // If no current flight, show next flight as current
  const currentFlight = currentFlights[0]?.flight || upcomingFlights[0]?.flight;
  const nextFlight = currentFlights[0]?.flight
    ? upcomingFlights[0]?.flight
    : upcomingFlights[1]?.flight;
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
    if (isLoading)
      return {
        text: "Starting...",
        color: "text-yellow-600",
        icon: RefreshCw,
        animate: "animate-spin",
      };
    if (!isTracking)
      return {
        text: "Offline",
        color: "text-gray-600",
        icon: WifiOff,
        animate: "",
      };
    if (!isOnline)
      return {
        text: "No Network",
        color: "text-red-600",
        icon: WifiOff,
        animate: "",
      };
    if (errors.length > 0)
      return {
        text: "Issues",
        color: "text-orange-600",
        icon: AlertCircle,
        animate: "",
      };
    return {
      text: "Live Tracking",
      color: "text-green-600",
      icon: Wifi,
      animate: "",
    };
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
                <Plane className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Flight Tracker
                </h1>
              </div>
            </div>

            {/* Live Status - Right aligned on mobile */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-full px-3 sm:px-4 py-2 border border-white/20">
                <trackingStatus.icon
                  className={`w-3 h-3 ${trackingStatus.color} ${trackingStatus.animate}`}
                />
                <span
                  className={`text-xs sm:text-sm font-medium ${trackingStatus.color}`}
                >
                  <span className="hidden sm:inline">
                    {trackingStatus.text} •{" "}
                  </span>
                  {currentTime.toLocaleTimeString()}
                </span>
              </div>

              {/* Control buttons */}
              <div className="flex items-center gap-2">
                {!isTracking && (
                  <button
                    onClick={startTracking}
                    disabled={isLoading}
                    className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    <span className="hidden sm:inline">Start Tracking</span>
                    <span className="sm:hidden">Start</span>
                  </button>
                )}

                {errors.length > 0 && (
                  <button
                    onClick={clearErrors}
                    className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-medium hover:bg-red-600 transition-colors flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">
                      Clear ({errors.length})
                    </span>
                    <span className="sm:hidden">{errors.length}</span>
                  </button>
                )}
              </div>

              <div className="hidden sm:block">
                <TimezoneSelector
                  selectedTimezone={selectedTimezone}
                  onTimezoneChange={setSelectedTimezone}
                  detectedTimezone={detectedTimezone}
                />
              </div>
            </div>
          </div>

          {/* Mobile Timezone Selector */}
          <div className="sm:hidden mt-2 flex justify-center">
            <TimezoneSelector
              selectedTimezone={selectedTimezone}
              onTimezoneChange={setSelectedTimezone}
              detectedTimezone={detectedTimezone}
            />
          </div>

          {/* Total Journey Time */}
          {getTotalRemainingTime() && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full px-4 sm:px-6 py-2">
                <Plane className="w-4 h-4" />
                <span className="text-sm sm:text-base font-medium">
                  {getTotalRemainingTime()}
                </span>
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
            timezone={getEffectiveTimezone()}
            currentTime={currentTime}
            type="current"
          />
          <FlightInfo
            flight={nextFlight}
            title="Next Flight"
            timezone={getEffectiveTimezone()}
            currentTime={currentTime}
            type="upcoming"
          />
        </div>

        {/* World Map */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <WorldMap flightData={flightData} currentTime={currentTime} />
        </div>
      </main>
    </div>
  );
};

export default Index;
