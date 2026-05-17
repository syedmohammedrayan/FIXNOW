// REBUILD_TRIGGER: 2026-05-07_01
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';


const BookingHistory = dynamic(() => import('@/components/customer/BookingHistory'), { ssr: false });
const AnalysisResultView = dynamic(() => import('./components/AnalysisResultView'), { ssr: false });
const BroadcastAcceptedPopup = dynamic(() => import('./components/BroadcastAcceptedPopup'), { ssr: false });
const TechnicianList = dynamic(() => import('./components/TechnicianList'), { ssr: false });
const BookingForm = dynamic(() => import('./components/BookingForm'), { ssr: false });
const SuccessState = dynamic(() => import('./components/SuccessState'), { ssr: false });
const AccountDeletionModal = dynamic(() => import('./components/AccountDeletionModal'), { ssr: false });
const PaymentSuccessCelebration = dynamic(() => import('./components/PaymentSuccessCelebration'), { ssr: false });
const MaintenanceLogs = dynamic(() => import('./components/MaintenanceLogs'), { ssr: false });
const ServiceCatalog = dynamic(() => import('./components/ServiceCatalog'), { ssr: false });
const AITriagePanel = dynamic(() => import('./components/AITriagePanel'), { ssr: false });
const DashboardHeader = dynamic(() => import('./components/DashboardHeader'), { ssr: false });
const StatusBanners = dynamic(() => import('./components/StatusBanners'), { ssr: false });

import { SOCKET_URL } from '@/lib/config';
import { io, Socket } from 'socket.io-client';
import { Notification, Reminder } from './types';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';

import { auth } from '@/lib/firebase';
import { useDashboardData } from './hooks/useDashboardData';
import { useBooking } from './hooks/useBooking';

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

