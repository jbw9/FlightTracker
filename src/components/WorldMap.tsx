
import React, { useRef, useEffect, useState } from 'react';
import { Plane, MapPin, Clock } from 'lucide-react';
import { FlightTrackingData } from '../types/flight';
import { projectToSVG, generateFlightPath } from '../lib/geoUtils';

interface WorldMapProps {
  flightData: FlightTrackingData[];
  currentTime: Date;
}

export const WorldMap: React.FC<WorldMapProps> = ({ flightData, currentTime }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 1000, height: 500 });
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);

  // Create flat horizontal flight path with circular layout
  const getCircularPosition = (airportCode: string) => {
    const airportOrder = ['ORD', 'NRT', 'CGK']; // Order of airports
    const index = airportOrder.indexOf(airportCode);
    const totalAirports = airportOrder.length;
    
    // Center of the map
    const centerX = mapDimensions.width / 2;
    const centerY = mapDimensions.height / 2;
    
    // Space airports evenly across the screen width with margins
    const margin = mapDimensions.width * 0.1; // 10% margin on each side
    const availableWidth = mapDimensions.width - (2 * margin);
    const spacing = availableWidth / (totalAirports - 1);
    
    return {
      x: margin + (index * spacing),
      y: centerY
    };
  };

  const createFlatFlightPath = (data: FlightTrackingData) => {
    const fromPos = getCircularPosition(data.flight.from.code);
    const toPos = getCircularPosition(data.flight.to.code);
    
    // Create a gentle upward curve
    const midX = (fromPos.x + toPos.x) / 2;
    const midY = fromPos.y - 60; // Curve upward slightly
    
    return `M ${fromPos.x} ${fromPos.y} Q ${midX} ${midY} ${toPos.x} ${toPos.y}`;
  };

  // Get country flag emoji
  const getCountryFlag = (airportCode: string): string => {
    const flagMap: { [key: string]: string } = {
      'ORD': '🇺🇸', // Chicago, USA
      'NRT': '🇯🇵', // Tokyo, Japan
      'CGK': '🇮🇩', // Jakarta, Indonesia
      'LAX': '🇺🇸', // Los Angeles, USA
      'JFK': '🇺🇸', // New York, USA
      'LHR': '🇬🇧', // London, UK
      'CDG': '🇫🇷', // Paris, France
      'FRA': '🇩🇪', // Frankfurt, Germany
      'DXB': '🇦🇪', // Dubai, UAE
      'SIN': '🇸🇬', // Singapore
      'SYD': '🇦🇺', // Sydney, Australia
    };
    return flagMap[airportCode] || '🌍';
  };

  // Get current aircraft position on flat line
  const getCurrentPosition = (data: FlightTrackingData) => {
    const fromPos = getCircularPosition(data.flight.from.code);
    const toPos = getCircularPosition(data.flight.to.code);
    
    // Calculate progress along the straight line
    const progress = data.flight.progress || 0;
    const progressDecimal = progress / 100;
    
    return {
      x: fromPos.x + (toPos.x - fromPos.x) * progressDecimal,
      y: fromPos.y + (toPos.y - fromPos.y) * progressDecimal
    };
  };

  // Get status color for flight
  const getFlightColor = (data: FlightTrackingData) => {
    switch (data.flight.status) {
      case 'completed': return '#10B981'; // green
      case 'current': return data.isLive ? '#F59E0B' : '#F97316'; // amber/orange
      case 'upcoming': return '#6B7280'; // gray
      default: return '#6B7280';
    }
  };

  // Get aircraft rotation based on heading
  const getAircraftRotation = (data: FlightTrackingData) => {
    if (data.flight.liveData?.heading) {
      return data.flight.liveData.heading;
    }
    // Calculate bearing from current position to destination
    const from = data.currentPosition;
    const to = { latitude: data.flight.to.coordinates[0], longitude: data.flight.to.coordinates[1] };
    // Simple bearing calculation for display
    const deltaLon = to.longitude - from.longitude;
    const deltaLat = to.latitude - from.latitude;
    return Math.atan2(deltaLon, deltaLat) * (180 / Math.PI);
  };

  useEffect(() => {
    const updateDimensions = () => {
      if (mapContainerRef.current) {
        const rect = mapContainerRef.current.getBoundingClientRect();
        setMapDimensions({ width: 1000, height: 500 }); // Fixed dimensions for consistent projection
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div ref={mapContainerRef} className="relative w-full h-96 bg-gray-50 rounded-lg overflow-hidden">
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox="0 0 1000 500"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Light background */}
        <rect width="1000" height="500" fill="#f8fafc" />

        {/* Flight paths and dots */}
        {flightData.map((data) => (
          <g key={data.flight.id}>
            {/* Flat flight path */}
            <path
              d={createFlatFlightPath(data)}
              stroke={getFlightColor(data)}
              strokeWidth={selectedFlight === data.flight.id ? "8" : "7"}
              fill="none"
              strokeDasharray={data.flight.status === 'upcoming' ? '8,4' : 'none'}
              className={`transition-all duration-300 cursor-pointer hover:opacity-100 ${
                data.flight.status === 'current' ? 'opacity-90' : 'opacity-60'
              } ${selectedFlight === data.flight.id ? 'opacity-100' : ''}`}
              style={{ 
                filter: data.isLive ? 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))' : 'none'
              }}
              onClick={() => setSelectedFlight(selectedFlight === data.flight.id ? null : data.flight.id)}
            />

            {/* Departure airport dot with flag */}
            {(() => {
              const pos = getCircularPosition(data.flight.from.code);
              return (
                <g transform={`translate(${pos.x}, ${pos.y})`}>
                  {/* Background circle */}
                  <circle 
                    r={selectedFlight === data.flight.id ? "50" : "40"} 
                    fill="white"
                    stroke="#e2e8f0"
                    strokeWidth="5"
                    className="hover:scale-110 transition-transform cursor-pointer"
                    onClick={() => setSelectedFlight(selectedFlight === data.flight.id ? null : data.flight.id)}
                  />
                  {/* Country flag emoji */}
                  <text 
                    x="0" 
                    y="15" 
                    fontSize={selectedFlight === data.flight.id ? "44" : "36"} 
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                  >
                    {getCountryFlag(data.flight.from.code)}
                  </text>
                  {/* Airport name below */}
                  <text 
                    x="0" 
                    y="80" 
                    fontSize="18" 
                    fill="#374151" 
                    fontWeight="bold"
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                  >
                    {data.flight.from.city}
                  </text>
                </g>
              );
            })()}

            {/* Arrival airport dot with flag */}
            {(() => {
              const pos = getCircularPosition(data.flight.to.code);
              return (
                <g transform={`translate(${pos.x}, ${pos.y})`}>
                  {/* Background circle */}
                  <circle 
                    r={selectedFlight === data.flight.id ? "50" : "40"} 
                    fill="white"
                    stroke="#e2e8f0"
                    strokeWidth="5"
                    className="hover:scale-110 transition-transform cursor-pointer"
                    onClick={() => setSelectedFlight(selectedFlight === data.flight.id ? null : data.flight.id)}
                  />
                  {/* Country flag emoji */}
                  <text 
                    x="0" 
                    y="15" 
                    fontSize={selectedFlight === data.flight.id ? "44" : "36"} 
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                  >
                    {getCountryFlag(data.flight.to.code)}
                  </text>
                  {/* Airport name below */}
                  <text 
                    x="0" 
                    y="80" 
                    fontSize="18" 
                    fill="#374151" 
                    fontWeight="bold"
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                  >
                    {data.flight.to.city}
                  </text>
                </g>
              );
            })()}

            {/* Current aircraft position moving along the curved path */}
            {data.flight.status === 'current' && (() => {
              const pos = getCurrentPosition(data);
              
              return (
                <g transform={`translate(${pos.x}, ${pos.y})`} className="transition-all duration-1000 ease-in-out">
                  {/* Aircraft indicator */}
                  <circle 
                    r={data.isLive ? "20" : "18"} 
                    fill={data.isLive ? "#F59E0B" : "#F97316"}
                    className={data.isLive ? "animate-pulse" : ""}
                  />
                  
                  {/* Aircraft icon */}
                  <Plane 
                    size={30} 
                    className="text-white transform -translate-x-4 -translate-y-4"
                    style={{ fill: 'white' }}
                  />
                  
                  {/* Flight progress info */}
                  {selectedFlight === data.flight.id && (
                    <g transform="translate(15, -10)">
                      <rect 
                        x="0" 
                        y="0" 
                        width="100" 
                        height="40" 
                        fill="white" 
                        stroke="#e2e8f0" 
                        rx="4"
                        className="opacity-95"
                      />
                      <text x="6" y="12" fontSize="10" fontWeight="bold" fill="#374151">
                        {data.flight.flightNumber}
                      </text>
                      <text x="6" y="24" fontSize="8" fill="#6B7280">
                        {data.isLive ? 'Live' : 'Estimated'} • {data.flight.progress?.toFixed(0)}%
                      </text>
                      <text x="6" y="36" fontSize="8" fill="#6B7280">
                        {data.isLive ? 'Real-time tracking' : 'Schedule-based estimate'}
                      </text>
                    </g>
                  )}
                </g>
              );
            })()}
          </g>
        ))}
      </svg>


    </div>
  );
};
