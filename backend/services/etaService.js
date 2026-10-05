// Google Maps JavaScript Client — used server-side so the API key stays secret.
const { Client } = require("@googlemaps/google-maps-services-js");
require('dotenv').config();

const client = new Client({});

// Support multiple API keys to rotate when one hits the daily quota limit.
const GOOGLE_MAPS_KEYS = (process.env.GOOGLE_MAPS_API_KEYS || '').split(',').filter(Boolean);
// Tracks which key was last successful so we resume from there instead of always starting at index 0.
let currentKeyIndex = 0;

// Tries each key in turn until one succeeds or all fail — handles per-key quota exhaustion.
async function callGoogleMapsWithFallback(method, params) {
  let lastError;
  for (let i = 0; i < GOOGLE_MAPS_KEYS.length; i++) {
    const key = GOOGLE_MAPS_KEYS[(currentKeyIndex + i) % GOOGLE_MAPS_KEYS.length];
    try {
      const response = await client[method]({
        params: { ...params, key }
      });
      
      // Check for API-level errors returned inside a 200 response body.
      if (response.data.status === 'OVER_QUERY_LIMIT' || response.data.status === 'REQUEST_DENIED') {
        throw new Error(`Google Maps API Error: ${response.data.status}`);
      }

      // Persist the working key index so next call starts there (avoids re-trying failed keys).
      currentKeyIndex = (currentKeyIndex + i) % GOOGLE_MAPS_KEYS.length;
      return response;
    } catch (err) {
      console.warn(`Google Maps Key ${i} failed (${err.message}). Trying next...`);
      lastError = err;
    }
  }
  throw lastError;
}

/**
 * Calculates real driving ETA from technician to customer using Google Distance Matrix API.
 * Uses live traffic data (duration_in_traffic) when available.
 * Falls back to Haversine calculation if no API keys are configured or if the API errors.
 */
async function getRealETA(origin, destination) {
  try {
    if (GOOGLE_MAPS_KEYS.length === 0) {
      return getFallbackETA(origin, destination);
    }

    const response = await callGoogleMapsWithFallback('distancematrix', {
      origins: [`${origin.lat},${origin.lng}`],
      destinations: [`${destination.lat},${destination.lng}`],
      mode: 'driving',
      departure_time: 'now' // enables traffic-aware duration
    });

    const element = response.data.rows[0].elements[0];
    if (element.status === 'OK') {
      const distanceValue = element.distance.value; // in metres
      // Prefer traffic-adjusted duration over static duration for accuracy.
      const durationValue = element.duration_in_traffic ? element.duration_in_traffic.value : element.duration.value;

      return {
        success: true,
        distance: element.distance.text,
        duration: element.duration_in_traffic ? element.duration_in_traffic.text : element.duration.text,
        durationValue: durationValue,
      };
    } else {
      throw new Error(element.status);
    }
  } catch (error) {
    if (error.response && error.response.status === 403) {
      // Silent swallow for 403 — key billing issue, fallback handles it.
    } else {
      console.error('Google Maps ETA Error:', error.message);
    }
    return getFallbackETA(origin, destination);
  }
}

/**
 * Gets ETA from one origin to multiple destinations in a single API call —
 * more efficient than calling getRealETA in a loop when ranking nearby technicians.
 */
async function getBatchETA(origin, destinations) {
  try {
    if (GOOGLE_MAPS_KEYS.length === 0 || !destinations || destinations.length === 0) {
      return destinations.map(dest => getFallbackETA(origin, dest));
    }

    const response = await callGoogleMapsWithFallback('distancematrix', {
      origins: [`${origin.lat},${origin.lng}`],
      destinations: destinations.map(d => `${d.lat},${d.lng}`),
      mode: 'driving',
      departure_time: 'now'
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Matrix API Status: ${response.data.status}`);
    }

    // Map each element back to its destination by index.
    const results = response.data.rows[0].elements.map((element, index) => {
      if (element.status === 'OK') {
        const durationValue = element.duration_in_traffic ? element.duration_in_traffic.value : element.duration.value;
        return {
          success: true,
          distance: element.distance.text,
          duration: element.duration_in_traffic ? element.duration_in_traffic.text : element.duration.text,
          durationValue: durationValue,
          distanceValue: element.distance.value
        };
      } else {
        // Single-destination failure — fall back only for that entry.
        return getFallbackETA(origin, destinations[index]);
      }
    });

    return results;
  } catch (error) {
    console.error('Batch ETA Error:', error.message);
    // If the whole batch call fails, fall back for every destination individually.
    return destinations.map(dest => getFallbackETA(origin, dest));
  }
}

/**
 * Haversine-based ETA estimate used when the Google Maps API is unavailable.
 * Assumes a straight-line distance and 30 km/h average city speed — not traffic-aware.
 */
function getFallbackETA(origin, destination) {
  // Haversine formula calculates the great-circle distance between two lat/lng points.
  const R = 6371; // Earth's radius in km
  const dLat = (destination.lat - origin.lat) * Math.PI / 180;
  const dLng = (destination.lng - origin.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  // Assume 30 km/h average city speed for the time estimate.
  const speedKmh = 30;
  const durationHours = distanceKm / speedKmh;
  
  // Clamp to minimum 1 minute so we never show "0 min".
  const durationMins = Math.max(1, Math.round(durationHours * 60));

  return {
    success: true,
    distance: distanceKm < 1 ? `${(distanceKm * 1000).toFixed(0)} m` : `${distanceKm.toFixed(1)} km`,
    duration: `${durationMins} min`,
    durationValue: durationMins * 60,
    distanceValue: Math.round(distanceKm * 1000),
    isFallback: true // flag so callers know this isn't a live traffic estimate
  };
}

module.exports = { getRealETA, getBatchETA };
