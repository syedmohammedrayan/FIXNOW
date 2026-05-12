'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { auth, db } from '@/lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { API_BASE } from '@/lib/config';
import { Notification, Reminder } from '../types';

export function useDashboardData() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string, avatar?: string }>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeJob, setActiveJob] = useState<any>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const activeJobRef = useRef<any>(null);

  useEffect(() => {
    const fetchReminders = async (uid: string) => {
      try {
        const response = await fetch(`${API_BASE}/api/bookings/reminders/${uid}`);
        const data = await response.json();
        if (data.success && Array.isArray(data.reminders)) {
          const list = [...data.reminders];
          list.sort((a: any, b: any) => new Date(a.nextServiceDate).getTime() - new Date(b.nextServiceDate).getTime());
          setReminders(list);
        }
      } catch (err) {
        console.error('Failed to fetch reminders:', err);
      }
    };

    const fetchUserProfile = async (uid: string) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          let avatarUrl = data.avatar || '';
          if (avatarUrl && !avatarUrl.startsWith('http')) avatarUrl = `${API_BASE}${avatarUrl}`;
          setUserProfile({ name: data.name, avatar: avatarUrl });
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    };

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUserId(u?.uid || null);
      if (u?.uid) {
        try {
          const res = await fetch(`${API_BASE}/api/users/${u.uid}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.user && data.user.role !== 'customer') {
              await auth.signOut();
              window.location.href = '/auth/login?role=customer';
              return;
            }
          }
        } catch (err) {
          console.error(err);
        }
        fetchReminders(u.uid);
        fetchUserProfile(u.uid);
      } else {
        setReminders([]);
        setUserProfile({});
      }
    });
    return () => unsub();
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (!userId) return;
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/bookings/notifications/${userId}`);
        if (res.data.success && Array.isArray(res.data.notifications)) {
          setNotifications(res.data.notifications);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, [userId]);

  // Fetch Active Job and handle Success/Payment states
  useEffect(() => {
    if (!userId) return;
    const fetchActiveJob = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/bookings/customer/${userId}`);
        if (res.data.success) {
          const bookings = Array.isArray(res.data.bookings) ? res.data.bookings : [];
          const active = bookings.find((b: any) => 
            (['Accepted', 'On the Way', 'Arrived', 'In Progress'].includes(b.status) || 
            (b.status === 'Completed' && b.payment_status === 'Unpaid')) && 
            b.category !== 'Toilet Repair'
          );
          
          // Detect transition to completed & paid
          if (!active && activeJobRef.current?.status === 'Completed' && activeJobRef.current?.payment_status === 'Unpaid') {
             setShowPaymentSuccess(true);
             setTimeout(() => setShowPaymentSuccess(false), 8000);
          }
          
          setActiveJob(active || null);
          activeJobRef.current = active || null;
        }
      } catch (err) {
        console.error('Failed to fetch active job:', err);
      }
    };
    fetchActiveJob();
    const interval = setInterval(fetchActiveJob, 180000); // 3 minutes
    return () => clearInterval(interval);
  }, [userId]); // Removed activeJob from dependencies to prevent infinite loop

  const markNotifRead = async (notifId: string) => {
    try {
      await axios.post(`${API_BASE}/api/bookings/notifications/${notifId}/read`);
      setNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, read: true } : n));
    } catch (e) { /* ignore */ }
  };

  const markAllRead = async () => {
    if (!userId) return;
    try {
      await axios.post(`${API_BASE}/api/bookings/notifications/${userId}/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) { /* ignore */ }
  };

  const handleSignOut = async (router: any) => {
    await signOut(auth);
    router.push('/');
  };

  const handleDeleteAccount = async (router: any, setDeleting: (v: boolean) => void, setShowDeleteConfirm: (v: boolean) => void) => {
    if (!userId) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`${API_BASE}/api/users/${userId}`);
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>, setUploadingAvatar: (v: boolean) => void, setAvatarMenuOpen: (v: boolean) => void) => {
    if (!e.target.files || !e.target.files[0] || !userId) return;
    const file = e.target.files[0];
    setUploadingAvatar(true);
    setAvatarMenuOpen(false);
    try {
      const uploadData = new FormData();
      uploadData.append('avatar', file);
      const res = await axios.post(`${API_BASE}/api/users/${userId}/avatar`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.avatar) {
        let url = res.data.avatar;
        if (url && !url.startsWith('http')) url = `${API_BASE}${url}`;
        setUserProfile(prev => ({ ...prev, avatar: url }));
      }
    } catch (err) {
      console.error('Failed to upload avatar', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async (setUploadingAvatar: (v: boolean) => void, setAvatarMenuOpen: (v: boolean) => void) => {
    if (!userId || !userProfile.avatar) return;
    setUploadingAvatar(true);
    setAvatarMenuOpen(false);
    const oldAvatar = userProfile.avatar;
    setUserProfile(prev => ({ ...prev, avatar: undefined }));
    try {
      // Update via backend directly
      await axios.post(`${API_BASE}/api/users/${userId}/update-profile`, { avatar: null });
    } catch (err) {
      console.error('Failed to delete avatar', err);
      setUserProfile(prev => ({ ...prev, avatar: oldAvatar }));
    } finally {
      setUploadingAvatar(false);
    }
  };

  return {
    userId,
    userProfile,
    setUserProfile,
    notifications,
    setNotifications,
    reminders,
    activeJob,
    showPaymentSuccess,
    setShowPaymentSuccess,
    markNotifRead,
    markAllRead,
    handleSignOut,
    handleDeleteAccount,
    handleAvatarUpload,
    handleAvatarDelete
  };
}
