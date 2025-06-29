
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
    // Extract unique airports from flight data in order
    const airportOrder: string[] = [];
    flightData.forEach(data => {
      if (!airportOrder.includes(data.flight.from.code)) {
        airportOrder.push(data.flight.from.code);
      }
      if (!airportOrder.includes(data.flight.to.code)) {
        airportOrder.push(data.flight.to.code);
      }
    });
    
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
    const flag = flagMap[airportCode];
    return flag || '🌍';
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
            {/* Base flight path (gray background) */}
            <path
              d={createFlatFlightPath(data)}
              stroke={data.flight.status === 'upcoming' ? '#d1d5db' : '#e5e7eb'}
              strokeWidth={selectedFlight === data.flight.id ? "8" : "7"}
              fill="none"
              strokeDasharray={data.flight.status === 'upcoming' ? '8,4' : 'none'}
              className="transition-all duration-300"
            />
            
            {/* Progress path (colored based on completion) */}
            {data.flight.status === 'current' && data.flight.progress && (
              <path
                d={createFlatFlightPath(data)}
                stroke="#22c55e"
                strokeWidth={selectedFlight === data.flight.id ? "8" : "7"}
                fill="none"
                strokeDasharray={`${(data.flight.progress / 100) * 100} ${100 - (data.flight.progress / 100) * 100}`}
                strokeDashoffset="0"
                className="transition-all duration-1000 ease-out"
                style={{ 
                  filter: data.isLive ? 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.5))' : 'none'
                }}
              />
            )}
            
            {/* Completed flight path */}
            {data.flight.status === 'completed' && (
              <path
                d={createFlatFlightPath(data)}
                stroke="#22c55e"
                strokeWidth={selectedFlight === data.flight.id ? "8" : "7"}
                fill="none"
                className="transition-all duration-300"
              />
            )}
            
            {/* Clickable invisible overlay for interaction */}
            <path
              d={createFlatFlightPath(data)}
              stroke="transparent"
              strokeWidth="20"
              fill="none"
              className="cursor-pointer"
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
              const fromPos = getCircularPosition(data.flight.from.code);
              const toPos = getCircularPosition(data.flight.to.code);
              const progress = (data.flight.progress || 0) / 100;
              
              // Calculate position along the curved path
              const midX = (fromPos.x + toPos.x) / 2;
              const midY = fromPos.y - 60;
              
              // Quadratic Bézier curve calculation
              const t = progress;
              const pos = {
                x: Math.pow(1-t, 2) * fromPos.x + 2*(1-t)*t * midX + Math.pow(t, 2) * toPos.x,
                y: Math.pow(1-t, 2) * fromPos.y + 2*(1-t)*t * midY + Math.pow(t, 2) * toPos.y
              };
              
              return (
                <g transform={`translate(${pos.x}, ${pos.y})`} className="transition-all duration-1000 ease-in-out">
                  {/* Aircraft indicator */}
                  <circle 
                    r={data.isLive ? "18" : "16"} 
                    fill="#3b82f6"
                    stroke="white"
                    strokeWidth="3"
                    className={data.isLive ? "animate-pulse" : ""}
                  />
                  
                  {/* Aircraft icon */}
                  <Plane 
                    size={24} 
                    className="text-white transform -translate-x-3 -translate-y-3"
                    style={{ fill: 'white' }}
                  />
                  
                  {/* Flight progress info */}
                  {selectedFlight === data.flight.id && (
                    <g transform="translate(15, -10)">
                      <rect 
                        x="0" 
                        y="0" 
                        width="90" 
                        height="30" 
                        fill="white" 
                        stroke="#e2e8f0" 
                        rx="4"
                        className="opacity-95"
                      />
                      <text x="6" y="12" fontSize="10" fontWeight="bold" fill="#374151">
                        {data.flight.flightNumber}
                      </text>
                      <text x="6" y="24" fontSize="8" fill="#6B7280">
                        {data.isLive ? 'Live tracking' : 'Estimated position'}
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
