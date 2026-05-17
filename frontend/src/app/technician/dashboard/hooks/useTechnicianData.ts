"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from '@/lib/firebase';
import { onSnapshot, doc, setDoc, updateDoc, query, collection, where } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Socket, io } from 'socket.io-client';
import { isCategoryMatch } from '@/app/utils/categoryMatcher';
import { SOCKET_URL, API_BASE } from "@/lib/config";
import axios from "axios";

export function useTechnicianData() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({
    name: "Loading...",
    rating: 5.0,
    totalJobs: 0,
    earnings: 0,
    online: true,
    skills: [],
  });

  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [currentJob, setCurrentJob] = useState<any | null>(null);
  const [jobStatus, setJobStatus] = useState("");
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [declinedJobs, setDeclinedJobs] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [techLocation, setTechLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [toolOrderHistory, setToolOrderHistory] = useState<any[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [availableBroadcasts, setAvailableBroadcasts] = useState<any[]>([]);
  const [missedBroadcast, setMissedBroadcast] = useState<{ bookingId: string; acceptedBy: string } | null>(null);
  const [cancelledBooking, setCancelledBooking] = useState<{ bookingId: string; customerName: string; reason: string } | null>(null);
  const [bellNotifications, setBellNotifications] = useState<any[]>([]);
  
  const prevToolOrdersRef = useRef<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const s = io(SOCKET_URL);
    setSocket(s);
    socketRef.current = s;

    s.on("customer_location_update", (loc) => {
      setCustomerLocation(loc);
    });

    s.on("broadcast_closed", (data) => {
      // Remove the broadcast from available list
      setAvailableBroadcasts((prev) => {
        const hadIt = prev.find(b => b.id === data.bookingId);
        // If we had this broadcast in our queue and it was accepted by someone else, show "missed" notification
        if (hadIt && data.acceptedBy) {
          setMissedBroadcast({ bookingId: data.bookingId, acceptedBy: data.acceptedBy });
          // Auto-dismiss after 6 seconds
          setTimeout(() => setMissedBroadcast(null), 6000);
        }
        return prev.filter(b => b.id !== data.bookingId);
      });
    });

    s.on("booking_cancelled", (data) => {
      // console.log("⚠️ Received booking_cancelled event:", data);
      setCancelledBooking({
        bookingId: data.bookingId,
        customerName: data.customerName || "A customer",
        reason: data.reason || "No reason specified"
      });
      
      // Refresh data to reflect the cancellation in the job lists
      if (auth.currentUser) fetchTechData(auth.currentUser.uid);
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => setCancelledBooking(null), 5000);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  // Join category room when profile + socket are ready
  useEffect(() => {
    if (!socket || !user?.uid || !profile?.category) return;
    
    socket.emit('tech_join_category', {
      techId: user.uid,
      category: profile.category,
      categories: profile.skills || [profile.category]
    });
  }, [socket, user?.uid, profile?.category]);

  // Listen to broadcasts in a separate effect so we have access to the latest profile
  useEffect(() => {
    if (!socket) return;
    
    const handleNewBroadcast = (data: any) => {
      // console.log("📡 Received new broadcast event:", data);
      
      const techCategory = profile?.category || 'general';
      const techSkills = profile?.skills || [];
      const requestCategory = data.category || 'general';
      
      // console.log(`🔍 Checking match: Tech(${techCategory}), Skills(${techSkills.join(', ')}) vs Request(${requestCategory})`);
      
      const isMatch = isCategoryMatch(techCategory, requestCategory) || 
                      techSkills.some((skill: string) => isCategoryMatch(skill, requestCategory));

      if (isMatch) {
        // console.log("✅ Match found! Adding to queue.");
        // Add to available broadcasts
        setAvailableBroadcasts((prev) => {
          if (prev.find(b => b.id === data.bookingId)) return prev;
          return [{ id: data.bookingId, ...data, receivedAt: Date.now() }, ...prev];
        });
        
        // Notify
        setNotification({
          message: `New ${data.category} request available! Click Accept in your queue to claim it.`,
          type: 'info'
        });
      } else {
        // console.log("❌ No category match.");
      }
    };

    socket.on("new_broadcast", handleNewBroadcast);

    return () => {
      socket.off("new_broadcast", handleNewBroadcast);
    };
  }, [socket, profile?.category]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Instant data fetch as soon as user is authenticated
        fetchTechData(currentUser.uid);
        
        // Also fetch profile instantly
        fetch(`${API_BASE}/api/users/${currentUser.uid}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setProfile((prev: any) => ({ ...prev, ...data.user }));
            }
          })
          .catch(err => console.error("Instant profile fetch failed", err));
      } else {
        router.push("/auth/login");
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  const fetchTechData = async (uid: string) => {
    try {
      const bookingsRes = await fetch(`${API_BASE}/api/bookings/technician/${uid}`);
      const bookingsData = await bookingsRes.json();
      if (bookingsData.success) {
        const allJobs = bookingsData.bookings;
        const pending = allJobs.filter((j: any) => j.status === "Pending" || j.status === undefined);
        const inProgress = allJobs.find((j: any) => ["Accepted", "On the Way", "Arrived", "In Progress"].includes(j.status));
        const completed = allJobs.filter((j: any) => j.status === "Completed");
        const declined = allJobs.filter((j: any) => j.status === "Declined" || j.status === "Cancelled");

        setActiveJobs(pending);
        setCurrentJob(inProgress || null);
        if (inProgress) {
          setJobStatus(inProgress.status);
          const cLoc = inProgress.customerLocation || (inProgress.customerLat ? { lat: inProgress.customerLat, lng: inProgress.customerLng } : null);
          if (cLoc) setCustomerLocation(cLoc);
          if (socketRef.current) {
            socketRef.current.emit("join_booking", { bookingId: inProgress.id });
          }
        }
        setOrderHistory(completed);
        setDeclinedJobs(declined.sort((a: any, b: any) => new Date(b.declinedAt || b.updatedAt || b.createdAt || 0).getTime() - new Date(a.declinedAt || a.updatedAt || a.createdAt || 0).getTime()));

        // Fetch Exact Stats from Backend "Oracle" Logic
        const statsRes = await fetch(`${API_BASE}/api/users/techs/${uid}/stats`);
        const statsData = await statsRes.json();
        const dbEarnings = statsData.success ? (parseFloat(statsData.stats.totalEarnings) || 0) : 0;

        const transRes = await fetch(`${API_BASE}/api/bookings/transactions/technician/${uid}`);
        const transData = await transRes.json();
        if (transData.success) {
          const myTrans = transData.transactions;
          setTransactions(myTrans);
          const grossEarnings = myTrans.reduce((acc: number, t: any) => {
            if (t.type === "service_payment" && t.status === "Success") return acc + (parseFloat(t.amount) || 0);
            return acc;
          }, 0);
          
          const netEarnings = myTrans.reduce((acc: number, t: any) => {
            if (t.type === "service_payment" && t.status === "Success") return acc + (parseFloat(t.amount) || 0);
            if (t.type === "tool_purchase" && t.paymentMethod === "deduct_from_earnings" && t.status === "Success") return acc - (parseFloat(t.amount) || 0);
            return acc;
          }, 0);
          
          setProfile((prev: any) => {
            // Priority: Stats API (Exact) > Manual Transactions. 
            // We NO LONGER fallback to prev.earnings to ensure mock data from Firestore doesn't persist.
            const finalEarnings = statsData.success ? (parseFloat(statsData.stats.totalEarnings) || 0) : grossEarnings;
            
            const updatedProfile = { 
              ...prev, 
              earnings: finalEarnings, 
              netEarnings,
              totalJobs: statsData.success ? statsData.stats.ordersCompleted : (prev.completed_jobs || prev.completedJobs || completed.length) 
            };
            
            fetchActiveBroadcasts(updatedProfile);
            return updatedProfile;
          });
        } else {
          setProfile((prev: any) => {
            // Strictly use DB earnings, no fallback to previous potentially mock state
            const finalEarnings = dbEarnings;
            const updatedProfile = { ...prev, earnings: finalEarnings };
            fetchActiveBroadcasts(updatedProfile);
            return updatedProfile;
          });
        }
      }
    } catch (err) {
      console.error("Tech dashboard fetch error:", err);
    }
  };

  const fetchActiveBroadcasts = async (currentProfile: any) => {
    if (!user?.uid) return;
    try {
      const bRes = await fetch(`${API_BASE}/api/bookings/active-broadcasts?techId=${user.uid}`);
      const bData = await bRes.json();
      if (bData.success && bData.broadcasts) {
        setAvailableBroadcasts(prev => {
          const newMap = new Map(prev.map(p => [p.id, p]));
          bData.broadcasts.forEach((mb: any) => {
            if (!newMap.has(mb.id)) {
              newMap.set(mb.id, { ...mb, receivedAt: Date.now() });
            }
          });
          // Sort descending by creation time
          return Array.from(newMap.values()).sort((x: any, y: any) => {
            const xTime = x.createdAt ? new Date(x.createdAt).getTime() : 0;
            const yTime = y.createdAt ? new Date(y.createdAt).getTime() : 0;
            return yTime - xTime;
          });
        });
      }
      
      // Also fetch missed broadcasts to catch up if we were logged out
      fetchMissedBroadcasts();
    } catch(e) {
      console.error('Failed to fetch broadcasts', e);
    }
  };

  const fetchMissedBroadcasts = async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`${API_BASE}/api/bookings/missed-broadcasts/${user.uid}`);
      const data = await res.json();
      if (data.success && data.missed && data.missed.length > 0) {
        const latest = data.missed[0];
        // Only show if it's really new (within last 30 seconds)
        const acceptedAt = new Date(latest.accepted_at || latest.updatedAt).getTime();
        if (Date.now() - acceptedAt < 30000) {
           setMissedBroadcast({ bookingId: latest.id, acceptedBy: latest.technician_name || "Another Technician" });
           setTimeout(() => setMissedBroadcast(null), 8000);
        }
      }
    } catch (e) {
      console.error('Failed to fetch missed broadcasts', e);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    fetchTechData(user.uid);
    const unsubTech = onSnapshot(doc(db, "technicians", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.avatar && !data.avatar.startsWith('http')) data.avatar = `${API_BASE}${data.avatar}`;
        setProfile((prev: any) => ({ ...prev, ...data }));
      }
    });
    
    const q = query(collection(db, "notifications"), where("userId", "==", user.uid), where("read", "==", false));
    const unsubNotif = onSnapshot(q, (snap) => {
      const notifs: any[] = [];
      snap.forEach((d: any) => notifs.push({ id: d.id, ...d.data() }));
      notifs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBellNotifications(notifs);
    });
    
    // REMOVED: Automatic offline on close. 
    // The technician stays online even if they close the tab, 
    // until they explicitly toggle it off in the UI.
    
    // High-frequency synchronization: Reduced to 30 seconds to save Firestore quota
    const interval = setInterval(() => fetchTechData(user.uid), 30000);
    return () => {
      unsubTech();
      unsubNotif();
      clearInterval(interval);
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'toolOrders'), where('technicianId', '==', user.uid));
    const unsub = onSnapshot(q, (snap: any) => {
      const newOrders = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      if (prevToolOrdersRef.current.length > 0) {
        newOrders.forEach((order: any) => {
          const prev = prevToolOrdersRef.current.find(p => p.id === order.id);
          if (prev && prev.status !== order.status) {
             if (order.status === 'Approved') setNotification({ message: `Your tool order #${order.id.slice(-6)} has been APPROVED!`, type: 'success' });
             else if (order.status === 'Rejected') setNotification({ message: `Tool order #${order.id.slice(-6)} was rejected.`, type: 'error' });
          }
        });
      }
      prevToolOrdersRef.current = newOrders;
      setToolOrderHistory(newOrders);
    });
    return () => unsub();
  }, [user]);

  const acceptJob = async (job: any) => {
    if (currentJob) {
      alert("⚠️ ACTIVE PROTOCOL: You cannot accept new assignments while a service is in progress.");
      return;
    }
    try {
      await axios.post(`${API_BASE}/api/bookings/update-status`, {
        bookingId: job.id,
        status: "Accepted",
        technicianId: user?.uid,
        technicianName: profile.name || "Technician",
      });
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to accept job.");
    }
  };

  const acceptBroadcast = async (broadcastId: string) => {
    if (currentJob) {
      alert("⚠️ ACTIVE PROTOCOL: You cannot accept new assignments while a service is in progress.");
      return;
    }
    try {
      const res = await axios.post(`${API_BASE}/api/bookings/accept-broadcast`, {
        bookingId: broadcastId,
        technicianId: user?.uid,
        technicianName: profile?.name || "Technician",
        technicianAvatar: profile?.avatar || null,
        technicianPhone: profile?.phone || null,
        technicianRating: profile?.rating || 5.0
      });
      
      if (res.data.success) {
        setNotification({ message: "Broadcast accepted successfully! Starting job.", type: 'success' });
        // Immediately emit socket event to notify customer — include full profile for popup
        if (socketRef.current) {
          socketRef.current.emit("broadcast_accepted", {
            bookingId: broadcastId,
            technicianId: user?.uid,
            technicianName: profile?.name || "Technician",
            technicianAvatar: profile?.avatar || null,
            technicianPhone: profile?.phone || null,
            technicianRating: profile?.rating || 5.0
          });
          // Join the booking room for live tracking
          socketRef.current.emit('join_booking', { bookingId: broadcastId });
        }
        // Remove from available broadcasts
        setAvailableBroadcasts((prev) => prev.filter(b => b.id !== broadcastId));
        // Refresh tech data
        fetchTechData(user?.uid);
      }
    } catch (e: any) {
      const errorMsg = e.response?.data?.error || "Failed to accept broadcast.";
      setNotification({ message: errorMsg, type: 'error' });
      setAvailableBroadcasts((prev) => prev.filter(b => b.id !== broadcastId));
      
      if (errorMsg.includes("Subscription limit reached") || errorMsg.includes("upgrade your plan")) {
        setTimeout(() => {
          router.push('/technician/subscription');
        }, 1500);
      }
    }
  };

  const declineJob = async (jobId: string) => {
    try {
      await axios.post(`${API_BASE}/api/bookings/decline`, {
        bookingId: jobId,
        technicianId: user?.uid,
        technicianName: profile.name || "Technician",
      });
    } catch (e) {
      alert("Failed to decline job.");
    }
  };

  const updateJobStatus = async (status: string) => {
    if (!currentJob) return;
    try {
      await axios.post(`${API_BASE}/api/bookings/update-status`, {
        bookingId: currentJob.id,
        status,
      });
      setJobStatus(status);
      if (socket) {
        socket.emit("status_update", { bookingId: currentJob.id, status });
      }
    } catch (e) {
      alert("Status update failed.");
    }
  };

  const markNotificationRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notifId), { read: true });
    } catch (e) {
      console.error("Failed to mark notification read", e);
    }
  };

  const handleSignOut = async (router: any) => {
    // REMOVED: Automatic offline on logout.
    // Persistent Online status allows technicians to be booked even when logged out.
    await signOut(auth);
    router.push("/");
  };

  return {
    user,
    profile,
    setProfile,
    activeJobs,
    currentJob,
    setCurrentJob,
    jobStatus,
    setJobStatus,
    orderHistory,
    declinedJobs,
    socket,
    techLocation,
    setTechLocation,
    customerLocation,
    transactions,
    toolOrderHistory,
    notification,
    setNotification,
    availableBroadcasts,
    missedBroadcast,
    setMissedBroadcast,
    cancelledBooking,
    setCancelledBooking,
    fetchTechData,
    acceptJob,
    acceptBroadcast,
    declineJob,
    updateJobStatus,
    bellNotifications,
    setBellNotifications,
    markNotificationRead,
    handleSignOut
  };
}
