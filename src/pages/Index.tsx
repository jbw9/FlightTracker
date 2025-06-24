
import React, { useState, useEffect } from 'react';
import { WorldMap } from '../components/WorldMap';
import { FlightInfo } from '../components/FlightInfo';
import { TimezoneSelector } from '../components/TimezoneSelector';
import { mockFlightData } from '../data/mockFlightData';
import { Plane } from 'lucide-react';

const Index = () => {
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const currentFlight = mockFlightData.flights.find(flight => flight.status === 'current');
  const nextFlight = mockFlightData.flights.find(flight => flight.status === 'upcoming');
  const finalDestination = mockFlightData.flights[mockFlightData.flights.length - 1];

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
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  Live tracking • {currentTime.toLocaleTimeString()}
                </span>
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
            flights={mockFlightData.flights}
            currentTime={currentTime}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
