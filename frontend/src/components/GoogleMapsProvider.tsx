'use client';

import React, { createContext, useContext, ReactNode } from 'react';
// useJsApiLoader handles injecting the Google Maps <script> tag safely to avoid duplicate loads.
import { useJsApiLoader } from '@react-google-maps/api';
// Custom hook that rotates API keys if the current one hits a billing/quota limit.
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';

// The specific Google Maps libraries we need:
// 'places' for autocomplete search, 'geometry' for distance calculations.
const LIBRARIES: ("places" | "geometry" | "visualization")[] = ["places", "geometry", "visualization"];

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
  currentKey: string;
}

// Context allows nested components (like the tracking map or address autocomplete)
// to know if the Maps API is ready without prop-drilling the isLoaded state.
const GoogleMapsContext = createContext<GoogleMapsContextType | null>(null);

/**
 * GoogleMapsProvider sits near the top of the React tree (in layout.tsx).
 * It ensures the Maps script is loaded exactly once for the whole app.
 */
export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const { currentKey } = useGoogleMapsKey();
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'fixnow-google-maps-script',
    googleMapsApiKey: currentKey || 'DUMMY_KEY',
    libraries: LIBRARIES,
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError, currentKey }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

// Custom hook wrapper around useContext.
// Includes a runtime check to prevent developers from using it outside the Provider.
export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
}
