
import React, { useRef, useEffect, useState } from 'react';
import { Plane } from 'lucide-react';

interface Flight {
  id: string;
  from: {
    code: string;
    city: string;
    coordinates: [number, number];
  };
  to: {
    code: string;
    city: string;
    coordinates: [number, number];
  };
  departure: string;
  arrival: string;
  status: 'completed' | 'current' | 'upcoming';
  progress?: number;
}

interface WorldMapProps {
  flights: Flight[];
  currentTime: Date;
}

export const WorldMap: React.FC<WorldMapProps> = ({ flights, currentTime }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 1000, height: 500 });

  // Convert lat/lon to SVG coordinates (simple equirectangular projection)
  const projectCoordinates = (lat: number, lon: number) => {
    const x = ((lon + 180) / 360) * mapDimensions.width;
    const y = ((90 - lat) / 180) * mapDimensions.height;
    return [x, y];
  };

  // Calculate current position for active flight
  const getCurrentFlightPosition = (flight: Flight) => {
    if (flight.status !== 'current' || !flight.progress) return null;
    
    const [fromX, fromY] = projectCoordinates(flight.from.coordinates[0], flight.from.coordinates[1]);
    const [toX, toY] = projectCoordinates(flight.to.coordinates[0], flight.to.coordinates[1]);
    
    const currentX = fromX + (toX - fromX) * (flight.progress / 100);
    const currentY = fromY + (toY - fromY) * (flight.progress / 100);
    
    return [currentX, currentY];
  };

  // Create curved path between two points
  const createFlightPath = (from: [number, number], to: [number, number]) => {
    const [x1, y1] = projectCoordinates(from[0], from[1]);
    const [x2, y2] = projectCoordinates(to[0], to[1]);
    
    // Create a curve by adding a control point
    const midX = (x1 + x2) / 2;
    const midY = Math.min(y1, y2) - 50; // Curve upward
    
    return `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;
  };

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setMapDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div className="relative w-full h-96 bg-gray-50 rounded-lg overflow-hidden">
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background */}
        <rect width="100%" height="100%" fill="#f8fafc" />

        {/* World map outline (simplified) */}
        <g stroke="#e2e8f0" strokeWidth="1" fill="#f1f5f9">
          {/* Simplified continents */}
          <path d="M150 120 Q200 100 280 130 L320 140 Q350 160 320 200 L280 220 Q200 240 150 200 Q120 160 150 120 Z" />
          <path d="M400 150 Q480 120 550 140 L580 160 Q600 200 570 240 L520 260 Q450 280 400 250 Q370 200 400 150 Z" />
          <path d="M650 130 Q720 110 780 130 L820 150 Q850 180 820 220 L780 240 Q720 260 650 230 Q620 180 650 130 Z" />
          <path d="M750 250 Q800 230 850 250 L880 270 Q900 300 870 330 L830 350 Q780 370 750 340 Q720 300 750 250 Z" />
          <path d="M80 280 Q130 260 180 280 L210 300 Q230 330 200 360 L160 380 Q110 400 80 370 Q50 330 80 280 Z" />
        </g>

        {/* Flight paths */}
        {flights.map((flight, index) => (
          <g key={flight.id}>
            {/* Flight path line */}
            <path
              d={createFlightPath(flight.from.coordinates, flight.to.coordinates)}
              stroke={
                flight.status === 'completed' 
                  ? '#10B981' 
                  : flight.status === 'current' 
                    ? '#F59E0B' 
                    : '#6B7280'
              }
              strokeWidth="2"
              fill="none"
              strokeDasharray={flight.status === 'upcoming' ? '5,5' : 'none'}
              className={flight.status === 'current' ? 'opacity-80' : 'opacity-60'}
            />

            {/* Departure airport */}
            <g transform={`translate(${projectCoordinates(flight.from.coordinates[0], flight.from.coordinates[1])})`}>
              <circle 
                r="4" 
                fill={flight.status === 'completed' ? '#10B981' : '#6B7280'}
                className="hover:scale-125 transition-transform cursor-pointer"
              />
              <text 
                x="8" 
                y="-8" 
                fontSize="10" 
                fill="#374151" 
                fontWeight="bold"
                className="pointer-events-none"
              >
                {flight.from.code}
              </text>
            </g>

            {/* Arrival airport */}
            <g transform={`translate(${projectCoordinates(flight.to.coordinates[0], flight.to.coordinates[1])})`}>
              <circle 
                r="4" 
                fill={
                  flight.status === 'completed' 
                    ? '#10B981' 
                    : flight.status === 'current' 
                      ? '#F59E0B' 
                      : '#6B7280'
                }
                className="hover:scale-125 transition-transform cursor-pointer"
              />
              <text 
                x="8" 
                y="-8" 
                fontSize="10" 
                fill="#374151" 
                fontWeight="bold"
                className="pointer-events-none"
              >
                {flight.to.code}
              </text>
            </g>
          </g>
        ))}

        {/* Current flight position */}
        {flights
          .filter(flight => flight.status === 'current')
          .map(flight => {
            const position = getCurrentFlightPosition(flight);
            if (!position) return null;
            
            return (
              <g key={`current-${flight.id}`} transform={`translate(${position[0]}, ${position[1]})`}>
                <circle 
                  r="6" 
                  fill="#F59E0B" 
                  className="animate-pulse"
                />
                <Plane 
                  size={10} 
                  className="text-white transform -translate-x-1.25 -translate-y-1.25"
                  style={{ fill: 'white' }}
                />
              </g>
            );
          })
        }
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-white/20">
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-green-500"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-amber-500"></div>
            <span>Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-gray-400 border-dashed border-t"></div>
            <span>Upcoming</span>
          </div>
          <div className="flex items-center gap-2">
            <Plane size={12} className="text-amber-500" />
            <span>Live Position</span>
          </div>
        </div>
      </div>
    </div>
  );
};
