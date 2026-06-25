'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  DollarSign, Clock, RefreshCw, Zap, Wrench, Plus, Minus, Trash2, CreditCard, Printer, Moon, Sun, Maximize2, Minimize2, AlertCircle, X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { io, Socket } from 'socket.io-client';
import TechnicianSidebar from '@/components/technician/Sidebar';
import { GoogleMap, OverlayViewF, DirectionsRenderer, Polyline } from '@react-google-maps/api';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';
import { useGoogleMaps } from '@/components/GoogleMapsProvider';

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
  { elementType: "geometry", stylers: [{ color: "#020617" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#38bdf8" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#38bdf8" }] },
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
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [liveAddress, setLiveAddress] = useState<string>('');
  const [addressParts, setAddressParts] = useState<{ street: string; area: string; zone: string; city: string }>({ street: '', area: '', zone: '', city: '' });
  const [localDistance, setLocalDistance] = useState<string>('Syncing...');
  const [mapReady, setMapReady] = useState(false);
  const [eta, setEta] = useState<string>('Syncing...');
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isMapInteracted, setIsMapInteracted] = useState(false);

  // Handle chatbot visibility - Hide for technician service map
  useEffect(() => {
    document.body.classList.add('hide-chatbot');
    return () => document.body.classList.remove('hide-chatbot');
  }, []);

  const { isLoaded, loadError } = useGoogleMaps();

  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);

  useEffect(() => {
    if (loadError) {
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

  const socketRef = useRef<Socket | null>(null);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
      else router.push('/auth/login?role=technician');
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
        if (!b.customerLocation && b.customer_location) b.customerLocation = b.customer_location;
        if (!b.customerLocation && b.customer_lat) b.customerLocation = { lat: b.customer_lat, lng: b.customer_lng };
        if (!b.customerName && b.customer_name) b.customerName = b.customer_name;
        if (!b.technicianId && b.technician_id) b.technicianId = b.technician_id;
        
        if (!baseAmount && b.estimatedCostRange && typeof b.estimatedCostRange === 'string') {
          setBaseAmount(b.estimatedCostRange.split('-')[0]);
        }
        
        setBooking(b);
      }
    } catch (e) {
      console.error('Fetch booking failed:', e);
    } finally {
      setLoading(false);
    }
  }, [bookingId, baseAmount]);

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

    // Initial position fetch for immediate responsiveness
    navigator.geolocation.getCurrentPosition(
      (pos) => updateLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("Initial geolocation fetch failed:", err),
      { enableHighAccuracy: true }
    );

    const wid = navigator.geolocation.watchPosition(
      (pos) => updateLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("Technician geolocation error:", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(wid);
  }, [bookingId, user?.uid]);

  // Map & Route Management
  const [map, setMap] = useState<google.maps.Map | null>(null);
  
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
        () => {}
      );
    }
  }, []);

  // 1. Consolidated Location Resolver (Top Level)
  const resolvedCustomerLoc = useMemo(() => {
    if (!booking) return null;
    const loc = booking.customerLocation || booking.customer_location;
    if (loc?.lat && loc?.lng) {
      const lat = Number(loc.lat);
      const lng = Number(loc.lng);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    if (booking.customer_lat && booking.customer_lng) {
      const lat = Number(booking.customer_lat);
      const lng = Number(booking.customer_lng);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    return null;
  }, [booking]);

  // 1. Tactical Centering Engine
  useEffect(() => {
    if (!map || !window.google?.maps || isMapInteracted) return;

    if (techLocation && resolvedCustomerLoc) {
      const b = new window.google.maps.LatLngBounds();
      b.extend(techLocation);
      b.extend(resolvedCustomerLoc);
      map.fitBounds(b, { top: 80, right: 80, bottom: 80, left: 80 });
    } else if (techLocation) {
      map.panTo(techLocation);
    } else if (resolvedCustomerLoc) {
      map.panTo(resolvedCustomerLoc);
    }
  }, [map, techLocation, resolvedCustomerLoc, isMapInteracted]);

    // Tactical Metrics Engine (Refactored for Routes API Compatibility)
    useEffect(() => {
      const runMetrics = async () => {
        if (!isLoaded || !mapReady || !window.google?.maps || !techLocation || !resolvedCustomerLoc) return;

        // 1. Fallback static calculation (Geometry library remains stable)
        if (window.google.maps.geometry?.spherical) {
          const meters = window.google.maps.geometry.spherical.computeDistanceBetween(
            new window.google.maps.LatLng(techLocation.lat, techLocation.lng),
            new window.google.maps.LatLng(resolvedCustomerLoc.lat, resolvedCustomerLoc.lng)
          );
          setLocalDistance(meters > 1000 ? `${(meters / 1000).toFixed(1)}km` : `${Math.round(meters)}m`);
          setEta(`${Math.ceil(meters / 400)} min`);
        }

        // 2. Precise Matrix Calculation (Migrating to RouteMatrix if available)
        const fallbackMatrix = () => {
          const service = new window.google.maps.DistanceMatrixService();
          service.getDistanceMatrix(
            { origins: [techLocation!], destinations: [resolvedCustomerLoc!], travelMode: window.google.maps.TravelMode.DRIVING },
            (response, status) => {
              if (status === 'OK' && response?.rows[0]?.elements[0]?.status === 'OK') {
                const el = response.rows[0].elements[0];
                setLocalDistance(el.distance.text);
                setEta(el.duration.text);
              } else if (status === 'REQUEST_DENIED') {
                console.error("Distance Matrix Access Denied: Check Billing/API Config");
              }
            }
          );
        };

        try {
          const origins = [{ location: { lat: techLocation.lat, lng: techLocation.lng } }];
          const destinations = [{ location: { lat: resolvedCustomerLoc.lat, lng: resolvedCustomerLoc.lng } }];
          
          // Check for new RouteMatrix API (v3.56+)
          if ((window.google.maps as any).routes?.RouteMatrix) {
            const matrixService = new (window.google.maps as any).routes.RouteMatrix();
            matrixService.computeRouteMatrix({
              origins,
              destinations,
              travelMode: 'DRIVE',
              routingPreference: 'TRAFFIC_AWARE'
            }).then((response: any) => {
              const el = response[0];
              if (el?.duration) setEta(el.duration);
              if (el?.distanceMeters) setLocalDistance(el.distanceMeters > 1000 ? `${(el.distanceMeters/1000).toFixed(1)}km` : `${el.distanceMeters}m`);
            }).catch(() => fallbackMatrix());
          } else {
            fallbackMatrix();
          }
        } catch (e) {
          console.error("DistanceMatrix logic failed:", e);
        }

        // 3. Directions Routing (Migrating to Routes API if available)
        const runDirectionsFallback = () => {
          if (!directionsServiceRef.current) directionsServiceRef.current = new window.google.maps.DirectionsService();
          directionsServiceRef.current.route(
            { origin: techLocation!, destination: resolvedCustomerLoc!, travelMode: window.google.maps.TravelMode.DRIVING },
            (result, status) => { 
              if (status === 'OK') {
                setDirections(result); 
              } else if (status === 'REQUEST_DENIED') {
                console.error("Directions Access Denied: Check Billing/API Config");
              }
            }
          );
        };

        try {
          if ((window.google.maps as any).routes?.Route) {
            // Note: Routes API returns different result types than DirectionsRenderer expects
            // For now, we continue using DirectionsService for the visual renderer compatibility
            // but we can compute routes for data if needed.
            // Fallback to DirectionsService for Renderer compatibility
            runDirectionsFallback();
          } else {
            runDirectionsFallback();
          }
        } catch (e) {
          console.error("DirectionsService logic failed:", e);
        }
      };

      runMetrics();
    }, [isLoaded, mapReady, techLocation, resolvedCustomerLoc]);

  // 3. Camera Management
  useEffect(() => {
    if (map && techLocation && resolvedCustomerLoc && window.google?.maps?.LatLngBounds && !isMapInteracted) {
      try {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(techLocation);
        bounds.extend(resolvedCustomerLoc);
        map.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });
      } catch (e) {
        console.warn("Bounds fitting error:", e);
      }
    }
  }, [map, techLocation, resolvedCustomerLoc, isMapInteracted]);

  // Reverse Geocoding
  useEffect(() => {
    if (!window.google?.maps?.Geocoder || !mapReady) return;
    const loc = booking?.customerLocation;
    if (!loc?.lat || !loc?.lng) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: loc }, (results: any, status: any) => {
      if (status === 'OK' && results?.[0]) {
        setLiveAddress(results[0].formatted_address);
        const components = results[0].address_components || [];
        const get = (type: string): string => {
          const match = components.find((c: any) => c.types.includes(type));
          return match?.long_name || '';
        };

        const street = get('route') || get('street_number');
        const area = get('sublocality_level_2') || get('sublocality_level_1') || get('sublocality') || get('neighborhood');
        const zone = get('sublocality_level_1') || get('locality');
        const city = get('administrative_area_level_2') || get('locality');

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
        setOtpError('Invalid OTP.');
        setOtpPhase('entering');
      }
    } catch (e: any) {
      setOtpError(e.response?.data?.error || 'Verification failed.');
      setOtpPhase('entering');
    }
  };

  const calculateTotal = () => {
    const base = parseFloat(baseAmount || booking?.estimatedCostRange?.split('-')[0] || '0');
    const extra = accessories.reduce((sum: number, acc: {price: number}) => sum + acc.price, 0);
    return base + extra;
  };

  const handleComplete = async () => {
    if (!isPaid && booking?.status !== 'Completed') {
      setShowPaymentModal(true);
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
    setAccessories(accessories.filter((_: any, i: number) => i !== index));
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
    }
  };

  const serviceInProgress = booking?.status === 'In Progress' || otpPhase === 'verified';

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-white/10 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500/30">
      <TechnicianSidebar hideMobileToggle={true} />
      <main className="pl-0 md:pl-[78px] lg:pl-[280px] pt-16 md:pt-0 min-h-screen relative overflow-x-hidden">
        {/* Cinematic Background Accents */}
        <div className="fixed top-0 right-0 w-[60vw] h-[60vw] bg-cyan-500/[0.03] blur-[150px] rounded-full pointer-events-none -mr-[20vw] -mt-[20vw]" />
        <div className="fixed bottom-0 left-0 w-[50vw] h-[50vw] bg-slate-500/[0.03] blur-[120px] rounded-full pointer-events-none -ml-[15vw] -mb-[15vw]" />

        <div className="p-3 sm:p-4 lg:p-10 max-w-[1400px] mx-auto relative z-10">
          {/* Header — always visible */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mb-4 sm:mb-10">
            <div className="flex items-center gap-3 sm:gap-5">
              <button onClick={() => router.back()} className="p-3 sm:p-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all active:scale-95 group">
                <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg sm:text-3xl font-black text-white tracking-tighter uppercase">{booking?.category || 'Service'}</h1>
                  <div className="px-2 py-0.5 bg-white/5 border border-white/10 text-slate-400 text-[9px] sm:text-[10px] font-black rounded-lg uppercase tracking-widest">#{bookingId?.slice(-8).toUpperCase()}</div>
                </div>
                <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-cyan-500" />
                  Service Control Center
                </p>
              </div>
            </div>
            <div className="sm:ml-auto flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex -space-x-2">
                   <div className="size-6 rounded-full bg-cyan-500 border-2 border-slate-900" />
                   <div className="size-6 rounded-full bg-white border-2 border-slate-900" />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Sync Active</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-2.5 bg-cyan-400/10 border border-cyan-400/20 rounded-2xl">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-cyan-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.15em]">{booking?.status || 'On The Way'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-3 sm:gap-6 h-auto lg:h-[calc(100vh-220px)] lg:min-h-[600px]">
            {/* Left Panel: Job Controls — appears BELOW map on mobile */}
            <div className="w-full lg:w-[420px] shrink-0 space-y-3 sm:space-y-6 lg:overflow-y-auto lg:pr-2 scrollbar-hide pb-4 lg:pb-0 order-2 lg:order-1">
              <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] p-4 sm:p-6 lg:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-500">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 sm:mb-8 flex items-center gap-2">
                  <span className="w-8 h-px bg-slate-800" />
                  Tactical Parameters
                </p>

                <div className="space-y-3 sm:space-y-5">
                  <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-5 bg-white/[0.03] border border-white/[0.05] rounded-[1.5rem] sm:rounded-[2rem] group/item hover:bg-white/[0.05] transition-all">
                    <div className="size-9 sm:size-12 rounded-xl sm:rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 shrink-0 group-hover/item:scale-110 transition-transform">
                      <MapPin className="size-4 sm:size-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Target Coordinate</p>
                      <p className="text-xs sm:text-sm text-white font-black leading-tight line-clamp-2 italic tracking-tight">
                        {liveAddress || booking?.address || "ACQUIRING..."}
                      </p>
                    </div>
                  </div>

                  {booking?.contactNumber && (
                    <a href={`tel:${booking.contactNumber}`} className="flex items-center gap-3 sm:gap-4 w-full p-3 sm:p-5 bg-white/[0.03] border border-white/[0.05] rounded-[1.5rem] sm:rounded-[2rem] hover:bg-white/[0.08] transition-all group/item">
                      <div className="size-9 sm:size-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover/item:scale-110 transition-transform">
                        <Phone className="size-4 sm:size-6" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Communication Link</p>
                        <span className="text-sm sm:text-base text-white font-black tracking-tighter">{booking.contactNumber}</span>
                      </div>
                      <div className="size-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <ArrowLeft className="size-4 rotate-180 text-white" />
                      </div>
                    </a>
                  )}

                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="p-3 sm:p-5 bg-white/[0.03] border border-white/[0.08] rounded-[1.2rem] sm:rounded-[1.8rem] flex flex-col justify-center shadow-xl group/hud hover:border-white/20 transition-all">
                      <p className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Distance Gap</p>
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 sm:size-8 rounded-lg sm:rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-400/20 group-hover/hud:scale-110 transition-transform">
                          <Navigation className="size-3.5 sm:size-4 text-cyan-400" />
                        </div>
                        <span className={cn("text-base sm:text-xl font-black italic tracking-tighter transition-all", localDistance === 'Syncing...' ? "text-slate-500 animate-pulse" : "text-white")}>{localDistance}</span>
                      </div>
                    </div>
                    <div className="p-5 bg-white/[0.03] border border-white/[0.08] rounded-[1.8rem] flex flex-col justify-center shadow-xl group/hud hover:border-white/20 transition-all">
                      <p className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">ETA</p>
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 sm:size-8 rounded-lg sm:rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-400/20 group-hover/hud:scale-110 transition-transform">
                          <Clock className="size-3.5 sm:size-4 text-amber-400" />
                        </div>
                        <span className={cn("text-base sm:text-xl font-black italic tracking-tighter transition-all", eta === 'Syncing...' ? "text-slate-500 animate-pulse" : "text-white")}>{eta}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 sm:mb-8 flex items-center gap-2">
                  <span className="w-8 h-px bg-slate-800" />
                  Verification Logic
                </p>
                
                {otpPhase === 'idle' && booking?.status !== 'In Progress' && (
                  <div className="text-center relative">
                    <div className="relative size-24 bg-white/[0.03] border border-white/[0.1] rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 group/icon overflow-hidden">
                      <div className="absolute inset-0 bg-cyan-500/5 group-hover/icon:bg-cyan-500/10 transition-colors" />
                      <ShieldCheck className="size-10 text-white relative z-10 group-hover/icon:scale-110 transition-transform" />
                    </div>
                    <button onClick={handleGenerateOtp} className="w-full py-5 bg-white text-slate-950 hover:bg-slate-50 font-black text-xs uppercase tracking-[0.3em] rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 group/btn">
                      <Zap className="size-4 group-hover:scale-125 transition-transform" /> Initiate Handover
                    </button>
                  </div>
                )}
                
                {otpPhase === 'entering' && (
                  <div>
                    <div className="flex gap-2 sm:gap-3 justify-center mb-10">
                      {otpInput.map((digit, i) => (
                        <input key={i} ref={(el) => { otpRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} className="w-12 h-16 sm:w-14 sm:h-18 text-center text-2xl font-black bg-white/[0.05] border border-white/[0.1] focus:border-cyan-500/50 rounded-2xl text-white outline-none transition-all shadow-inner focus:bg-white/[0.08]" />
                      ))}
                    </div>
                    {otpError && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-6 text-rose-500 text-[10px] font-black uppercase tracking-wider text-center flex items-center justify-center gap-2"><AlertCircle className="size-3" /> {otpError}</div>}
                    <div className="flex gap-3">
                      <button onClick={handleVerifyOtp} className="flex-1 py-5 bg-cyan-500 hover:bg-cyan-400 text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-cyan-500/20">Authorize</button>
                      <button onClick={handleGenerateOtp} className="p-5 bg-white/[0.05] border border-white/[0.1] text-slate-400 rounded-2xl hover:bg-white/[0.1] transition active:scale-95"><RefreshCw className="size-4" /></button>
                    </div>
                  </div>
                )}
                
                {(otpPhase === 'verified' || booking?.status === 'In Progress') && (
                  <div className="text-center py-6">
                    <div className="relative size-24 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                      <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
                      <CheckCircle2 className="size-12 text-emerald-400 relative z-10" />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tighter italic">ACTIVE EXECUTION</h3>
                    <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3 flex items-center justify-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Secure Link Synced
                    </p>
                  </div>
                )}
              </div>

              {serviceInProgress && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
                  <button onClick={handleComplete} disabled={completing} className="w-full py-4 sm:py-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black rounded-[1.5rem] sm:rounded-[2rem] transition-all shadow-[0_20px_50px_rgba(16,185,129,0.2)] flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 text-sm uppercase tracking-[0.3em]">
                    {completing ? <Loader2 className="size-6 animate-spin" /> : <CheckCircle2 className="size-6" />} Complete Protocol
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => window.print()} className="py-5 bg-white/[0.03] border border-white/[0.08] text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-white/[0.08] hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl"><Printer className="size-4" /> Receipt</button>
                    <button onClick={() => setRefuseConfirm(true)} disabled={refusing} className="py-5 bg-rose-500/[0.03] border border-rose-500/[0.1] text-rose-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-rose-500/10 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl"><XCircle className="size-4" /> Abort</button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel: Map & Console Environment */}
            <div className={cn(
              "flex-1 order-1 lg:order-2 transition-all duration-700 z-20 flex flex-col gap-3 sm:gap-6",
              isMapFullscreen ? "fixed inset-0 z-[100] h-screen w-screen" : "h-auto lg:h-full"
            )}>
              {/* Map Section */}
              <div className={cn(
                "bg-slate-950 border border-white/[0.08] overflow-hidden transition-all duration-700 shadow-[0_30px_100px_rgba(0,0,0,0.5)] relative",
                isMapFullscreen ? "h-screen w-screen rounded-none" : "h-[58vh] sm:h-[65vh] lg:h-full rounded-[1.5rem] sm:rounded-[2.5rem] lg:rounded-[3rem]"
              )}>
                <div className="relative h-full w-full bg-slate-950">
                  {/* Mobile Map Top HUD Strip - Optimized for Mobile responsiveness and zero overlap */}
                  <div className="absolute top-4 left-4 right-4 z-[60] lg:hidden">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl">
                          <div className={cn(
                            "size-2.5 rounded-full shrink-0 shadow-[0_0_10px_currentColor]",
                            booking?.status === 'Completed' ? "text-emerald-400 bg-emerald-400" :
                            booking?.status === 'Cancelled' ? "text-rose-400 bg-rose-400" : "text-cyan-400 bg-cyan-400 animate-pulse"
                          )} />
                          <span className="text-[11px] font-black text-white uppercase tracking-[0.1em] truncate italic">{booking?.status || 'On The Way'}</span>
                        </div>
                        <div className="px-4 py-3 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex items-center gap-4">
                           <div className="flex items-center gap-2 border-r border-white/10 pr-3">
                              <Navigation className="size-3.5 text-cyan-400" />
                              <span className={cn("text-[10px] font-black italic tracking-tighter", localDistance === 'Syncing...' ? "text-slate-500 animate-pulse" : "text-white")}>{localDistance}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <Clock className="size-3.5 text-amber-400" />
                              <span className={cn("text-[10px] font-black italic tracking-tighter", eta === 'Syncing...' ? "text-slate-500 animate-pulse" : "text-white")}>{eta}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Map Controls - Tactical Style */}
                  <div className="absolute bottom-6 right-6 lg:top-6 lg:right-6 lg:bottom-auto z-[60] flex flex-col gap-3">
                    <button
                      onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                      className="size-14 sm:size-16 rounded-2xl bg-slate-950/90 backdrop-blur-3xl border border-white/20 text-white hover:bg-white/10 transition-all flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.8)] group active:scale-90"
                    >
                      {isMapFullscreen ? <Minimize2 className="size-6 text-cyan-400" /> : <Maximize2 className="size-6" />}
                    </button>
                    <button
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className="size-14 sm:size-16 rounded-2xl bg-slate-950/90 backdrop-blur-3xl border border-white/20 text-white hover:bg-white/10 transition-all flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.8)] group active:scale-90"
                    >
                      {isDarkMode ? <Sun className="size-6 text-amber-400 animate-spin-slow" /> : <Moon className="size-6 text-slate-400" />}
                    </button>
                    
                    {/* Custom Tactical Zoom Controls */}
                    <div className="flex flex-col gap-3 mt-2">
                      <button
                        onClick={() => {
                          const newZoom = (map?.getZoom() || 14) + 1;
                          map?.setZoom(newZoom);
                          setMapZoom(newZoom);
                        }}
                        className="size-14 sm:size-16 rounded-2xl bg-slate-950/90 backdrop-blur-3xl border border-white/20 text-white hover:bg-white/10 transition-all flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.8)] group active:scale-90 font-black text-xl"
                      >
                        <Plus className="size-6" />
                      </button>
                      <button
                        onClick={() => {
                          const newZoom = (map?.getZoom() || 14) - 1;
                          map?.setZoom(newZoom);
                          setMapZoom(newZoom);
                        }}
                        className="size-14 sm:size-16 rounded-2xl bg-slate-950/90 backdrop-blur-3xl border border-white/20 text-white hover:bg-white/10 transition-all flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.8)] group active:scale-90 font-black text-xl"
                      >
                        <Minus className="size-6" />
                      </button>
                    </div>

                    {techLocation && (
                      <button
                        onClick={() => {
                          setIsMapInteracted(false);
                          const m = map;
                          if (m && techLocation && resolvedCustomerLoc) {
                            try {
                              const b = new window.google.maps.LatLngBounds();
                              b.extend(techLocation);
                              b.extend(resolvedCustomerLoc);
                              m.fitBounds(b, { top: 80, right: 80, bottom: 80, left: 80 });
                            } catch (e) {
                              console.warn("Map fitBounds failed:", e);
                            }
                          } else if (m && techLocation) {
                             m.panTo(techLocation);
                          }
                        }}
                        className="size-14 sm:size-16 rounded-2xl bg-slate-950/90 backdrop-blur-3xl border border-white/20 text-white hover:bg-white/10 transition-all flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.8)] group active:scale-90"
                        title="Re-center Tracking"
                      >
                        <Zap className="size-6 text-emerald-400" />
                      </button>
                    )}
                  </div>

                  {isLoaded ? (
                    <GoogleMap
                      mapContainerClassName="w-full h-full"
                      mapContainerStyle={{ width: '100%', height: '100%', position: 'absolute' }}
                      center={mapCenter || { lat: 0, lng: 0 }}
                      zoom={mapZoom}
                      onLoad={(m) => { 
                        if (!window.google?.maps) return;
                        setMap(m); 
                        setMapReady(true);
                      }}
                      onDragStart={() => setIsMapInteracted(true)}
                      onZoomChanged={() => {
                        if (map) {
                          const z = map.getZoom();
                          if (z !== undefined) setMapZoom(z);
                        }
                      }}
                      options={{ 
                        disableDefaultUI: true, 
                        zoomControl: false, 
                        styles: isDarkMode ? darkMapStyles : lightMapStyles,
                        gestureHandling: 'greedy',
                        backgroundColor: '#020617'
                      }}
                    >
                        {/* THE DOTTED TACTICAL PATH (Primary) */}
                        {techLocation && resolvedCustomerLoc && (
                          <Polyline
                            path={[techLocation, resolvedCustomerLoc]}
                            options={{
                              strokeColor: "#22d3ee",
                              strokeOpacity: 0,
                              icons: [{
                                icon: {
                                  path: 'M 0,-1 0,1',
                                  strokeOpacity: 1,
                                  scale: 4,
                                  strokeColor: '#22d3ee'
                                },
                                offset: '0',
                                repeat: '20px'
                              }],
                              zIndex: 10
                            }}
                          />
                        )}

                        {techLocation && (
                          <OverlayViewF position={techLocation} mapPaneName="overlayMouseTarget">
                            <div className="relative -translate-x-1/2 -translate-y-1/2">
                              <div className="relative group flex flex-col items-center">
                                {/* Intense Pulse */}
                                <div className="absolute inset-0 bg-cyan-400/30 rounded-full animate-ping scale-[2.5]" />
                                <div className="absolute inset-0 bg-cyan-400/10 rounded-full animate-pulse scale-[4]" />
                                
                                {/* Status HUD Overlay - Only on Laptop/Large Screen */}
                                <div className="absolute -top-24 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 pointer-events-none z-30">
                                  <div className="px-6 py-3 bg-slate-950/95 backdrop-blur-3xl rounded-[1.5rem] border border-white/20 shadow-[0_30px_70px_rgba(0,0,0,0.8)] whitespace-nowrap flex items-center gap-5">
                                    <div className="flex items-center gap-3 border-r border-white/10 pr-5">
                                      <Clock className="size-5 text-amber-400" />
                                      <span className={cn("text-[14px] font-black uppercase tracking-tighter italic", eta === 'Syncing...' ? "text-slate-500 animate-pulse" : "text-white")}>{eta}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Navigation className="size-5 text-cyan-400" />
                                      <span className={cn("text-[14px] font-black uppercase tracking-tighter italic", localDistance === 'Syncing...' ? "text-slate-500 animate-pulse" : "text-white")}>{localDistance}</span>
                                    </div>
                                  </div>
                                  <div className="w-1.5 h-8 bg-gradient-to-b from-cyan-400 to-transparent opacity-60 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                                </div>

                                {/* Main Technician Icon */}
                                <div className="relative z-10">
                                  <span className="text-4xl sm:text-5xl drop-shadow-[0_10px_15px_rgba(34,211,238,0.4)] hover:scale-110 transition-transform block">🛠️</span>
                                </div>
                                <div className="mt-3 px-4 py-1.5 bg-slate-900/90 backdrop-blur-md text-[10px] font-black text-white rounded-full border border-white/10 uppercase tracking-widest shadow-2xl flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                                  YOU • LIVE
                                </div>
                              </div>
                            </div>
                          </OverlayViewF>
                        )}

                        {resolvedCustomerLoc && (
                          <OverlayViewF position={resolvedCustomerLoc} mapPaneName="overlayMouseTarget">
                            <div className="relative -translate-x-1/2 -translate-y-1/2">
                              <div className="relative group flex flex-col items-center">
                                <div className="relative z-10">
                                  <span className="text-4xl sm:text-5xl drop-shadow-[0_10px_15px_rgba(52,211,153,0.4)] hover:scale-110 transition-transform block">📍</span>
                                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-30 pointer-events-none scale-150" />
                                </div>
                                <div className="mt-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md text-[9px] font-black text-white uppercase tracking-widest rounded-xl border border-white/10 shadow-2xl flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                  TARGET CUSTOMER
                                </div>
                              </div>
                            </div>
                          </OverlayViewF>
                        )}
                    </GoogleMap>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 gap-6">
                      <div className="w-16 h-16 border-4 border-white/5 border-t-cyan-400 rounded-full animate-spin shadow-[0_0_40px_rgba(34,211,238,0.2)]" />
                      <div className="text-center">
                        <p className="text-[12px] font-black text-white uppercase tracking-[0.3em] italic mb-2">Synchronizing Satellite Feed</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Awaiting Uplink Confirmation...</p>
                      </div>
                      {loadError && (
                        <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl max-w-sm mx-auto">
                          <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center">Satellite Uplink Failure</p>
                          <p className="text-white/60 text-[9px] mt-2 text-center leading-relaxed">
                            {loadError.message.includes('Billing') || loadError.message.includes('REQUEST_DENIED') 
                              ? "API Configuration Error: Access denied. Please ensure the Google Cloud project has an active billing account linked to these coordinates." 
                              : loadError.message}
                          </p>
                          <button onClick={() => window.location.reload()} className="mt-3 w-full py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-500 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all">Retry Uplink</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Console Section - Shown below map on mobile when in progress */}
              {serviceInProgress && !isMapFullscreen && (
                <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
                  <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Activity className="size-32" /></div>
                    
                    <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-10">
                      <div className="size-10 sm:size-14 bg-emerald-500/10 border border-emerald-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-400 shrink-0">
                        <Zap className="size-7" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-2xl font-black text-white tracking-tighter italic">LIVE OPERATION HUD</h2>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Satellite Link Synchronized</p>
                      </div>
                    </div>

                    <div className="flex flex-col md:grid md:grid-cols-5 gap-4 sm:gap-8 flex-1">
                      <div className="md:col-span-3 space-y-4 sm:space-y-6">
                        <div className="p-6 bg-white/[0.03] border border-white/[0.05] rounded-3xl">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Inventory Control</p>
                          <div className="space-y-3">
                            {accessories.map((acc, i) => (
                              <div key={`${acc.name}-${i}`} className="flex justify-between items-center p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl group/item">
                                <span className="text-sm font-bold text-slate-300">{acc.name}</span>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm font-black text-white italic tracking-tight">₹{acc.price}</span>
                                  <button onClick={() => removeAccessory(i)} className="p-2 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 rounded-xl transition-all opacity-0 group-hover/item:opacity-100"><X className="size-4" /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                            <div className="flex gap-3">
                              <input type="text" placeholder="Component Name" value={newAccName} onChange={(e) => setNewAccName(e.target.value)} className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm text-white font-bold outline-none focus:border-white transition-all" />
                              <input type="number" placeholder="₹" value={newAccPrice} onChange={(e) => setNewAccPrice(e.target.value)} className="w-16 sm:w-28 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-2 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm text-white font-bold outline-none focus:border-white transition-all" />
                              <button onClick={addAccessory} className="p-3 sm:p-4 bg-white text-slate-950 rounded-xl sm:rounded-2xl transition active:scale-95 hover:bg-slate-100 shadow-lg shrink-0"><Plus className="size-4 sm:size-5" /></button>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 bg-white/[0.03] border border-white/[0.05] rounded-3xl">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-3">Service Documentation</label>
                          <textarea value={servicesDone} onChange={(e) => setServicesDone(e.target.value)} placeholder="Describe work performed..." className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white font-bold focus:border-white transition-all outline-none resize-none" />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <div className="bg-slate-950/50 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl h-full flex flex-col">
                          <h3 className="text-lg font-black tracking-tighter uppercase text-center mb-8 italic">Service Ledger</h3>
                          <div className="space-y-4 mb-10 text-[10px] font-black uppercase tracking-widest text-slate-500 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                            <div className="flex justify-between border-b border-white/5 pb-3"><span>Base Protocol</span><span className="text-white text-sm font-black">₹{baseAmount || '0'}</span></div>
                            {accessories.map((acc, i) => <div key={`ledger-${acc.name}-${i}`} className="flex justify-between border-b border-white/5 pb-3"><span>{acc.name}</span><span className="text-cyan-400 text-sm font-black">+ ₹{acc.price}</span></div>)}
                          </div>
                          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center mt-auto">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Final Settlement</p>
                            <h4 className="text-4xl font-black text-white tracking-tighter">₹{calculateTotal()}</h4>
                          </div>
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl text-center">
              <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] flex items-center justify-center mb-8 mx-auto"><AlertTriangle className="size-10 text-rose-500" /></div>
              <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Terminate Protocol?</h3>
              <p className="text-slate-500 text-xs font-bold leading-relaxed uppercase tracking-widest mb-10">This will cancel the active booking. This action is <span className="text-rose-500">irreversible</span>.</p>
              <div className="flex flex-col gap-4">
                <button onClick={handleRefuse} disabled={refusing} className="w-full py-5 rounded-[1.5rem] text-xs font-black text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 uppercase tracking-widest">{refusing ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />} Confirm Termination</button>
                <button onClick={() => setRefuseConfirm(false)} className="w-full py-5 rounded-[1.5rem] text-xs font-black text-slate-400 bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95 uppercase tracking-widest">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-white/10 rounded-[3rem] p-10 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Settlement</h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 text-slate-500 hover:text-white transition-all"><XCircle className="size-8" /></button>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 mb-10 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Total Payable Amount</p>
                <h4 className="text-5xl font-black text-white tracking-tighter">₹{calculateTotal()}</h4>
              </div>
              <div className="flex gap-4 mb-10">
                <button onClick={() => setPaymentMethod('upi')} className={cn("flex-1 p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-3", paymentMethod === 'upi' ? "bg-cyan-500/10 border-cyan-400 text-cyan-400" : "bg-white/5 border-white/10 text-slate-500")}><CreditCard className="size-7" /><span className="text-[10px] font-black uppercase tracking-widest">Digital QR</span></button>
                <button onClick={() => setPaymentMethod('cash')} className={cn("flex-1 p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-3", paymentMethod === 'cash' ? "bg-emerald-500/10 border-emerald-400 text-emerald-400" : "bg-white/5 border-white/10 text-slate-500")}><DollarSign className="size-7" /><span className="text-[10px] font-black uppercase tracking-widest">Physical Cash</span></button>
              </div>
              {paymentMethod === 'upi' ? (
                <div className="text-center mb-10">
                  <div className="inline-block p-8 bg-white rounded-[2.5rem] shadow-xl mb-6"><QRCodeSVG value={`upi://pay?pa=fixnow@upi&pn=FixNow&am=${calculateTotal()}&cu=INR`} size={180} level="H" /></div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Monitoring Payment Network...</p>
                </div>
              ) : (
                <div className="text-center py-14 mb-10 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem]">
                  <DollarSign className="size-8 text-emerald-400 mx-auto mb-6 animate-bounce" />
                  <p className="text-xs font-bold text-slate-500 px-10 leading-relaxed uppercase tracking-widest">Collect <span className="text-white font-black text-sm">₹{calculateTotal()}</span> from customer.</p>
                </div>
              )}
              <button onClick={() => { setIsPaid(true); handleComplete(); }} disabled={completing} className="w-full py-6 bg-white text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] hover:bg-slate-100 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-2xl disabled:opacity-70">{completing ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />} Finalize Settlement</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
