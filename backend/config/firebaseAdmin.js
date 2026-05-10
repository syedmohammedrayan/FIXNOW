const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

let db;

try {
  const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf-8")
  );

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
