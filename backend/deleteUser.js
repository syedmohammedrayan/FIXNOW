require('dotenv').config();
const { admin } = require('./config/firebaseAdmin');

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error("❌ Please provide an email address.");
  console.error("Usage: node deleteUser.js <email>");
  process.exit(1);
}

console.log(`🔍 Searching for user with email: ${email}...`);

(async () => {
  try {
    // Find by email using Firebase Admin
    const user = await admin.auth().getUserByEmail(email).catch(() => null);
    if (!user) {
      console.error(`❌ User ${email} does not exist in Firebase Auth.`);
      process.exit(1);
    }

    console.log(`✅ Found user with UID: ${user.uid}. Deleting...`);
    await admin.auth().deleteUser(user.uid);

    console.log(`🗑️ Successfully deleted ${email} from Firebase Auth.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting user:', error.message || error);
    process.exit(1);
  }
})();
