export const API_BASE = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost'
      ? 'http://localhost:5050'
      : (process.env.NEXT_PUBLIC_API_URL || window.location.origin))
  : (process.env.NEXT_PUBLIC_API_URL || '');

export const SOCKET_URL = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost'
      ? 'http://localhost:5050'
      : (process.env.NEXT_PUBLIC_API_URL || window.location.origin))
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050');

export const RAZORPAY_KEY_ID = 'rzp_test_YourRealKeyHere'; // Update this with your live key
