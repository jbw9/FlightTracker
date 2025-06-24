
export interface Flight {
  id: string;
  from: {
    code: string;
    city: string;
    coordinates: [number, number]; // [lat, lon]
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
  progress?: number; // 0-100 for current flights
}

export const mockFlightData = {
  traveler: {
    name: "Flight Tracker",
    currentLocation: "In Transit"
  },
  flights: [
    {
      id: "1",
      from: {
        code: "LAX",
        city: "Los Angeles",
        coordinates: [34.0522, -118.2437] as [number, number]
      },
      to: {
        code: "JFK",
        city: "New York",
        coordinates: [40.7128, -74.0060] as [number, number]
      },
      departure: "2024-06-24T08:00:00Z",
      arrival: "2024-06-24T16:30:00Z",
      status: "completed" as const,
      flightNumber: "AA123",
      aircraft: "Boeing 737"
    },
    {
      id: "2",
      from: {
        code: "JFK",
        city: "New York",
        coordinates: [40.7128, -74.0060] as [number, number]
      },
      to: {
        code: "LHR",
        city: "London",
        coordinates: [51.5074, -0.1278] as [number, number]
      },
      departure: "2024-06-24T20:00:00Z",
      arrival: "2024-06-25T08:00:00Z",
      status: "current" as const,
      flightNumber: "BA456",
      aircraft: "Airbus A350",
      progress: 65
    },
    {
      id: "3",
      from: {
        code: "LHR",
        city: "London",
        coordinates: [51.5074, -0.1278] as [number, number]
      },
      to: {
        code: "NRT",
        city: "Tokyo",
        coordinates: [35.6762, 139.6503] as [number, number]
      },
      departure: "2024-06-25T14:00:00Z",
      arrival: "2024-06-26T10:00:00Z",
      status: "upcoming" as const,
      flightNumber: "JL789",
      aircraft: "Boeing 787"
    }
  ]
};
