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
  DollarSign, Clock, RefreshCw, Zap, Wrench, Plus, Trash2, CreditCard, Printer, Moon, Sun
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { io, Socket } from 'socket.io-client';
import TechnicianSidebar from '@/components/technician/Sidebar';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
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
  const [isDarkMode] = useState(true);
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

    const wid = navigator.geolocation.watchPosition(
      (pos) => updateLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("Technician geolocation error:", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(wid);
  }, [bookingId, user?.uid]);

  // Instant Local Distance Calculation
  useEffect(() => {
    const cLoc = booking?.customerLocation || ((booking as any)?.customerLat ? { lat: (booking as any).customerLat, lng: (booking as any).customerLng } : null);
    if (techLocation && cLoc && window.google?.maps?.geometry?.spherical) {
      const meters = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(techLocation.lat, techLocation.lng),
        new window.google.maps.LatLng(cLoc.lat, cLoc.lng)
      );
      
      if (meters < 100) setEta('Arrived');
      
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

  // Map & Polyline Management
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  
  useEffect(() => {
    const cLoc = booking?.customerLocation || ((booking as any)?.customerLat ? { lat: (booking as any).customerLat, lng: (booking as any).customerLng } : null);
    if (!map || !window.google?.maps) return;
    
    if (!polylineRef.current) {
      polylineRef.current = new window.google.maps.Polyline({
        strokeColor: "#22d3ee",
        strokeWeight: 4,
        strokeOpacity: 0.8,
        zIndex: 5,
        map: map
      });
    }

    if (techLocation?.lat && techLocation?.lng && cLoc?.lat && cLoc?.lng) {
      const path = [
        new window.google.maps.LatLng(techLocation.lat, techLocation.lng),
        new window.google.maps.LatLng(cLoc.lat, cLoc.lng)
      ];
      polylineRef.current.setPath(path);
      polylineRef.current.setMap(map);
      
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(techLocation);
      bounds.extend(cLoc);
      map.fitBounds(bounds, { top: 100, right: 100, bottom: 200, left: 100 });
    } else {
      polylineRef.current.setMap(null);
    }

    return () => {
      if (polylineRef.current) polylineRef.current.setMap(null);
    };
  }, [map, techLocation, booking?.customerLocation]);

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

        let street = get('route') || get('street_number');
        let area = get('sublocality_level_2') || get('sublocality_level_1') || get('sublocality') || get('neighborhood');
        let zone = get('sublocality_level_1') || get('locality');
        let city = get('administrative_area_level_2') || get('locality');

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
    const extra = accessories.reduce((sum, acc) => sum + acc.price, 0);
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
      <TechnicianSidebar />
      <main className="pl-0 md:pl-[78px] lg:pl-[280px] pt-16 md:pt-0 min-h-screen relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-500/5 blur-[100px] rounded-full -ml-48 -mb-48" />

        <div className="p-4 lg:p-10 max-w-[1400px] mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10">
            <div className="flex items-center gap-5">
              <button onClick={() => router.back()} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all active:scale-95 group">
                <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl sm:text-3xl font-black text-white tracking-tighter uppercase">{booking?.category || 'Service'}</h1>
                  <div className="px-3 py-1 bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black rounded-lg uppercase tracking-widest">#{bookingId?.slice(-8).toUpperCase()}</div>
                </div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                  <Activity className="size-3 text-cyan-400" />
                  Service Control Center
                </p>
              </div>
            </div>
            <div className="md:ml-auto flex items-center gap-4">
              <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex -space-x-2">
                   <div className="size-6 rounded-full bg-cyan-500 border-2 border-slate-900" />
                   <div className="size-6 rounded-full bg-white border-2 border-slate-900" />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Sync Active</span>
              </div>
              <div className="flex items-center gap-3 px-6 py-2.5 bg-cyan-400/10 border border-cyan-400/20 rounded-2xl">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-cyan-400 text-xs font-black uppercase tracking-[0.15em]">{booking?.status || 'On The Way'}</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Job Parameters</p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-5 bg-white/5 border border-white/10 rounded-[1.5rem] hover:border-white/20 transition-all duration-300">
                    <div className="size-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                      <MapPin className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Customer Location</p>
                      </div>
                      <p className="text-sm text-white font-bold leading-tight line-clamp-2">
                        {liveAddress || booking?.address || "Locating..."}
                      </p>
                    </div>
                  </div>
                  {booking?.contactNumber && (
                    <a href={`tel:${booking.contactNumber}`} className="flex items-center gap-3 w-full p-4 bg-white/5 border border-white/10 rounded-[1.5rem] hover:bg-white/10 transition-all active:scale-[0.98]">
                      <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0"><Phone className="size-5" /></div>
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Communication</p>
                        <span className="text-sm text-white font-bold">{booking.contactNumber}</span>
                      </div>
                    </a>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-[1.5rem] flex flex-col justify-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Distance</p>
                      <div className="flex items-center gap-1.5">
                        <Navigation className="size-4 text-cyan-400" />
                        <span className="text-lg font-black text-white">{localDistance || 'Syncing...'}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-[1.5rem] flex flex-col justify-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">ETA</p>
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-4 text-amber-400" />
                        <span className="text-lg font-black text-white">{eta}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Verification Protocol</p>
                {otpPhase === 'idle' && booking?.status !== 'In Progress' && (
                  <div className="text-center">
                    <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group">
                      <ShieldCheck className="size-10 text-white group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <button onClick={handleGenerateOtp} className="w-full py-5 bg-white text-slate-950 hover:bg-slate-100 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95">
                      <Zap className="size-4" /> Initiate Protocol
                    </button>
                  </div>
                )}
                {otpPhase === 'entering' && (
                  <div>
                    <div className="flex gap-3 justify-center mb-8">
                      {otpInput.map((digit, i) => (
                        <input key={i} ref={(el) => { otpRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} className="w-12 h-16 sm:w-14 sm:h-18 text-center text-2xl font-black bg-white/5 border border-white/10 focus:border-white rounded-2xl text-white outline-none transition-all" />
                      ))}
                    </div>
                    {otpError && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-6 text-rose-500 text-[10px] font-black uppercase tracking-wider text-center">{otpError}</div>}
                    <div className="flex gap-3">
                      <button onClick={handleVerifyOtp} className="flex-1 py-5 bg-white text-slate-950 hover:bg-slate-100 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95">Authorize</button>
                      <button onClick={handleGenerateOtp} className="p-5 bg-white/5 border border-white/10 text-slate-400 rounded-2xl hover:bg-white/10 transition active:scale-95"><RefreshCw className="size-4" /></button>
                    </div>
                  </div>
                )}
                {(otpPhase === 'verified' || booking?.status === 'In Progress') && (
                  <div className="text-center py-6">
                    <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="size-10 text-emerald-400" /></div>
                    <h3 className="text-xl font-black text-white tracking-tight">Active Operation</h3>
                    <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Protocol Verified & Syncing</p>
                  </div>
                )}
              </div>

              {serviceInProgress && (
                <div className="space-y-4">
                  <button onClick={handleComplete} disabled={completing} className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-[1.5rem] transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 text-sm uppercase tracking-widest">
                    {completing ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />} Complete Service
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => window.print()} className="py-4 bg-white/5 border border-white/10 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 active:scale-95"><Printer className="size-4" /> Receipt</button>
                    <button onClick={() => setRefuseConfirm(true)} disabled={refusing} className="py-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-rose-600 transition-all flex items-center justify-center gap-2 active:scale-95"><XCircle className="size-4" /> Refused</button>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-3">
              {!serviceInProgress ? (
                <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden h-full min-h-[500px] flex flex-col shadow-2xl">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tactical Overlay</span>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-slate-900/50">
                      <Moon className="size-3.5 text-cyan-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-white">Midnight Mode</span>
                    </div>
                  </div>
                  <div className="relative flex-1">
                    {isLoaded && (
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={techLocation || { lat: 28.6139, lng: 77.2090 }}
                        zoom={14}
                        onLoad={(m) => { setMap(m); setMapReady(true); }}
                        options={{ disableDefaultUI: true, zoomControl: true, styles: darkMapStyles }}
                      >
                        {techLocation && (
                          <OverlayView position={techLocation} mapPaneName="overlayMouseTarget">
                            <div className="relative -translate-x-1/2 -translate-y-1/2"><div className="size-10 bg-white rounded-full border-4 border-slate-900 shadow-xl flex items-center justify-center"><Wrench className="size-5 text-slate-900" /></div></div>
                          </OverlayView>
                        )}
                        {booking?.customerLocation && (
                          <OverlayView position={booking.customerLocation} mapPaneName="overlayMouseTarget">
                            <div className="relative -translate-x-1/2 -translate-y-1/2"><div className="size-10 bg-cyan-400 rounded-full border-4 border-slate-900 shadow-xl flex items-center justify-center"><MapPin className="size-5 text-slate-900" /></div></div>
                          </OverlayView>
                        )}
                      </GoogleMap>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 h-full min-h-[600px] flex flex-col shadow-2xl">
                  <h2 className="text-2xl font-black text-white tracking-tight mb-10 uppercase">Execution Console</h2>
                  <div className="grid md:grid-cols-5 gap-10 flex-1">
                    <div className="md:col-span-3 space-y-8">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-3">Service Documentation</label>
                        <textarea value={servicesDone} onChange={(e) => setServicesDone(e.target.value)} placeholder="Describe work performed..." className="w-full h-40 bg-white/5 border border-white/10 rounded-3xl p-6 text-sm text-white font-bold focus:border-white transition-all outline-none resize-none" />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-3">Base Price (INR)</label>
                          <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                            <input type="number" placeholder="0" value={baseAmount} onChange={(e) => setBaseAmount(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-5 py-3 text-sm text-white font-bold focus:border-white outline-none transition-all" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-3">Additional Components</label>
                        <div className="flex gap-3 mb-4">
                          <input type="text" placeholder="Component Name" value={newAccName} onChange={(e) => setNewAccName(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white font-bold outline-none focus:border-white" />
                          <input type="number" placeholder="₹" value={newAccPrice} onChange={(e) => setNewAccPrice(e.target.value)} className="w-28 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white font-bold outline-none focus:border-white" />
                          <button onClick={addAccessory} className="p-4 bg-white text-slate-950 rounded-2xl transition active:scale-95"><Plus className="size-5" /></button>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-3 custom-scrollbar">
                          {accessories.map((acc, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                              <span className="text-sm font-bold text-white">{acc.name}</span>
                              <div className="flex items-center gap-4"><span className="text-sm font-black text-cyan-400">₹{acc.price}</span><button onClick={() => removeAccessory(i)} className="text-rose-500 hover:text-rose-400 transition"><Trash2 className="size-4" /></button></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="bg-slate-950 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative">
                        <h3 className="text-lg font-black tracking-tighter uppercase text-center mb-8 italic">Service Ledger</h3>
                        <div className="space-y-4 mb-10 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          <div className="flex justify-between border-b border-white/5 pb-3"><span>Base Protocol</span><span className="text-white text-sm font-black">₹{baseAmount || '0'}</span></div>
                          {accessories.map((acc, i) => <div key={i} className="flex justify-between border-b border-white/5 pb-3"><span>{acc.name}</span><span className="text-cyan-400 text-sm font-black">+ ₹{acc.price}</span></div>)}
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Final Settlement</p>
                          <h4 className="text-4xl font-black text-white tracking-tighter">₹{calculateTotal()}</h4>
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
