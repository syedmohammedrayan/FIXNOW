'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Phone, 
  MapPin, 
  Wrench, 
  Shield, 
  Save, 
  ArrowLeft, 
  ShieldAlert, 
  Camera, 
  Trash2,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronDown,
  Plus,
  Minus,
  Lock
} from 'lucide-react';
import { db, auth, storage } from '@/lib/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import axios from 'axios';
import { API_BASE } from '@/lib/config';
import { cn } from '@/lib/utils';
import { ALL_SERVICES } from '@/lib/services';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';
import { getAvatarUrl } from '@/lib/image-utils';

interface ProfileProps {
  user: any;
  profile: any;
  setProfile: (profile: any) => void;
}

export default function ProfileSettings({ user, profile, setProfile }: ProfileProps) {
  const [formData, setFormData] = useState({
    name: profile.name || '',
    phone: profile.phone || '',
    category: profile.category || '',
    address: profile.address || '',
    bio: profile.bio || '',
    passwordHint: profile.passwordHint || ''
  });
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set(profile.skills || []));
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  const { currentKey, rotateKey } = useGoogleMapsKey();

  useEffect(() => {
    if (!isEditing) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        category: profile.category || '',
        address: profile.address || '',
        bio: profile.bio || '',
        passwordHint: profile.passwordHint || ''
      });
      setSelectedServices(new Set(profile.skills || []));
    }
  }, [profile, isEditing]);

  useEffect(() => {
    // Load Google Maps script if not already present
    if (typeof window !== 'undefined' && !(window as any).google) {
      if (!document.getElementById('google-maps-script')) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${currentKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => initAutocomplete();
        script.onerror = () => {
          console.error("Google Maps script load failed in Profile. Rotating...");
          rotateKey();
        };
        document.head.appendChild(script);
      }
    } else if (typeof window !== 'undefined' && (window as any).google) {
      initAutocomplete();
    }

    function initAutocomplete() {
      if (addressInputRef.current && window.google?.maps?.places?.Autocomplete) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
          types: ['(regions)'],
          componentRestrictions: { country: 'in' } // Focus on India for FIXNOW
        });
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (place.formatted_address) {
            setFormData(prev => ({ ...prev, address: place.formatted_address }));
            setIsEditing(true);
          }
        });
      }
    }
  }, [currentKey, rotateKey]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsEditing(true);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleService = (service: string) => {
    setIsEditing(true);
    setSelectedServices(prev => {
      const next = new Set(prev);
      if (next.has(service)) next.delete(service);
      else next.add(service);
      return next;
    });
  };

  const toggleCategory = (catName: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catName)) next.delete(catName);
      else next.add(catName);
      return next;
    });
  };

  const selectAllInCategory = (items: string[]) => {
    setIsEditing(true);
    setSelectedServices(prev => {
      const next = new Set(prev);
      items.forEach(i => next.add(i));
      return next;
    });
  };

  const deselectAllInCategory = (items: string[]) => {
    setIsEditing(true);
    setSelectedServices(prev => {
      const next = new Set(prev);
      items.forEach(i => next.delete(i));
      return next;
    });
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      const skillsArray = Array.from(selectedServices);
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        category: formData.category,
        skills: skillsArray,
        address: formData.address,
        bio: formData.bio,
        passwordHint: formData.passwordHint
      };

      // Call the backend endpoint instead of updating Firestore client-side directly
      await axios.post(`${API_BASE}/api/users/${user.uid}/update-profile`, updateData);
      
      setProfile((prev: any) => ({ ...prev, ...updateData }));
      setIsEditing(false);
      window.location.hash = '';
    } catch (err: any) {
      console.error('Failed to save profile', err);
      alert('Failed to save profile updates: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    const file = e.target.files[0];

    // 1. Optimistic Update with local preview
    const previewUrl = URL.createObjectURL(file);
    const previousAvatar = profile.avatar;
    setProfile((prev: any) => ({ ...prev, avatar: previewUrl }));

    setUploadingAvatar(true);
    try {
      const uploadData = new FormData();
      uploadData.append('avatar', file);
      const res = await axios.post(`${API_BASE}/api/users/${user.uid}/avatar`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.avatar) {
        // 2. Final Update with server URL
        const finalUrl = getAvatarUrl(res.data.avatar) || res.data.avatar;
        setProfile((prev: any) => ({ ...prev, avatar: finalUrl }));
        // Clean up the local preview URL
        URL.revokeObjectURL(previewUrl);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Failed to upload avatar', err);
      // Rollback on failure
      setProfile((prev: any) => ({ ...prev, avatar: previousAvatar }));
      URL.revokeObjectURL(previewUrl);
      alert('Failed to upload avatar. Protocol interrupted.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!user || !profile.avatar) return;
    setUploadingAvatar(true);
    try {
      setProfile((prev: any) => ({ ...prev, avatar: undefined }));
      // Use backend API to clear avatar
      await axios.post(`${API_BASE}/api/users/${user.uid}/update-profile`, { avatar: null });
    } catch (err) {
      console.error('Failed to delete avatar', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.uid) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`${API_BASE}/api/users/${user.uid}`);
      if (res.data.success) {
        await signOut(auth);
        window.location.href = '/';
      } else {
        alert(res.data.error || 'Failed to delete account');
      }
    } catch (err) {
      console.error('Deletion error:', err);
      alert('Failed to delete account. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-neon-card p-6 sm:p-10 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Shield className="size-40 text-white" />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="relative group">
            <div className="size-32 rounded-[2.5rem] overflow-hidden border-4 border-slate-900 shadow-2xl relative bg-slate-800 transition-transform group-hover:scale-105 duration-500">
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="size-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              {profile.avatar && profile.avatar.length > 5 ? (
                <div className="relative size-full">
                  <img src={getAvatarUrl(profile.avatar)!} className="size-full object-contain bg-slate-50 p-2" />
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] pointer-events-none" />
                </div>
              ) : (
                <div className="size-full bg-slate-900 flex items-center justify-center text-5xl">👷</div>
              )}
            </div>
            
            <div className="absolute -bottom-2 -right-2 flex gap-2">
              <label 
                htmlFor="avatar-upload"
                className="size-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-slate-900 hover:bg-slate-100 transition-all active:scale-95 cursor-pointer"
                title="Update Photo"
              >
                <Camera className="size-5" />
              </label>
              <input id="avatar-upload" type="file" className="hidden" accept="image/jpeg, image/png, image/jpg, image/webp" onChange={handleAvatarUpload} />
              {profile.avatar && (
                <button 
                  onClick={handleAvatarDelete}
                  className="size-10 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                  title="Remove Photo"
                >
                  <Trash2 className="size-5" />
                </button>
              )}
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <h2 className="text-4xl font-black text-white tracking-tighter mb-2">Identity Settings</h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Manage your professional credentials and presence</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
              <div className="px-5 py-2 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-2">
                 <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Active Specialist</span>
              </div>
              <div className="px-5 py-2 bg-slate-900 border border-slate-800 rounded-full flex items-center gap-2">
                 <Shield className="size-3 text-white" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">ID: {user?.uid.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.hash = ''}
              className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition active:scale-95"
            >
              Exit Protocol
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-neon-card p-6 sm:p-10"
          >
            <div className="space-y-10">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Full Professional Name</label>
                  <div className="relative group">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-white transition" />
                    <input 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-[1.5rem] py-5 pl-16 pr-6 text-white font-bold placeholder:text-slate-600 focus:bg-slate-950 focus:border-white/30 transition-all outline-none shadow-inner"
                      placeholder="Enter your legal name"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Direct Contact Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-white transition" />
                    <input 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-[1.5rem] py-5 pl-16 pr-6 text-white font-bold placeholder:text-slate-600 focus:bg-slate-950 focus:border-white/30 transition-all outline-none shadow-inner"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Primary Service Category Dropdown */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Primary Service Category</label>
                <div className="relative group">
                  <Wrench className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-white transition z-10" />
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                  <select 
                    name="category"
                    value={formData.category}
                    onChange={(e) => { setIsEditing(true); setFormData({ ...formData, category: e.target.value }); }}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-[1.5rem] py-5 pl-16 pr-12 text-white font-bold focus:bg-slate-950 focus:border-white/30 transition-all outline-none shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="">Select your primary category</option>
                    {ALL_SERVICES.map(svc => (
                      <option key={svc.category} value={svc.category}>
                        {svc.category}
                      </option>
                    ))}
                    <option value="general">General / Other</option>
                  </select>
                </div>
              </div>

              {/* Service Area */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Service Area / Operating Base</label>
                <div className="relative group">
                  <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-white transition" />
                  <input 
                    ref={addressInputRef}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-[1.5rem] py-5 pl-16 pr-6 text-white font-bold placeholder:text-slate-600 focus:bg-slate-950 focus:border-white/30 transition-all outline-none shadow-inner"
                    placeholder="Enter your primary operating address or service zone..."
                  />
                </div>
              </div>

              {/* Password Hint */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Password Reset Hint</label>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-white transition" />
                  <input 
                    name="passwordHint"
                    value={formData.passwordHint}
                    onChange={handleChange}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-[1.5rem] py-5 pl-16 pr-6 text-white font-bold placeholder:text-slate-600 focus:bg-slate-950 focus:border-white/30 transition-all outline-none shadow-inner"
                    placeholder="Secret hint for password resets..."
                  />
                </div>
              </div>

              {/* Services Multi-Select */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Your Services & Specializations</label>
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mr-4">
                    {selectedServices.size} selected
                  </span>
                </div>

                {/* Selected Services Tags */}
                {selectedServices.size > 0 && (
                  <div className="flex flex-wrap gap-2 p-4 bg-slate-950/50 border border-white/10 rounded-2xl">
                    {Array.from(selectedServices).map(svc => (
                      <span key={svc} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white rounded-full text-[11px] font-bold border border-white/10">
                        {svc}
                        <button type="button" onClick={() => toggleService(svc)} className="hover:text-rose-500 transition">
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Toggle Service Selector */}
                <button
                  type="button"
                  onClick={() => setShowServiceSelector(!showServiceSelector)}
                  className="w-full py-4 bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-600 font-black text-xs uppercase tracking-widest hover:bg-indigo-100 hover:border-indigo-300 transition-all flex items-center justify-center gap-2"
                >
                  <Wrench className="size-4" />
                  {showServiceSelector ? 'Hide Service Catalog' : 'Browse & Select Services'}
                  <ChevronDown className={cn('size-4 transition-transform', showServiceSelector && 'rotate-180')} />
                </button>

                {/* Service Catalog Selector */}
                <AnimatePresence>
                  {showServiceSelector && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border border-slate-200 rounded-2xl bg-white shadow-lg overflow-hidden">
                        {/* Search */}
                        <div className="p-4 border-b border-slate-100">
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <input
                              type="text"
                              value={serviceSearch}
                              onChange={e => setServiceSearch(e.target.value)}
                              placeholder="Search services..."
                              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 transition"
                            />
                          </div>
                        </div>

                        {/* Categories */}
                        <div className="max-h-[400px] overflow-y-auto">
                          {ALL_SERVICES.filter(cat =>
                            !serviceSearch.trim() ||
                            cat.category.toLowerCase().includes(serviceSearch.toLowerCase()) ||
                            cat.items.some(i => i.toLowerCase().includes(serviceSearch.toLowerCase()))
                          ).map(cat => {
                            const isExpanded = expandedCategories.has(cat.category) || !!serviceSearch.trim();
                            const filteredItems = serviceSearch.trim()
                              ? cat.items.filter(i => i.toLowerCase().includes(serviceSearch.toLowerCase()))
                              : cat.items;
                            const selectedInCat = filteredItems.filter(i => selectedServices.has(i)).length;

                            return (
                              <div key={cat.category} className="border-b border-slate-50 last:border-0">
                                <button
                                  type="button"
                                  onClick={() => toggleCategory(cat.category)}
                                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition text-left"
                                >
                                  <div className="flex items-center gap-3">
                                    <ChevronDown className={cn('size-4 text-slate-400 transition-transform', isExpanded && 'rotate-180')} />
                                    <span className="text-sm font-bold text-slate-800">{cat.category}</span>
                                    {selectedInCat > 0 && (
                                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-[10px] font-black">
                                        {selectedInCat}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <button type="button" onClick={e => { e.stopPropagation(); selectAllInCategory(filteredItems); }} className="px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Select all">
                                      <Plus className="size-3" />
                                    </button>
                                    <button type="button" onClick={e => { e.stopPropagation(); deselectAllInCategory(filteredItems); }} className="px-2 py-1 text-[9px] font-black uppercase tracking-wider text-rose-500 hover:bg-rose-50 rounded-lg transition" title="Deselect all">
                                      <Minus className="size-3" />
                                    </button>
                                  </div>
                                </button>

                                {isExpanded && filteredItems.length > 0 && (
                                  <div className="px-5 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    {filteredItems.map(item => (
                                      <label
                                        key={item}
                                        className={cn(
                                          'flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all text-xs font-semibold',
                                          selectedServices.has(item)
                                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                            : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                                        )}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selectedServices.has(item)}
                                          onChange={() => toggleService(item)}
                                          className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                                        />
                                        {item}
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full py-6 bg-white text-slate-900 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:bg-slate-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {saving ? (
                  <div className="size-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                ) : (
                  <Save className="size-5" />
                )}
                {saving ? 'Synchronizing...' : 'Save Profile Protocol'}
              </button>
            </div>
          </motion.div>
        </div>

        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900/90 backdrop-blur-3xl p-6 sm:p-8 text-white border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] blur-[60px] -mr-32 -mt-32" />
            <div className="size-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 relative z-10">
               <Shield className="size-7" />
            </div>
            <h3 className="text-xl font-black mb-4 tracking-tight">Trust Verification</h3>
            <p className="text-white/80 font-bold text-xs leading-relaxed uppercase tracking-wider mb-8">Your profile details are verified by our protocol system to ensure platform integrity and customer safety.</p>
            <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
               <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-4 text-emerald-300" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Background Check: PASSED</span>
               </div>
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-neon-card p-6 sm:p-8 border-rose-100 bg-rose-50/30"
          >
            <div className="flex items-center gap-3 mb-6">
               <AlertCircle className="size-5 text-rose-500" />
               <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest">Critical Action Zone</h3>
            </div>
            <p className="text-slate-400 font-bold text-[10px] leading-relaxed uppercase tracking-widest mb-8">Terminating your account is irreversible. All history, earnings, and credentials will be purged.</p>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-4 bg-white/5 border border-rose-500/20 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-sm"
            >
              Terminate Identity
            </button>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
             <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-slate-900/95 backdrop-blur-3xl p-6 sm:p-12 border border-white/10 rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-600 to-orange-600" />
              
              <div className="size-20 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-8">
                <ShieldAlert className="size-10 text-rose-500" />
              </div>
              
              <h3 className="text-2xl font-black text-white text-center mb-4 tracking-tight uppercase">Confirm Termination?</h3>
              <p className="text-slate-400 text-center text-xs font-bold leading-relaxed uppercase tracking-widest mb-10">
                Are you absolutely certain? This will purge your profile and <strong>all associated data</strong> permanently.
              </p>

              <div className="flex flex-col gap-4">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="w-full py-5 bg-rose-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] hover:bg-rose-700 transition shadow-xl shadow-rose-200 flex items-center justify-center gap-3 active:scale-95"
                >
                  {deleting ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm Purge'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="w-full py-5 bg-white/5 text-slate-400 font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] border border-white/10 hover:bg-white/10 transition active:scale-95"
                >
                  Cancel Protocol
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
