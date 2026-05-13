'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';

const LIBRARIES: ("places" | "geometry" | "visualization")[] = ["places", "geometry", "visualization"];

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
  currentKey: string;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | null>(null);

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

export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
}
