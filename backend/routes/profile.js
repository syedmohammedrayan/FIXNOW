const express = require('express');
const router = express.Router();
const { db } = require('../config/firebaseAdmin');
const cloudinary = require('../config/cloudinary');
// verifyToken middleware protects all profile endpoints — only the authenticated owner can modify their profile.
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');

// Buffer file in memory so we can stream it directly to Cloudinary without writing to disk.
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Wraps Cloudinary's callback-based stream upload in a Promise for async/await use.
 */
function uploadBufferToCloudinary(buffer, folder = 'fixnow/profiles') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// GET /api/profile/me — Returns the authenticated user's full profile.
// Merges both users and technicians collections for technician role users.
router.get('/me', verifyToken, async (req, res) => {
  try {
    // req.user.uid comes from the decoded Firebase JWT token (set by verifyToken middleware).
    const uid = req.user.uid;
    const uDoc = await db.collection('users').doc(uid).get();
    let user = uDoc.exists ? uDoc.data() : null;

    if (!user) {
      // Edge case: user exists only in technicians collection (data migration issue).
      const tDoc = await db.collection('technicians').doc(uid).get();
      if (tDoc.exists) {
        user = { ...tDoc.data(), role: 'technician' };
      } else {
        return res.status(404).json({ success: false, error: 'User profile not found.' });
      }
    }

    // Technicians have extra fields (skills, category, etc.) in a separate collection — merge them.
    if (user.role === 'technician') {
      const tDoc = await db.collection('technicians').doc(uid).get();
      if (tDoc.exists) {
        user = { ...user, ...tDoc.data() };
      }
    }

    // Ensure email and name are always present, falling back to Firebase Auth token claims.
    if (!user.email && req.user.email) user.email = req.user.email;
    if (!user.name && req.user.name) user.name = req.user.name;

    res.json({ success: true, user });
  } catch (err) {
    console.error('GET /api/profile/me error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/profile/me — Updates profile fields for the authenticated user.
router.patch('/me', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const body = { ...req.body };

    // Strip fields that must not be changed via this endpoint to prevent data corruption.
    delete body.specialityTagline;
    delete body.role; // Prevent privilege escalation by client-side role injection.
    delete body.avatar; // Avatars are handled by the dedicated /me/avatar endpoint.
    delete body.avatar_public_id;

    // Normalise camelCase request keys to snake_case for consistent DB storage.
    const update = {};
    for (const [key, value] of Object.entries(body)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      update[snakeKey] = value;
    }
    update.updated_at = new Date().toISOString();

    const uDoc = await db.collection('users').doc(uid).get();
    
    // Use set with merge so new fields are added without overwriting unrelated existing fields.
    await db.collection('users').doc(uid).set(update, { merge: true });
    
    const role = (uDoc.exists ? uDoc.data().role : null) || update.role;
    
    // Mirror changes to the technicians collection so both collections stay in sync.
    if (role === 'technician') {
      await db.collection('technicians').doc(uid).set(update, { merge: true });
    }

    res.json({ success: true, message: 'Profile updated successfully', data: update });
  } catch (err) {
    console.error('PATCH /api/profile/me error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/profile/me/avatar — Replaces the authenticated user's avatar photo.
router.post('/me/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const uid = req.user.uid;
    const uDoc = await db.collection('users').doc(uid).get();
    const user = uDoc.exists ? uDoc.data() : {};

    // Delete the old avatar from Cloudinary first to avoid storage bloat.
    if (user.avatar_public_id) {
      try {
        await cloudinary.uploader.destroy(user.avatar_public_id);
      } catch (delErr) {
        console.warn('Failed to delete old avatar from Cloudinary:', delErr.message);
      }
    }

    // Upload the new avatar and store both URL and public_id (needed for future deletion).
    const result = await uploadBufferToCloudinary(req.file.buffer, `fixnow/avatars/${uid}`);
    
    const update = {
      avatar: result.secure_url,
      avatar_public_id: result.public_id,
      updated_at: new Date().toISOString()
    };

    // Update both collections so avatar is consistent across the app.
    await db.collection('users').doc(uid).set(update, { merge: true });
    
    if (user.role === 'technician' || (await db.collection('technicians').doc(uid).get()).exists) {
      await db.collection('technicians').doc(uid).set(update, { merge: true });
    }

    res.json({ success: true, avatar: result.secure_url });
  } catch (err) {
    console.error('POST /api/profile/me/avatar error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/profile/me/avatar — Removes avatar from Cloudinary and clears the DB fields.
router.delete('/me/avatar', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const uDoc = await db.collection('users').doc(uid).get();
    const user = uDoc.exists ? uDoc.data() : null;

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Remove image asset from Cloudinary CDN.
    if (user.avatar_public_id) {
      try {
        await cloudinary.uploader.destroy(user.avatar_public_id);
      } catch (delErr) {
        console.warn('Failed to delete avatar from Cloudinary:', delErr.message);
      }
    }

    // Use Firestore FieldValue.delete() to remove the fields entirely (not set to null).
    const admin = require('firebase-admin');
    
    await db.collection('users').doc(uid).update({ 
      avatar: admin.firestore.FieldValue.delete(), 
      avatar_public_id: admin.firestore.FieldValue.delete(),
      updated_at: new Date().toISOString()
    }).catch(() => {});
    
    if (user.role === 'technician') {
      await db.collection('technicians').doc(uid).update({ 
        avatar: admin.firestore.FieldValue.delete(), 
        avatar_public_id: admin.firestore.FieldValue.delete(),
        updated_at: new Date().toISOString()
      }).catch(() => {});
    }

    res.json({ success: true, message: 'Avatar deleted' });
  } catch (err) {
    console.error('DELETE /api/profile/me/avatar error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
