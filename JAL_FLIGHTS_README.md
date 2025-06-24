# Your JAL Flight Tracking Setup

## ✈️ **Your Flights Configured**

Your Flight Tracker is now set up to track your actual JAL flights:

### **JL55: Chicago O'Hare → Tokyo Narita**
- **Flight**: Japan Airlines JL55 
- **Route**: ORD → NRT
- **Aircraft**: Boeing 787-9
- **Departure**: June 25, 2025 at 11:50 AM CDT (Chicago time)
- **Arrival**: June 26, 2025 at 3:35 PM JST (Tokyo time)
- **Flight Time**: ~13 hours

### **JL729: Tokyo Narita → Jakarta**
- **Flight**: Japan Airlines JL729
- **Route**: NRT → CGK  
- **Aircraft**: Boeing 787-8
- **Departure**: June 27, 2025 at 10:50 AM JST (Tokyo time)
- **Arrival**: June 27, 2025 at 4:55 PM WIB (Jakarta time)
- **Flight Time**: ~7 hours

## 🚀 **Quick Start**

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **The app will automatically:**
   - Track both flights with high priority (30-second updates)
   - Try to find live aircraft positions using OpenSky Network
   - Show accurate great circle flight paths on the world map
   - Display estimated positions when live data isn't available

## 🔍 **What You'll See**

### **Current Status (June 24, 2025)**
- Both flights show as "**Upcoming**" since they haven't departed yet
- You'll see estimated countdown timers to departure
- Flight paths are drawn on the accurate world map

### **When JL55 Departs (June 25)**
- Status changes to "**Current**" 
- Real-time aircraft position tracking begins
- Live altitude, speed, and heading display
- Progress percentage across the Pacific

### **During Layover in Tokyo**
- JL55 shows "**Completed**" 
- JL729 remains "**Upcoming**"
- Clear visual of your journey progress

### **When JL729 Departs (June 27)**  
- JL729 becomes "**Current**"
- Live tracking continues to Jakarta
- Final destination countdown

## 🛠 **Finding Your Specific Aircraft**

For the most accurate tracking, you can add the ICAO24 codes of your specific aircraft:

### **How to Find ICAO24 Codes:**

1. **Visit [FlightRadar24.com](https://www.flightradar24.com)**
2. **Search for "JL55" on your departure date**
3. **Click on your flight when it appears**
4. **Look for aircraft registration** (like "JA123A")
5. **Add it to the config:**

```typescript
// In src/config/flights.ts
{
  id: "jl55-ord-nrt",
  flightNumber: "JL55",
  icao24: "JA123A", // ← Add the code here
  // ... rest of config
}
```

## 📡 **Live Data Sources**

- **Real-time positions**: OpenSky Network (free, worldwide ADS-B data)
- **Fallback tracking**: Mathematical estimation based on departure/arrival times
- **Flight paths**: Great circle calculations (most efficient routes)
- **Map data**: Accurate world continent shapes

## 🌏 **Your Route Visualization**

The app displays:
- **Great circle route** from Chicago to Tokyo (over the North Pacific)
- **Connecting route** from Tokyo to Jakarta (over Southeast Asia)
- **Live aircraft positions** with correct heading orientation
- **Interactive map** - click flights for detailed info

## ⚙️ **Customization Options**

Edit `src/config/flights.ts` to:
- **Update actual departure times** from your boarding passes
- **Add ICAO24 codes** for precise aircraft tracking  
- **Adjust tracking priorities** (high/medium/low update frequencies)
- **Enable/disable specific flights**

## 🔧 **Troubleshooting**

### **No Live Data?**
- Normal for flights that haven't departed yet
- App automatically uses estimated positions
- Live tracking begins when aircraft is airborne

### **Flight Not Found?**
- Try both "JL55" and "JAL55" callsigns
- Add ICAO24 code for most reliable tracking
- Check flight dates are correct

### **Performance Issues?**
- Both flights set to "high" priority for best tracking
- Can reduce to "medium" if needed
- Clear old errors with the "Clear" button

---

## 🎯 **Ready to Track!**

Your Flight Tracker is configured and ready to monitor your JAL journey from Chicago to Jakarta via Tokyo. The system will automatically detect when your flights become active and provide real-time tracking with accurate positioning on the world map.

**Safe travels! ✈️🌏**