
// REBUILD_TRIGGER: 2026-05-07_01
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_BASE, RAZORPAY_KEY_ID } from '@/lib/config';
import { AnalysisResult, Technician } from '../types';
import { Socket } from 'socket.io-client';
import { calculateTechnicianRank } from '@/server/ai/agents/aiRankingEngine';
import loadRazorpay from '@/lib/loadRazorpay';

interface UseBookingProps {
  userId: string | null;
  socketRef: React.MutableRefObject<Socket | null>;
  socketInstance?: Socket | null;
  coords: { lat: number; lng: number } | null;
  setCoords: (coords: { lat: number; lng: number } | null) => void;
  userProfile: any;
}

const getRealisticCostRange = (category: string): string => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('plumb')) return '₹300 - ₹1,200';
  if (cat.includes('electric')) return '₹400 - ₹1,500';
  if (cat.includes('ac ') || cat.includes('hvac')) return '₹500 - ₹2,500';
  if (cat.includes('appliance') || cat.includes('washing') || cat.includes('refrigerat')) return '₹500 - ₹2,000';
  if (cat.includes('carpenter') || cat.includes('carpentry')) return '₹400 - ₹2,000';
  if (cat.includes('paint')) return '₹2,000 - ₹15,000';
  if (cat.includes('clean')) return '₹800 - ₹3,000';
  if (cat.includes('pest')) return '₹800 - ₹2,500';
  if (cat.includes('pack') || cat.includes('mov')) return '₹1,500 - ₹8,000';
  if (cat.includes('car') || cat.includes('bike')) return '₹500 - ₹4,000';
  return '₹300 - ₹1,000';
};

export type BroadcastStatus = 'idle' | 'waiting' | 'accepted' | 'expired' | 'cancelled';

export interface BroadcastAcceptedTech {
  id: string;
  name: string;
  avatar?: string | null;
  phone?: string | null;
  rating?: number;
}

