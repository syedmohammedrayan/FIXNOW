// Initialises the Firebase client SDK for browser-side auth, Firestore reads, and file storage.
// This is the client SDK (not Admin) — it runs in the browser and respects Firestore security rules.
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// All Firebase config values come from Next.js public env vars (NEXT_PUBLIC_* prefix)
// so they're safe to expose in the browser bundle.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// initializeApp connects this instance to the Firebase project; only needs to be called once.
const app = initializeApp(firebaseConfig);

// auth is used throughout the app for login, logout, signup, and getting the current user's JWT.
export const auth = getAuth(app);
// browserSessionPersistence means the user is logged out when the tab/window is closed.
// This is chosen for security in a service-marketplace context (shared devices).
setPersistence(auth, browserSessionPersistence).catch((err) => {
  console.error("Auth persistence error:", err);
});

// db is the Firestore instance used by server-side services and some client-side reads.
export const db = getFirestore(app);
// storage is used for Firebase Storage (e.g. file uploads before switching to Cloudinary).
export const storage = getStorage(app);
