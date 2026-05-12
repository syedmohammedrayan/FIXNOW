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

const Map          = dynamic(() => import('@/components/ui/map').then(mod => mod.Map),          { ssr: false });
const MapMarker    = dynamic(() => import('@/components/ui/map').then(mod => mod.MapMarker),    { ssr: false });
const MarkerContent = dynamic(() => import('@/components/ui/map').then(mod => mod.MarkerContent), { ssr: false });
const MapPopup     = dynamic(() => import('@/components/ui/map').then(mod => mod.MapPopup),     { ssr: false });

export function LiveMapTab() {
  const [mapTheme,       setMapTheme]       = useState<'dark' | 'light'>('dark');
  const [techs,          setTechs]          = useState<any[]>([]);
  const [bookings,       setBookings]       = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [mapCenter,      setMapCenter]      = useState<[number, number]>([77.2090, 28.6139]);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    const unsubTechs = onSnapshot(collection(db, 'technicians'), snap => {
      const techData = snap.docs.map(d => ({ id: d.id, type: 'tech', ...d.data() } as any)).filter(t => t.location?.lat || t.lat);
      setTechs(techData);
      
      // Dynamically center map on the fleet
      if (techData.length > 0) {
        let sumLat = 0;
        let sumLng = 0;
        let count = 0;
        techData.forEach(t => {
          const loc = t.location || { lat: t.lat, lng: t.lng };
          if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
            sumLat += loc.lat;
            sumLng += loc.lng;
            count++;
          }
        });
        if (count > 0) {
          setMapCenter([sumLng / count, sumLat / count]);
        }
      }

      setLoading(false);
    });

    const q = query(collection(db, 'bookings'), where('status', 'in', ['Accepted', 'On the Way', 'Arrived', 'In Progress']));
    const unsubBookings = onSnapshot(q, snap => {
      setBookings(snap.docs.map(d => ({ id: d.id, type: 'customer', ...d.data() } as any)).filter(b => b.customerLocation?.lat || b.customerLat));
    });

    return () => { unsubTechs(); unsubBookings(); };
  }, []);

  const getEntityLocation = (entity: any): [number, number] => {
    if (entity.type === 'tech') {
      const loc = entity.location || { lat: entity.lat, lng: entity.lng };
      return [loc.lng, loc.lat];
    }
    const loc = entity.customerLocation || { lat: entity.customerLat, lng: entity.customerLng };
    return [loc.lng, loc.lat];
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

      {/* Map Container */}
      <div className="flex-1 rounded-[1.75rem] sm:rounded-[2.5rem] overflow-hidden border border-white/[0.08] bg-slate-900/40 relative shadow-2xl min-h-[400px]">
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
              return (
                <MapMarker key={tech.id} longitude={loc[0]} latitude={loc[1]} onClick={() => setSelectedEntity(tech)}>
                  <MarkerContent>
                    <div className="relative cursor-pointer group">
                      {tech.online && <div className="absolute -inset-4 bg-white/10 rounded-full animate-ping pointer-events-none" />}
                      <div className={cn(
                        'size-10 rounded-2xl border-2 shadow-xl flex items-center justify-center transform rotate-45 transition-all duration-300 group-hover:scale-110',
                        tech.online ? 'bg-white border-slate-900 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-400'
                      )}>
                        <Wrench className={cn('size-5 -rotate-45', tech.online ? 'text-slate-900' : 'text-slate-500')} />
                      </div>
                      <div className="absolute top-12 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-slate-900/90 backdrop-blur-md text-white text-[6px] font-black rounded uppercase tracking-tighter whitespace-nowrap border border-white/10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>🛠️</span> {tech.name?.split(' ')[0] || 'TECH'}
                      </div>
                    </div>
                  </MarkerContent>
                </MapMarker>
              );
            })}

            {/* Customer Markers */}
            {bookings.map(booking => {
              const loc = getEntityLocation(booking);
              return (
                <MapMarker key={booking.id} longitude={loc[0]} latitude={loc[1]} onClick={() => setSelectedEntity(booking)}>
                  <MarkerContent>
                    <div className="relative cursor-pointer group">
                      <div className="absolute -inset-4 bg-emerald-500/20 rounded-full animate-pulse pointer-events-none" />
                      <div className="size-10 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                        <MapPin className="size-5 text-white" />
                      </div>
                      <div className="absolute top-12 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-emerald-500 text-white text-[6px] font-black rounded uppercase tracking-tighter whitespace-nowrap shadow-lg flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>📍</span> {booking.customerName?.split(' ')[0] || 'CLIENT'}
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
      </div>

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