const BROADCAST_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export function useBooking({ userId, socketRef, socketInstance, coords, setCoords, userProfile }: UseBookingProps) {
  const [issueText, setIssueText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [matchedTechs, setMatchedTechs] = useState<Technician[]>([]);
  const [bookingConfirmation, setBookingConfirmation] = useState<Record<string, any> | null>(null);
  const [bookingStep, setBookingStep] = useState<'input' | 'confirm' | 'done'>('input');
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);

  // ── Broadcast booking state ──
  const [broadcastStatus, setBroadcastStatus] = useState<BroadcastStatus>('idle');
  const [broadcastBookingId, setBroadcastBookingId] = useState<string | null>(null);
  const [broadcastAcceptedTech, setBroadcastAcceptedTech] = useState<BroadcastAcceptedTech | null>(null);
  const [broadcastTimerEnd, setBroadcastTimerEnd] = useState<number | null>(null);
  const [showAcceptedPopup, setShowAcceptedPopup] = useState(false);
  const broadcastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Legacy compat
  const isWaitingForBroadcast = broadcastStatus === 'waiting';

  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [serviceTime, setServiceTime] = useState('');

  useEffect(() => {
    setServiceTime(new Date().toLocaleString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }));
  }, []);

  useEffect(() => {
    if (userProfile?.name) {
      setCustomerName(userProfile.name);
    }
  }, [userProfile]);
  const [paymentMethod, setPaymentMethod] = useState<'now' | 'later'>('now');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // ── Socket listeners for broadcast events ──
  useEffect(() => {
    const socket = socketInstance || socketRef.current;
    if (!socket) return;

    const handleStatusUpdate = (data: any) => {
      if (bookingConfirmation && data.bookingId === bookingConfirmation.id) {
        setBookingConfirmation(prev => prev ? { ...prev, status: data.status } : null);
      }
    };

    const handleBroadcastAccepted = (data: any) => {
      if (broadcastBookingId && data.bookingId === broadcastBookingId) {
        // console.log('✅ Broadcast accepted by tech:', data.technicianName);
        
        // Clear the timeout timer
        if (broadcastTimeoutRef.current) {
          clearTimeout(broadcastTimeoutRef.current);
          broadcastTimeoutRef.current = null;
        }

        // Set accepted technician info
        const techInfo: BroadcastAcceptedTech = {
          id: data.technicianId,
          name: data.technicianName || 'Expert',
          avatar: data.technicianAvatar || null,
          phone: data.technicianPhone || null,
          rating: data.technicianRating || 5.0
        };

        setBroadcastAcceptedTech(techInfo);
        setBroadcastStatus('accepted');
        setBroadcastTimerEnd(null);
        setShowAcceptedPopup(true);

        // INSTANT LIVE LOCATION SHARING
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const liveLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setCoords(liveLoc);
              if (socketRef.current) {
                socketRef.current.emit('customer_update_location', {
                  bookingId: data.bookingId,
                  location: liveLoc,
                  customerId: userId || 'GUEST'
                });
              }
            },
            (err) => console.warn('Instant geolocation failed:', err),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        }

        // Update booking confirmation with tech info
        setBookingConfirmation(prev => prev ? {
          ...prev,
          status: 'Accepted',
          technicianId: data.technicianId,
          technicianName: data.technicianName,
          technicianAvatar: data.technicianAvatar,
          technicianPhone: data.technicianPhone,
          technicianRating: data.technicianRating
        } : {
          id: data.bookingId,
          status: 'Accepted',
          category: analysisResult?.category || 'General',
          customerName: 'Customer',
          paymentStatus: 'Unpaid',
          paymentMode: 'pay_later',
          technicianId: data.technicianId,
          technicianName: data.technicianName
        });
      }
    };

    socket.on('status_update', handleStatusUpdate);
    socket.on('broadcast_accepted', handleBroadcastAccepted);

    return () => {
      socket.off('status_update', handleStatusUpdate);
      socket.off('broadcast_accepted', handleBroadcastAccepted);
    };
  }, [socketInstance, socketRef, bookingConfirmation, broadcastBookingId, analysisResult]);

  // ── Cleanup broadcast timeout on unmount ──
  useEffect(() => {
    return () => {
      if (broadcastTimeoutRef.current) {
        clearTimeout(broadcastTimeoutRef.current);
      }
    };
  }, []);

  // ── Re-login: restore broadcast state from pending bookings ──
  useEffect(() => {
    if (!userId || broadcastStatus !== 'idle') return;

    const restoreBroadcastState = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/bookings/customer/${userId}`);
        if (!res.data.success) return;
        
        const bookings = res.data.bookings || [];
        
        // Find any pending broadcast booking (technicianId === 'broadcast' and status === 'Pending')
        const pendingBroadcast = bookings.find(
          (b: any) => (b.technicianId === 'broadcast' || b.technician_id === 'broadcast') && 
                      (b.status === 'Pending' || b.booking_status === 'Pending')
        );
        
        if (pendingBroadcast) {
          const createdAt = new Date(pendingBroadcast.created_at || pendingBroadcast.createdAt).getTime();
          const elapsed = Date.now() - createdAt;
          const remaining = BROADCAST_TIMEOUT_MS - elapsed;
          
          if (remaining > 0) {
            // Still within timeout — restore waiting state
            setBroadcastBookingId(pendingBroadcast.id);
            setBookingConfirmation(pendingBroadcast);
            setBroadcastStatus('waiting');
            setBroadcastTimerEnd(Date.now() + remaining);
            
            // Restore analysis result from booking data
            if (pendingBroadcast.category) {
              setAnalysisResult({
                category: pendingBroadcast.category,
                urgency: pendingBroadcast.urgency || 'Medium',
                estimatedCostRange: pendingBroadcast.estimatedCostRange || getRealisticCostRange(pendingBroadcast.category),
                summary: pendingBroadcast.issueDescription || '',
                recommendedMaterials: pendingBroadcast.recommendedMaterials || []
              });
            }
            
            // Join the booking room
            if (socketRef.current) {
              socketRef.current.emit('join_booking', { bookingId: pendingBroadcast.id });
            }
            
            // Set timeout for remaining time
            broadcastTimeoutRef.current = setTimeout(async () => {
              setBroadcastStatus('expired');
              setBroadcastTimerEnd(null);
              try {
                await axios.post(`${API_BASE}/api/bookings/update-status`, {
                  bookingId: pendingBroadcast.id,
                  status: 'Cancelled'
                });
                if (socketRef.current) {
                  socketRef.current.emit('broadcast_closed', { bookingId: pendingBroadcast.id });
                }
              } catch (e) {
                console.error('Failed to cancel expired broadcast', e);
              }
            }, remaining);
          } else {
            // Expired — cancel it
            setBroadcastStatus('expired');
            try {
              await axios.post(`${API_BASE}/api/bookings/update-status`, {
                bookingId: pendingBroadcast.id,
                status: 'Cancelled'
              });
            } catch (e) {
              console.error('Failed to cancel expired broadcast', e);
            }
          }
          return;
        }
        
        // Check if there's a recently accepted broadcast booking
        const acceptedBroadcast = bookings.find(
          (b: any) => (b.accepted_at || b.acceptedAt) && 
                      (b.status === 'Accepted' || b.booking_status === 'Accepted') && 
                      (b.technician_id || b.technicianId) !== 'broadcast'
        );
        
        if (acceptedBroadcast) {
          const acceptedTime = new Date(acceptedBroadcast.accepted_at || acceptedBroadcast.acceptedAt).getTime();
          const timeSinceAccepted = Date.now() - acceptedTime;
          
          // Show acceptance popup only if accepted within the last 2 minutes
          if (timeSinceAccepted < 120000) {
            setBroadcastBookingId(acceptedBroadcast.id);
            setBookingConfirmation(acceptedBroadcast);
            setBroadcastStatus('accepted');
            
            // Resolve avatar
            let bAvatar = acceptedBroadcast.technician_avatar || acceptedBroadcast.technicianAvatar || null;
            if (bAvatar && !bAvatar.startsWith('http') && !bAvatar.startsWith('data:')) {
              bAvatar = `${API_BASE}${bAvatar}`;
            }

            setBroadcastAcceptedTech({
              id: acceptedBroadcast.technician_id || acceptedBroadcast.technicianId,
              name: acceptedBroadcast.technician_name || acceptedBroadcast.technicianName || 'Expert',
              avatar: bAvatar,
              phone: acceptedBroadcast.technician_phone || acceptedBroadcast.technicianPhone || null,
              rating: acceptedBroadcast.technician_rating || acceptedBroadcast.technicianRating || 5.0
            });
            setShowAcceptedPopup(true);
            
            if (socketRef.current) {
              socketRef.current.emit('join_booking', { bookingId: acceptedBroadcast.id });
            }
          }
        }
      } catch (err) {
        console.error('Failed to restore broadcast state:', err);
      }
    };

    // Small delay to ensure socket is connected
    const timer = setTimeout(restoreBroadcastState, 1000);
    return () => clearTimeout(timer);
  }, [userId]);

  // Helper to downscale image to prevent VLM CPU overload
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 512;
          const MAX_HEIGHT = 512;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas conversion failed'));
          }, 'image/jpeg', 0.8);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleAnalyze = async (explicitText?: string) => {
    const textToAnalyze = typeof explicitText === 'string' ? explicitText : issueText;
    if (!textToAnalyze.trim() && !imageFile) return;
    setAnalyzing(true);
    setAnalysisResult(null);
    setMatchedTechs([]);
    try {
      let res;
      if (imageFile) {
        const formData = new FormData();
        
        // Compress image before sending to massively speed up local CPU inference
        const compressedBlob = await compressImage(imageFile);
        formData.append('image', compressedBlob, 'upload.jpg');
        
        formData.append('userText', textToAnalyze);
        res = await axios.post(`${API_BASE}/api/ai/analyze-image`, formData, { timeout: 180000 });
        
        if (res.data.success) {
          const visionData = res.data.data;
          if (visionData.category === 'INVALID') {
            alert('Service request not recognized from the image. Please describe the issue in text or try a different photo.');
            setAnalyzing(false);
            return;
          }
          setAnalysisResult({
            category: (visionData.category || visionData.service || 'general_maintenance'),
            urgency: (visionData.urgency || visionData.severity || 'medium').charAt(0).toUpperCase() + (visionData.urgency || visionData.severity || 'medium').slice(1),
            estimatedCostRange: visionData.estimatedCostRange || visionData.priceEstimate || getRealisticCostRange(visionData.category || visionData.service), 
            summary: visionData.summary || visionData.problem || 'Visual analysis completed.',
            recommendedMaterials: visionData.requiredMaterials || visionData.materials || [],
            requiredTools: visionData.requiredTools || [],
            requiredMaterials: visionData.requiredMaterials || [],
            recommendedRepair: visionData.solution || visionData.problem || 'Specialized assessment and repair needed',
            serviceSpecs: visionData.serviceSpecs || visionData.estimatedRepairTime,
            technicalTerms: visionData.technicalTerms || visionData.possibleCauses,
            confidence: visionData.confidence
          });
        }
      } else {
        res = await axios.post(`/api/ai/parse-issue`, { issueText: textToAnalyze });
        if (res.data.success) {
          if (res.data.data.category === 'INVALID') {
            alert('Service request not recognized. Please describe a specific repair or maintenance issue (e.g., "Leaking tap", "AC not cooling").');
            setAnalyzing(false);
            return;
          }
          setAnalysisResult(res.data.data as AnalysisResult);
        }
      }

      if (res?.data?.success) {
        const result = res.data.success && imageFile ? 
            { category: (res.data.data.category || res.data.data.service || 'general_maintenance') } : 
            res.data.data;
            
        const origin = coords || { lat: 37.7749, lng: -122.4194 };
        // Send both the AI-parsed category and the original text for robust matching
        const searchCategory = result.category || textToAnalyze;
        const search = await axios.post(`${API_BASE}/api/bookings/search`, {
          category: searchCategory,
          customerLat: origin.lat,
          customerLng: origin.lng,
        });
        if (search.data.success) {
          let techs = search.data.technicians || [];
          // If AI category returned no results, retry with the raw issue text
          if (techs.length === 0 && result.category && result.category !== textToAnalyze) {
            const fallbackSearch = await axios.post(`${API_BASE}/api/bookings/search`, {
              category: textToAnalyze,
              customerLat: origin.lat,
              customerLng: origin.lng,
            });
            if (fallbackSearch.data.success) {
              techs = fallbackSearch.data.technicians || [];
            }
          }
          
          // Normalize avatars and fetch ML scores
          const techsWithScore = await Promise.all(techs.map(async (t: any) => {
            if (t.avatar && !t.avatar.startsWith('http') && !t.avatar.startsWith('data:')) {
              t.avatar = `${API_BASE}${t.avatar}`;
            }
            
            // Parse distance
            let distKm = 5;
            if (typeof t.distance === 'string') {
              const parsed = parseFloat(t.distance.replace(/[^\d.]/g, ''));
              if (!isNaN(parsed)) {
                 distKm = t.distance.toLowerCase().includes('km') ? parsed : (t.distance.toLowerCase().includes('m') ? parsed / 1000 : parsed);
              }
            } else if (typeof t.distance === 'number') {
              distKm = t.distance;
            }

            const budget = 500; // default assumption
            const rank = await calculateTechnicianRank({
              technician: t,
              jobEmbedding: null,
              technicianEmbedding: null,
              distanceKm: distKm,
              customerBudget: budget
            });
            
            return {
              ...t,
              xgbScore: rank.xgbScore,
              totalScore: rank.totalScore
            };
          }));
          
          // Sort by total ML score
          techsWithScore.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
          setMatchedTechs(techsWithScore);
        }
      }
    } catch (err: unknown) {
      console.error(err);
      alert('AI service error. Please try describing the issue in text.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Basic validation
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('Image is too large. Please upload an image smaller than 10MB.');
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      
      setAnalyzing(true);
      setAnalysisResult(null);
      setMatchedTechs([]);
      try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('userText', issueText);
        
        const res = await axios.post(`/api/ai/analyze-image`, formData);
        if (res.data.success) {
          const visionData = res.data.data;
          if (visionData.category === 'INVALID') {
            alert('Service request not recognized from the image. Please upload a clear photo of the issue or describe it in text.');
            setAnalyzing(false);
            return;
          }
          setAnalysisResult({
            category: (visionData.category || visionData.service || 'general_maintenance'),
            urgency: (visionData.urgency || 'medium').charAt(0).toUpperCase() + (visionData.urgency || 'medium').slice(1),
            estimatedCostRange: visionData.estimatedCostRange || visionData.priceEstimate || getRealisticCostRange(visionData.category || visionData.service), 
            summary: visionData.summary || visionData.problem || 'Visual analysis completed.',
            recommendedMaterials: visionData.requiredMaterials || visionData.materials || [],
            requiredTools: visionData.requiredTools || [],
            requiredMaterials: visionData.requiredMaterials || [],
            recommendedRepair: visionData.solution || visionData.problem || 'Specialized assessment and repair needed',
            confidence: visionData.confidence,
            documentDetails: visionData.documentDetails
          });
          
          const origin = coords || { lat: 37.7749, lng: -122.4194 };
          const searchCategory = visionData.category === 'Document / Invoice' && visionData.documentDetails?.recommendedTechnicianCategory 
            ? visionData.documentDetails.recommendedTechnicianCategory 
            : (visionData.category || visionData.service || 'general_maintenance');

          const search = await axios.post(`${API_BASE}/api/bookings/search`, {
            category: searchCategory,
            customerLat: origin.lat,
            customerLng: origin.lng,
          });
          if (search.data.success) {
            let techs = search.data.technicians || [];
            const techsWithScore = await Promise.all(techs.map(async (t: any) => {
              if (t.avatar && !t.avatar.startsWith('http') && !t.avatar.startsWith('data:')) {
                t.avatar = `${API_BASE}${t.avatar}`;
              }

              let distKm = 5;
              if (typeof t.distance === 'string') {
                const parsed = parseFloat(t.distance.replace(/[^\d.]/g, ''));
                if (!isNaN(parsed)) {
                   distKm = t.distance.toLowerCase().includes('km') ? parsed : (t.distance.toLowerCase().includes('m') ? parsed / 1000 : parsed);
                }
              } else if (typeof t.distance === 'number') {
                distKm = t.distance;
              }

              const budget = 500;
              const rank = await calculateTechnicianRank({
                technician: t,
                jobEmbedding: null,
                technicianEmbedding: null,
                distanceKm: distKm,
                customerBudget: budget
              });

              return {
                ...t,
                xgbScore: rank.xgbScore,
                totalScore: rank.totalScore
              };
            }));
            
            techsWithScore.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
            setMatchedTechs(techsWithScore);
          }
        }
      } catch (err: unknown) {
        console.error(err);
        alert('AI service error. Please try describing the issue in text.');
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const selectTechnician = (tech: Technician) => {
    setSelectedTech(tech);
    setBookingStep('confirm');
  };

  const createBookingRecord = async (paymentMode: 'pay_now' | 'pay_later') => {
    const origin = coords || { lat: 37.7749, lng: -122.4194 };
    const res = await axios.post(`${API_BASE}/api/bookings/create`, {
      customerId: userId || 'guest',
      technicianId: selectedTech?.id,
      category: analysisResult?.category,
      estimatedCostRange: analysisResult?.estimatedCostRange,
      serviceSpecs: analysisResult?.serviceSpecs,
      technicalTerms: analysisResult?.technicalTerms,
      customerName,
      address,
      contactNumber,
      serviceTime,
      paymentMode,
      customerLat: origin.lat,
      customerLng: origin.lng,
    });
    if (res.data.success) {
      setBookingConfirmation(res.data.booking);
      setBookingStep('done');
      const sock = socketRef.current;
      if (sock) {
        sock.emit('new_order', res.data.booking);
        sock.emit('join_booking', { bookingId: res.data.bookingId });
      }
    }
  };

  const confirmBooking = async () => {
    if (!address.trim() || !contactNumber.trim()) {
      alert('Please enter service address and contact number.');
      return;
    }
    setAnalyzing(true);
    try {
      if (paymentMethod === 'later') {
        await createBookingRecord('pay_later');
        setAnalyzing(false);
        return;
      }

      // ==========================================
      // PRODUCTION BOOKING FLOW (PRE-BOOKING PAY)
      // ==========================================
      
      const origin = coords || { lat: 37.7749, lng: -122.4194 };
      
      const estimatedCostRange =
        analysisResult?.estimatedCostRange ??
        (
          (analysisResult as any)?.estimatedCostMin &&
          (analysisResult as any)?.estimatedCostMax
            ? `${(analysisResult as any).estimatedCostMin}-${(analysisResult as any).estimatedCostMax}`
            : "499-999"
        );

      const bookingPayload = {
        customerId: userId || 'guest',
        technicianId: selectedTech?.id,
        technicianName: selectedTech?.name,
        category: analysisResult?.category,
        estimatedCostRange,
        serviceSpecs: analysisResult?.serviceSpecs,
        technicalTerms: analysisResult?.technicalTerms,
        customerName,
        address,
        contactNumber,
        serviceTime,
        paymentMode: 'pay_now',
        customerLat: origin.lat,
        customerLng: origin.lng,
      };

      console.log("BOOKING PAYLOAD");
      console.log(bookingPayload);
      console.log("analysisResult", analysisResult);

      // 1. Create Razorpay order BEFORE booking creation
      const orderRes = await axios.post(`${API_BASE}/api/payment/create-booking-order`, bookingPayload);

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || 'Failed to create payment order');
      }

      const key = orderRes.data.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const orderId = orderRes.data.orderId;
      const amount = orderRes.data.amount;
      const currency = orderRes.data.currency || 'INR';

      console.log("window.Razorpay =", (window as any).Razorpay);
      console.log("key =", key);

      const loaded = await loadRazorpay();

      if (!loaded) {
        alert("Unable to load Razorpay Checkout");
        setAnalyzing(false);
        return;
      }

      if (!(window as any).Razorpay) {
        alert("SDK Missing");
        setAnalyzing(false);
        return;
      }

      if (!key) {
        alert("Key Missing");
        setAnalyzing(false);
        return;
      }

      const Rzp = (window as any).Razorpay;
      const rzp = new Rzp({
        key,
        amount,
        currency,
        order_id: orderId,
        name: 'FIXNOW',
        description: 'Service booking',
        handler: async (response: any) => {
          try {
            // 2. Verify payment and create booking on backend
            const verifyRes = await axios.post(`${API_BASE}/api/payment/verify-booking`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingPayload
            });
            
            if (verifyRes.data.success) {
              const newBooking = verifyRes.data.booking;
              setBookingConfirmation(newBooking);
              setBookingStep('done');
              
              // No need to emit 'new_order' if assigned directly to specific tech
              // Backend emits 'new_assigned_booking' directly to tech's private room.
              const sock = socketRef.current;
              if (sock) {
                sock.emit('join_booking', { bookingId: newBooking.id });
              }
            } else {
              alert('Payment verification failed');
            }
          } catch (e) {
            console.error('Verify error', e);
            alert('Payment verification error');
          }
        },
      });
      
      rzp.on('payment.failed', function (response: any){
        alert("Payment Failed: " + response.error.description);
      });
      
      rzp.open();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || err.message || 'Payment or booking failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const createBroadcastBooking = async () => {
    if (!analysisResult) return;
    setAnalyzing(true);

    try {
      const origin = coords || { lat: 37.7749, lng: -122.4194 };
      const payload = {
        customerId: userId || 'GUEST_' + Date.now(),
        customerName: customerName || 'Valued Customer',
        contactNumber,
        address,
        customerLat: origin.lat,
        customerLng: origin.lng,
        issueDescription: issueText,
        category: analysisResult.category,
        urgency: analysisResult.urgency,
        estimatedCostRange: analysisResult.estimatedCostRange,
        recommendedMaterials: analysisResult.recommendedMaterials,
        technicianId: 'broadcast', // Explicit broadcast flag
        technicianName: 'Pending Expert',
        status: 'Pending',
        serviceTime: 'As soon as possible',
        paymentMode: 'pay_later', // Always pay after service for broadcast
        paymentStatus: 'Unpaid'
      };

      const res = await axios.post(`${API_BASE}/api/bookings/create`, payload);
      if (res.data.success) {
        const newBooking = res.data.booking;
        setBookingConfirmation(newBooking);
        setBroadcastBookingId(newBooking.id);

        // Set broadcast waiting state with timer
        const timerEnd = Date.now() + BROADCAST_TIMEOUT_MS;
        setBroadcastStatus('waiting');
        setBroadcastTimerEnd(timerEnd);

        // Join the booking room immediately so we get broadcast_accepted events
        if (socketRef.current) {
          socketRef.current.emit('join_booking', { bookingId: newBooking.id });

          // Broadcast to all technicians with rich data
          socketRef.current.emit('broadcast_booking', {
            bookingId: newBooking.id,
            category: analysisResult.category,
            customerLocation: origin,
            address: address || 'Location pending',
            urgency: analysisResult.urgency,
            estimatedCostRange: analysisResult.estimatedCostRange,
            customerName: 'Customer',
            issueDescription: issueText
          });
        }

        // Set 10-minute timeout
        broadcastTimeoutRef.current = setTimeout(async () => {
          setBroadcastStatus('expired');
          setBroadcastTimerEnd(null);
          // Cancel the broadcast booking
          try {
            await axios.post(`${API_BASE}/api/bookings/update-status`, {
              bookingId: newBooking.id,
              status: 'Cancelled'
            });
            if (socketRef.current) {
              socketRef.current.emit('broadcast_closed', { bookingId: newBooking.id });
            }
          } catch (e) {
            console.error('Failed to cancel broadcast booking on timeout', e);
          }
        }, BROADCAST_TIMEOUT_MS);
      }

    } catch (e) {
      alert('Failed to broadcast booking.');
      setBroadcastStatus('idle');
    } finally {
      setAnalyzing(false);
    }
  };

  const cancelBroadcast = async () => {
    if (!broadcastBookingId) return;
    
    // Clear timeout
    if (broadcastTimeoutRef.current) {
      clearTimeout(broadcastTimeoutRef.current);
      broadcastTimeoutRef.current = null;
    }

    setBroadcastStatus('cancelled');
    setBroadcastTimerEnd(null);

    try {
      await axios.post(`${API_BASE}/api/bookings/update-status`, {
        bookingId: broadcastBookingId,
        status: 'Cancelled'
      });
      if (socketRef.current) {
        socketRef.current.emit('broadcast_closed', { bookingId: broadcastBookingId });
      }
    } catch (e) {
      console.error('Failed to cancel broadcast', e);
    }
  };

  const resetBroadcast = () => {
    setBroadcastStatus('idle');
    setBroadcastBookingId(null);
    setBroadcastAcceptedTech(null);
    setBroadcastTimerEnd(null);
    setShowAcceptedPopup(false);
    setBookingConfirmation(null);
  };

  const dismissAcceptedPopup = () => {
    setShowAcceptedPopup(false);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setAnalyzing(false);
  };

  return {
    issueText, setIssueText,
    analyzing, setAnalyzing,
    analysisResult, setAnalysisResult,
    matchedTechs, setMatchedTechs,
    bookingConfirmation, setBookingConfirmation,
    bookingStep, setBookingStep,
    selectedTech, setSelectedTech,
    address, setAddress,
    contactNumber,
    setContactNumber,
    customerName,
    setCustomerName,
    serviceTime,
    setServiceTime,
    paymentMethod, setPaymentMethod,
    imageFile, setImageFile,
    imagePreview, setImagePreview,
    // Broadcast state
    isWaitingForBroadcast,
    broadcastStatus,
    broadcastBookingId,
    broadcastAcceptedTech,
    broadcastTimerEnd,
    showAcceptedPopup,
    // Broadcast actions
    handleAnalyze,
    handleImageChange,
    selectTechnician,
    confirmBooking,
    createBookingRecord,
    createBroadcastBooking,
    cancelBroadcast,
    resetBroadcast,
    dismissAcceptedPopup,
    removeImage
  };
}