const LANGS: { code: string; label: string }[] = [
  { code: 'en-US', label: 'English' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam' },
  { code: 'bn-IN', label: 'Bengali' },
  { code: 'gu-IN', label: 'Gujarati' },
  { code: 'mr-IN', label: 'Marathi' },
  { code: 'pa-IN', label: 'Punjabi' },
  { code: 'or-IN', label: 'Odia' }
];

export default function CustomerDashboard() {
  const { currentKey, rotateKey } = useGoogleMapsKey();
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const recognitionRef = useRef<any>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [voiceLang, setVoiceLang] = useState('en-US');
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isListening, setIsListening] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showLangMenuVoice, setShowLangMenuVoice] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  const addressInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  const {
    userId,
    userProfile,
    notifications,
    reminders,
    activeJob,
    showPaymentSuccess: paymentSuccessState,
    markNotifRead,
    markAllRead,
    handleSignOut,
    handleDeleteAccount,
    handleAvatarUpload,
    handleAvatarDelete
  } = useDashboardData();

  useEffect(() => {
    if (userId === null) {
      // Check again after a short delay to ensure auth had time to init
      const timeout = setTimeout(() => {
        if (!auth.currentUser) {
          router.push('/auth/login?role=customer');
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [userId, router]);

  const {
    issueText, setIssueText,
    analyzing, setAnalyzing,
    analysisResult, setAnalysisResult,
    matchedTechs, setMatchedTechs,
    bookingConfirmation, setBookingConfirmation,
    bookingStep, setBookingStep,
    selectedTech, setSelectedTech,
    address, setAddress,
    contactNumber, setContactNumber,
    customerName, setCustomerName,
    serviceTime, setServiceTime,
    paymentMethod, setPaymentMethod,
    imageFile, setImageFile,
    imagePreview, setImagePreview,
    isWaitingForBroadcast,
    broadcastStatus,
    broadcastBookingId,
    broadcastAcceptedTech,
    broadcastTimerEnd,
    showAcceptedPopup,
    handleAnalyze,
    handleImageChange,
    selectTechnician,
    confirmBooking,
    createBroadcastBooking,
    cancelBroadcast,
    resetBroadcast,
    dismissAcceptedPopup,
    removeImage
  } = useBooking({ userId, socketRef, socketInstance, coords, setCoords, userProfile });

  const [urgentReminders, setUrgentReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    if (!Array.isArray(reminders)) {
      setUrgentReminders([]);
      return;
    }
    const today = new Date();
    const urgent = reminders.filter(r => {
      const diffTime = new Date(r.nextServiceDate).getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays >= -30;
    });
    setUrgentReminders(urgent);
  }, [reminders]);

  const unreadNotifications = Array.isArray(notifications) ? notifications.filter((n: Notification) => !n.read) : [];
  const declineNotifications = unreadNotifications.filter((n: Notification) => n.type === 'booking_declined');

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setCoords({ lat: 37.7749, lng: -122.4194 })
    );
  }, []);

  useEffect(() => {
    const initAutocomplete = () => {
      if (typeof window !== 'undefined' && window.google?.maps?.places?.Autocomplete && addressInputRef.current && bookingStep === 'confirm') {
        const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
          types: ['geocode'],
          componentRestrictions: { country: 'IN' }
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            setAddress(place.formatted_address);
          }
          if (place.geometry && place.geometry.location) {
            const loc = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            };
            setCoords(loc);
          }
        });

        autocompleteRef.current = autocomplete;
      }
    };

    if (typeof window !== 'undefined' && !(window as any).google && bookingStep === 'confirm') {
      if (!document.getElementById('google-maps-script')) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${currentKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = initAutocomplete;
        script.onerror = () => {
          console.error("Maps load failed. Rotating...");
          rotateKey();
        };
        document.head.appendChild(script);
      }
    } else {
      initAutocomplete();
    }
  }, [bookingStep, setAddress, setCoords, currentKey, rotateKey]);

  useEffect(() => {
    const s = io(SOCKET_URL);
    setSocketInstance(s);
    socketRef.current = s;
    return () => {
      s.disconnect();
    };
  }, []);

  const startListening = () => {
    if (typeof window === 'undefined') return;
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition isn't supported in this browser. Try Chrome.");
      return;
    }

    if (isListening || recognitionRef.current) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch (err) {
          console.error(err);
        }
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    const recognition = new SR();
    recognition.lang = voiceLang;
    recognition.interimResults = true;
    recognition.continuous = false;

    const baseText = issueText.trim();
    let finalTranscript = baseText;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let currentFinal = '';
      let currentInterim = '';
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentFinal += event.results[i][0].transcript;
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }
      const combined = (currentFinal + ' ' + currentInterim).trim();
      finalTranscript = baseText ? `${baseText} ${combined}` : combined;
      setIssueText(finalTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      if (finalTranscript.trim()) {
        handleAnalyze(finalTranscript);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  if (bookingStep === 'done' && bookingConfirmation) {
    return (
      <SuccessState 
        bookingConfirmation={bookingConfirmation}
        selectedTech={selectedTech}
        onNewRequest={() => {
          setBookingStep('input');
          handleAnalyze('');
        }}
        onTrack={(id) => router.push(`/customer/tracking?id=${id}`)}
        userId={userId || undefined}
      />
    );
  }

  if (bookingStep === 'confirm' && selectedTech) {
    return (
      <BookingForm 
        selectedTech={selectedTech}
        analysisResult={analysisResult}
        address={address}
        setAddress={setAddress}
        contactNumber={contactNumber}
        setContactNumber={setContactNumber}
        customerName={customerName}
        setCustomerName={setCustomerName}
        serviceTime={serviceTime}
        setServiceTime={setServiceTime}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        onConfirm={confirmBooking}
        onCancel={() => setBookingStep('input')}
        analyzing={analyzing}
        addressInputRef={addressInputRef}
      />
    );
  }

  if (showHistory && userId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white pt-20 sm:pt-24 pb-16 px-3 sm:px-6 lg:px-8 max-w-4xl mx-auto overflow-x-hidden">
        <BookingHistory 
          userId={userId} 
          userProfile={userProfile}
          onTrack={(bookingId) => router.push(`/customer/tracking?id=${bookingId}`)} 
          onBack={() => setShowHistory(false)} 
        />

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-20 sm:pt-24 lg:pt-28 pb-12 sm:pb-16 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      <StatusBanners 
        dismissedBanner={dismissedBanner}
        setDismissedBanner={setDismissedBanner}
        declineNotifications={declineNotifications}
        onMarkAllRead={markAllRead}
        setShowHistory={setShowHistory}
        urgentReminders={urgentReminders}
        setIssueText={setIssueText}
        activeJob={activeJob}
      />

      <DashboardHeader 
        onShowHistory={() => setShowHistory(true)}
        showNotifPanel={showNotifPanel}
        setShowNotifPanel={setShowNotifPanel}
        notifications={notifications}
        unreadCount={unreadNotifications.length}
        onMarkRead={markNotifRead}
        onMarkAllRead={markAllRead}
        avatarMenuOpen={avatarMenuOpen}
        setAvatarMenuOpen={setAvatarMenuOpen}
        uploadingAvatar={uploadingAvatar}
        userProfile={userProfile}
        onAvatarUpload={(e) => handleAvatarUpload(e, setUploadingAvatar, setAvatarMenuOpen)}
        onAvatarDelete={() => handleAvatarDelete(setUploadingAvatar, setAvatarMenuOpen)}
        onSignOut={() => handleSignOut(router)}
        onShowDeleteConfirm={() => setShowDeleteConfirm(true)}
        activeJob={activeJob}
        onTrack={(id) => router.push(`/customer/tracking?id=${id}`)}
      />

      <div className="mt-6 sm:mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-8 space-y-6 sm:space-y-8">
            <AITriagePanel 
              analyzing={analyzing}
              issueText={issueText}
              setIssueText={setIssueText}
              voiceLang={voiceLang}
              setVoiceLang={setVoiceLang}
              showLangMenuVoice={showLangMenuVoice}
              setShowLangMenuVoice={setShowLangMenuVoice}
              isListening={isListening}
              startListening={startListening}
              imageFile={imageFile}
              imagePreview={imagePreview}
              imageInputRef={imageInputRef}
              handleImageChange={handleImageChange}
              removeImage={removeImage}
              handleAnalyze={() => handleAnalyze()}
              langs={LANGS}
            />

            <AnimatePresence mode="wait">
              {analysisResult && (
                <AnalysisResultView 
                  analysisResult={analysisResult} 
                  onBroadcastBook={createBroadcastBooking}
                  isWaitingForBroadcast={isWaitingForBroadcast}
                  broadcastStatus={broadcastStatus}
                  broadcastTimerEnd={broadcastTimerEnd}
                  onCancelBroadcast={() => { cancelBroadcast(); resetBroadcast(); }}
                  onRetryBroadcast={() => { resetBroadcast(); createBroadcastBooking(); }}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <TechnicianList 
              technicians={matchedTechs} 
              onSelect={selectTechnician} 
              analyzing={analyzing} 
            />
          </div>
        </div>
      </div>

      <ServiceCatalog 
        serviceSearch={serviceSearch}
        setServiceSearch={setServiceSearch}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onSelectService={(item) => {
          setIssueText(item + ' needed. Instant booking and inspection.');
          const el = document.getElementById('diagnose-box');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <MaintenanceLogs 
        reminders={reminders}
        onBookUrgent={(appliance) => {
          setIssueText(`I need a technician for my ${appliance} servicing.`);
          window.scrollTo(0, 0);
        }}
      />


      <PaymentSuccessCelebration show={paymentSuccessState} />

      <BroadcastAcceptedPopup
        show={showAcceptedPopup}
        technician={broadcastAcceptedTech}
        bookingId={broadcastBookingId}
        onDismiss={dismissAcceptedPopup}
        onTrackLive={(id) => { dismissAcceptedPopup(); router.push(`/customer/tracking?id=${id}`); }}
        onViewBookings={() => { dismissAcceptedPopup(); setShowHistory(true); }}
      />

      <AccountDeletionModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => handleDeleteAccount(router, setDeleting, setShowDeleteConfirm)}
        deleting={deleting}
      />


    </div>
  );
}
