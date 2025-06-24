# Flight Tracker

A real-time flight tracking web application built with React and TypeScript. Track flights around the world with an interactive map visualization, timezone support, and live status updates.

## 🚀 Features

- **Real-time Flight Tracking**: Live flight status with progress updates
- **Interactive World Map**: Visual flight paths with current aircraft position
- **Multi-timezone Support**: Display flight times in different timezones globally  
- **Flight Information Cards**: Detailed departure/arrival times and aircraft info
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS

## 🛠 Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks (useState, useEffect)
- **Routing**: React Router DOM
- **Data Fetching**: TanStack Query (React Query)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Date Handling**: date-fns
- **Form Handling**: React Hook Form with Zod validation

## 📁 Project Structure

```
FlightTracker/
├── src/
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui base components
│   │   ├── FlightInfo.tsx   # Flight information cards
│   │   ├── WorldMap.tsx     # Interactive world map
│   │   └── TimezoneSelector.tsx # Timezone selection dropdown
│   ├── data/                # Mock data and types
│   │   └── mockFlightData.ts # Flight data with coordinates
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   ├── pages/               # Page components
│   │   ├── Index.tsx        # Main dashboard page
│   │   └── NotFound.tsx     # 404 error page
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # App entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── components.json          # shadcn/ui configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── package.json            # Dependencies and scripts
```

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd FlightTracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:8080`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🎯 Key Components

### FlightInfo Component
- Displays flight details with departure/arrival information
- Shows real-time progress for current flights
- Supports timezone conversion for flight times
- Visual status indicators for different flight states

### WorldMap Component  
- SVG-based world map with flight path visualization
- Real-time aircraft position tracking
- Color-coded flight paths (completed, current, upcoming)
- Interactive hover effects and airport labels

### TimezoneSelector Component
- Dropdown for selecting different timezones
- Supports major global timezones
- Updates all flight times dynamically

## 📊 Data Structure

The application uses a structured flight data format:

```typescript
interface Flight {
  id: string;
  from: {
    code: string;      // Airport code (e.g., "LAX")
    city: string;      // City name
    coordinates: [number, number]; // [latitude, longitude]
  };
  to: {
    code: string;
    city: string;
    coordinates: [number, number];
  };
  departure: string;   // ISO date string
  arrival: string;     // ISO date string
  status: 'completed' | 'current' | 'upcoming';
  flightNumber?: string;
  aircraft?: string;
  progress?: number;   // 0-100 for current flights
}
```

## 🎨 UI/UX Features

- **Glassmorphism Design**: Modern backdrop blur effects
- **Gradient Backgrounds**: Beautiful color transitions
- **Responsive Layout**: Mobile-first design approach
- **Real-time Updates**: Live clock and progress tracking
- **Smooth Animations**: CSS transitions and micro-interactions
- **Accessibility**: Semantic HTML and keyboard navigation

## 🔧 Configuration

### shadcn/ui Setup
The project uses shadcn/ui with the following configuration:
- Style: default
- Base color: slate
- CSS variables: enabled
- TypeScript: enabled

### Tailwind CSS
Custom configuration with:
- Dark mode support
- Extended color palette
- Custom animations
- Container utilities

### TypeScript
Configured with:
- Path aliases (`@/*` points to `./src/*`)
- Strict type checking disabled for development
- React JSX support

## 🌍 Timezone Support

The application supports multiple timezones:
- UTC (Universal)
- US Timezones (ET, CT, MT, PT)
- European Timezones (GMT, CET)
- Asian Timezones (JST, CST, GST)
- Australian Timezone (AEDT)

## 🚀 Deployment

The project is optimized for deployment on:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

Build the project with:
```bash
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and tests
5. Submit a pull request

## 📝 License

This project was generated with Lovable AI platform.

## 🔗 Links

- **Lovable Project**: https://lovable.dev/projects/f3dd2b3d-8376-4975-8ff8-95ff476a1d32
- **Documentation**: [Lovable Docs](https://docs.lovable.dev)
- **Custom Domain Setup**: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)