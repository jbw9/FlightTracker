// Environment configuration with defaults
export const ENV = {
  // OpenSky Network API
  OPENSKY_API_BASE_URL: import.meta.env.VITE_OPENSKY_API_BASE_URL || 'https://opensky-network.org/api',
  OPENSKY_USERNAME: import.meta.env.VITE_OPENSKY_USERNAME || null,
  OPENSKY_PASSWORD: import.meta.env.VITE_OPENSKY_PASSWORD || null,
  
  // Backup API (AviationStack)
  AVIATIONSTACK_API_KEY: import.meta.env.VITE_AVIATIONSTACK_API_KEY || null,
  AVIATIONSTACK_API_BASE_URL: import.meta.env.VITE_AVIATIONSTACK_API_BASE_URL || 'http://api.aviationstack.com/v1',
  
  // Update intervals (in milliseconds)
  FLIGHT_UPDATE_INTERVAL_HIGH: parseInt(import.meta.env.VITE_FLIGHT_UPDATE_INTERVAL_HIGH || '30000'),
  FLIGHT_UPDATE_INTERVAL_MEDIUM: parseInt(import.meta.env.VITE_FLIGHT_UPDATE_INTERVAL_MEDIUM || '60000'),
  FLIGHT_UPDATE_INTERVAL_LOW: parseInt(import.meta.env.VITE_FLIGHT_UPDATE_INTERVAL_LOW || '300000'),
  
  // Feature flags
  ENABLE_REAL_TIME_TRACKING: import.meta.env.VITE_ENABLE_REAL_TIME_TRACKING !== 'false',
  ENABLE_FALLBACK_ESTIMATION: import.meta.env.VITE_ENABLE_FALLBACK_ESTIMATION !== 'false',
  ENABLE_DEBUG_LOGGING: import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true',
  
  // Map configuration
  MAP_UPDATE_INTERVAL: parseInt(import.meta.env.VITE_MAP_UPDATE_INTERVAL || '1000'),
  MAP_ANIMATION_DURATION: parseInt(import.meta.env.VITE_MAP_ANIMATION_DURATION || '2000'),
  
  // Development flags
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
};

// Validation and warnings
if (ENV.ENABLE_DEBUG_LOGGING) {
  console.log('Flight Tracker Environment Configuration:', ENV);
}

// Warn about missing configurations
if (!ENV.OPENSKY_API_BASE_URL) {
  console.warn('OpenSky API base URL not configured, using default');
}

if (ENV.AVIATIONSTACK_API_KEY) {
  console.log('AviationStack API key detected - backup API available');
} else if (ENV.ENABLE_DEBUG_LOGGING) {
  console.log('No AviationStack API key - using only OpenSky Network');
}

// Helper functions
export const getUpdateInterval = (priority: 'high' | 'medium' | 'low'): number => {
  switch (priority) {
    case 'high': return ENV.FLIGHT_UPDATE_INTERVAL_HIGH;
    case 'medium': return ENV.FLIGHT_UPDATE_INTERVAL_MEDIUM;
    case 'low': return ENV.FLIGHT_UPDATE_INTERVAL_LOW;
    default: return ENV.FLIGHT_UPDATE_INTERVAL_MEDIUM;
  }
};

export const isFeatureEnabled = (feature: keyof typeof ENV): boolean => {
  return Boolean(ENV[feature]);
};

export const logDebug = (...args: any[]): void => {
  if (ENV.ENABLE_DEBUG_LOGGING) {
    console.log('[Flight Tracker Debug]', ...args);
  }
};