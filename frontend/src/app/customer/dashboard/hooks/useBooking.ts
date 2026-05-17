
// REBUILD_TRIGGER: 2026-05-07_01
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_BASE, RAZORPAY_KEY_ID } from '@/lib/config';
import { AnalysisResult, Technician } from '../types';
import { Socket } from 'socket.io-client';
import { calculateTechnicianRank } from '@/app/services/aiRankingEngine';

interface UseBookingProps {
  userId: string | null;
  socketRef: React.MutableRefObject<Socket | null>;
  socketInstance?: Socket | null;
  coords: { lat: number; lng: number } | null;
  setCoords: (coords: { lat: number; lng: number } | null) => void;
  userProfile: any;
}

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
                estimatedCostRange: pendingBroadcast.estimatedCostRange || '₹300 - ₹900',
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
        formData.append('image', imageFile);
        formData.append('userText', textToAnalyze);
        res = await axios.post(`${API_BASE}/api/ai/analyze-image`, formData);
        
        if (res.data.success) {
          const visionData = res.data.data;
          if (visionData.category === 'INVALID') {
            alert('Service request not recognized from the image. Please describe the issue in text or try a different photo.');
            setAnalyzing(false);
            return;
          }
          setAnalysisResult({
            category: (visionData.category || visionData.service || 'general_maintenance'),
            urgency: (visionData.urgency || 'medium').charAt(0).toUpperCase() + (visionData.urgency || 'medium').slice(1),
            estimatedCostRange: visionData.estimatedCostRange || visionData.priceEstimate || '₹300 - ₹900', 
            summary: visionData.summary || visionData.problem || 'Visual analysis completed.',
            recommendedMaterials: visionData.materials || [visionData.solution || 'Consult the technician upon arrival'],
            serviceSpecs: visionData.serviceSpecs,
            technicalTerms: visionData.technicalTerms
          });
        }
      } else {
        res = await axios.post(`${API_BASE}/api/ai/parse-issue`, { issueText: textToAnalyze });
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
        
        const res = await axios.post(`${API_BASE}/api/ai/analyze-image`, formData);
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
            estimatedCostRange: visionData.estimatedCostRange || visionData.priceEstimate || '₹300 - ₹900', 
            summary: visionData.summary || visionData.problem || 'Visual analysis completed.',
            recommendedMaterials: visionData.materials || [visionData.solution || 'Consult the technician upon arrival']
          });
          
          const origin = coords || { lat: 37.7749, lng: -122.4194 };
          const search = await axios.post(`${API_BASE}/api/bookings/search`, {
            category: (visionData.category || visionData.service || 'general_maintenance'),
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

      const getDynamicAmount = () => {
        const range = analysisResult?.estimatedCostRange;
        if (range) {
          const firstPart = range.split('-')[0].replace(/[^\d]/g, '');
          const parsed = parseFloat(firstPart);
          if (!isNaN(parsed) && parsed > 0) return parsed;
        }
        return 499;
      };

      const amount = getDynamicAmount();
      const orderRes = await axios.post(`${API_BASE}/api/payments/create-order`, {
        amount,
        currency: 'INR',
        receipt: `bk_${Date.now()}`,
      });

      const key = orderRes.data.keyId || RAZORPAY_KEY_ID;
      const order = orderRes.data.order;

      if (orderRes.data.mock || !window.Razorpay || !key) {
        await createBookingRecord('pay_now');
        setAnalyzing(false);
        return;
      }

      const Rzp = (window as any).Razorpay;
      if (!Rzp) throw new Error('Razorpay script not loaded');
      const rzp = new Rzp({
        key,
        amount: order.amount,
        currency: order.currency || 'INR',
        order_id: order.id,
        name: 'FIXNOW',
        description: 'Service booking',
        handler: async () => {
          await createBookingRecord('pay_now');
        },
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      alert('Payment or booking failed.');
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
