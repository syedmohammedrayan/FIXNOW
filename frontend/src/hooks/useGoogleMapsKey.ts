'use client';

import { useState, useEffect, useCallback } from 'react';

// Support multiple Google Maps API keys to rotate when one hits its daily quota limit.
// Keys are stored in a single comma-separated environment variable for simple configuration.
const GOOGLE_MAPS_KEYS = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEYS || '').split(',').filter(Boolean);

/**
 * useGoogleMapsKey — manages automatic key rotation when Google Maps authentication fails.
 * Persists the active key index in localStorage so refreshes start from the last working key.
 */
export function useGoogleMapsKey() {
  // keyIndex tracks which key in the array is currently active.
  const [keyIndex, setKeyIndex] = useState(0);
  // isMounted prevents localStorage access during SSR (Next.js renders server-side first).
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Restore the last-known working key index so we don't start at index 0 every page load.
    const saved = localStorage.getItem('google_maps_key_index');
    if (saved) {
      setKeyIndex(parseInt(saved, 10));
    }
  }, []);

  const [currentKey, setCurrentKey] = useState(GOOGLE_MAPS_KEYS[keyIndex] || '');

  // rotateKey switches to the next key and reloads the page because the Maps JS API
  // is loaded once via a script tag and can't be re-initialised in the same session.
  const rotateKey = useCallback(() => {
    if (GOOGLE_MAPS_KEYS.length <= 1) {
      console.error("No more Google Maps keys to rotate to.");
      return;
    }
    const nextIndex = (keyIndex + 1) % GOOGLE_MAPS_KEYS.length;
    
    if (typeof window !== 'undefined') {
      // Persist the index so after the reload we're still on the rotated key.
      localStorage.setItem('google_maps_key_index', nextIndex.toString());
      console.warn(`Rotating to Google Maps Key Index ${nextIndex}...`);
      // Page reload is the simplest way to re-initialise the Maps script with the new key.
      window.location.reload();
    }
  }, [keyIndex]);

  // Google Maps exposes gm_authFailure as a global callback for billing/key failures.
  // We hook into it to trigger automatic rotation without user intervention.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).gm_authFailure = () => {
        console.error("Google Maps global authentication failure detected. Rotating key...");
        rotateKey();
      };
    }
  }, [rotateKey]);

  // Sync the displayed key string whenever keyIndex changes.
  useEffect(() => {
    setCurrentKey(GOOGLE_MAPS_KEYS[keyIndex] || '');
  }, [keyIndex]);

  return { currentKey, rotateKey, allKeys: GOOGLE_MAPS_KEYS };
}
