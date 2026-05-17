import React, { useMemo } from 'react';
import { GoogleMap, Marker, Circle } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '2rem'
};

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#334155" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#020617" }]
  }
];

export default function NearbyTechniciansMap({ 
  customerLocation, 
  technicians,
  radiusKm = 10
}: { 
  customerLocation: { lat: number, lng: number },
  technicians: any[],
  radiusKm?: number
}) {
  const options = useMemo(() => ({
    styles: darkMapStyle,
    disableDefaultUI: true,
    zoomControl: true,
  }), []);

  if (!customerLocation) return <div className="w-full h-full bg-slate-900 rounded-[2rem] flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest">Loading Map...</div>;

  return (
    <div className="w-full h-full rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={customerLocation}
        zoom={12}
        options={options}
      >
        {/* Customer Marker */}
        <Marker 
          position={customerLocation}
          icon={{
            path: window.google?.maps?.SymbolPath?.CIRCLE,
            fillColor: "#06b6d4",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            scale: 8,
          }}
        />

        {/* Radius Circle */}
        <Circle
          center={customerLocation}
          radius={radiusKm * 1000}
          options={{
            fillColor: "#06b6d4",
            fillOpacity: 0.05,
            strokeColor: "#06b6d4",
            strokeOpacity: 0.3,
            strokeWeight: 1,
            clickable: false
          }}
        />

        {/* Technician Markers */}
        {technicians.map((t, idx) => (
          <Marker
            key={t.id || idx}
            position={{ lat: t.latitude || t.lat, lng: t.longitude || t.lng }}
            icon={{
              path: window.google?.maps?.SymbolPath?.CIRCLE,
              fillColor: "#10b981", // Emerald
              fillOpacity: 1,
              strokeColor: "#064e3b",
              strokeWeight: 2,
              scale: 6,
            }}
          />
        ))}
      </GoogleMap>
      
      {/* HUD overlay */}
      <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl">
        <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Active Radar Scan
        </p>
        <p className="text-white text-sm font-bold mt-1">Found {technicians.length} Units</p>
      </div>
    </div>
  );
}
