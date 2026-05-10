'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { API_BASE, SOCKET_URL } from '@/lib/config';
import axios from 'axios';
import {
  ArrowLeft, MapPin, Phone, Navigation, CheckCircle2,
  XCircle, Loader2, ShieldCheck, AlertTriangle, Activity,
  User, DollarSign, Clock, RefreshCw, Zap, Wrench, Plus, Trash2, CreditCard, Printer, Moon, Sun
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { io, Socket } from 'socket.io-client';
import TechnicianSidebar from '@/components/technician/Sidebar';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, OverlayView, Polyline } from '@react-google-maps/api';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';

const LIBRARIES: ("geometry" | "places" | "visualization")[] = ["geometry", "places", "visualization"];

interface Booking {
  id: string;
  category: string;
  status: string;
  address?: string;
  contactNumber?: string;
  estimatedCostRange?: string;
  customerId?: string;
  customerName?: string;
  technicianId?: string;
  createdAt?: string;
  customerLocation?: { lat: number; lng: number };
  customer_location?: { lat: number; lng: number };
  customer_lat?: number;
  customer_lng?: number;
  customer_name?: string;
  technician_id?: string;
  serviceStartedAt?: string;
}

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

export default function TechnicianServicePage() {
  const { currentKey, rotateKey } = useGoogleMapsKey();
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [techLocation, setTechLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [liveAddress, setLiveAddress] = useState<string>('');
  const [addressParts, setAddressParts] = useState<{ street: string; area: string; zone: string; city: string }>({ street: '', area: '', zone: '', city: '' });
  const [localDistance, setLocalDistance] = useState<string>('');
  const [mapReady, setMapReady] = useState(false);
  const [eta, setEta] = useState<string>('Syncing...');

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: currentKey || '',
    libraries: LIBRARIES
  });

  useEffect(() => {
    if (loadError) {
      console.error("Maps failed to load. Rotating key...");
      rotateKey();
    }
  }, [loadError, rotateKey]);

  // OTP states
  const [otpPhase, setOtpPhase] = useState<'idle' | 'generating' | 'entering' | 'verifying' | 'verified'>('idle');
  const [otpInput, setOtpInput] = useState(['', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Action states
  const [completing, setCompleting] = useState(false);
  const [refusing, setRefusing] = useState(false);
  const [actionDone, setActionDone] = useState<'completed' | 'refused' | null>(null);
  const [refuseConfirm, setRefuseConfirm] = useState(false);

  // Service Progress States
  const [servicesDone, setServicesDone] = useState<string>('');
  const [baseAmount, setBaseAmount] = useState<string>('');
  const [accessories, setAccessories] = useState<{name: string, price: number}[]>([]);
  const [newAccName, setNewAccName] = useState('');
  const [newAccPrice, setNewAccPrice] = useState('');

  // Payment States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash'>('upi');
  const [isPaid, setIsPaid] = useState(false);

  // Map & Routing
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const directionsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
      else router.push('/auth/login');
    });
    return () => unsub();
  }, [router]);

  // Fetch booking
  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await axios.get(`${API_BASE}/api/bookings/${bookingId}`);
      if (res.data.success) {
        const b = res.data.booking;
        // Normalize snake_case to camelCase for the frontend
        if (!b.customerLocation && b.customer_location) b.customerLocation = b.customer_location;
        if (!b.customerLocation && b.customer_lat) b.customerLocation = { lat: b.customer_lat, lng: b.customer_lng };
        if (!b.customerName && b.customer_name) b.customerName = b.customer_name;
        if (!b.technicianId && b.technician_id) b.technicianId = b.technician_id;
        
        // Initialize base amount if not set yet
        if (!baseAmount && b.estimatedCostRange) {
          setBaseAmount(b.estimatedCostRange.split('-')[0]);
        }
        
        setBooking(b);
      }
    } catch (e) {
      console.error('Fetch booking failed:', e);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
      const iv = setInterval(fetchBooking, 10000);

      const s = io(SOCKET_URL);
      socketRef.current = s;
      s.emit('join_booking', { bookingId });

      s.on('customer_location_update', (location) => {
        setBooking(prev => prev ? { ...prev, customerLocation: location } : null);
      });

      s.on('eta_update', (data) => {
        if (data && data.eta) setEta(data.eta);
      });

      return () => {
        clearInterval(iv);
        s.disconnect();
      };
    }
  }, [bookingId, fetchBooking]);

  // Geolocation
  useEffect(() => {
    if (!user?.uid || !bookingId) return;

    const updateLocation = (loc: { lat: number; lng: number }) => {
      setTechLocation(loc);
      if (socketRef.current) {
        socketRef.current.emit('update_location', { 
          bookingId, 
          location: loc,
          techId: user.uid 
        });
      }
      updateDoc(doc(db, 'technicians', user.uid), { location: loc }).catch(console.error);
    };

    const wid = navigator.geolocation.watchPosition(
      (pos) => updateLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("Technician geolocation error:", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(wid);
  }, [bookingId, user?.uid]);

  // Real-time Routing Logic & ETA Optimization
  useEffect(() => {
    const cLoc = booking?.customerLocation || ((booking as any)?.customerLat ? { lat: (booking as any).customerLat, lng: (booking as any).customerLng } : null);
    if (techLocation && cLoc && window.google?.maps && isLoaded) {
      if (directionsDebounceRef.current) clearTimeout(directionsDebounceRef.current);
      
      // We now rely on localDistance for the UI
      if (!eta) setEta('Syncing...');
    }
  }, [techLocation, booking?.customerLocation, isLoaded, eta]);

  // Auto-Refresh Map View (Fit Bounds)
  const [map, setMap] = useState<google.maps.Map | null>(null);
  useEffect(() => {
    const cLoc = booking?.customerLocation || ((booking as any)?.customerLat ? { lat: (booking as any).customerLat, lng: (booking as any).customerLng } : null);
    if (map && techLocation && cLoc && window.google?.maps) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(techLocation);
      bounds.extend(cLoc);
      map.fitBounds(bounds, { top: 100, right: 100, bottom: 200, left: 100 });
    }
  }, [map, techLocation, booking?.customerLocation]);

  // Instant Local Distance Calculation (Zero Lag)
  useEffect(() => {
    const cLoc = booking?.customerLocation || ((booking as any)?.customerLat ? { lat: (booking as any).customerLat, lng: (booking as any).customerLng } : null);
    if (techLocation && cLoc && window.google?.maps?.geometry?.spherical) {
      const meters = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(techLocation.lat, techLocation.lng),
        new window.google.maps.LatLng(cLoc.lat, cLoc.lng)
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
  }, [techLocation, booking?.customerLocation]);

  // Direct Map Polyline Management (Resolves Phantom Lines)
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  useEffect(() => {
    const cLoc = booking?.customerLocation || ((booking as any)?.customerLat ? { lat: (booking as any).customerLat, lng: (booking as any).customerLng } : null);
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
    if (techLocation?.lat && techLocation?.lng && cLoc?.lat && cLoc?.lng) {
      const path = [
        new window.google.maps.LatLng(techLocation.lat, techLocation.lng),
        new window.google.maps.LatLng(cLoc.lat, cLoc.lng)
      ];
      polylineRef.current.setPath(path);
      polylineRef.current.setMap(map);
    } else {
      polylineRef.current.setMap(null);
    }

    return () => {
      if (polylineRef.current) polylineRef.current.setMap(null);
    };
  }, [map, techLocation, booking?.customerLocation]);

  // Real-Time Reverse Geocoding with Structured Address Extraction
  const lastGeocodedRef = useRef<string>('');
  useEffect(() => {
    if (!window.google?.maps?.Geocoder || !mapReady) return;
    const loc = booking?.customerLocation;
    if (!loc?.lat || !loc?.lng) return;

    // Deduplicate: only re-geocode if location changed meaningfully (> ~10m)
    const locKey = `${loc.lat.toFixed(4)},${loc.lng.toFixed(4)}`;
    if (locKey === lastGeocodedRef.current) return;
    lastGeocodedRef.current = locKey;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: loc }, (results: any, status: any) => {
      if (status === 'OK' && results?.[0]) {
        setLiveAddress(results[0].formatted_address);

        // Extract granular address components
        const components = results[0].address_components || [];
        const get = (type: string): string => {
          const match = components.find((c: any) => c.types.includes(type));
          return match?.long_name || '';
        };

        // Try multiple results for richer detail
        let street = get('route') || get('street_number');
        let area = get('sublocality_level_2') || get('sublocality_level_1') || get('sublocality') || get('neighborhood');
        let zone = get('sublocality_level_1') || get('locality');
        let city = get('administrative_area_level_2') || get('locality');

        // Fallback: scan secondary results for missing parts
        if ((!street || !area) && results.length > 1) {
          for (let r = 1; r < Math.min(results.length, 4); r++) {
            const comps = results[r].address_components || [];
            const getAlt = (type: string): string => {
              const m = comps.find((c: any) => c.types.includes(type));
              return m?.long_name || '';
            };
            if (!street) street = getAlt('route') || getAlt('street_number');
            if (!area) area = getAlt('sublocality_level_2') || getAlt('sublocality_level_1') || getAlt('neighborhood');
            if (!zone) zone = getAlt('sublocality_level_1');
          }
        }

        // Build premise/street from street_number + route
        const premise = get('premise') || get('street_number');
        if (premise && street && !street.includes(premise)) {
          street = `${premise}, ${street}`;
        }

        setAddressParts({
          street: street || 'Locating street...',
          area: area || zone || 'Locating area...',
          zone: zone || city || '',
          city: city || ''
        });
      }
    });
  }, [booking?.customerLocation, mapReady]);

  // OTP handlers
  const handleGenerateOtp = async () => {
    setOtpPhase('entering');
    setOtpError('');
    try {
      await axios.post(`${API_BASE}/api/bookings/update-status`, { bookingId, status: 'Arrived' });
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otpInput];
    next[i] = val.slice(-1);
    setOtpInput(next);
    if (val && i < 3) otpRefs.current[i + 1]?.focus();
    if (!val && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleVerifyOtp = async () => {
    const otp = otpInput.join('');
    if (otp.length < 4) { setOtpError('Please enter all 4 digits.'); return; }
    setOtpPhase('verifying');
    setOtpError('');
    try {
      const res = await axios.post(`${API_BASE}/api/bookings/verify-otp`, { bookingId, otp, technicianId: user?.uid });
      if (res.data.success) {
        setOtpPhase('verified');
        await fetchBooking();
        setTimeout(() => router.push('/technician/dashboard'), 1500);
      } else {
        setOtpError('Invalid OTP. Ask customer to check their notification.');
        setOtpPhase('entering');
      }
    } catch (e: any) {
      setOtpError(e.response?.data?.error || 'Verification failed.');
      setOtpPhase('entering');
    }
  };

  const calculateTotal = () => {
    const base = parseFloat(baseAmount || booking?.estimatedCostRange?.split('-')[0] || '0');
    const extra = accessories.reduce((sum, acc) => sum + acc.price, 0);
    return base + extra;
  };

  const handleComplete = async () => {
    if (!isPaid && booking?.status !== 'Completed') {
      setShowPaymentModal(true);
      try {
        await axios.post(`${API_BASE}/api/bookings/update-status`, { 
          bookingId, 
          status: 'Completed',
          servicesDone,
          accessories,
          totalAmount: calculateTotal(),
          isPaid: false
        });
      } catch (e) {
        console.error("Failed to set payment pending state", e);
      }
      return;
    }
    
    setCompleting(true);
    try {
      await axios.post(`${API_BASE}/api/bookings/update-status`, { 
        bookingId, 
        status: 'Completed',
        servicesDone,
        accessories,
        totalAmount: calculateTotal(),
        isPaid: true
      });
      setActionDone('completed');
      setTimeout(() => router.push('/technician/bookings'), 3000);
    } catch (e) {
      alert('Failed to mark as completed.');
    } finally {
      setCompleting(false);
    }
  };

  const addAccessory = () => {
    if (!newAccName || !newAccPrice) return;
    setAccessories([...accessories, { name: newAccName, price: parseFloat(newAccPrice) }]);
    setNewAccName('');
    setNewAccPrice('');
  };

  const removeAccessory = (index: number) => {
    setAccessories(accessories.filter((_, i) => i !== index));
  };

  const handleRefuse = async () => {
    setRefusing(true);
    try {
      await axios.post(`${API_BASE}/api/bookings/customer-refused`, { bookingId, technicianId: user?.uid });
      setActionDone('refused');
      setTimeout(() => router.push('/technician/bookings'), 3000);
    } catch (e) {
      alert('Failed to update status.');
    } finally {
      setRefusing(false);
      setRefuseConfirm(false);
    }
  };

  const serviceInProgress = booking?.status === 'In Progress' || otpPhase === 'verified';

  if (loading) return (
    <div className="min-h-screen bg-[#f8faff] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen glass-panel border-white/10 text-white font-sans">
      <TechnicianSidebar />
      <main className="pl-0 md:pl-20 lg:pl-64 pt-16 md:pt-0 min-h-screen relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full -ml-48 -mb-48" />

        <div className="p-4 lg:p-10 max-w-[1400px] mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10">
            <div className="flex items-center gap-5">
              <button onClick={() => router.back()} className="p-3.5 rounded-2xl glass-panel border-white/10 border border-slate-200 shadow-sm text-slate-400 hover:text-indigo-600 transition-all active:scale-95 group">
                <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl sm:text-3xl font-black text-white tracking-tighter">{booking?.category || 'Service'}</h1>
                  <div className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-lg uppercase tracking-widest">#{bookingId?.slice(-8).toUpperCase()}</div>
                </div>
                <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                  <Activity className="size-3 text-indigo-500" />
                  Service Control Center
                </p>
              </div>
            </div>
            <div className="md:ml-auto flex items-center gap-4">
              <div className="flex items-center gap-3 px-5 py-2.5 glass-panel border-white/10 border border-slate-100 rounded-2xl shadow-sm">
                <div className="flex -space-x-2">
                   <div className="size-6 rounded-full bg-indigo-500 border-2 border-white" />
                   <div className="size-6 rounded-full bg-cyan-500 border-2 border-white" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Sync Active</span>
              </div>
              <div className="flex items-center gap-3 px-6 py-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-cyan-600 text-xs font-black uppercase tracking-[0.15em]">{booking?.status || 'On The Way'}</span>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {actionDone && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center p-12">
                  <div className={cn("w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-4", actionDone === 'completed' ? "bg-emerald-500/20 border-emerald-500/50" : "bg-rose-500/20 border-rose-500/50")}>
                    {actionDone === 'completed' ? <CheckCircle2 className="size-12 text-emerald-400" /> : <XCircle className="size-12 text-rose-400" />}
                  </div>
                  <h2 className="text-3xl font-black text-white mb-2">{actionDone === 'completed' ? 'Service Completed!' : 'Booking Cancelled'}</h2>
                  <p className="text-slate-400">Redirecting to bookings...</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <div className="glass-neon-card p-5 sm:p-8 glass-panel border-white/40 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Job Parameters</p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-5 glass-panel border-white/50 border border-slate-100 rounded-[1.5rem] hover:border-indigo-500/30 transition-all duration-300 group/loc">
                    <div className="size-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20">
                      <MapPin className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer Location</p>
                        {liveAddress && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">Live</span>
                          </div>
                        )}
                      </div>
                      {addressParts.street || addressParts.area ? (
                        <div className="space-y-1">
                          <p className="text-sm text-white font-black leading-tight truncate">
                            {addressParts.street !== 'Locating street...' ? addressParts.street : ''}
                            {addressParts.street !== 'Locating street...' && addressParts.area !== 'Locating area...' ? ', ' : ''}
                            {addressParts.area !== 'Locating area...' ? addressParts.area : ''}
                          </p>
                          {(addressParts.zone || addressParts.city) && (
                            <p className="text-[11px] text-indigo-300 font-bold truncate">
                              {[addressParts.zone, addressParts.city].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                            </p>
                          )}
                        </div>
                      ) : liveAddress ? (
                        <p className="text-sm text-slate-300 font-bold leading-tight">{liveAddress}</p>
                      ) : booking?.address ? (
                        <p className="text-sm text-slate-300 font-bold leading-tight">{booking.address}</p>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Loader2 className="size-3 animate-spin text-indigo-400" />
                          <span className="text-xs text-slate-400 font-bold">Resolving address...</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {booking?.contactNumber && (
                    <a href={`tel:${booking.contactNumber}`} className="flex items-center gap-3 w-full p-4 glass-panel rounded-[1.5rem] border border-slate-100 hover:border-emerald-500/50 transition-all text-left group/call active:scale-[0.98]">
                      <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100/50 group-hover/call:bg-emerald-500 group-hover/call:text-white transition-colors"><Phone className="size-5" /></div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Communication</p>
                        <span className="text-sm text-slate-300 font-bold">{booking.contactNumber}</span>
                      </div>
                    </a>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-[1.5rem] flex flex-col justify-center">
                      <p className="text-[9px] font-black text-indigo-600/60 uppercase tracking-widest mb-1">Distance to Target</p>
                      <div className="flex items-center gap-1.5">
                        <Navigation className="size-4 text-indigo-600" />
                        <span className="text-lg font-black text-indigo-700">{localDistance || 'Syncing...'}</span>
                      </div>
                    </div>
                    <div className="p-4 glass-panel border-white/10 border border-slate-100 rounded-[1.5rem] flex flex-col justify-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Accepted Protocol</p>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3.5 text-indigo-300" />
                          <span className="text-[11px] font-black text-slate-300">
                            {booking?.createdAt || (booking as any)?.accepted_at || (booking as any)?.acceptedAt
                              ? new Date((booking as any).accepted_at || (booking as any).acceptedAt || (booking?.createdAt as string)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                              : '--:--'}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 ml-5 mt-0.5">
                          {booking?.createdAt || (booking as any)?.accepted_at || (booking as any)?.acceptedAt
                            ? new Date((booking as any).accepted_at || (booking as any).acceptedAt || (booking?.createdAt as string)).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) 
                            : '--/--/----'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-neon-card p-8 glass-panel border-white/10 border border-slate-100 relative overflow-hidden">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 relative z-10">Verification Protocol</p>
                {otpPhase === 'idle' && booking?.status !== 'In Progress' && (
                  <div className="text-center relative z-10">
                    <div className="w-20 h-20 bg-indigo-50 border border-indigo-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 relative group">
                      <ShieldCheck className="size-10 text-indigo-600 relative z-10" />
                    </div>
                    <button onClick={handleGenerateOtp} className="w-full py-5 bg-slate-900 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95 group">
                      <Zap className="size-4 group-hover:animate-pulse" /> Initiate Protocol
                    </button>
                  </div>
                )}
                {otpPhase === 'entering' && (
                  <div className="relative z-10">
                    <div className="flex gap-3 justify-center mb-8">
                      {otpInput.map((digit, i) => (
                        <input key={i} ref={(el) => { otpRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => e.key === 'Backspace' && !otpInput[i] && i > 0 && otpRefs.current[i - 1]?.focus()} className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-black glass-panel border border-slate-200 focus:border-indigo-500 rounded-2xl text-white focus:outline-none transition-all shadow-sm" />
                      ))}
                    </div>
                    {otpError && <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl mb-6 text-rose-600 text-[10px] font-black uppercase tracking-wider text-center">{otpError}</div>}
                    <div className="flex gap-3">
                      <button onClick={handleVerifyOtp} className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 active:scale-95"><ShieldCheck className="size-4" /> Authorize</button>
                      <button onClick={handleGenerateOtp} className="p-5 glass-panel border-white/10 hover:bg-slate-800/40 backdrop-blur-md text-slate-400 rounded-2xl border border-slate-100 transition active:scale-95"><RefreshCw className="size-4" /></button>
                    </div>
                  </div>
                )}
                {(otpPhase === 'verified' || booking?.status === 'In Progress') && (
                  <div className="text-center py-6 relative z-10">
                    <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 relative"><CheckCircle2 className="size-10 text-emerald-600 relative z-10" /></div>
                    <h3 className="text-xl font-black text-white tracking-tight">Active Operation</h3>
                    <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Protocol Verified & Syncing</p>
                  </div>
                )}
              </div>

              {serviceInProgress && (
                <div className="space-y-4">
                  <button onClick={handleComplete} disabled={completing} className="w-full py-5 bg-gradient-to-br from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black rounded-[1.5rem] transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 text-sm uppercase tracking-widest">
                    {completing ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />} Complete Service
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => window.print()} className="py-4 glass-panel border border-slate-200 text-indigo-200 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"><Printer className="size-4" /> Receipt</button>
                    <button onClick={() => setRefuseConfirm(true)} disabled={refusing} className="py-4 bg-rose-50 border border-rose-100 text-rose-600 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95"><XCircle className="size-4" /> Refused</button>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-3">
              {!serviceInProgress ? (
                <div className="glass-neon-card glass-panel border-white/40 border border-slate-100 overflow-hidden h-full min-h-[500px] flex flex-col">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 glass-panel border-white/20">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Tactical Overlay</span>
                    <button 
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 glass-panel text-slate-300 hover:text-white transition-all active:scale-95 shadow-sm hover:shadow-indigo-500/20"
                    >
                      {isDarkMode ? <Sun className="size-3.5 text-amber-400" /> : <Moon className="size-3.5 text-indigo-300" />}
                      <span className="text-[9px] font-black uppercase tracking-widest">{isDarkMode ? 'Light' : 'Dark'}</span>
                    </button>
                  </div>
                  <div className="relative flex-1 bg-slate-900/10">
                    {isLoaded && (
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={techLocation || { lat: 28.6139, lng: 77.2090 }}
                        zoom={14}
                        onLoad={(m) => { setMap(m); setMapReady(true); }}
                        options={{ disableDefaultUI: true, zoomControl: true, styles: isDarkMode ? darkMapStyles : lightMapStyles }}
                      >
                        {/* Markers only, Polyline managed via effect above */}
                        {techLocation && (
                          <OverlayView position={techLocation} mapPaneName="overlayMouseTarget">
                            <div className="relative -translate-x-1/2 -translate-y-1/2"><div className="size-10 bg-indigo-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center"><Wrench className="size-5 text-white" /></div></div>
                          </OverlayView>
                        )}
                        {booking?.customerLocation && (
                          <OverlayView position={booking.customerLocation} mapPaneName="overlayMouseTarget">
                            <div className="relative -translate-x-1/2 -translate-y-1/2"><div className="size-10 bg-cyan-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center"><MapPin className="size-5 text-white" /></div></div>
                          </OverlayView>
                        )}
                      </GoogleMap>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-neon-card p-10 glass-panel border-white/10 border border-slate-100 h-full min-h-[600px] flex flex-col relative z-10">
                  <h2 className="text-2xl font-black text-white tracking-tight mb-10">Execution Console</h2>
                  <div className="grid md:grid-cols-5 gap-10 flex-1">
                    <div className="md:col-span-3 space-y-8">
                      <textarea value={servicesDone} onChange={(e) => setServicesDone(e.target.value)} placeholder="Describe the technical solutions implemented..." className="w-full h-40 glass-panel border border-slate-200 rounded-3xl p-6 text-sm text-slate-300 font-bold focus:outline-none transition-all resize-none shadow-sm" />
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Confirmed Base Price</label>
                          <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                            <input type="number" placeholder="0" value={baseAmount} onChange={(e) => setBaseAmount(e.target.value)} className="w-full glass-panel border border-slate-200 rounded-2xl pl-10 pr-5 py-3 text-sm text-slate-300 font-bold focus:border-indigo-500 transition-all" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Inventory Utilization</label>
                        <div className="flex gap-3 mb-4">
                          <input type="text" placeholder="Component" value={newAccName} onChange={(e) => setNewAccName(e.target.value)} className="flex-1 glass-panel border border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-300 font-bold" />
                          <input type="number" placeholder="₹" value={newAccPrice} onChange={(e) => setNewAccPrice(e.target.value)} className="w-28 glass-panel border border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-300 font-bold" />
                          <button onClick={addAccessory} className="p-4 bg-indigo-600 text-white rounded-2xl transition active:scale-95"><Plus className="size-5" /></button>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-3 custom-scrollbar">
                          {accessories.map((acc, i) => (
                            <div key={i} className="flex items-center justify-between p-4 glass-panel border border-slate-100 rounded-2xl shadow-sm">
                              <span className="text-sm font-bold text-slate-300">{acc.name}</span>
                              <div className="flex items-center gap-4"><span className="text-sm font-black text-indigo-600">₹{acc.price}</span><button onClick={() => removeAccessory(i)} className="text-rose-500"><Trash2 className="size-4" /></button></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                        <h3 className="text-lg font-black tracking-tight uppercase text-center mb-8">Service Ledger</h3>
                        <div className="space-y-4 mb-10 text-[10px] font-black uppercase tracking-widest text-indigo-300">
                          <div className="flex justify-between border-b border-white/5 pb-3"><span>Base Protocol</span><span className="text-white text-sm font-black">₹{baseAmount || booking?.estimatedCostRange?.split('-')[0] || '0'}</span></div>
                          {accessories.map((acc, i) => <div key={i} className="flex justify-between border-b border-white/5 pb-3"><span>{acc.name}</span><span className="text-indigo-400 text-sm font-black">+ ₹{acc.price}</span></div>)}
                        </div>
                        <div className="glass-panel border-white/5 border border-white/10 rounded-3xl p-6 text-center">
                          <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">Final Settlement</p>
                          <h4 className="text-3xl font-black text-white tracking-tighter">₹{calculateTotal()}</h4>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {refuseConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="glass-panel border-white/10 border-none rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative overflow-hidden bg-white">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 to-rose-600" />
              <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mb-8 mx-auto"><AlertTriangle className="size-10 text-rose-500" /></div>
              <h3 className="text-2xl font-black text-slate-900 text-center mb-4 uppercase tracking-tight">Terminate Protocol?</h3>
              <p className="text-slate-500 text-center text-xs font-bold leading-relaxed uppercase tracking-widest mb-10">This will cancel the active booking and notify the customer. This action is <span className="text-rose-600">irreversible</span>.</p>
              <div className="flex flex-col gap-4">
                <button onClick={handleRefuse} disabled={refusing} className="w-full py-5 rounded-[1.5rem] text-xs font-black text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-xl shadow-rose-100 flex items-center justify-center gap-3 active:scale-95 uppercase tracking-widest">{refusing ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />} Confirm Termination</button>
                <button onClick={() => setRefuseConfirm(false)} disabled={refusing} className="w-full py-5 rounded-[1.5rem] text-xs font-black text-slate-400 glass-panel border border-slate-200 hover:bg-slate-50 transition-all active:scale-95 uppercase tracking-widest">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaymentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="glass-panel border-white/10 border-none rounded-[3rem] p-12 max-w-md w-full shadow-2xl relative overflow-hidden bg-white">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Settlement</h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 text-slate-300 hover:text-slate-900 transition-all"><XCircle className="size-8" /></button>
              </div>
              <div className="glass-panel border-slate-200 rounded-[2.5rem] p-8 mb-10 flex flex-col items-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Total Payable Amount</p>
                <h4 className="text-5xl font-black text-slate-900 tracking-tighter">₹{calculateTotal()}</h4>
              </div>
              <div className="flex gap-4 mb-10">
                <button onClick={() => setPaymentMethod('upi')} className={cn("flex-1 p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3", paymentMethod === 'upi' ? "bg-indigo-50 border-indigo-500 text-indigo-600 shadow-lg shadow-indigo-100" : "bg-white border-slate-100 text-slate-400")}><CreditCard className="size-7" /><span className="text-[10px] font-black uppercase tracking-widest">Digital QR</span></button>
                <button onClick={() => setPaymentMethod('cash')} className={cn("flex-1 p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3", paymentMethod === 'cash' ? "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-lg shadow-emerald-100" : "bg-white border-slate-100 text-slate-400")}><DollarSign className="size-7" /><span className="text-[10px] font-black uppercase tracking-widest">Physical Cash</span></button>
              </div>
              {paymentMethod === 'upi' ? (
                <div className="text-center mb-10">
                  <div className="inline-block p-8 glass-panel border border-slate-100 rounded-[2.5rem] shadow-xl mb-6"><QRCodeSVG value={`upi://pay?pa=fixnow@upi&pn=FixNow&am=${calculateTotal()}&cu=INR`} size={200} level="H" /></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Monitoring Network...</p>
                </div>
              ) : (
                <div className="text-center py-14 mb-10 bg-emerald-50 border border-emerald-100 rounded-[2.5rem]">
                  <DollarSign className="size-8 text-emerald-500 mx-auto mb-6 animate-bounce" />
                  <p className="text-xs font-bold text-slate-500 px-10 leading-relaxed uppercase tracking-widest">Collect <span className="text-emerald-600 text-sm font-black">₹{calculateTotal()}</span> from customer.</p>
                </div>
              )}
              <button onClick={() => { setIsPaid(true); handleComplete(); }} disabled={completing} className="w-full py-6 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-2xl disabled:opacity-70">{completing ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />} Verify & Finalize Protocol</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
