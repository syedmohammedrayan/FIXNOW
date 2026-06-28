import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as geofire from 'geofire-common';

export const startLocationTracker = (technicianId: string) => {
  if (!navigator.geolocation) {
    console.warn("Geolocation not supported");
    return null;
  }

  let lastUpdateTime = 0;

  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
      const now = Date.now();
      // Throttle to max 1 update every 15 seconds
      if (now - lastUpdateTime < 15000) return;
      lastUpdateTime = now;

      const { latitude, longitude } = position.coords;
      const hash = geofire.geohashForLocation([latitude, longitude]);

      try {
        await setDoc(doc(db, 'technician_locations', technicianId), {
          technicianId,
          latitude,
          longitude,
          geohash: hash,
          isOnline: true,
          lastUpdated: serverTimestamp()
        }, { merge: true });
        console.log(`Updated location for tech ${technicianId}`);
      } catch (err) {
        console.error("Location track error:", err);
      }
    },
    (err) => console.error("Location error:", err),
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
  );

  return watchId;
};

export const stopLocationTracker = async (technicianId: string, watchId: number) => {
  navigator.geolocation.clearWatch(watchId);
  try {
    await setDoc(doc(db, 'technician_locations', technicianId), {
      isOnline: false,
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error("Location stop error:", err);
  }
};
