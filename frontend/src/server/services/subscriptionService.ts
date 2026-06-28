import { API_BASE } from '@/lib/config';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  bookingLimit: number;
  priorityMultiplier: number;
  features: string[];
}

export interface TechnicianSubscription {
  technicianId: string;
  planId: string;
  planName: string;
  bookingLimit: number;
  bookingsUsed: number;
  priorityMultiplier: number;
  paymentStatus: string;
  expiresAt: string;
}

export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const res = await fetch(`${API_BASE}/api/subscriptions/plans`);
    const data = await res.json();
    if (data.success) return data.plans;
  } catch (err) {
    console.error("Failed to fetch subscription plans:", err);
  }
  return [];
};

export const getTechnicianSubscription = async (technicianId: string): Promise<TechnicianSubscription | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/subscriptions/${technicianId}`);
    const data = await res.json();
    if (data.success) return data.subscription;
  } catch (err) {
    console.error("Failed to fetch technician subscription:", err);
  }
  return null;
};

export const createSubscriptionOrder = async (technicianId: string, planId: string): Promise<any> => {
  try {
    const res = await fetch(`${API_BASE}/api/subscriptions/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technicianId, planId })
    });
    const data = await res.json();
    if (data.success) return data;
  } catch (err) {
    console.error("Failed to create subscription order:", err);
  }
  return null;
};

export const verifySubscriptionPayment = async (
  technicianId: string, 
  planId: string,
  paymentDetails: { razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }
): Promise<TechnicianSubscription | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/subscriptions/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technicianId, planId, ...paymentDetails })
    });
    const data = await res.json();
    if (data.success) return data.subscription;
  } catch (err) {
    console.error("Failed to verify subscription:", err);
  }
  return null;
};
