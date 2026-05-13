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
  Minimize2,
  Plus,
  Minus
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
  const [isMapInteracted, setIsMapInteracted] = useState(false);
  
  // Stable map states to prevent snapping loops
  const [mapZoom, setMapZoom] = useState(14);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral | null>(null);

  // Initial Contextual Centering (Localize before live data)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!mapCenter) setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Fallback if denied, but don't show New Delhi immediately
        }
      );
    }
  }, []);

  // Cancellation states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Handle chatbot visibility in fullscreen
  useEffect(() => {
    if (isMapFullscreen) {
      document.body.classList.add('hide-chatbot');
    } else {
      document.body.classList.remove('hide-chatbot');
    }
    return () => document.body.classList.remove('hide-chatbot');
  }, [isMapFullscreen]);
  
  const destinationLocation = userLocation || booking?.customerLocation || booking?.customer_location || 
    (booking?.customerLat ? { lat: booking.customerLat, lng: booking.customerLng } : 
     booking?.customer_lat ? { lat: booking.customer_lat, lng: booking.customer_lng } : null);

  // Only initialise the loader once we have a real key — an empty string causes Google Maps to throw
  const mapsKey = currentKey || '';
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: mapsKey,
    libraries: LIBRARIES,
    id: 'fixnow-google-maps-script'
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
              setTechDetails((prev: any) => ({
                ...prev,
                name: tData.fullName || tData.name || bData.technicianName || bData.technician_name || prev.name,
                avatar: tData.profilePicture || tData.avatar || bData.technicianAvatar || bData.technician_avatar || prev.avatar,
                service: tData.serviceCategory || bData.category || bData.service_category || prev.service,
                phone: tData.phoneNumber || tData.phone || bData.technicianPhone || bData.technician_phone || prev.phone,
                rating: tData.rating || bData.technicianRating || bData.technician_rating || 4.8
              }));
              
              const tLoc = tData.location || tData.current_location || tData.tech_location || 
                (tData.lat ? { lat: tData.lat, lng: tData.lng } : 
                 tData.latitude ? { lat: tData.latitude, lng: tData.longitude } : 
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
    if (!isLoaded || !window.google?.maps || !techLocation || !destination) return;

    try {
      // 1. Geometric Calculation (instant, no API quota)
      if (window.google.maps.geometry?.spherical) {
        const meters = window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(techLocation.lat, techLocation.lng),
          new window.google.maps.LatLng(destination.lat, destination.lng)
        );
        setLocalDistance(meters > 1000 ? `${(meters / 1000).toFixed(1)}km` : `${Math.round(meters)}m`);
        setEta(`${Math.ceil(meters / 400)} min`);
      }

      // 2. Traffic-Aware Distance Matrix
      const dmService = new window.google.maps.DistanceMatrixService();
      dmService.getDistanceMatrix(
        {
          origins: [new window.google.maps.LatLng(techLocation.lat, techLocation.lng)],
          destinations: [new window.google.maps.LatLng(destination.lat, destination.lng)],
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
          if (status === 'OK' && response?.rows?.[0]?.elements?.[0]?.status === 'OK') {
            const el = response.rows[0].elements[0];
            if (el.distance?.text) setLocalDistance(el.distance.text);
            if (el.duration?.text) setEta(el.duration.text);
          }
        }
      );

      // 3. Directions Route (for road-snapped polyline)
      if (!directionsServiceRef.current) {
        directionsServiceRef.current = new window.google.maps.DirectionsService();
      }
      directionsServiceRef.current.route(
        { origin: techLocation, destination, travelMode: window.google.maps.TravelMode.DRIVING },
        (result, status) => {
          if (status === 'OK' && result) setDirections(result);
        }
      );
    } catch (err) {
      console.warn('[FIXNOW/Tracking] Maps calculation error:', err);
    }
  }, [isLoaded, techLocation, userLocation, booking?.customerLocation]);

  useEffect(() => {
    if (!map || !window.google?.maps || isMapInteracted) return;

    if (techLocation && userLocation) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(techLocation);
      bounds.extend(userLocation);
      map.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });
    } else if (techLocation) {
      map.panTo(techLocation);
    } else if (userLocation) {
      map.panTo(userLocation);
    }
  }, [map, techLocation, userLocation, isMapInteracted]);

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
          "relative overflow-hidden bg-slate-900 transition-all duration-500 flex-shrink-0",
          isMapFullscreen 
            ? "fixed inset-0 z-[150] h-full w-full" 
            : "h-[52vh] sm:h-[55vh] lg:h-full lg:flex-1 border-b lg:border-b-0 border-white/10"
        )}>
          {!isLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl z-10">
              {loadError ? (
                <div className="max-w-sm text-center px-8">
                  <div className="size-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                    <AlertTriangle className="size-8 text-rose-500" />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-4">Satellite Signal Lost</h3>
                  <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase tracking-widest mb-8">
                    {loadError.message.includes('Billing') || loadError.message.includes('REQUEST_DENIED')
                      ? "API Configuration Error: Access denied. Please ensure the Google Cloud project has an active billing account linked to these coordinates."
                      : loadError.message}
                  </p>
                  <button onClick={() => window.location.reload()} className="px-10 py-4 bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-rose-600 transition-all active:scale-95 shadow-xl shadow-rose-500/20">Retry Uplink</button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <div className="size-20 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                      <Navigation className="size-8 text-white/40" />
                    </div>
                    <div className="absolute inset-0 border-4 border-white/10 border-t-white rounded-full animate-spin" />
                  </div>
                  <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Synchronizing Tactical Overlay...</p>
                </>
              )}
            </div>
          )}

          {isLoaded && (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={mapCenter || { lat: 0, lng: 0 }}
              zoom={mapZoom}
              onLoad={onLoad}
              onDragStart={() => setIsMapInteracted(true)}
              onZoomChanged={() => {
                if (map) {
                  const z = map.getZoom();
                  if (z) setMapZoom(z);
                }
              }}
              options={{
                disableDefaultUI: true,
                styles: isDarkMode ? darkMapStyles : lightMapStyles,
                zoomControl: false,
                gestureHandling: 'greedy'
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

                      <div className="relative z-10">
                        <span className="text-4xl sm:text-5xl drop-shadow-[0_10px_15px_rgba(34,211,238,0.4)] hover:scale-110 transition-transform block">🛠️</span>
                      </div>
                      
                      <div className="absolute top-16 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900/90 backdrop-blur-md text-white text-[8px] sm:text-[9px] font-black rounded-lg uppercase tracking-[0.2em] whitespace-nowrap shadow-2xl border border-white/10 flex items-center gap-1.5">
                        {techDetails.name} • LIVE
                      </div>
                    </div>
                  </div>
                </OverlayView>
              )}

              {destinationLocation && (
                <OverlayView position={destinationLocation} mapPaneName="overlayMouseTarget">
                  <div className="relative -translate-x-1/2 -translate-y-1/2">
                    <div className="relative z-10 flex flex-col items-center">
                      <span className="text-4xl sm:text-5xl drop-shadow-[0_10px_15px_rgba(52,211,153,0.4)] hover:scale-110 transition-transform block">📍</span>
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-30 pointer-events-none scale-150" />
                      <div className="mt-2 px-3 py-1 bg-slate-900/90 backdrop-blur-md text-[8px] sm:text-[9px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap shadow-2xl border border-white/10 flex items-center gap-1.5 rounded-lg">
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        YOU • LIVE
                      </div>
                    </div>
                  </div>
                </OverlayView>
              )}

              {/* Markers only, Polyline managed via effect below */}
            </GoogleMap>
          )}

            <div className="absolute bottom-6 right-6 sm:top-6 sm:right-6 sm:bottom-auto z-[200] flex flex-col gap-2 sm:gap-3 pointer-events-auto">
              <button
                onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                className="size-12 sm:size-16 rounded-2xl shadow-2xl bg-slate-900/90 backdrop-blur-xl border border-white/20 text-white hover:bg-white/10 transition-all flex items-center justify-center active:scale-90"
                title={isMapFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
              >
                {isMapFullscreen ? (
                  <Minimize2 className="size-5 sm:size-6 text-cyan-400" />
                ) : (
                  <Maximize2 className="size-5 sm:size-6" />
                )}
              </button>

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="size-12 sm:size-16 rounded-2xl shadow-2xl bg-slate-900/90 backdrop-blur-xl border border-white/20 text-white hover:bg-white/10 transition-all flex items-center justify-center active:scale-90"
              >
                {isDarkMode ? <Sun className="size-5 sm:size-6 text-amber-400" /> : <Moon className="size-5 sm:size-6" />}
              </button>

              {/* Custom Tactical Zoom Controls */}
              <div className="flex flex-col gap-2 mt-2">
                <button
                  onClick={() => {
                    const newZoom = (map?.getZoom() || 14) + 1;
                    map?.setZoom(newZoom);
                    setMapZoom(newZoom);
                  }}
                  className="size-12 sm:size-16 rounded-2xl shadow-2xl bg-slate-900/90 backdrop-blur-xl border border-white/20 text-white hover:bg-white/10 transition-all flex items-center justify-center font-black text-xl active:scale-90"
                >
                  <Plus className="size-5 sm:size-6" />
                </button>
                <button
                  onClick={() => {
                    const newZoom = (map?.getZoom() || 14) - 1;
                    map?.setZoom(newZoom);
                    setMapZoom(newZoom);
                  }}
                  className="size-12 sm:size-16 rounded-2xl shadow-2xl bg-slate-900/90 backdrop-blur-xl border border-white/20 text-white hover:bg-white/10 transition-all flex items-center justify-center font-black text-xl active:scale-90"
                >
                  <Minus className="size-5 sm:size-6" />
                </button>
                
                <button
                  onClick={() => {
                    setIsMapInteracted(false);
                    if (map && techLocation && userLocation) {
                      const bounds = new window.google.maps.LatLngBounds();
                      bounds.extend(techLocation);
                      bounds.extend(userLocation);
                      map.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });
                    }
                  }}
                  className="size-12 sm:size-16 rounded-2xl shadow-2xl bg-slate-900/90 backdrop-blur-xl border border-white/20 text-white hover:bg-white/10 transition-all flex items-center justify-center font-black text-xl active:scale-90 mt-2"
                  title="Re-center Tracking"
                >
                  <LocateFixed className="size-5 sm:size-6" />
                </button>
              </div>
            </div>

          {/* FLOATING HUD - top-left on mobile (below buttons strip), left panel on desktop */}
          <div className="absolute top-3 left-3 right-16 z-20 flex flex-row lg:flex-col gap-2 lg:gap-5 pointer-events-none lg:top-32 lg:left-8 lg:right-auto lg:w-auto">
             <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-slate-900/95 backdrop-blur-2xl px-3 py-2 lg:p-5 rounded-xl lg:rounded-[2rem] shadow-2xl border border-white/10 flex items-center gap-2 lg:gap-5 pointer-events-auto flex-1 min-w-0">
                <div className="size-7 lg:size-14 bg-white/5 rounded-lg lg:rounded-3xl flex items-center justify-center border border-white/10 shrink-0">
                   <Clock className={cn("size-3.5 lg:size-7 text-white", eta === 'Syncing...' && "animate-spin")} />
                </div>
                <div className="min-w-0">
                   <p className="text-[7px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">ETA</p>
                   <p className={cn("text-xs lg:text-2xl font-black text-white truncate leading-none tracking-tight", eta === 'Syncing...' && "text-slate-500 animate-pulse")}>{eta}</p>
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

        {/* SIDEBAR — GLASSMORPHIC CINEMATIC HUD */}
        <aside className="w-full lg:w-[400px] xl:w-[460px] flex-1 lg:flex-none lg:h-full flex flex-col border-t lg:border-t-0 lg:border-l border-white/[0.07] relative z-10 overflow-hidden min-h-0"
          style={{ background: 'linear-gradient(160deg, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.99) 100%)', backdropFilter: 'blur(40px)' }}>

          {/* Ambient glow layers */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/[0.06] rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-cyan-500/[0.05] rounded-full blur-[60px] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.025] via-transparent to-transparent pointer-events-none" />

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-4 sm:p-6 lg:p-8 pb-6 lg:pb-8 relative z-10">

            {/* ── Header Row ── */}
            <div className="flex items-center justify-between mb-4 sm:mb-7">
              <button
                onClick={() => router.push('/customer/dashboard')}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.09] transition-all group"
              >
                <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
              </button>

              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">{techDetails.service}</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.25em]">#{bookingId?.slice(-6).toUpperCase()}</span>
              </div>
            </div>

            {/* ── Live Status Badge ── */}
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-white/[0.06]"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="relative flex size-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex rounded-full size-2.5 bg-cyan-400" />
              </span>
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]">Live Satellite Link</span>
              <span className="ml-auto text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-xl border"
                style={{
                  color: status === 'Completed' ? '#34d399' : status === 'Cancelled' ? '#f87171' : '#818cf8',
                  borderColor: status === 'Completed' ? 'rgba(52,211,153,0.2)' : status === 'Cancelled' ? 'rgba(248,113,113,0.2)' : 'rgba(129,140,248,0.2)',
                  background: status === 'Completed' ? 'rgba(52,211,153,0.08)' : status === 'Cancelled' ? 'rgba(248,113,113,0.08)' : 'rgba(129,140,248,0.08)'
                }}>
                {status}
              </span>
            </div>

            {/* ── ETA + Distance Metric Row ── */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="rounded-xl sm:rounded-2xl border border-white/[0.07] p-3 sm:p-4 flex flex-col gap-1" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3 sm:size-3.5 text-amber-400" />
                  <span className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest">ETA</span>
                </div>
                <p className="text-base sm:text-lg font-black text-white tracking-tight leading-none">{eta}</p>
              </div>
              <div className="rounded-xl sm:rounded-2xl border border-white/[0.07] p-3 sm:p-4 flex flex-col gap-1" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center gap-1.5">
                  <Navigation className="size-3 sm:size-3.5 text-cyan-400" />
                  <span className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest">Distance</span>
                </div>
                <p className="text-base sm:text-lg font-black text-white tracking-tight leading-none">{localDistance}</p>
              </div>
            </div>

            {/* ── Technician Profile Card ── */}
            <div className="rounded-[2rem] border border-white/[0.07] overflow-hidden mb-6 relative group"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              {/* Avatar + name row */}
              <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 lg:p-6">
                <div className="relative shrink-0">
                  <div className="size-14 sm:size-16 lg:size-20 rounded-[1.2rem] sm:rounded-[1.5rem] overflow-hidden border border-white/[0.1] shadow-xl bg-slate-800">
                    {techDetails.avatar ? (
                      <img src={techDetails.avatar} className="w-full h-full object-cover" alt="Tech" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-black text-2xl">
                        {techDetails.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 size-6 bg-emerald-500 rounded-xl border-2 border-slate-900 flex items-center justify-center shadow-lg">
                    <ShieldCheck className="size-3.5 text-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">{techDetails.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">{techDetails.service}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="flex text-amber-400 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("size-3", i < Math.floor(techDetails.rating) ? "fill-current" : "opacity-25")} />
                      ))}
                    </div>
                    <span className="text-[9px] font-black text-slate-500">{techDetails.rating}</span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/[0.06] mx-5" />

              {/* OTP + Call row */}
              <div className="grid grid-cols-2 gap-3 p-5 sm:p-6">
                {/* OTP */}
                <div className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border border-emerald-500/20"
                  style={{ background: 'rgba(52,211,153,0.06)' }}>
                  <span className="text-[7px] font-black uppercase tracking-[0.3em] text-emerald-400/60">Access OTP</span>
                  <span className="text-2xl font-black tracking-[0.25em] text-emerald-400">{otp}</span>
                </div>

                {/* Call button */}
                <a href={`tel:${techDetails.phone}`}
                  className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border border-white/[0.08] hover:border-white/20 transition-all group/call active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <Phone className="size-5 text-white group-hover/call:text-cyan-400 transition-colors" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover/call:text-white transition-colors">Call Now</span>
                </a>
              </div>

              {/* Abort button */}
              {status !== 'In Progress' && status !== 'Completed' && status !== 'Cancelled' && (
                <div className="px-5 sm:px-6 pb-5">
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-rose-500/[0.15] text-slate-500 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/[0.06] transition-all"
                  >
                    <XCircle className="size-3.5" />
                    Abort Booking Protocol
                  </button>
                </div>
              )}
            </div>

            {/* ── Live Protocol Timeline ── */}
            <div className="rounded-[2rem] border border-white/[0.07] p-5 sm:p-6"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)' }}>
              <div className="flex items-center gap-2.5 mb-6">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-cyan-400" />
                </span>
                <span className="text-[10px] font-black text-white uppercase tracking-[0.35em]">Live Protocol Sequence</span>
              </div>

              <div className="space-y-2">
                <TimelineItem active={true} completed={true} title="Deployment Initialized" desc="Satellite link encrypted & synced" />
                <TimelineItem active={true} completed={status === 'Arrived' || status === 'In Progress'} title="Specialist En-Route" desc={`${eta} • ${localDistance}`} icon={<Navigation className="size-6" />} />
                <TimelineItem active={status === 'In Progress'} completed={status === 'Completed'} title="Active Execution" desc="On-site maintenance in progress" icon={<Zap className="size-6" />} isLast={true} />
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
