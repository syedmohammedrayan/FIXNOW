import { db } from '@/lib/firebase';
import { collection, query, orderBy, startAt, endAt, getDocs, where } from 'firebase/firestore';
import * as geofire from 'geofire-common';

export interface NearbyTechnician {
  id: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

export const findNearbyTechnicians = async (
  centerLat: number, 
  centerLng: number, 
  radiusInKm: number = 10
): Promise<NearbyTechnician[]> => {
  const center = [centerLat, centerLng] as [number, number];
  const radiusInM = radiusInKm * 1000;

  // Generate bounds for the geohash query
  const bounds = geofire.geohashQueryBounds(center, radiusInM);
  const promises = [];

  for (const b of bounds) {
    const q = query(
      collection(db, 'technician_locations'),
      where('isOnline', '==', true),
      orderBy('geohash'),
      startAt(b[0]),
      endAt(b[1])
    );
    promises.push(getDocs(q));
  }

  const snapshots = await Promise.all(promises);
  const matchingDocs: NearbyTechnician[] = [];

  for (const snap of snapshots) {
    for (const doc of snap.docs) {
      const data = doc.data();
      const lat = data.latitude;
      const lng = data.longitude;
      
      // Filter out false positives (geohash boxes are rectangles, we want a circle)
      const distanceInKm = geofire.distanceBetween([lat, lng], center);
      if (distanceInKm <= radiusInKm) {
        // Also check lastUpdated (if older than 2 mins, skip them)
        const lastUpdated = data.lastUpdated?.toMillis() || 0;
        const isStale = (Date.now() - lastUpdated) > 2 * 60 * 1000;
        
        if (!isStale) {
          matchingDocs.push({
            id: doc.id,
            latitude: lat,
            longitude: lng,
            distanceKm: distanceInKm
          });
        }
      }
    }
  }

  // Sort by distance
  matchingDocs.sort((a, b) => a.distanceKm - b.distanceKm);
  return matchingDocs;
};
