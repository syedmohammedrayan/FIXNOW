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
  const [localDistance, setLocalDistance] = useState<string>('---');
  const [status, setStatus] = useState<string>('Initializing');
  const [otp, setOtp] = useState<string>('----');
  const [booking, setBooking] = useState<any>(null);
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
  
  const destinationLocation = userLocation || booking?.customerLocation || booking?.customer_location || 
    (booking?.customerLat ? { lat: booking.customerLat, lng: booking.customerLng } : 
     booking?.customer_lat ? { lat: booking.customer_lat, lng: booking.customer_lng } : null);

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
        setBooking(bData);
        
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
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  useEffect(() => {
    const destination = destinationLocation;
    
    if (!window.google?.maps || !techLocation || !destination) {
      console.log('Tracking: Waiting for components...', { techLocation, userLocation, destination });
      return;
    }
    
    console.log('Tracking: Requesting Distance Matrix...', { techLocation, destination });
    
    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [new window.google.maps.LatLng(techLocation.lat, techLocation.lng)],
        destinations: [new window.google.maps.LatLng(destination.lat, destination.lng)],
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status === window.google.maps.DistanceMatrixStatus.OK && response) {
          const element = response.rows[0].elements[0];
          if (element.status === 'OK') {
            const dText = element.distance?.text;
            const dVal = element.distance?.value;
            const eText = element.duration?.text;

            if (dText) setLocalDistance(dText);
            else if (dVal !== undefined) setLocalDistance(dVal > 1000 ? `${(dVal/1000).toFixed(1)}km` : `${Math.round(dVal)}m`);
            
            if (eText) setEta(eText);
          } else {
            const meters = window.google.maps.geometry.spherical.computeDistanceBetween(
              new window.google.maps.LatLng(techLocation.lat, techLocation.lng),
              new window.google.maps.LatLng(destination.lat, destination.lng)
            );
            setLocalDistance(meters > 1000 ? `${(meters/1000).toFixed(1)}km` : `${Math.round(meters)}m`);
            setEta(meters < 50 ? 'Arrived' : `${Math.ceil(meters / 400)} min`);
          }
        }
      }
    );

    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new window.google.maps.DirectionsService();
    }
    directionsServiceRef.current.route(
      {
        origin: techLocation,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        }
      }
    );
  }, [techLocation, userLocation, booking?.customerLocation]);

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

              {techLocation && destinationLocation && (
                <Polyline
                  path={[techLocation, destinationLocation]}
                  options={{
                    strokeColor: isDarkMode ? "#ffffff" : "#000000",
                    strokeOpacity: 0,
                    icons: [{
                      icon: {
                        path: 'M 0,-1 0,1',
                        strokeOpacity: 1,
                        scale: 3,
                        strokeColor: isDarkMode ? '#ffffff' : '#000000'
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
                    <div className="relative group flex flex-col items-center">
                      {/* Pulse effect */}
                      <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping scale-150" />
                      
                      {/* Tactical HUD Label */}
                      <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none z-30">
                        <div className="px-4 py-2 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.5)] whitespace-nowrap flex items-center gap-3">
                          <div className="flex items-center gap-1.5 border-r border-white/10 pr-3">
                            <Clock className="size-3.5 text-amber-400" />
                            <span className="text-[11px] font-black text-white uppercase tracking-tighter">{eta}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Navigation className="size-3.5 text-cyan-400" />
                            <span className="text-[11px] font-black text-white uppercase tracking-tighter">{localDistance}</span>
                          </div>
                        </div>
                        <div className="w-0.5 h-4 bg-gradient-to-b from-white/30 to-transparent" />
                      </div>

                      <div className="size-14 sm:size-16 bg-slate-900 rounded-[2rem] p-1 shadow-2xl border border-white/20 relative z-10 transition-transform group-hover:scale-110 duration-500">
                        <div className="w-full h-full bg-white rounded-[1.8rem] flex items-center justify-center overflow-hidden">
                          {techDetails.avatar ? (
                            <img src={techDetails.avatar} className="size-full object-cover" alt="Tech" />
                          ) : (
                            <Wrench className="size-7 text-slate-900" />
                          )}
                        </div>
                      </div>
                      
                      <div className="absolute top-16 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900/90 backdrop-blur-md text-white text-[8px] font-black rounded-lg uppercase tracking-[0.2em] whitespace-nowrap shadow-2xl border border-white/10">
                        {techDetails.name} • LIVE
                      </div>
                    </div>
                  </div>
                </OverlayView>
              )}

              {destinationLocation && (
                <OverlayView position={destinationLocation} mapPaneName="overlayMouseTarget">
                  <div className="relative -translate-x-1/2 -translate-y-1/2">
                    <div className="size-10 bg-emerald-500 rounded-2xl border-4 border-slate-950 shadow-2xl relative flex items-center justify-center">
                       <MapPin className="size-5 text-white" />
                       <div className="absolute inset-0 bg-emerald-500 rounded-2xl animate-ping opacity-25" />
                       <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-500 text-[8px] font-black text-white uppercase tracking-widest rounded shadow-lg whitespace-nowrap">Destination</div>
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

        {/* SIDEBAR - REIMAGINED CINEMATIC HUD */}
        <aside className="w-full lg:w-[420px] xl:w-[480px] flex-1 lg:flex-none lg:h-full bg-slate-950/40 backdrop-blur-3xl lg:bg-slate-950 flex flex-col border-t lg:border-t-0 lg:border-l border-white/10 relative z-10 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          
          <div className="flex-1 min-h-0 overflow-y-scroll p-6 sm:p-8 lg:p-10 pb-24 lg:pb-10 custom-scrollbar relative">
            {/* TACTICAL BACK BUTTON */}
            <div className="flex justify-between items-center mb-8 lg:mb-12">
              <button 
                onClick={() => router.push('/customer/dashboard')}
                className="size-10 sm:size-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all group"
              >
                <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="flex flex-col items-end">
                <p className="text-white font-black text-xs sm:text-sm tracking-tight italic">{techDetails.service}</p>
                <p className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">ID: {bookingId?.slice(-6).toUpperCase()}</p>
              </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
              {/* Tech Profile Card - Glassmorphism v2 */}
              <div className="relative p-6 sm:p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/[0.08] shadow-2xl overflow-hidden group" style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)' }}>
                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                 
                 <div className="relative flex flex-col items-center text-center">
                    <div className="relative mb-6">
                      <div className="size-20 sm:size-28 rounded-[2.5rem] bg-slate-900 border border-white/10 overflow-hidden shadow-2xl relative group-hover:scale-105 transition-transform duration-500">
                        {techDetails.avatar ? (
                          <div className="relative size-full">
                            <img src={techDetails.avatar} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] pointer-events-none" />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white font-black text-4xl">{techDetails.name.charAt(0)}</div>
                        )}
                      </div>
                      <div className="absolute -bottom-2 -right-2 size-8 sm:size-10 bg-emerald-500 rounded-2xl border-4 border-slate-950 flex items-center justify-center shadow-2xl">
                        <ShieldCheck className="size-4 sm:size-5 text-white" />
                      </div>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tighter italic mb-1">{techDetails.name}</h3>
                    <div className="flex items-center gap-2 mb-8">
                      <div className="flex text-amber-400 gap-0.5">
                        {[...Array(5)].map((_, i) => <Star key={i} className={cn("size-3.5", i < Math.floor(techDetails.rating) ? "fill-current" : "opacity-30")} />)}
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{techDetails.rating}</span>
                    </div>
                    
                    <div className="w-full grid grid-cols-2 gap-3 sm:gap-4">
                        <a href={`tel:${techDetails.phone}`} className="flex items-center justify-center gap-3 py-4 sm:py-5 bg-white rounded-3xl border border-white/10 hover:bg-slate-100 transition-all group/btn shadow-xl active:scale-[0.98]">
                          <Phone className="size-4 sm:size-5 text-slate-900" />
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Call Tech</span>
                        </a>
                        <div className="flex flex-col items-center justify-center py-3 bg-white/[0.04] backdrop-blur-xl text-white rounded-3xl border border-white/[0.1] shadow-inner group/otp">
                          <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/30 mb-0.5">Access Protocol</span>
                          <span className="text-xl sm:text-2xl font-black tracking-[0.3em] text-emerald-400 group-hover:scale-110 transition-transform">{otp}</span>
                        </div>
                    </div>
                 </div>

                 {/* Cancel Action - Integrated subtly */}
                 {status !== 'In Progress' && status !== 'Completed' && status !== 'Cancelled' && (
                   <button 
                     onClick={() => setShowCancelModal(true)}
                     className="w-full mt-6 py-4 bg-white/[0.02] hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-2xl border border-white/[0.05] hover:border-rose-500/20 transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                   >
                     <XCircle className="size-3.5" />
                     Abort Booking Protocol
                   </button>
                 )}
              </div>

              {/* Status Timeline - Cinematic Style */}
              <div className="relative py-4 px-2">
                <div className="flex items-center gap-3 mb-8">
                  <div className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Live Protocol Sequence</span>
                </div>
                
                <div className="space-y-2">
                  <TimelineItem active={true} completed={true} title="Deployment Initialized" desc="Satellite link encrypted & synced" />
                  <TimelineItem active={true} completed={status === 'Arrived' || status === 'In Progress'} title="Specialist En-Route" desc={`${eta} • ${localDistance}`} icon={<Navigation className="size-6" />} />
                  <TimelineItem active={status === 'In Progress'} completed={status === 'Completed'} title="Active Execution" desc="On-site maintenance in progress" icon={<Zap className="size-6" />} isLast={true} />
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
