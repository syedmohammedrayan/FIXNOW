'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, MapPin, Save, LogOut, ShieldCheck, ChevronRight, ArrowLeft, Camera, Trash2, ShieldAlert, Lock, Activity, Smartphone } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import axios from 'axios';
import { API_BASE } from '@/lib/config';
import { getAvatarUrl } from '@/lib/image-utils';

export default function CustomerAccount() {
  const { currentKey, rotateKey } = useGoogleMapsKey();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    emergencyContact: '',
    avatar: '',
    passwordHint: ''
  });

  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setFormData({
              name: data.name || '',
              phone: data.phone || '',
              address: data.address || '',
              emergencyContact: data.emergencyContact || '',
              avatar: data.avatar || '',
              passwordHint: data.passwordHint || ''
            });
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
        setLoading(false);
        initGoogleMaps();
      } else {
        router.push('/auth/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const initGoogleMaps = () => {
    if (typeof window !== 'undefined' && !(window as any).google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${currentKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setupAutocomplete();
      script.onerror = () => {
        console.error("Maps load failed in Account. Rotating...");
        rotateKey();
      };
      document.head.appendChild(script);
    } else if (typeof window !== 'undefined' && (window as any).google) {
      setupAutocomplete();
    }
  };

  const setupAutocomplete = () => {
    if (addressInputRef.current && (window as any).google) {
      autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(addressInputRef.current, {
        types: ['geocode'],
        componentRestrictions: { country: 'in' }
      });
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.formatted_address) {
          setFormData(prev => ({ ...prev, address: place.formatted_address }));
        }
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/users/${user.uid}/update-profile`, {
        ...formData
      });
      // Optionally show a custom toast instead of alert
      alert('Profile protocol updated successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to update profile: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    const file = e.target.files[0];
    setUploadingAvatar(true);
    try {
      const uploadData = new FormData();
      uploadData.append('avatar', file);
      const res = await axios.post(`${API_BASE}/api/users/${user.uid}/avatar`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.avatar) {
        const url = res.data.avatar;
        setFormData(prev => ({ ...prev, avatar: url }));
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const deleteAvatar = async () => {
    if (!user || !formData.avatar) return;
    setUploadingAvatar(true);
    setFormData(prev => ({ ...prev, avatar: '' }));
    try {
      await axios.post(`${API_BASE}/api/users/${user.uid}/update-profile`, { avatar: null });
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-20">
      {/* Premium Sticky Header */}
      <div className="sticky top-0 z-[60] px-4 py-4 sm:py-6 bg-slate-950/60 backdrop-blur-3xl border-b border-white/[0.08]">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={() => router.back()}
              className="p-3 sm:p-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-all shadow-lg active:scale-95 group"
            >
              <ArrowLeft className="w-5 h-5 text-white group-hover:-translate-x-1 transition-all" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-4xl font-black text-white tracking-tighter italic">Identity Hub</h1>
              <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[8px] sm:text-[10px] mt-1">Authorized Protocol Management</p>
            </div>
          </div>
          <button 
            onClick={() => signOut(auth)} 
            className="hidden sm:flex items-center gap-3 px-6 py-4 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500/20 transition-all font-black text-[10px] uppercase tracking-widest border border-rose-500/15 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Terminate
          </button>
          <button 
            onClick={() => signOut(auth)} 
            className="sm:hidden p-3.5 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/15"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12 grid lg:grid-cols-12 gap-6 sm:gap-10">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-10 border border-white/[0.08] rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl relative overflow-hidden"
            style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 20px 60px rgba(0,0,0,0.3)' }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] blur-[80px] -mr-32 -mt-32 pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 mb-10 sm:mb-12 relative z-10">
              <div className="relative group">
                <div className="size-28 sm:size-36 rounded-[2rem] sm:rounded-[2.5rem] bg-slate-900 border-4 border-slate-950 overflow-hidden shadow-2xl flex items-center justify-center text-white text-4xl sm:text-5xl font-black group-hover:scale-105 transition-all duration-500">
                  {formData.avatar ? (
                    <img src={getAvatarUrl(formData.avatar)!} className="size-full object-cover" />
                  ) : (
                    formData.name.charAt(0) || user?.email?.charAt(0).toUpperCase()
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center">
                      <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 flex gap-2">
                  <input type="file" className="hidden" id="avatar-up" accept="image/*" onChange={handleAvatarUpload} />
                  <label htmlFor="avatar-up" className="p-3 bg-white text-slate-950 rounded-2xl shadow-2xl cursor-pointer hover:bg-slate-100 transition active:scale-90 flex items-center justify-center">
                    <Camera className="size-5 sm:size-6" />
                  </label>
                  {formData.avatar && (
                    <button onClick={deleteAvatar} className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl shadow-2xl hover:bg-rose-500/20 transition active:scale-90 flex items-center justify-center">
                      <Trash2 className="size-5 sm:size-6" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="text-center sm:text-left">
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight italic">{formData.name || 'Micro-User'}</h3>
                <p className="text-slate-500 font-bold text-xs sm:text-sm mt-1">{user?.email}</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/15 mt-5">
                  <ShieldCheck className="size-3.5" />
                  Grid Verified
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8">
              <div className="space-y-3">
                <label className="text-[10px] sm:text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1 block">Identity Handle</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 size-4 sm:size-5 text-white/20 group-focus-within:text-white/60 transition" />
                  <input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="Full Name"
                    className="w-full rounded-[1.25rem] border border-white/[0.08] bg-white/[0.03] px-12 sm:px-14 py-4 sm:py-5 text-white placeholder:text-white/10 focus:outline-none focus:border-white/20 transition text-sm sm:text-base font-bold shadow-inner" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] sm:text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1 block">Secure Line</label>
                <div className="relative group">
                  <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 size-4 sm:size-5 text-white/20 group-focus-within:text-white/60 transition" />
                  <input 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full rounded-[1.25rem] border border-white/[0.08] bg-white/[0.03] px-12 sm:px-14 py-4 sm:py-5 text-white placeholder:text-white/10 focus:outline-none focus:border-white/20 transition text-sm sm:text-base font-bold shadow-inner" 
                  />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-3">
                <label className="text-[10px] sm:text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1 block">Primary Base Coordinates</label>
                <div className="relative group">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 size-4 sm:size-5 text-white/20 group-focus-within:text-white/60 transition" />
                  <input 
                    ref={addressInputRef}
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    placeholder="Search for grid location..."
                    className="w-full rounded-[1.25rem] border border-white/[0.08] bg-white/[0.03] px-12 sm:px-14 py-4 sm:py-5 text-white placeholder:text-white/10 focus:outline-none focus:border-white/20 transition text-sm sm:text-base font-bold shadow-inner" 
                  />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-3">
                <label className="text-[10px] sm:text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1 block">Encryption Hint</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 size-4 sm:size-5 text-white/20 group-focus-within:text-white/60 transition" />
                  <input 
                    value={formData.passwordHint} 
                    onChange={e => setFormData({...formData, passwordHint: e.target.value})} 
                    placeholder="Password recovery hint..."
                    className="w-full rounded-[1.25rem] border border-white/[0.08] bg-white/[0.03] px-12 sm:px-14 py-4 sm:py-5 text-white placeholder:text-white/10 focus:outline-none focus:border-white/20 transition text-sm sm:text-base font-bold shadow-inner" 
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="w-full mt-10 sm:mt-12 py-5 sm:py-6 bg-white text-slate-900 font-black text-[10px] sm:text-xs uppercase tracking-[0.3em] rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {saving ? <div className="size-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" /> : <Save className="size-5" />}
              {saving ? 'Synchronizing Base...' : 'Execute Profile Update'}
            </button>
          </motion.div>
        </div>

        {/* Right Column: Security & Misc */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8">
          <div className="bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white/[0.08] shadow-2xl relative overflow-hidden" style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)' }}>
            <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-6">Security Protocol</h4>
            <div className="space-y-4">
              <div className="p-4 sm:p-5 bg-emerald-500/10 rounded-2xl border border-emerald-500/15 flex items-center justify-between group cursor-pointer hover:bg-emerald-500/15 transition-all">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/15">
                    <ShieldCheck className="size-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-tight">2FA Active</p>
                    <p className="text-[9px] text-emerald-400/60 font-black uppercase tracking-widest mt-0.5">Encrypted</p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>

              <div className="p-4 sm:p-5 bg-white/[0.03] rounded-2xl border border-white/[0.06] flex items-center justify-between group cursor-pointer hover:bg-white/[0.06] transition-all">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-white/[0.04] flex items-center justify-center border border-white/[0.06]">
                    <Activity className="size-5 text-white/40" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-tight">Logs</p>
                    <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-0.5">Session History</p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </div>

          <div className="bg-rose-500/[0.04] backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-rose-500/15 relative overflow-hidden shadow-2xl">
            <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4">Danger Protocol</h4>
            <p className="text-[11px] text-slate-500 mb-6 font-bold leading-relaxed uppercase tracking-wide">Decommission your profile and purge all grid data forever.</p>
            <button 
              onClick={() => {
                // We should ideally show the AccountDeletionModal here
                // For now, redirect to dashboard as a placeholder or trigger modal via state
                router.push('/customer/dashboard');
              }}
              className="w-full py-4 rounded-xl sm:rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <ShieldAlert className="size-4" />
              Purge Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
