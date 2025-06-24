
import React from 'react';
import { Plane, Clock, Calendar } from 'lucide-react';

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
  flightNumber?: string;
  aircraft?: string;
  progress?: number;
}

interface FlightInfoProps {
  flight?: Flight;
  title: string;
  timezone: string;
  currentTime: Date;
  type: 'current' | 'upcoming';
}

export const FlightInfo: React.FC<FlightInfoProps> = ({ 
  flight, 
  title, 
  timezone, 
  currentTime, 
  type 
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone === 'UTC' ? 'UTC' : timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleTimeString('en-US', options);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone === 'UTC' ? 'UTC' : timezone,
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getRemainingTime = () => {
    if (!flight) return null;
    const arrival = new Date(flight.arrival);
    const now = currentTime;
    const diff = arrival.getTime() - now.getTime();
    
    if (diff <= 0) return "Arrived";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = () => {
    if (!flight) return 'bg-gray-50 border-gray-200';
    switch (flight.status) {
      case 'current':
        return 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200';
      case 'upcoming':
        return 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    if (!flight) return <Clock className="w-4 h-4 text-gray-400" />;
    switch (flight.status) {
      case 'current':
        return <Plane className="w-4 h-4 text-amber-600 animate-pulse" />;
      case 'upcoming':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  if (!flight) {
    return (
      <div className={`p-4 rounded-xl border-2 ${getStatusColor()}`}>
        <div className="flex items-center gap-2 mb-3">
          {getStatusIcon()}
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">No {type} flight</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border-2 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        </div>
        {flight.status === 'current' && (
          <div className="text-right">
            <div className="text-xs text-amber-600 font-medium">ETA: {getRemainingTime()}</div>
            {flight.progress && (
              <div className="text-xs text-amber-600">{flight.progress}% Complete</div>
            )}
          </div>
        )}
        {flight.status === 'upcoming' && (
          <div className="text-xs text-blue-600 font-medium">
            In {getRemainingTime()}
          </div>
        )}
      </div>

      {/* Route */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800">{flight.from.code}</div>
          <div className="text-xs text-gray-600">{flight.from.city}</div>
        </div>
        
        <div className="flex-1 mx-3 relative">
          <div className="h-0.5 bg-gray-300 w-full"></div>
          <Plane className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 bg-white" />
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800">{flight.to.code}</div>
          <div className="text-xs text-gray-600">{flight.to.city}</div>
        </div>
      </div>

      {/* Times */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="text-center p-2 bg-white/50 rounded">
          <div className="text-xs text-gray-500">Departure</div>
          <div className="text-sm font-semibold text-gray-800">{formatTime(flight.departure)}</div>
          <div className="text-xs text-gray-600">{formatDate(flight.departure)}</div>
        </div>
        <div className="text-center p-2 bg-white/50 rounded">
          <div className="text-xs text-gray-500">Arrival</div>
          <div className="text-sm font-semibold text-gray-800">{formatTime(flight.arrival)}</div>
          <div className="text-xs text-gray-600">{formatDate(flight.arrival)}</div>
        </div>
      </div>

      {/* Flight details */}
      {flight.flightNumber && (
        <div className="flex justify-between items-center text-xs text-gray-600">
          <span>Flight: {flight.flightNumber}</span>
          {flight.aircraft && <span>{flight.aircraft}</span>}
        </div>
      )}
    </div>
  );
};
