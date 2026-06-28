'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '@/lib/config';

interface RazorpayCheckoutProps {
  bookingId: string;
  onSuccess: (paymentDetails: any) => void;
  onFailure: (error: any) => void;
  onDismiss: () => void;
  customerProfile?: any; // To prefill name, email, contact
}

export default function RazorpayCheckout({
  bookingId,
  onSuccess,
  onFailure,
  onDismiss,
  customerProfile
}: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Load Razorpay Script
    const loadScript = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          resolve(true);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    const initializeCheckout = async () => {
      try {
        const isLoaded = await loadScript();
        if (!isLoaded) {
          throw new Error("Failed to load Razorpay SDK. Please check your connection.");
        }

        // 2. Fetch Order from Backend (Phase 2)
        const response = await axios.post(`${API_BASE}/api/payment/create-order`, {
          bookingId
        });

        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to create order");
        }

        const { orderId, amount, currency, keyId } = response.data;

        // 3. Initialize Razorpay Options
        const options = {
          key: keyId, 
          amount: amount.toString(),
          currency: currency,
          name: "FixNow",
          description: "Service Payment",
          image: "https://fixnow.app/logo.png", // Replace with your actual logo
          order_id: orderId,
          handler: async function (response: any) {
            try {
              // 4. Verify Payment (Phase 4)
              const verifyRes = await axios.post(`${API_BASE}/api/payment/verify`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: bookingId
              });

              if (verifyRes.data.success) {
                onSuccess(verifyRes.data);
              } else {
                onFailure(new Error(verifyRes.data.message));
              }
            } catch (err: any) {
              onFailure(err);
            }
          },
          prefill: {
            name: customerProfile?.name || "",
            email: customerProfile?.email || "",
            contact: customerProfile?.phone || ""
          },
          theme: {
            color: "#0891b2" // Cyan-600
          },
          modal: {
            ondismiss: function() {
              onDismiss();
            }
          }
        };

        const rzp = new window.Razorpay(options);
        
        rzp.on('payment.failed', function (response: any) {
          onFailure(response.error);
        });

        rzp.open();
        setLoading(false);

      } catch (err: any) {
        console.error("Checkout Initialization Error:", err);
        setError(err.message || "An error occurred while initializing checkout");
        setLoading(false);
        onFailure(err);
      }
    };

    initializeCheckout();

  }, [bookingId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="size-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-slate-400 animate-pulse">Initializing Secure Checkout...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center">
        <p className="text-sm font-black text-rose-400 mb-4">{error}</p>
        <button 
          onClick={onDismiss}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return null; // Razorpay handles the UI popup
}
