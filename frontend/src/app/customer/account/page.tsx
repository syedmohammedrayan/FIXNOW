'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, MapPin, Save, LogOut, ShieldCheck, ChevronRight, ArrowLeft, Camera, Trash2, ShieldAlert, Lock } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import axios from 'axios';
import { API_BASE } from '@/lib/config';

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
      // Call the backend endpoint directly instead of client-side updateDoc
      await axios.post(`${API_BASE}/api/users/${user.uid}/update-profile`, {
        ...formData
      });
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
        // Backend already updates both users and technicians collections
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
      // Use backend API to clear avatar
      await axios.post(`${API_BASE}/api/users/${user.uid}/update-profile`, { avatar: null });
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center glass-panel border-white/10">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen glass-panel font-sans pb-20">
      {/* Premium Header */}
      <div className="glass-panel backdrop-blur-2xl px-6 pt-24 pb-12 border-b border-white/60 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.back()}
              className="p-3.5 rounded-2xl glass-panel hover:bg-white/10 border border-slate-100 transition-all shadow-sm active:scale-95 group"
            >
              <ArrowLeft className="w-5 h-5 text-indigo-300 group-hover:text-indigo-600 group-hover:-translate-x-1 transition-all" />
            </button>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter">Security & Profile</h1>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Authorized User Hub</p>
            </div>
          </div>
          <button 
            onClick={() => signOut(auth)} 
            className="flex items-center gap-3 px-6 py-3.5 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm border border-rose-100 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Terminate Session
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-12 grid lg:grid-cols-12 gap-10">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-8 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="glass-neon-card p-10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.03] blur-[80px] -mr-32 -mt-32" />
            
            <div className="flex flex-col md:flex-row items-center gap-8 mb-12 relative z-10">
              <div className="relative group">
                <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-600 overflow-hidden border-4 border-white shadow-2xl flex items-center justify-center text-white text-5xl font-black transition-transform duration-500 group-hover:scale-105">
                  {formData.avatar ? (
                    <img src={formData.avatar} className="w-full h-full object-cover" />
                  ) : (
                    formData.name.charAt(0) || user?.email?.charAt(0).toUpperCase()
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 flex gap-2">
                  <input type="file" className="hidden" id="avatar-up" accept="image/jpeg, image/png, image/jpg, image/webp" onChange={handleAvatarUpload} />
                  <label htmlFor="avatar-up" className="p-3 glass-panel border-white/10 hover:bg-indigo-50 text-indigo-600 rounded-2xl shadow-xl border border-slate-100 cursor-pointer transition-all active:scale-90">
                    <Camera className="w-5 h-5" />
                  </label>
                  {formData.avatar && (
                    <button onClick={deleteAvatar} className="p-3 glass-panel border-white/10 hover:bg-rose-50 text-rose-500 rounded-2xl shadow-xl border border-slate-100 transition-all active:scale-90">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-black text-white tracking-tight">{formData.name || 'Set Your Name'}</h3>
                <p className="text-slate-400 font-medium mb-4">{user?.email}</p>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Identity Verified
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="Enter full name"
                    className="w-full rounded-[1.25rem] border border-slate-100 glass-panel px-12 py-5 text-white focus:outline-none focus:border-indigo-500 focus:bg-white/5 transition font-bold shadow-inner" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Authorized Phone</label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full rounded-[1.25rem] border border-slate-100 glass-panel px-12 py-5 text-white focus:outline-none focus:border-indigo-500 focus:bg-white/5 transition font-bold shadow-inner" 
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Primary Service Location</label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    ref={addressInputRef}
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    placeholder="Search for service address..."
                    className="w-full rounded-[1.25rem] border border-slate-100 glass-panel px-12 py-5 text-white focus:outline-none focus:border-indigo-500 focus:bg-white/5 transition font-bold shadow-inner" 
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Password Reset Hint</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    value={formData.passwordHint} 
                    onChange={e => setFormData({...formData, passwordHint: e.target.value})} 
                    placeholder="Set a secret hint for password resets..."
                    className="w-full rounded-[1.25rem] border border-slate-100 glass-panel px-12 py-5 text-white focus:outline-none focus:border-indigo-500 focus:bg-white/5 transition font-bold shadow-inner" 
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="w-full mt-12 py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.25em] rounded-[1.5rem] shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'Syncing Profile...' : 'Update Authorized Details'}
            </button>
          </motion.div>
        </div>

        {/* Right Column: Security & Misc */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-neon-card p-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Security Hub</h4>
            <div className="space-y-4">
              <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between group cursor-pointer hover:bg-emerald-100 transition-all">
                <div className="flex items-center gap-4">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-tight">Security Protocol</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Secured</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
              </div>

              <div className="p-5 glass-panel rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                <div className="flex items-center gap-4">
                  <User className="w-6 h-6 text-slate-400" />
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-tight">Emergency</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Protocol Contacts</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          <div className="glass-neon-card p-8 border-rose-100 bg-rose-50/10">
            <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4">Danger Zone</h4>
            <p className="text-xs text-indigo-300 mb-6 font-medium">Permanently delete your profile and all associated service history from FIXNOW servers.</p>
            <button 
              onClick={() => router.push('/customer/dashboard')} // Or show a modal
              className="w-full py-4 rounded-2xl border-2 border-rose-100 text-rose-500 font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-95"
            >
              <ShieldAlert className="w-4 h-4 inline mr-2" />
              Decommission Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
