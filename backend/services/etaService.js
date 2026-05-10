const { Client } = require("@googlemaps/google-maps-services-js");
require('dotenv').config();

const client = new Client({});
const GOOGLE_MAPS_KEYS = (process.env.GOOGLE_MAPS_API_KEYS || '').split(',').filter(Boolean);
let currentKeyIndex = 0;

async function callGoogleMapsWithFallback(method, params) {
  let lastError;
  for (let i = 0; i < GOOGLE_MAPS_KEYS.length; i++) {
    const key = GOOGLE_MAPS_KEYS[(currentKeyIndex + i) % GOOGLE_MAPS_KEYS.length];
    try {
      const response = await client[method]({
        params: { ...params, key }
      });
      
      // If we got a specific Maps error in the body
      if (response.data.status === 'OVER_QUERY_LIMIT' || response.data.status === 'REQUEST_DENIED') {
        throw new Error(`Google Maps API Error: ${response.data.status}`);
      }

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
 * Get real ETA using Google Maps Distance Matrix API
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
      departure_time: 'now'
    });

    const element = response.data.rows[0].elements[0];
    if (element.status === 'OK') {
      const distanceValue = element.distance.value; // in meters
      const durationValue = element.duration_in_traffic ? element.duration_in_traffic.value : element.duration.value;

      // Force 'Nearby' if extremely close (within 50m)
      if (distanceValue < 50) {
        return {
          success: true,
          distance: 'Nearby',
          duration: '1 min',
          durationValue: 60
        };
      }

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
      // Catch 403
    } else {
      console.error('Google Maps ETA Error:', error.message);
    }
    return getFallbackETA(origin, destination);
  }
}

/**
 * Get batch ETA for multiple destinations from one origin
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
        return getFallbackETA(origin, destinations[index]);
      }
    });

    return results;
  } catch (error) {
    console.error('Batch ETA Error:', error.message);
    return destinations.map(dest => getFallbackETA(origin, dest));
  }
}

/**
 * Heuristic fallback if API fails
 */
function getFallbackETA(origin, destination) {
  // Haversine distance
  const R = 6371; // km
  const dLat = (destination.lat - origin.lat) * Math.PI / 180;
  const dLng = (destination.lng - origin.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  // Assume 30km/h average city speed
  const speedKmh = 30;
  const durationHours = distanceKm / speedKmh;
  
  // If distance < 50m, return 'Nearby'
  if (distanceKm < 0.05) {
    return {
      success: true,
      distance: 'Nearby',
      duration: '1 min',
      durationValue: 60,
      distanceValue: Math.round(distanceKm * 1000),
      isFallback: true
    };
  }

  const durationMins = Math.max(1, Math.round(durationHours * 60));

  return {
    success: true,
    distance: distanceKm < 1 ? `${(distanceKm * 1000).toFixed(0)} m` : `${distanceKm.toFixed(1)} km`,
    duration: `${durationMins} min`,
    durationValue: durationMins * 60,
    distanceValue: Math.round(distanceKm * 1000),
    isFallback: true
  };
}

module.exports = { getRealETA, getBatchETA };
