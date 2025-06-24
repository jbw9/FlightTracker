# Flight Tracker Setup Guide

## Quick Start

Your Flight Tracker is now ready to track real flights! Here's how to set it up with your actual flight details:

## 1. Configure Your Flights

Edit `src/config/flights.ts` and update the `FLIGHT_CONFIG` array with your real flight information:

```typescript
export const FLIGHT_CONFIG: FlightConfig[] = [
  {
    id: "my-flight-1",
    flightNumber: "AA123",  // Replace with your actual flight number
    // icao24: "A12345",    // Uncomment and add if you know the aircraft ICAO code
    from: {
      code: "LAX",          // Departure airport IATA code
      city: "Los Angeles",
      coordinates: [34.0522, -118.2437]  // [latitude, longitude]
    },
    to: {
      code: "JFK",          // Arrival airport IATA code  
      city: "New York",
      coordinates: [40.6413, -73.7781]
    },
    departure: "2024-06-24T08:00:00Z",  // ISO date string
    arrival: "2024-06-24T16:30:00Z",
    aircraft: "Boeing 737",
    airline: "American Airlines",
    priority: "high",       // high = 30s updates, medium = 1min, low = 5min
    trackingEnabled: true
  }
  // Add more flights here...
];
```

## 2. Finding Flight Information

### Flight Numbers
- Use the exact format from your airline (e.g., "AA123", "BA456", "LH401")
- Check your boarding pass or airline confirmation email

### Aircraft ICAO24 Code (Optional but Recommended)
This is the most reliable way to track your specific aircraft:

1. Visit [FlightRadar24.com](https://www.flightradar24.com)
2. Search for your flight number
3. Click on your flight
4. Look for the aircraft registration (e.g., "N123AA")
5. The ICAO24 code is derived from this registration

### Airport Coordinates
Common airports are already included in the `AIRPORTS` object. For new airports:
1. Find IATA codes at [IATA Airport Codes](https://www.iata.org/en/publications/directories/code-search/)
2. Get coordinates from [AirportData.io](https://airportdata.io)

## 3. Update Tracking Priorities

Set appropriate priorities for your flights:

- **High Priority** (`priority: "high"`): Updates every 30 seconds
  - Use for current flights or flights departing within 24 hours
  
- **Medium Priority** (`priority: "medium"`): Updates every 1 minute  
  - Use for flights departing within a week
  
- **Low Priority** (`priority: "low"`): Updates every 5 minutes
  - Use for reference flights or distant future flights

## 4. Environment Configuration (Optional)

Create a `.env` file in the project root for advanced configuration:

```bash
# Copy from .env.example
cp .env.example .env
```

Key settings:
- `VITE_ENABLE_REAL_TIME_TRACKING=true` - Auto-start tracking
- `VITE_ENABLE_DEBUG_LOGGING=true` - Show debug info in console
- `VITE_FLIGHT_UPDATE_INTERVAL_HIGH=30000` - High priority update interval (ms)

## 5. Start the Application

```bash
npm run dev
```

The app will:
1. Auto-start flight tracking if enabled
2. Try to find your flights using the OpenSky Network API (free)
3. Fall back to estimated positions based on schedule if live data unavailable
4. Update positions in real-time
5. Show live altitude, speed, and heading when available

## Features

### Real-Time Tracking
- ✅ Live aircraft position from ADS-B data
- ✅ Accurate flight paths using great circle calculations  
- ✅ Real altitude, speed, and heading display
- ✅ Automatic fallback to estimated positions

### Interactive Map
- ✅ Accurate world map with continent shapes
- ✅ Click flights for detailed information
- ✅ Live vs estimated position indicators
- ✅ Aircraft icons with correct heading rotation

### Smart Updates
- ✅ Different update frequencies based on priority
- ✅ Automatic error handling and retries
- ✅ Network status monitoring
- ✅ Offline mode with cached data

### Status Monitoring
- ✅ Live tracking status indicator
- ✅ Error reporting and clearing
- ✅ Flight statistics dashboard
- ✅ Manual refresh controls

## Troubleshooting

### Flight Not Found
1. **Check flight number format** - Use exact airline format (AA123, not American 123)
2. **Add ICAO24 code** - Most reliable tracking method
3. **Verify flight is active** - OpenSky only shows airborne aircraft
4. **Check dates** - Make sure departure/arrival times are correct

### No Live Data
- The app will automatically fall back to estimated positions
- Estimated positions are calculated based on your scheduled departure/arrival times
- This is normal for flights that haven't departed yet or don't have ADS-B coverage

### API Rate Limits
- OpenSky Network is free but has rate limits
- The app automatically handles this with caching and smart update intervals
- Consider getting an OpenSky account for higher limits if needed

### Performance
- Disable unused flights by setting `trackingEnabled: false`
- Use lower priority for non-critical flights
- Clear old errors regularly

## Data Sources

- **Live Flight Data**: [OpenSky Network](https://opensky-network.org) (Free, community-driven)
- **World Map**: Simplified accurate continent shapes
- **Calculations**: Great circle distance and bearing formulas
- **Fallback**: Mathematical position estimation based on schedule

## Privacy & Security

- All flight tracking data comes from public ADS-B sources
- No personal information is transmitted
- All processing happens locally in your browser
- No data is stored on external servers (except public flight APIs)

---

## Need Help?

Check the browser console (F12) for detailed logs if you enable debug mode. The app provides comprehensive error reporting and status information to help troubleshoot any issues.