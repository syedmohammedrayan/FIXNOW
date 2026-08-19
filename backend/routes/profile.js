const express = require('express');
const router = express.Router();
const { db } = require('../config/firebaseAdmin');
const cloudinary = require('../config/cloudinary');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');

// Memory storage for Cloudinary stream upload
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Upload a buffer directly to Cloudinary via stream.
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

// GET /api/profile/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const uDoc = await db.collection('users').doc(uid).get();
    let user = uDoc.exists ? uDoc.data() : null;

    if (!user) {
      // Fallback if somehow they only exist in technicians
      const tDoc = await db.collection('technicians').doc(uid).get();
      if (tDoc.exists) {
        user = { ...tDoc.data(), role: 'technician' };
      } else {
        return res.status(404).json({ success: false, error: 'User profile not found.' });
      }
    }

    if (user.role === 'technician') {
      const tDoc = await db.collection('technicians').doc(uid).get();
      if (tDoc.exists) {
        user = { ...user, ...tDoc.data() };
      }
    }

    // Merge email and name from auth token if missing
    if (!user.email && req.user.email) user.email = req.user.email;
    if (!user.name && req.user.name) user.name = req.user.name;

    res.json({ success: true, user });
  } catch (err) {
    console.error('GET /api/profile/me error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/profile/me
router.patch('/me', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const body = { ...req.body };

    // Clean dangerous fields
    delete body.specialityTagline;
    delete body.role; // Prevent role escalation
    delete body.avatar; // Handle via dedicated endpoint
    delete body.avatar_public_id;

    // Convert camelCase to snake_case for DB
    const update = {};
    for (const [key, value] of Object.entries(body)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      update[snakeKey] = value;
    }
    update.updated_at = new Date().toISOString();

    const uDoc = await db.collection('users').doc(uid).get();
    
    // Ensure document exists before updating, or use set with merge
    await db.collection('users').doc(uid).set(update, { merge: true });
    
    const role = (uDoc.exists ? uDoc.data().role : null) || update.role;
    
    if (role === 'technician') {
      await db.collection('technicians').doc(uid).set(update, { merge: true });
    }

    res.json({ success: true, message: 'Profile updated successfully', data: update });
  } catch (err) {
    console.error('PATCH /api/profile/me error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/profile/me/avatar
router.post('/me/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const uid = req.user.uid;
    const uDoc = await db.collection('users').doc(uid).get();
    const user = uDoc.exists ? uDoc.data() : {};

    // 1. Delete old avatar from Cloudinary if public_id exists
    if (user.avatar_public_id) {
      try {
        await cloudinary.uploader.destroy(user.avatar_public_id);
      } catch (delErr) {
        console.warn('Failed to delete old avatar from Cloudinary:', delErr.message);
      }
    }

    // 2. Upload new avatar via stream
    const result = await uploadBufferToCloudinary(req.file.buffer, `fixnow/avatars/${uid}`);
    
    const update = {
      avatar: result.secure_url,
      avatar_public_id: result.public_id,
      updated_at: new Date().toISOString()
    };

    // 3. Save to DB
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

// DELETE /api/profile/me/avatar
router.delete('/me/avatar', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const uDoc = await db.collection('users').doc(uid).get();
    const user = uDoc.exists ? uDoc.data() : null;

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // 1. Delete from Cloudinary
    if (user.avatar_public_id) {
      try {
        await cloudinary.uploader.destroy(user.avatar_public_id);
      } catch (delErr) {
        console.warn('Failed to delete avatar from Cloudinary:', delErr.message);
      }
    }

    // 2. Clear from DB
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
