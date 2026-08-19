import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Save, User, ShieldCheck, Trash2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '@/lib/config';
import { getAvatarUrl } from '@/lib/image-utils';
import { auth } from '@/lib/firebase';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminProfileModal({ isOpen, onClose }: AdminProfileModalProps) {
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const res = await axios.get(`${API_BASE}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setProfile(res.data.user || {});
      }
    } catch (err) {
      console.error('Failed to fetch admin profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      await axios.patch(`${API_BASE}/api/profile/me`, {
        name: profile.name
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Profile updated successfully');
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Failed to update profile: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setUploadingAvatar(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const uploadData = new FormData();
      uploadData.append('avatar', file);
      const res = await axios.post(`${API_BASE}/api/profile/me/avatar`, uploadData, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });
      if (res.data && res.data.avatar) {
        setProfile((prev: any) => ({ ...prev, avatar: res.data.avatar }));
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const deleteAvatar = async () => {
    if (!profile.avatar) return;
    setUploadingAvatar(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      await axios.delete(`${API_BASE}/api/profile/me/avatar`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile((prev: any) => ({ ...prev, avatar: undefined }));
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl z-[101]"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <ShieldCheck className="text-cyan-400 w-6 h-6" />
                Admin Profile
              </h2>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loading ? (
              <div className="py-20 flex justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="relative group">
                    <div className="size-24 rounded-2xl bg-slate-800 border-2 border-slate-700 overflow-hidden shadow-xl flex items-center justify-center text-white text-3xl font-black">
                      {profile.avatar ? (
                        <img src={getAvatarUrl(profile.avatar)!} className="size-full object-cover" />
                      ) : (
                        (profile.name || profile.email || 'A').charAt(0).toUpperCase()
                      )}
                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 flex gap-1">
                      <input type="file" className="hidden" id="admin-avatar" accept="image/*" onChange={handleAvatarUpload} />
                      <label htmlFor="admin-avatar" className="p-2 bg-white text-slate-950 rounded-xl shadow-lg cursor-pointer hover:scale-105 transition">
                        <Camera className="w-4 h-4" />
                      </label>
                      {profile.avatar && (
                        <button onClick={deleteAvatar} className="p-2 bg-rose-500 text-white rounded-xl shadow-lg cursor-pointer hover:scale-105 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email (Read Only)</label>
                    <div className="w-full bg-slate-800/50 border border-white/5 rounded-xl px-4 py-3 text-slate-300 text-sm">
                      {profile.email}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        value={profile.name || ''} 
                        onChange={e => setProfile({...profile, name: e.target.value})}
                        className="w-full bg-slate-800 border border-white/10 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-3 text-white text-sm transition outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-black uppercase tracking-widest text-xs transition active:scale-95 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Profile
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
