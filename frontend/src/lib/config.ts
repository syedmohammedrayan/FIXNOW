export const API_BASE = typeof window !== 'undefined' 
  ? (window.location.hostname === 'localhost' ? 'http://localhost:5050' : window.location.origin)
  : '';

export const SOCKET_URL = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' ? 'http://localhost:5050' : window.location.origin)
  : 'http://localhost:5050'; // Default for SSR if needed

export const RAZORPAY_KEY_ID = 'rzp_test_YourRealKeyHere'; // Update this with your live key
