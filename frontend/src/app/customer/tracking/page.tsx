'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Navigation, 
  Phone, 
  ShieldCheck, 
  Star, 
  Activity,
  CheckCircle2,
  Zap,
  LayoutDashboard,
  Clock,
  ChevronRight,
  Shield,
  LocateFixed,
  Moon,
  Sun,
  ArrowLeft,
  Wrench,
  MapPin,
  XCircle,
  AlertTriangle,
  Loader2,
  X
} from 'lucide-react';
import axios from 'axios';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, OverlayView, Polyline } from '@react-google-maps/api';
import { io } from 'socket.io-client';
import { SOCKET_URL, API_BASE } from '@/lib/config';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';

const LIBRARIES: ("geometry" | "places" | "visualization")[] = ["geometry", "places", "visualization"];

const lightMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#f8fafc" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#4f46e5" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#4f46e5" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#f1f5f9" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e2e8f0" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e2e8f0" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#cbd5e1" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#e0f2fe" }] },
];

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#818cf8" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#818cf8" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#334155" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#334155" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#020617" }] },
];

export default function TrackingPage() {
  const { currentKey, rotateKey } = useGoogleMapsKey();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');

  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [techLocation, setTechLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [eta, setEta] = useState<string>('Syncing...');
  const [status, setStatus] = useState<string>('Initializing');
  const [otp, setOtp] = useState<string>('----');
  const [techDetails, setTechDetails] = useState({
    name: 'Technician',
    avatar: '',
    service: 'Service Specialist',
    phone: '',
    rating: 4.8
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const directionsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<any>(null);

  // Cancellation states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: currentKey || '',
    libraries: LIBRARIES
  });

  // Handle load error by rotating key
  useEffect(() => {
    if (loadError) {
      console.error("Maps failed to load. Rotating key...");
      rotateKey();
    }
  }, [loadError, rotateKey]);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const handleCancelBooking = async () => {
    if (!bookingId) return;
    setCancelling(true);
    try {
      await axios.post(`${API_BASE}/api/bookings/cancel`, {
        bookingId,
        reason: cancelReason.trim() || 'Cancelled by customer during tracking'
      });
      // Redirect to dashboard
      router.push('/customer/dashboard');
    } catch (e) {
      alert('Failed to cancel booking. Please try again or contact support.');
      setCancelling(false);
    }
  };

  useEffect(() => {
    if (!bookingId) return;
    let unsubTech: (() => void) | null = null;

    const unsubBooking = onSnapshot(doc(db, 'bookings', bookingId), (docSnap) => {
      if (docSnap.exists()) {
        const bData = docSnap.data();
        
        // Handle both snake_case and camelCase for all critical fields
        if (bData.otp) setOtp(bData.otp);
        const currentStatus = bData.status || bData.booking_status;
        if (currentStatus) setStatus(currentStatus);
        
        const cLoc = bData.customerLocation || bData.customer_location || 
          (bData.customerLat ? { lat: bData.customerLat, lng: bData.customerLng } : 
           bData.customer_lat ? { lat: bData.customer_lat, lng: bData.customer_lng } : null);
        
        if (cLoc && !userLocation) setUserLocation(cLoc);

        const tId = bData.technicianId || bData.technician_id;
        if (tId && !unsubTech) {
          unsubTech = onSnapshot(doc(db, 'technicians', tId), (tSnap) => {
            if (tSnap.exists()) {
              const tData = tSnap.data();
              
              let avatarUrl = tData.avatar || bData.technician_avatar || bData.technicianAvatar || '';
              if (avatarUrl && !avatarUrl.startsWith('http')) avatarUrl = `${API_BASE}${avatarUrl}`;

              setTechDetails(prev => ({
                ...prev,
                name: tData.name || bData.technician_name || bData.technicianName || prev.name,
                avatar: avatarUrl || prev.avatar,
                service: bData.category || bData.service_category || prev.service,
                phone: tData.phone || bData.technician_phone || bData.technicianPhone || prev.phone,
                rating: tData.rating || bData.technician_rating || bData.technicianRating || 4.8
              }));
              
              const tLoc = tData.location || tData.tech_location || 
                (tData.lat ? { lat: tData.lat, lng: tData.lng } : 
                 tData.tech_lat ? { lat: tData.tech_lat, lng: tData.tech_lng } : null);
              
              if (tLoc) setTechLocation(tLoc);
            }
          });
        }
      }
    });

    const s = io(SOCKET_URL);
    socketRef.current = s;
    s.emit('join_booking', { bookingId });
    
    s.on('location_update', (data) => {
      console.log("📍 Real-time location:", data);
      if (data) {
        if (data.lat && data.lng) {
          setTechLocation({ lat: data.lat, lng: data.lng });
        } else if (data.location || data.tech_location) {
          const loc = data.location || data.tech_location;
          if (loc.lat && loc.lng) setTechLocation({ lat: loc.lat, lng: loc.lng });
        }
      }
    });

    s.on('eta_update', (data) => {
      if (data && data.duration) setEta(data.duration);
    });

    s.on('status_update', (data) => {
      if (data && data.status) setStatus(data.status);
    });

    return () => {
      unsubBooking();
      if (unsubTech) (unsubTech as () => void)();
      s.disconnect();
    };
  }, [bookingId]);

  // Live Customer GPS Tracking
  useEffect(() => {
    if (!navigator.geolocation || !bookingId) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const liveLoc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(liveLoc);
        
        // 1. Emit live location to technician via Socket (Real-time smoothness)
        if (socketRef.current) {
          socketRef.current.emit('customer_update_location', {
            bookingId,
            location: liveLoc
          });
        }

        // 2. Sync live location to database (Persistence)
        updateDoc(doc(db, 'bookings', bookingId), { 
          customer_lat: liveLoc.lat, 
          customer_lng: liveLoc.lng,
          customer_location: liveLoc
        }).catch(err => console.warn('Could not sync live location:', err));
      },
      (error) => console.warn("GPS tracking error:", error.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [bookingId]);

  useEffect(() => {
    if (map && techLocation && userLocation && window.google?.maps) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(techLocation);
      bounds.extend(userLocation);
      map.fitBounds(bounds, { top: 150, right: 100, bottom: 250, left: 100 });
    }
  }, [map, techLocation, userLocation]);

  useEffect(() => {
    // We now rely on instant localDistance for the UI and ETA
    if (!eta) setEta('Syncing...');
  }, [techLocation, userLocation, eta]);

  // Instant Local Distance Calculation (Zero Lag)
  const [localDistance, setLocalDistance] = useState<string>('');
  useEffect(() => {
    if (techLocation && userLocation && window.google?.maps?.geometry?.spherical) {
      const meters = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(techLocation.lat, techLocation.lng),
        new window.google.maps.LatLng(userLocation.lat, userLocation.lng)
      );
      if (meters < 100) {
        setEta('Arrived');
      }
      
      if (meters < 1000) {
        setLocalDistance(`${Math.round(meters)}m`);
        if (meters >= 100) {
          const mins = Math.ceil(meters / 300);
          setEta(`${mins} min`);
        }
      } else {
        setLocalDistance(`${((meters / 1000).toFixed(1))}km`);
        const mins = Math.ceil((meters / 1000) * 3);
        setEta(`${mins} min`);
      }
    }
  }, [techLocation, userLocation]);

  // Direct Map Polyline Management (Resolves Phantom Lines)
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  useEffect(() => {
    if (!map || !window.google?.maps) return;
    
    // Create polyline if it doesn't exist
    if (!polylineRef.current) {
      polylineRef.current = new window.google.maps.Polyline({
        strokeColor: "#4f46e5",
        strokeWeight: 3,
        strokeOpacity: 0.8,
        zIndex: 5,
        map: map
      });
    }

    // Update path strictly if both locations are valid numbers
    if (techLocation?.lat && techLocation?.lng && userLocation?.lat && userLocation?.lng) {
      const path = [
        new window.google.maps.LatLng(techLocation.lat, techLocation.lng),
        new window.google.maps.LatLng(userLocation.lat, userLocation.lng)
      ];
      polylineRef.current.setPath(path);
      polylineRef.current.setMap(map);
    } else {
      polylineRef.current.setMap(null);
    }

    return () => {
      if (polylineRef.current) polylineRef.current.setMap(null);
    };
  }, [map, techLocation, userLocation]);

  return (
    <div className="h-screen w-full bg-slate-50 overflow-hidden flex flex-col">
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row relative overflow-hidden">
        
        {/* MAP SECTION */}
        <section className="h-[40vh] md:h-[50vh] lg:h-full lg:flex-1 relative overflow-hidden bg-slate-100 border-b lg:border-b-0 border-slate-200">
          {!isLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10">
              <div className="relative">
                <div className="size-20 rounded-full bg-indigo-50 flex items-center justify-center animate-pulse">
                  <Navigation className="size-8 text-indigo-400" />
                </div>
                <div className="absolute inset-0 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              </div>
              <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Initializing Tactical Overlay...</p>
            </div>
          )}

          {isLoaded && (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={techLocation || userLocation || { lat: 28.6139, lng: 77.2090 }}
              zoom={14}
              onLoad={onLoad}
              options={{ 
                disableDefaultUI: true, 
                zoomControl: true,
                styles: isDarkMode ? darkMapStyles : lightMapStyles
              }}
            >
              {techLocation && (
                <OverlayView position={techLocation} mapPaneName="overlayMouseTarget">
                  <div className="relative -translate-x-1/2 -translate-y-1/2">
                    <div className="relative group">
                      <div className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
                      <div className="size-14 bg-white rounded-full p-1 shadow-2xl border border-indigo-100 relative">
                        <div className="w-full h-full bg-indigo-600 rounded-full flex items-center justify-center animate-pulse">
                          <Wrench className="size-6 text-white" />
                        </div>
                      </div>
                      
                      <div className="absolute top-0 left-full ml-3 px-3 py-1.5 bg-indigo-600 text-white text-[9px] font-black rounded-xl uppercase tracking-widest whitespace-nowrap shadow-2xl border border-white/20 flex items-center gap-2">
                        <Clock className="size-3" />
                        {eta}
                      </div>

                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-1 bg-indigo-950 text-white text-[8px] font-black rounded-lg uppercase tracking-widest whitespace-nowrap shadow-2xl border border-white/20">
                        {techDetails.name} • LIVE
                      </div>
                    </div>
                  </div>
                </OverlayView>
              )}

              {userLocation && (
                <OverlayView position={userLocation} mapPaneName="overlayMouseTarget">
                  <div className="relative -translate-x-1/2 -translate-y-1/2">
                    <div className="size-10 bg-emerald-500 rounded-full border-4 border-white shadow-2xl relative flex items-center justify-center">
                       <MapPin className="size-5 text-white" />
                       <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-25" />
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-1 bg-white text-emerald-900 text-[8px] font-black rounded-lg uppercase tracking-widest whitespace-nowrap shadow-xl border border-slate-100">
                      DESTINATION
                    </div>
                  </div>
                </OverlayView>
              )}

              {/* Markers only, Polyline managed via effect below */}
            </GoogleMap>
          )}

           {/* THEME SWITCHER */}
           <div className="absolute top-6 right-6 z-50 pointer-events-auto">
             <button
               onClick={() => setIsDarkMode(!isDarkMode)}
               className={cn(
                 "p-3 rounded-full shadow-2xl backdrop-blur-md transition-all border flex items-center justify-center",
                 isDarkMode ? "bg-slate-800/80 border-slate-700 text-amber-400 hover:bg-slate-700" : "bg-white/80 border-slate-200 text-indigo-600 hover:bg-slate-50"
               )}
             >
               {isDarkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
             </button>
           </div>

          {/* FLOATING INTELLIGENCE HUD - TOP ON MOBILE, LEFT ON DESKTOP */}
          <div className="absolute top-4 lg:top-32 left-4 lg:left-6 w-[calc(100%-4.5rem)] lg:w-auto flex flex-wrap lg:flex-col gap-2 lg:gap-4 pointer-events-none z-20">
             <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white/90 backdrop-blur-xl p-2 lg:p-4 rounded-2xl lg:rounded-3xl shadow-lg border border-white/50 flex items-center gap-2 lg:gap-4 pointer-events-auto flex-1 min-w-[105px]">
                <div className="size-8 lg:size-12 bg-indigo-600/10 rounded-xl lg:rounded-2xl flex items-center justify-center border border-indigo-100 shrink-0">
                   <Clock className={cn("size-4 lg:size-6 text-indigo-600", eta === 'Syncing...' && "animate-spin")} />
                </div>
                <div className="min-w-0">
                   <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">ETA</p>
                      <span className="flex size-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                   </div>
                   <p className={cn("text-xs lg:text-lg font-black text-slate-900 truncate leading-none", eta === 'Syncing...' && "text-slate-400 animate-pulse")}>
                      {eta}
                   </p>
                </div>
             </motion.div>

             <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white/90 backdrop-blur-xl p-2 lg:p-4 rounded-2xl lg:rounded-3xl shadow-lg border border-white/50 flex items-center gap-2 lg:gap-4 pointer-events-auto flex-1 min-w-[105px]">
                <div className="size-8 lg:size-12 bg-indigo-600/10 rounded-xl lg:rounded-2xl flex items-center justify-center border border-indigo-100 shrink-0">
                   <LocateFixed className="size-4 lg:size-6 text-indigo-600" />
                </div>
                <div className="min-w-0">
                   <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate mb-0.5">Distance</p>
                   <p className="text-xs lg:text-lg font-black text-slate-900 tracking-tighter truncate leading-none">{localDistance}</p>
                </div>
             </motion.div>

             <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white/90 backdrop-blur-xl p-2 lg:p-4 rounded-2xl lg:rounded-3xl shadow-lg border border-white/50 flex items-center gap-2 lg:gap-4 pointer-events-auto flex-1 min-w-[105px]">
                <div className="size-8 lg:size-12 bg-emerald-600/10 rounded-xl lg:rounded-2xl flex items-center justify-center border border-emerald-100 shrink-0">
                   <Activity className="size-4 lg:size-6 text-emerald-600 animate-pulse" />
                </div>
                <div className="min-w-0">
                   <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate mb-0.5">System</p>
                   <p className="text-xs lg:text-lg font-black text-emerald-600 tracking-tighter truncate leading-none">CONN.</p>
                </div>
             </motion.div>
          </div>
        </section>

        {/* SIDEBAR */}
        <aside className="w-full lg:w-[400px] xl:w-[450px] flex-1 lg:flex-none lg:h-full bg-white flex flex-col border-l border-slate-100 relative z-10 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-scroll p-6 lg:p-10 pb-24 lg:pb-10 custom-scrollbar relative">
            {/* TACTICAL BACK BUTTON - UPPER RIGHT */}
            <div className="absolute top-6 lg:top-10 right-6 lg:right-10 z-30">
              <button 
                onClick={() => router.push('/customer/dashboard')}
                className="size-10 lg:size-12 rounded-xl lg:rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-white transition-all shadow-sm group"
              >
                <ArrowLeft className="size-5 lg:size-6 group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="mb-8 lg:mb-12 pt-10 lg:pt-0">
              <h1 className="text-2xl lg:text-4xl font-black text-slate-900 leading-none tracking-tighter mb-2 pr-14">{techDetails.service}</h1>
              <p className="text-slate-400 text-[10px] lg:text-xs font-bold uppercase tracking-[0.3em]">Deployment ID: {bookingId?.slice(-6).toUpperCase()}</p>
            </div>

            <div className="space-y-10">
              {/* Tech Profile Card */}
              <div className="bg-slate-50 rounded-[3rem] p-8 border border-slate-100 relative overflow-hidden group">
                 <div className="flex items-center gap-6 mb-8">
                    <div className="relative">
                      <div className="size-20 rounded-[2rem] bg-white border border-slate-200 overflow-hidden shadow-xl">
                        {techDetails.avatar ? <img src={techDetails.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-600 font-black text-2xl">{techDetails.name.charAt(0)}</div>}
                      </div>
                      <div className="absolute -bottom-2 -right-2 size-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                        <CheckCircle2 className="size-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{techDetails.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => <Star key={i} className="size-3 fill-current" />)}
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{techDetails.rating}</span>
                      </div>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <a href={`tel:${techDetails.phone}`} className="flex items-center justify-center gap-3 py-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 transition-all group/btn shadow-sm">
                      <Phone className="size-5 text-slate-400 group-hover/btn:text-indigo-600" />
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Call Tech</span>
                    </a>
                    <div className="flex flex-col items-center justify-center py-2 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/20">
                      <span className="text-[7px] font-bold uppercase tracking-widest opacity-70 mb-0.5">Secure OTP</span>
                      <span className="text-xl font-black tracking-[0.2em]">{otp}</span>
                    </div>
                 </div>

                 {/* Cancel Booking Option */}
                 {status !== 'In Progress' && status !== 'Completed' && status !== 'Cancelled' && (
                   <button 
                     onClick={() => setShowCancelModal(true)}
                     className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-rose-50/50 hover:bg-rose-50 text-rose-500 rounded-2xl border border-rose-100 hover:border-rose-200 transition-all text-[10px] font-black uppercase tracking-widest active:scale-95"
                   >
                     <XCircle className="size-3.5" />
                     Cancel Booking
                   </button>
                 )}
              </div>

              {/* Timeline */}
              <div className="space-y-8 pb-10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Protocol Status</span>
                </div>
                <div className="space-y-4">
                  <TimelineItem active={true} completed={true} title="Authentication" desc="Security link verified" />
                  <TimelineItem active={true} completed={status === 'Arrived'} title="Tracking Active" desc={`ETA: ${eta}`} icon={<Navigation className="size-5" />} />
                  <TimelineItem active={status === 'In Progress'} completed={status === 'Completed'} title="Execution" desc="Specialist working on site" icon={<Zap className="size-5" />} isLast={true} />
                </div>
              </div>
            </div>
          </div>
        </aside>

      </main>

      {/* PENDING / WAITING FOR ACCEPTANCE OVERLAY */}
      <AnimatePresence>
        {status === 'Pending' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-white/95 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center">
             <div className="relative mb-12">
                <div className="absolute -inset-10 bg-indigo-500/10 rounded-full animate-ping" />
                <div className="relative size-32 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40">
                  <Clock className="size-16 text-white animate-pulse" />
                </div>
             </div>
             <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter italic uppercase">Waiting for Acceptance</h2>
             <p className="text-slate-400 font-bold max-w-sm uppercase tracking-[0.2em] text-[10px] leading-loose">
               Your request has been dispatched. Live tracking will activate once the technician accepts the protocol.
             </p>
             <div className="flex flex-col gap-4 mt-12 w-full max-w-xs">
                <button onClick={() => router.push('/customer/dashboard')} className="px-8 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-800 transition-all shadow-2xl active:scale-95">Return to Dashboard</button>
                <button onClick={() => setShowCancelModal(true)} className="px-8 py-5 bg-rose-50 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-[0.3em] border border-rose-100 transition-all active:scale-95">Cancel Request</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IN PROGRESS FULLSCREEN HUD */}
      <AnimatePresence>
        {status === 'In Progress' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-white/95 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center">
             <div className="relative mb-12">
                <div className="absolute -inset-10 bg-indigo-500/10 rounded-full animate-ping" />
                <div className="relative size-32 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40">
                  <Zap className="size-16 text-white animate-pulse" />
                </div>
             </div>
             <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter italic">EXECUTION ACTIVE</h2>
             <p className="text-slate-400 font-bold max-w-sm uppercase tracking-[0.2em] text-[10px] leading-loose">Specialist is currently optimizing your service manifest. Signal link remains encrypted.</p>
             <button onClick={() => setStatus('Arrived')} className="mt-12 px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all shadow-2xl">Return to Monitoring</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CANCEL CONFIRMATION MODAL */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl relative overflow-hidden border border-slate-200">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 to-rose-600" />
                
                <div className="flex justify-between items-start mb-6">
                  <div className="size-16 bg-rose-50 rounded-[1.5rem] flex items-center justify-center border border-rose-100">
                    <AlertTriangle className="size-8 text-rose-500" />
                  </div>
                  <button onClick={() => !cancelling && setShowCancelModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition">
                    <X className="size-5 text-slate-400" />
                  </button>
                </div>

                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Cancel Booking?</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
                  Are you sure you want to cancel this service? The technician will be notified and the booking will be terminated.
                </p>

                <div className="space-y-4">
                  <button 
                    onClick={handleCancelBooking} 
                    disabled={cancelling} 
                    className="w-full py-4 rounded-2xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 flex items-center justify-center gap-2 active:scale-95 uppercase tracking-widest disabled:opacity-50"
                  >
                    {cancelling ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />} 
                    Confirm Cancellation
                  </button>
                  <button 
                    onClick={() => setShowCancelModal(false)} 
                    disabled={cancelling} 
                    className="w-full py-4 rounded-2xl text-xs font-black text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all active:scale-95 uppercase tracking-widest border border-slate-200 disabled:opacity-50"
                  >
                    Keep Booking
                  </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TimelineItem({ active, completed, title, desc, icon, isLast }: any) {
  return (
    <div className="flex gap-6 lg:gap-8 pb-8 lg:pb-10 relative">
      {!isLast && (
        <div className={cn(
          "absolute top-10 left-5 -ml-px w-0.5 h-[calc(100%-2.5rem)]",
          completed ? "bg-emerald-500" : "bg-slate-200"
        )} />
      )}
      <div className={cn(
        "size-10 shrink-0 rounded-2xl border-2 flex items-center justify-center z-10 transition-all bg-white relative",
        completed ? "bg-emerald-500 border-emerald-500 shadow-xl shadow-emerald-500/30" : 
        active ? "bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-500/30" : 
        "bg-white border-slate-200"
      )}>
        {completed ? <CheckCircle2 className="size-5 text-white" /> : 
         icon ? React.cloneElement(icon, { className: cn("size-5", active ? "text-white" : "text-slate-300") }) :
         <div className={cn("size-2 rounded-full", active ? "bg-white" : "bg-slate-200")} />}
      </div>
      <div className="min-w-0 pt-1">
        <h4 className={cn("text-xs font-black uppercase tracking-widest mb-1 truncate", active || completed ? "text-slate-900" : "text-slate-300")}>{title}</h4>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter line-clamp-2">{desc}</p>
      </div>
    </div>
  );
}
