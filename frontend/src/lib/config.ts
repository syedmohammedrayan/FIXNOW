// Backend API URL — set NEXT_PUBLIC_API_URL in production (e.g. https://fixnow-backend.onrender.com)
// Falls back to localhost:5050 only for local development
const getApiUrl = (): string => {
  // Environment variable takes priority (works in both SSR and client)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Local dev fallback
  return 'http://localhost:5050';
};

export const API_BASE = getApiUrl();
export const SOCKET_URL = getApiUrl();

export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_YourRealKeyHere';
