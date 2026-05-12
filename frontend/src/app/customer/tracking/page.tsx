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
  X,
  Maximize2,
  Minimize2
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
  const hasInitiallyCentered = useRef(false);
  const directionsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<any>(null);
  const [hasFitBounds, setHasFitBounds] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

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

  // Map & Route Management
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  
  useEffect(() => {
    if (!window.google?.maps || !techLocation || !userLocation) return;
    
    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new window.google.maps.DirectionsService();
    }

    directionsServiceRef.current.route(
      {
        origin: techLocation,
        destination: userLocation,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          const route = result.routes[0].legs[0];
          setLocalDistance(route.distance?.text || '');
          setEta(route.duration?.text || '');
        }
      }
    );
  }, [techLocation, userLocation]);

  useEffect(() => {
    if (map && techLocation && userLocation && window.google?.maps && !hasInitiallyCentered.current) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(techLocation);
      bounds.extend(userLocation);
      map.fitBounds(bounds, { top: 150, right: 100, bottom: 250, left: 100 });
      hasInitiallyCentered.current = true;
    }
  }, [map, techLocation, userLocation]);

  // Direct Map Polyline Management (Dotted Line)
  useEffect(() => {
    if (!map || !window.google?.maps || !techLocation || !userLocation) return;
    
    // We use @react-google-maps/api components in the render instead of manual Polyline management where possible
  }, [map, techLocation, userLocation]);

  return (
    <div className="h-screen w-full bg-slate-950 overflow-hidden flex flex-col font-sans">
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row relative overflow-hidden">
        
        {/* MAP SECTION */}
        <section className={cn(
          "relative overflow-hidden bg-slate-900 transition-all duration-500",
          isMapFullscreen 
            ? "fixed inset-0 z-[150] h-full w-full" 
            : "h-[35vh] sm:h-[45vh] lg:h-full lg:flex-1 border-b lg:border-b-0 border-white/10"
        )}>
          {!isLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl z-10">
              <div className="relative">
                <div className="size-20 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                  <Navigation className="size-8 text-white/40" />
                </div>
                <div className="absolute inset-0 border-4 border-white/10 border-t-white rounded-full animate-spin" />
              </div>
              <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Synchronizing Tactical Overlay...</p>
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
              {directions && (
                <DirectionsRenderer
                  directions={directions}
                  options={{
                    suppressMarkers: true,
                    polylineOptions: {
                      strokeColor: isDarkMode ? "#818cf8" : "#4f46e5",
                      strokeWeight: 5,
                      strokeOpacity: 0.8
                    }
                  }}
                />
              )}

              {techLocation && userLocation && (
                <Polyline
                  path={[techLocation, userLocation]}
                  options={{
                    strokeColor: "#ffffff",
                    strokeOpacity: 0,
                    icons: [{
                      icon: {
                        path: 'M 0,-1 0,1',
                        strokeOpacity: 1,
                        scale: 3,
                        strokeColor: '#ffffff'
                      },
                      offset: '0',
                      repeat: '20px'
                    }],
                    zIndex: 10
                  }}
                />
              )}

              {techLocation && (
                <OverlayView position={techLocation} mapPaneName="overlayMouseTarget">
                  <div className="relative -translate-x-1/2 -translate-y-1/2">
                    <div className="relative group">
                      <div className="absolute -inset-4 bg-white/10 rounded-full blur-xl animate-pulse" />
                      <div className="size-14 bg-slate-900 rounded-full p-1 shadow-2xl border border-white/20 relative">
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                          <Wrench className="size-6 text-slate-900" />
                        </div>
                      </div>
                      
                      <div className="absolute top-0 left-full ml-3 px-3 py-1.5 bg-white text-slate-900 text-[9px] font-black rounded-xl uppercase tracking-widest whitespace-nowrap shadow-2xl border border-white/20 flex items-center gap-2">
                        <Clock className="size-3" />
                        {eta}
                      </div>

                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-1 bg-slate-900/90 backdrop-blur-md text-white text-[8px] font-black rounded-lg uppercase tracking-widest whitespace-nowrap shadow-2xl border border-white/20">
                        {techDetails.name} • LIVE
                      </div>
                    </div>
                  </div>
                </OverlayView>
              )}

              {userLocation && (
                <OverlayView position={userLocation} mapPaneName="overlayMouseTarget">
                  <div className="relative -translate-x-1/2 -translate-y-1/2">
                    <div className="size-10 bg-emerald-500 rounded-full border-4 border-slate-900 shadow-2xl relative flex items-center justify-center">
                       <MapPin className="size-5 text-white" />
                       <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-25" />
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-1 bg-slate-900/90 backdrop-blur-md text-emerald-400 text-[8px] font-black rounded-lg uppercase tracking-widest whitespace-nowrap shadow-xl border border-white/10">
                      DESTINATION
                    </div>
                  </div>
                </OverlayView>
              )}

              {/* Markers only, Polyline managed via effect below */}
            </GoogleMap>
          )}

            <div className="absolute top-3 sm:top-6 right-3 sm:right-6 z-50 flex flex-col gap-2 sm:gap-3 pointer-events-auto">
              <button
                onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center"
                title={isMapFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
              >
                {isMapFullscreen ? (
                  <Minimize2 className="size-4 sm:size-6" />
                ) : (
                  <Maximize2 className="size-4 sm:size-6" />
                )}
              </button>

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center"
              >
                {isDarkMode ? <Sun className="size-4 sm:size-6 text-amber-400" /> : <Moon className="size-4 sm:size-6" />}
              </button>
            </div>

          {/* FLOATING INTELLIGENCE HUD - TOP ON MOBILE, LEFT ON DESKTOP */}
          <div className="absolute top-3 sm:top-4 lg:top-32 left-3 sm:left-4 lg:left-8 w-[calc(100%-5rem)] sm:w-[calc(100%-8rem)] lg:w-auto flex flex-row lg:flex-col gap-2 sm:gap-3 lg:gap-5 pointer-events-none z-20">
             <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-slate-900/90 backdrop-blur-2xl p-2.5 sm:p-3 lg:p-5 rounded-xl sm:rounded-[1.5rem] lg:rounded-[2rem] shadow-2xl border border-white/10 flex items-center gap-2 sm:gap-3 lg:gap-5 pointer-events-auto flex-1 min-w-0">
                <div className="size-8 sm:size-10 lg:size-14 bg-white/5 rounded-xl sm:rounded-2xl lg:rounded-3xl flex items-center justify-center border border-white/10 shrink-0 shadow-inner">
                   <Clock className={cn("size-4 sm:size-5 lg:size-7 text-white", eta === 'Syncing...' && "animate-spin")} />
                </div>
                <div className="min-w-0">
                   <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                      <p className="text-[7px] sm:text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] truncate">ETA</p>
                      <span className="flex size-1 sm:size-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                   </div>
                   <p className={cn("text-xs sm:text-sm lg:text-2xl font-black text-white truncate leading-none tracking-tight", eta === 'Syncing...' && "text-slate-500 animate-pulse")}>
                      {eta}
                   </p>
                </div>
             </motion.div>

             <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-slate-900/90 backdrop-blur-2xl p-2.5 sm:p-3 lg:p-5 rounded-xl sm:rounded-[1.5rem] lg:rounded-[2rem] shadow-2xl border border-white/10 flex items-center gap-2 sm:gap-3 lg:gap-5 pointer-events-auto flex-1 min-w-0">
                <div className="size-8 sm:size-10 lg:size-14 bg-white/5 rounded-xl sm:rounded-2xl lg:rounded-3xl flex items-center justify-center border border-white/10 shrink-0 shadow-inner">
                   <LocateFixed className="size-4 sm:size-5 lg:size-7 text-white" />
                </div>
                <div className="min-w-0">
                   <p className="text-[7px] sm:text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] truncate mb-0.5 sm:mb-1">Distance</p>
                   <p className="text-xs sm:text-sm lg:text-2xl font-black text-white tracking-tight truncate leading-none">{localDistance}</p>
                </div>
             </motion.div>

          </div>
        </section>

        {/* SIDEBAR */}
        <aside className="w-full lg:w-[400px] xl:w-[450px] flex-1 lg:flex-none lg:h-full bg-slate-950 flex flex-col border-l border-white/10 relative z-10 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-scroll p-4 sm:p-6 lg:p-10 pb-24 lg:pb-10 custom-scrollbar relative">
            {/* TACTICAL BACK BUTTON - UPPER RIGHT */}
            <div className="absolute top-4 sm:top-6 lg:top-10 right-4 sm:right-6 lg:right-10 z-30">
              <button 
                onClick={() => router.push('/customer/dashboard')}
                className="size-10 sm:size-12 lg:size-14 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all shadow-2xl group"
              >
                <ArrowLeft className="size-5 sm:size-6 group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="mb-8 sm:mb-10 lg:mb-14 pt-10 sm:pt-12 lg:pt-0">
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-white leading-none tracking-tighter mb-3 sm:mb-4 pr-14 sm:pr-16 italic">{techDetails.service}</h1>
              <p className="text-slate-500 text-[9px] sm:text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] sm:tracking-[0.4em]">DEPLOYMENT ID: {bookingId?.slice(-6).toUpperCase()}</p>
            </div>

            <div className="space-y-6 sm:space-y-10">
              {/* Tech Profile Card */}
              <div className="bg-white/[0.04] rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-7 lg:p-10 border border-white/[0.08] relative overflow-hidden group shadow-2xl" style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04)' }}>
                 <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-10">
                    <div className="relative">
                      <div className="size-16 sm:size-20 lg:size-24 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] bg-slate-900 border border-white/10 overflow-hidden shadow-2xl relative">
                        {techDetails.avatar ? (
                          <div className="relative size-full">
                            <img src={techDetails.avatar} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] pointer-events-none" />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white font-black text-3xl">{techDetails.name.charAt(0)}</div>
                        )}
                        <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] pointer-events-none" />
                      </div>
                      <div className="absolute -bottom-1.5 sm:-bottom-2 -right-1.5 sm:-right-2 size-7 sm:size-8 lg:size-10 bg-emerald-500 rounded-full border-3 sm:border-4 border-slate-900 flex items-center justify-center shadow-2xl">
                        <CheckCircle2 className="size-4 sm:size-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tighter italic">{techDetails.name}</h3>
                      <div className="flex items-center gap-2.5 mt-2">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => <Star key={i} className="size-4 fill-current" />)}
                        </div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{techDetails.rating}</span>
                      </div>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3 sm:gap-5">
                     <a href={`tel:${techDetails.phone}`} className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-5 bg-white rounded-xl sm:rounded-3xl border border-white/10 hover:bg-slate-100 transition-all group/btn shadow-2xl">
                       <Phone className="size-4 sm:size-6 text-slate-900" />
                       <span className="text-[9px] sm:text-[11px] font-black text-slate-900 uppercase tracking-widest">Call</span>
                     </a>
                     <div className="flex flex-col items-center justify-center py-2 sm:py-3 bg-white/[0.04] backdrop-blur-md text-white rounded-xl sm:rounded-3xl border border-white/[0.08] shadow-inner">
                       <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/30 mb-0.5 sm:mb-1">Access OTP</span>
                       <span className="text-lg sm:text-2xl font-black tracking-[0.2em] sm:tracking-[0.3em]">{otp}</span>
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
              <div className="space-y-8 sm:space-y-12 pb-8 sm:pb-12">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-black text-slate-500 uppercase tracking-[0.5em]">Protocol Status</span>
                </div>
                <div className="space-y-6">
                  <TimelineItem active={true} completed={true} title="Authentication" desc="Satellite link encrypted" />
                  <TimelineItem active={true} completed={status === 'Arrived'} title="Tactical Tracking" desc={`ETA: ${eta}`} icon={<Navigation className="size-6" />} />
                  <TimelineItem active={status === 'In Progress'} completed={status === 'Completed'} title="Service Execution" desc="Specialist working on site" icon={<Zap className="size-6" />} isLast={true} />
                </div>
              </div>
            </div>
          </div>
        </aside>

      </main>

      {/* PENDING / WAITING FOR ACCEPTANCE OVERLAY */}
      <AnimatePresence>
        {status === 'Pending' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-slate-950/98 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center">
             <div className="relative mb-16">
                <div className="absolute -inset-16 bg-white/5 rounded-full animate-ping" />
                <div className="relative size-40 bg-white rounded-[3rem] flex items-center justify-center shadow-2xl">
                  <Clock className="size-20 text-slate-950 animate-pulse" />
                </div>
             </div>
             <h2 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white mb-4 sm:mb-6 tracking-tighter italic uppercase">Synchronizing...</h2>
             <p className="text-slate-400 font-bold max-w-md uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[9px] sm:text-[10px] lg:text-xs leading-loose px-4">
               Your request has been broadcasted to the network. Tracking will activate once the specialist accepts.
             </p>
             <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 mt-10 sm:mt-16 w-full max-w-md px-4">
                <button onClick={() => router.push('/customer/dashboard')} className="flex-1 px-6 sm:px-10 py-4 sm:py-6 bg-white text-slate-900 rounded-2xl sm:rounded-3xl font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] hover:bg-slate-100 transition-all shadow-2xl active:scale-95">Return to Base</button>
                <button onClick={() => setShowCancelModal(true)} className="flex-1 px-6 sm:px-10 py-4 sm:py-6 bg-white/5 text-slate-400 rounded-2xl sm:rounded-3xl font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] border border-white/10 transition-all hover:bg-white/10 active:scale-95">Cancel</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IN PROGRESS FULLSCREEN HUD */}
      <AnimatePresence>
        {status === 'In Progress' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-slate-950/98 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center">
             <div className="relative mb-16">
                <div className="absolute -inset-16 bg-white/5 rounded-full animate-ping" />
                <div className="relative size-40 bg-white rounded-[3rem] flex items-center justify-center shadow-2xl">
                  <Zap className="size-20 text-slate-950 animate-pulse" />
                </div>
             </div>
             <h2 className="text-3xl sm:text-5xl lg:text-8xl font-black text-white mb-4 sm:mb-6 tracking-tighter italic">EXECUTION ACTIVE</h2>
             <p className="text-slate-400 font-bold max-w-md uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[9px] sm:text-[10px] lg:text-xs leading-loose px-4">Specialist is currently working on your service. Tactical link remains encrypted.</p>
             <button onClick={() => setStatus('Arrived')} className="mt-10 sm:mt-16 px-10 sm:px-16 py-4 sm:py-6 bg-white text-slate-900 rounded-2xl sm:rounded-3xl font-black text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] hover:bg-slate-100 transition-all shadow-2xl active:scale-95">Return to Monitoring</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CANCEL CONFIRMATION MODAL */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-slate-900/95 backdrop-blur-3xl rounded-t-[2rem] sm:rounded-[3rem] p-6 sm:p-10 md:p-12 max-w-md w-full shadow-2xl relative overflow-hidden border border-white/10">
                <div className="absolute top-0 left-0 w-full h-2 bg-rose-600" />
                
                <div className="flex justify-between items-start mb-8">
                  <div className="size-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center border border-rose-500/20">
                    <AlertTriangle className="size-10 text-rose-500" />
                  </div>
                  <button onClick={() => !cancelling && setShowCancelModal(false)} className="p-3 hover:bg-white/5 rounded-2xl transition border border-transparent hover:border-white/10">
                    <X className="size-6 text-slate-400" />
                  </button>
                </div>

                <h3 className="text-3xl font-black text-white tracking-tighter mb-4 italic">Abort Mission?</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10 uppercase tracking-tight">
                  Are you sure you want to terminate this service protocol? The specialist will be notified and the deployment will be purged.
                </p>

                <div className="space-y-4">
                  <button 
                    onClick={handleCancelBooking} 
                    disabled={cancelling} 
                    className="w-full py-5 rounded-3xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 uppercase tracking-[0.2em] disabled:opacity-50"
                  >
                    {cancelling ? <Loader2 className="size-5 animate-spin" /> : <XCircle className="size-5" />} 
                    Confirm Purge
                  </button>
                  <button 
                    onClick={() => setShowCancelModal(false)} 
                    disabled={cancelling} 
                    className="w-full py-5 rounded-3xl text-xs font-black text-slate-400 bg-white/5 hover:bg-white/10 transition-all active:scale-95 uppercase tracking-[0.2em] border border-white/10 disabled:opacity-50"
                  >
                    Maintain Protocol
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
    <div className="flex gap-5 sm:gap-8 lg:gap-10 pb-6 sm:pb-10 lg:pb-12 relative">
      {!isLast && (
        <div className={cn(
          "absolute top-12 left-6 -ml-px w-0.5 h-[calc(100%-2.5rem)]",
          completed ? "bg-emerald-500" : "bg-white/10"
        )} />
      )}
      <div className={cn(
        "size-12 shrink-0 rounded-2xl border-2 flex items-center justify-center z-10 transition-all relative",
        completed ? "bg-emerald-500 border-emerald-500 shadow-2xl shadow-emerald-500/40" : 
        active ? "bg-white border-white shadow-2xl shadow-white/20" : 
        "bg-slate-900 border-white/10"
      )}>
        {completed ? <CheckCircle2 className="size-6 text-white" /> : 
         icon ? React.cloneElement(icon, { className: cn("size-6", active ? "text-slate-950" : "text-slate-600") }) :
         <div className={cn("size-2.5 rounded-full", active ? "bg-slate-950" : "bg-slate-700")} />}
      </div>
      <div className="min-w-0 pt-1.5">
        <h4 className={cn("text-[11px] font-black uppercase tracking-[0.2em] mb-1.5 truncate", active || completed ? "text-white" : "text-slate-600")}>{title}</h4>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight line-clamp-2">{desc}</p>
      </div>
    </div>
  );
}
