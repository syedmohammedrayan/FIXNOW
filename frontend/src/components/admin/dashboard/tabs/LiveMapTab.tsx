'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Navigation,
  MapPin,
  Zap,
  Activity,
  Phone,
  Maximize2,
  Filter,
  Search,
  Wrench,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/lib/config';

const Map          = dynamic(() => import('@/components/ui/map').then(mod => mod.Map),          { ssr: false });
const MapMarker    = dynamic(() => import('@/components/ui/map').then(mod => mod.MapMarker),    { ssr: false });
const MarkerContent = dynamic(() => import('@/components/ui/map').then(mod => mod.MarkerContent), { ssr: false });
const MapPopup     = dynamic(() => import('@/components/ui/map').then(mod => mod.MapPopup),     { ssr: false });
import { isValidCoordinate } from '@/components/ui/map';
import { Star } from 'lucide-react';

// Haversine distance calculation (returns km)
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
};

export function LiveMapTab() {
  const [mapTheme,       setMapTheme]       = useState<'dark' | 'light'>('dark');
  const [techs,          setTechs]          = useState<any[]>([]);
  const [bookings,       setBookings]       = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [mapCenter,      setMapCenter]      = useState<[number, number]>([0, 0]);
  const [loading,        setLoading]        = useState(true);

  // Initial Contextual Centering
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (mapCenter[0] === 0) setMapCenter([pos.coords.longitude, pos.coords.latitude]);
        },
        () => {}
      );
    }
  }, []);

  // Socket.IO for Sub-Second Real-Time Updates
  const [socketLocations, setSocketLocations] = useState<Record<string, { lat: number, lng: number }>>({});

  useEffect(() => {
    // 1. Initial Firestore Load (Throttled but persistent)
    const unsubTechs = onSnapshot(collection(db, 'technicians'), snap => {
      const techData = snap.docs.map(d => ({ id: d.id, type: 'tech', ...d.data() } as any));
      setTechs(techData);
      
      // Dynamically center map on first load
      if (techData.length > 0 && mapCenter[0] === 0) {
        const valid = techData.filter(t => isValidCoordinate(t.location || { lat: t.lat, lng: t.lng }));
        if (valid.length > 0) setMapCenter([valid[0].location?.lng || valid[0].lng, valid[0].location?.lat || valid[0].lat]);
      }
      setLoading(false);
    });

    const q = query(collection(db, 'bookings'), where('status', 'in', ['Accepted', 'On the Way', 'Arrived', 'In Progress']));
    const unsubBookings = onSnapshot(q, snap => {
      setBookings(snap.docs.map(d => ({ id: d.id, type: 'customer', ...d.data() } as any)));
    });

    // 2. Socket.IO Direct Stream (Bypasses 10s Firestore Throttling)
    const socket: Socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to Tactical Live Stream');
      socket.emit('admin_join_fleet');
    });

    socket.on('fleet_tech_location', (data: { techId: string, location: { lat: number, lng: number } }) => {
      setSocketLocations(prev => ({ ...prev, [data.techId]: data.location }));
    });

    socket.on('fleet_customer_location', (data: { customerId: string, bookingId: string, location: { lat: number, lng: number } }) => {
      setSocketLocations(prev => ({ ...prev, [data.customerId || data.bookingId]: data.location }));
    });

    return () => { 
      unsubTechs(); 
      unsubBookings(); 
      socket.disconnect();
    };
  }, []);

  const getEntityLocation = (entity: any): [number, number] => {
    // Override with socket stream if available for sub-second accuracy
    if (socketLocations[entity.id]) {
      return [socketLocations[entity.id].lng, socketLocations[entity.id].lat];
    }
    if (entity.type === 'tech') {
      const loc = entity.location || { lat: entity.lat, lng: entity.lng };
      return [loc?.lng || 0, loc?.lat || 0];
    }
    const loc = entity.customerLocation || { lat: entity.customerLat, lng: entity.customerLng };
    return [loc?.lng || 0, loc?.lat || 0];
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-4 h-[calc(100vh-10rem)] min-h-[500px]"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-400 animate-pulse" />
            Live Fleet Operations
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Command Center • Real-time Tactical Map</p>
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-xl flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              {techs.filter(t => t.online).length} Online
            </span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              {bookings.length} Active
            </span>
          </div>
        </div>
      </div>

      {/* Map and Sidebar Container */}
      <div className="flex-1 flex gap-4 overflow-hidden min-h-[400px]">
        {/* Sidebar - Fleet Status */}
        <div className="hidden lg:flex flex-col w-80 bg-slate-900/40 border border-white/[0.08] rounded-[2rem] p-4 overflow-y-auto">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap className="size-3 text-amber-400" />
            Active Fleet Elements
          </h3>
          <div className="space-y-3">
            {techs.filter(t => t.online).map(tech => {
              const activeBooking = bookings.find(b => b.technician_id === tech.id || b.technicianId === tech.id);
              return (
                <div key={tech.id} className="p-3.5 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3)] cursor-pointer hover:bg-slate-800/80 transition-colors group" onClick={() => {
                  setSelectedEntity(tech);
                  const loc = getEntityLocation(tech);
                  if (isValidCoordinate({ lat: loc[1], lng: loc[0] })) setMapCenter(loc);
                }}>
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors">{tech.name}</p>
                    <div className={cn("size-2 rounded-full mt-1", activeBooking ? "bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]")} />
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest">{tech.category}</p>
                    <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-md">
                      <Star className="size-2.5 text-amber-400 fill-amber-400" />
                      <span className="text-[9px] font-black text-white">{Number(tech.rating || 0).toFixed(1)}</span>
                    </div>
                  </div>

                  {activeBooking && (
                    <div className="mt-3 pt-3 border-t border-white/[0.04]">
                      <p className="text-[10px] text-amber-400/90 font-black tracking-wide">En Route to Client</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{activeBooking.customerName}</p>
                      
                      {(() => {
                        const techLoc = getEntityLocation(tech);
                        const custLoc = getEntityLocation(activeBooking);
                        if (techLoc[0] !== 0 && custLoc[0] !== 0) {
                          const dist = getDistance(techLoc[1], techLoc[0], custLoc[1], custLoc[0]);
                          return (
                            <div className="flex items-center justify-between mt-2 bg-black/40 rounded-lg p-2 border border-white/[0.02]">
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Live Distance</span>
                              <span className="text-[10px] font-black text-emerald-400">
                                {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 rounded-[1.75rem] sm:rounded-[2.5rem] overflow-hidden border border-white/[0.08] bg-slate-900/40 relative shadow-2xl">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/60">
            <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin" />
            <p className="text-white font-bold text-xs uppercase tracking-widest animate-pulse">Initializing Map...</p>
          </div>
        ) : (
          <Map 
            center={mapCenter} 
            zoom={12} 
            className="w-full h-full"
            styles={{
              light: mapTheme === 'dark' ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" : "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
              dark: mapTheme === 'dark' ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" : "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
            }}
          >
            {/* Technician Markers */}
            {techs.map(tech => {
              const loc = getEntityLocation(tech);
              if (!isValidCoordinate({ lat: loc[1], lng: loc[0] })) return null;
              const isActive = bookings.some(b => b.technicianId === tech.id || b.technician_id === tech.id);
              
              return (
                <MapMarker key={tech.id} longitude={loc[0]} latitude={loc[1]} onClick={() => setSelectedEntity(tech)}>
                  <MarkerContent>
                    <div className="relative cursor-pointer group">
                      {(tech.online || isActive) && <div className={cn("absolute -inset-4 rounded-full animate-ping pointer-events-none opacity-50", isActive ? "bg-amber-400" : "bg-emerald-500")} />}
                      <div className={cn(
                        'size-10 rounded-2xl border-2 shadow-xl flex items-center justify-center transform rotate-45 transition-all duration-300 group-hover:scale-110',
                        isActive ? 'bg-amber-400 border-white text-slate-900' :
                        tech.online ? 'bg-white border-slate-900 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-400'
                      )}>
                        <span className={cn('text-lg -rotate-45', !tech.online && 'opacity-50 grayscale')}>🛠️</span>
                      </div>
                      <div className="absolute top-12 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-slate-900/90 backdrop-blur-md text-white text-[6px] font-black rounded uppercase tracking-tighter whitespace-nowrap border border-white/10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {tech.name?.split(' ')[0] || 'TECH'}
                      </div>
                    </div>
                  </MarkerContent>
                </MapMarker>
              );
            })}

            {/* Customer Markers */}
            {bookings.map(booking => {
              const loc = getEntityLocation(booking);
              if (!isValidCoordinate({ lat: loc[1], lng: loc[0] })) return null;
              
              return (
                <MapMarker key={booking.id} longitude={loc[0]} latitude={loc[1]} onClick={() => setSelectedEntity(booking)}>
                  <MarkerContent>
                    <div className="relative cursor-pointer group">
                      <div className="absolute -inset-4 bg-cyan-500/20 rounded-full animate-pulse pointer-events-none" />
                      <div className="size-8 rounded-full bg-cyan-500 border-2 border-white shadow-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                        <span className="text-sm">📍</span>
                      </div>
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-cyan-500 text-slate-900 text-[6px] font-black rounded uppercase tracking-tighter whitespace-nowrap shadow-lg flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {booking.customerName?.split(' ')[0] || 'CLIENT'}
                      </div>
                    </div>
                  </MarkerContent>
                </MapMarker>
              );
            })}

            {/* Selected Entity Popup */}
            {selectedEntity && (
              <MapPopup
                longitude={getEntityLocation(selectedEntity)[0]}
                latitude={getEntityLocation(selectedEntity)[1]}
                options={{ closeButton: false, className: 'custom-popup' }}
              >
                <div className="p-4 bg-slate-950/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl min-w-[200px] shadow-2xl relative">
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedEntity(null); }}
                    className="absolute top-2 right-2 p-1 text-slate-500 hover:text-white rounded-lg hover:bg-white/[0.06] transition"
                  >
                    <X className="size-3.5" />
                  </button>

                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    {selectedEntity.type === 'tech' ? 'Field Agent' : 'Active Client'}
                  </p>
                  <h4 className="text-sm font-black text-white mb-2">{selectedEntity.name || 'Anonymous User'}</h4>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className={cn('size-1.5 rounded-full', selectedEntity.online || selectedEntity.type === 'customer' ? 'bg-emerald-500' : 'bg-slate-600')} />
                      <span className="text-[9px] text-slate-400 font-bold uppercase">{selectedEntity.status || (selectedEntity.online ? 'Online' : 'Offline')}</span>
                    </div>
                    {selectedEntity.category && (
                      <div className="flex items-center gap-2">
                        <Zap className="size-3 text-amber-400" />
                        <span className="text-[9px] text-slate-400 font-medium">{selectedEntity.category}</span>
                      </div>
                    )}
                    {selectedEntity.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="size-3 text-slate-500" />
                        <span className="text-[9px] text-slate-400 font-medium">{selectedEntity.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </MapPopup>
            )}
          </Map>
        )}

        {/* Legend overlay */}
        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-10 pointer-events-none">
          <div className="bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/[0.08] pointer-events-auto">
            <h4 className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2.5">Legend</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="size-4 rounded bg-white rotate-45 border border-slate-900 flex items-center justify-center">
                  <Wrench className="size-2.5 text-slate-900 -rotate-45" />
                </div>
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Technician</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="size-4 rounded-full bg-emerald-500 border border-white/20 flex items-center justify-center">
                  <MapPin className="size-2.5 text-white" />
                </div>
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Customer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map controls overlay */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex flex-col sm:flex-row gap-2">
          {/* Theme Switcher */}
          <button 
            onClick={() => setMapTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            className="size-8 sm:size-10 rounded-xl bg-slate-900/80 border border-white/[0.1] backdrop-blur-md flex items-center justify-center text-slate-400 hover:text-white transition active:scale-95 shadow-xl"
            title="Toggle Map Theme"
          >
            {mapTheme === 'dark' ? <Sun className="size-3.5 sm:size-4" /> : <Moon className="size-3.5 sm:size-4" />}
          </button>

          <button className="size-8 sm:size-10 rounded-xl bg-slate-900/80 border border-white/[0.1] backdrop-blur-md flex items-center justify-center text-slate-400 hover:text-white transition active:scale-95 shadow-xl">
            <Search className="size-3.5 sm:size-4" />
          </button>
          <button className="size-8 sm:size-10 rounded-xl bg-slate-900/80 border border-white/[0.1] backdrop-blur-md flex items-center justify-center text-slate-400 hover:text-white transition active:scale-95 shadow-xl">
            <Filter className="size-3.5 sm:size-4" />
          </button>
        </div>

        </div>{/* /Map Container */}
      </div>{/* /flex: sidebar + map */}

      <style jsx global>{`
        .custom-popup .maplibregl-popup-content {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .custom-popup .maplibregl-popup-tip {
          border-top-color: rgba(2, 6, 23, 0.95) !important;
        }
      `}</style>
    </motion.div>
  );
}
