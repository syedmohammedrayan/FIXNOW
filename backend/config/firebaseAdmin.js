// Initializes the Firebase Admin SDK for server-side Firestore access and auth verification.
// Admin SDK runs with service-account credentials (not a browser user), giving full DB access.
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// db is declared outside the try block so it can be exported even if init fails.
let db;

try {
  // Prefer the env var in production (Render/Railway); fall back to a local key file for dev.
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Production: the whole JSON is stored as a single env variable string.
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log("🔑 Using FIREBASE_SERVICE_ACCOUNT env var");
  } else {
    // Development: read the service account JSON from disk.
    const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, "utf-8")
    );
    console.log("🔑 Using local serviceAccountKey.json file");
  }

  // Guard against double-initialisation when the module is hot-reloaded (e.g. by nodemon).
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  // Firestore instance used throughout the backend for all database operations.
  db = admin.firestore();
  console.log("✅ Firebase connected");
} catch (error) {
  // If credentials are missing or malformed the server still starts in demo mode.
  console.log("⚠️ Firebase NOT connected → DEMO MODE", error.message);
  db = null;
}

// Export db for Firestore queries and admin for Auth (token verification, user management).
module.exports = { db, admin };
