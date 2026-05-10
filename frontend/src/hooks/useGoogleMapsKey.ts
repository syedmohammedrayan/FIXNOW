'use client';

import { useState, useEffect, useCallback } from 'react';

const GOOGLE_MAPS_KEYS = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEYS || '').split(',').filter(Boolean);

export function useGoogleMapsKey() {
  const [keyIndex, setKeyIndex] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('google_maps_key_index');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const [currentKey, setCurrentKey] = useState(GOOGLE_MAPS_KEYS[keyIndex] || '');

  const rotateKey = useCallback(() => {
    if (GOOGLE_MAPS_KEYS.length <= 1) {
      console.error("No more Google Maps keys to rotate to.");
      return;
    }
    const nextIndex = (keyIndex + 1) % GOOGLE_MAPS_KEYS.length;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('google_maps_key_index', nextIndex.toString());
      console.warn(`Rotating to Google Maps Key Index ${nextIndex}...`);
      // Reload page to re-initialize map with new key
      window.location.reload();
    }
  }, [keyIndex]);

  // Global listener for Google Maps authentication failures
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).gm_authFailure = () => {
        console.error("Google Maps global authentication failure detected. Rotating key...");
        rotateKey();
      };
    }
  }, [rotateKey]);

  useEffect(() => {
    setCurrentKey(GOOGLE_MAPS_KEYS[keyIndex] || '');
  }, [keyIndex]);

  return { currentKey, rotateKey, allKeys: GOOGLE_MAPS_KEYS };
}
