// Central config file that resolves the backend API base URL at runtime.
// Keeps all components from hard-coding the URL, making deployment changes trivial.
const getApiUrl = (): string => {
  // NEXT_PUBLIC_API_URL is set in Vercel/Render environment; works in both SSR and browser contexts.
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Fallback for when the env var is accidentally missing in production deployments.
  if (typeof window !== 'undefined' && (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('onrender.com'))) {
    return 'https://fixnow-backend.onrender.com';
  }
  // Local development default.
  return 'http://localhost:5050';
};

// API_BASE is used as the HTTP endpoint prefix for all fetch/axios calls to the Express backend.
export const API_BASE = getApiUrl();
// SOCKET_URL points Socket.IO at the same server so live tracking and broadcasts work.
export const SOCKET_URL = getApiUrl();

// Razorpay public key is needed by the frontend checkout modal (not the secret — that stays on the server).
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_YourRealKeyHere';
