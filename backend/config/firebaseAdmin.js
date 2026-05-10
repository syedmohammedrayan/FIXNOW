const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

let db;

try {
  // Try env var first (for Render/production), then local file (for dev)
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log("🔑 Using FIREBASE_SERVICE_ACCOUNT env var");
  } else {
    const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, "utf-8")
    );
    console.log("🔑 Using local serviceAccountKey.json file");
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  db = admin.firestore();
  console.log("✅ Firebase connected");
} catch (error) {
  console.log("⚠️ Firebase NOT connected → DEMO MODE", error.message);
  db = null;
}

module.exports = { db, admin };
