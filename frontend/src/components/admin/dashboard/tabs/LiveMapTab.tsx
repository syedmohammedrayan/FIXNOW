'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Navigation, 
  MapPin, 
  User, 
  Zap, 
  Activity, 
  Clock, 
  Phone,
  Maximize2,
  Filter,
  ShieldCheck,
  Search,
  Wrench
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const Map = dynamic(() => import('@/components/ui/map').then(mod => mod.Map), { ssr: false });
const MapMarker = dynamic(() => import('@/components/ui/map').then(mod => mod.MapMarker), { ssr: false });
const MarkerContent = dynamic(() => import('@/components/ui/map').then(mod => mod.MarkerContent), { ssr: false });
const MapPopup = dynamic(() => import('@/components/ui/map').then(mod => mod.MapPopup), { ssr: false });

export function LiveMapTab() {
  const [techs, setTechs] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([77.2090, 28.6139]); // Default to New Delhi
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listen to all approved technicians
    const unsubTechs = onSnapshot(collection(db, 'technicians'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, type: 'tech', ...d.data() } as any));
      setTechs(data.filter(t => t.location?.lat || t.lat));
      setLoading(false);
    });

    // 2. Listen to active bookings for customer locations
    const activeStatuses = ['Accepted', 'On the Way', 'Arrived', 'In Progress'];
    const q = query(collection(db, 'bookings'), where('status', 'in', activeStatuses));
    const unsubBookings = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, type: 'customer', ...d.data() } as any));
      setBookings(data.filter(b => b.customerLocation?.lat || b.customerLat));
    });

    return () => {
      unsubTechs();
      unsubBookings();
    };
  }, []);

  const getEntityLocation = (entity: any): [number, number] => {
    if (entity.type === 'tech') {
      const loc = entity.location || { lat: entity.lat, lng: entity.lng };
      return [loc.lng, loc.lat];
    } else {
      const loc = entity.customerLocation || { lat: entity.customerLat, lng: entity.customerLng };
      return [loc.lng, loc.lat];
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="h-[calc(100vh-12rem)] min-h-[600px] w-full flex flex-col gap-4"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-500 animate-pulse" />
            Live Fleet Operations
          </h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">Command Center • Real-time Tactical Map</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{techs.filter(t => t.online).length} Technicians Online</span>
          </div>
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{bookings.length} Active Missions</span>
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-[2.5rem] overflow-hidden border border-white/10 glass-panel relative group shadow-2xl">
        <Map
          center={mapCenter}
          zoom={12}
          className="w-full h-full"
        >
          {/* Technician Markers */}
          {techs.map(tech => {
            const loc = getEntityLocation(tech);
            return (
              <MapMarker 
                key={tech.id} 
                longitude={loc[0]} 
                latitude={loc[1]}
                onClick={() => setSelectedEntity(tech)}
              >
                <MarkerContent>
                  <div className="relative cursor-pointer group">
                    {tech.online && (
                      <div className="absolute -inset-4 bg-indigo-500/20 rounded-full animate-ping pointer-events-none" />
                    )}
                    <div className={cn(
                      "size-10 rounded-2xl border-2 shadow-xl flex items-center justify-center transform rotate-45 transition-all duration-300 group-hover:scale-110",
                      tech.online 
                        ? "bg-indigo-600 border-white text-white" 
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    )}>
                      <Wrench className={cn("size-5 -rotate-45", tech.online ? "text-white" : "text-slate-500")} />
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
              <MapMarker 
                key={booking.id} 
                longitude={loc[0]} 
                latitude={loc[1]}
                onClick={() => setSelectedEntity(booking)}
              >
                <MarkerContent>
                  <div className="relative cursor-pointer group">
                    <div className="absolute -inset-4 bg-emerald-500/20 rounded-full animate-pulse pointer-events-none" />
                    <div className="size-10 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                      <MapPin className="size-5 text-white" />
                    </div>
                  </div>
                </MarkerContent>
              </MapMarker>
            );
          })}

          {/* Popup for Selected Entity */}
          {selectedEntity && (
            <MapPopup
              longitude={getEntityLocation(selectedEntity)[0]}
              latitude={getEntityLocation(selectedEntity)[1]}
              options={{ closeButton: false, className: 'custom-popup' }}
            >
              <div className="p-4 bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-2xl min-w-[200px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  {selectedEntity.type === 'tech' ? <Wrench className="size-12" /> : <MapPin className="size-12" />}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedEntity(null); }}
                  className="absolute top-2 right-2 text-slate-400 hover:text-white"
                >
                  <Maximize2 className="size-3" />
                </button>
                
                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                  {selectedEntity.type === 'tech' ? 'Field Agent' : 'Active Client'}
                </p>
                <h4 className="text-sm font-black text-white mb-2">{selectedEntity.name || 'Anonymous User'}</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("size-1.5 rounded-full", selectedEntity.online || selectedEntity.type === 'customer' ? 'bg-emerald-500' : 'bg-slate-600')} />
                    <span className="text-[9px] text-slate-300 font-bold uppercase">{selectedEntity.status || (selectedEntity.online ? 'Online' : 'Offline')}</span>
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

        {/* Legend / Overlay Controls */}
        <div className="absolute bottom-8 left-8 z-10 space-y-3 pointer-events-none">
          <div className="glass-panel border-white/10 bg-slate-950/50 backdrop-blur-md p-4 rounded-3xl border border-white/5 pointer-events-auto">
            <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Live Legend</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-3 rounded bg-indigo-600 rotate-45 border border-white/20 flex items-center justify-center">
                  <Wrench className="size-2 text-white -rotate-45" />
                </div>
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Active Technician (🛠️)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-3 rounded-full bg-emerald-500 border border-white/20 flex items-center justify-center">
                  <MapPin className="size-2 text-white" />
                </div>
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Active Customer (📍)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-3 rounded bg-slate-800 rotate-45 border border-slate-700" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Offline / Idle Tech</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search / Filter Overlay */}
        <div className="absolute top-6 right-6 z-10 pointer-events-auto">
           <div className="flex items-center gap-2">
             <button className="size-10 rounded-xl bg-slate-900/80 border border-white/10 backdrop-blur-md flex items-center justify-center text-slate-400 hover:text-white transition">
               <Search className="size-4" />
             </button>
             <button className="size-10 rounded-xl bg-slate-900/80 border border-white/10 backdrop-blur-md flex items-center justify-center text-slate-400 hover:text-white transition">
               <Filter className="size-4" />
             </button>
           </div>
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
          border-top-color: rgba(2, 6, 23, 0.9) !important;
        }
      `}</style>
    </motion.div>
  );
}
