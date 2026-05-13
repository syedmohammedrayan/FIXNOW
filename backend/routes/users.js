const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebaseAdmin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const avatarsDir = path.join(__dirname, '..', 'uploads', 'avatars');
const idsDir = path.join(__dirname, '..', 'uploads', 'ids');

[avatarsDir, idsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'avatar') cb(null, avatarsDir);
    else if (file.fieldname === 'govId') cb(null, idsDir);
    else cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Helper for permanent deletion
const performPermanentDeletion = async (id) => {
  console.log(`🗑️ Starting permanent deletion for user: ${id}`);

  // 1. Delete from Firebase Auth
  try {
    await admin.auth().deleteUser(id);
    console.log(`✅ User ${id} removed from Firebase Auth`);
  } catch (authErr) {
    console.warn(`⚠️ Auth deletion warning for ${id}:`, authErr.message);
  }

  // 2. Database Cleanup
  const cleanupPromises = [
    db.collection('users').doc(id).delete(),
    db.collection('technicians').doc(id).delete(),
    db.collection('notifications').where('user_id', '==', id).get().then(s => { const b=db.batch(); s.forEach(d => b.delete(d.ref)); return b.commit(); }),
    db.collection('bookings').where('customer_id', '==', id).get().then(s => { const b=db.batch(); s.forEach(d => b.delete(d.ref)); return b.commit(); }),
    db.collection('bookings').where('technician_id', '==', id).get().then(s => { const b=db.batch(); s.forEach(d => b.delete(d.ref)); return b.commit(); }),
    db.collection('transactions').where('technician_id', '==', id).get().then(s => { const b=db.batch(); s.forEach(d => b.delete(d.ref)); return b.commit(); }),
    db.collection('tool_orders').where('technician_id', '==', id).get().then(s => { const b=db.batch(); s.forEach(d => b.delete(d.ref)); return b.commit(); }),
    db.collection('reminders').where('user_id', '==', id).get().then(s => { const b=db.batch(); s.forEach(d => b.delete(d.ref)); return b.commit(); }),
    db.collection('notification_logs').where('user_id', '==', id).get().then(s => { const b=db.batch(); s.forEach(d => b.delete(d.ref)); return b.commit(); }),
  ];

  await Promise.allSettled(cleanupPromises);
  console.log(`✅ Database cleanup completed for user: ${id}`);
};

// Create or Update User Profile
router.post('/signup', async (req, res) => {
  try {
    const { id, name, email, role, phone, address, skills, password, passwordHint, category, govIdUrl } = req.body;

    // Check if user already exists in DB
    const s = await db.collection('users').where('email', '==', email).limit(1).get(); const existingUser = s.empty ? null : s.docs[0].data();
    
    // Check if user exists in Auth
    let existingInAuth = null;
    try {
      existingInAuth = await admin.auth().getUserByEmail(email);
    } catch(e) {}

    if (existingUser && existingInAuth) {
      return res.status(409).json({ error: 'This email is already registered and active.' });
    }

    if (existingUser && !existingInAuth) {
      console.log(`⚠️ Ghost User detected: ${email} exists in DB but not Auth. Deleting orphaned record to allow re-registration.`);
      const uSnap = await db.collection('users').where('email', '==', email).get(); uSnap.forEach(d => d.ref.delete());
      // Also delete from technicians if they were a tech
      const tSnap = await db.collection('technicians').where('email', '==', email).get(); tSnap.forEach(d => d.ref.delete());
    }

    const pSnap = await db.collection('users').where('phone', '==', phone).limit(1).get(); const existingPhone = pSnap.empty ? null : pSnap.docs[0].data();
    if (existingPhone) {
      return res.status(409).json({ error: 'This phone number is already registered.' });
    }

    // Check if user is in pending_technicians
    if (role === 'technician') {
      const peSnap = await db.collection('pending_technicians').where('email', '==', email).limit(1).get(); const pendingEmail = peSnap.empty ? null : peSnap.docs[0].data();
      if (pendingEmail) {
        return res.status(409).json({ error: 'Account details are under verification. Please wait for admin approval.' });
      }
      const ppSnap = await db.collection('pending_technicians').where('phone', '==', phone).limit(1).get(); const pendingPhone = ppSnap.empty ? null : ppSnap.docs[0].data();
      if (pendingPhone) {
        return res.status(409).json({ error: 'Account details are under verification. Please wait for admin approval.' });
      }

      // Store in pending collection ONLY
      const pendingData = {
        name, email, phone, address, role, category,
        skills: skills || [],
        password,
        gov_id_url: govIdUrl || null,
        password_hint: passwordHint || '',
        verification_status: govIdUrl ? 'uploaded' : 'pending',
        approved: false,
        created_at: new Date().toISOString()
      };
      
      const ref = await db.collection('pending_technicians').add(pendingData); const inserted = { id: ref.id }; const insertErr = null;
      
      if (insertErr) throw insertErr;

      return res.status(201).json({ 
        success: true, 
        message: 'Registration request submitted. Please wait for admin approval.',
        id: inserted.id,
        isPending: true 
      });
    }

    // Standard signup for customers/admins
    let finalId = id;
    
    // If id is missing, it means the frontend hit a rate limit or skipped Auth creation.
    // we use the admin client to create the user directly.
    if (!finalId && email && password) {
      try {
        let authErr = null;
        try {
          const newUser = await admin.auth().createUser({
            email,
            password,
            emailVerified: true,
            displayName: name
          });
          finalId = newUser.uid;
        } catch(e) {
          if (e.code === 'auth/email-already-exists') {
            const existing = await admin.auth().getUserByEmail(email);
            if (existing) finalId = existing.uid;
            else authErr = e;
          } else {
            authErr = e;
            throw authErr;
          }
        }
      } catch(err) {
        console.error('Backend Auth Creation Error:', err.message);
        return res.status(500).json({ error: 'Authentication service limit reached. Please try again later or contact support.' });
      }
    }

    const userData = {
      id: finalId,
      name: name || '',
      email: email || '',
      role: role || 'customer',
      phone: phone || '',
      address: address || '',
      password: password || '',
      password_hint: passwordHint || '',
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    await db.collection('users').doc(userData.id).set(userData, {merge: true}); const error = null;
    if (error) throw error;
    
    res.status(201).json({ success: true, user: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get User Profile (Oracle Logic)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Try primary 'users' table
    const uDoc = await db.collection('users').doc(id).get(); const user = uDoc.exists ? uDoc.data() : null;
    
    if (user) {
      if (user.role === 'technician') {
        const tDoc = await db.collection('technicians').doc(id).get(); const tech = tDoc.exists ? tDoc.data() : null;
        if (tech) {
          return res.json({ success: true, user: { ...user, ...tech } });
        }
      }
      return res.json({ success: true, user });
    }

    // 2. Fallback to technicians table directly
    const tfDoc = await db.collection('technicians').doc(id).get(); const techFallback = tfDoc.exists ? tfDoc.data() : null;
    
    if (techFallback) {
      return res.json({ success: true, user: { ...techFallback, role: 'technician' } });
    }
    
    res.status(404).json({ error: 'User profile not found in any sector.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Technicians (Approved)
router.get('/techs/all', async (req, res) => {
  try {
    const snap = await db.collection('technicians').limit(500).get(); const data = snap.docs.map(d=>d.data()); const error = null;
    if (error) throw error;
    res.json({ success: true, technicians: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Pending Technicians
router.get('/techs/pending', async (req, res) => {
  try {
    const snap = await db.collection('pending_technicians').get(); const data = snap.docs.map(d=>({id: d.id, ...d.data()})); const error = null;
    if (error) throw error;
    
    // Map snake_case to camelCase for frontend compatibility
    const mappedData = (data || []).map(tech => ({
      ...tech,
      govIdUrl: tech.gov_id_url,
      verificationStatus: tech.verification_status,
      passwordHint: tech.password_hint
    }));

    res.json({ success: true, technicians: mappedData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Detailed Technician Stats (for Admin)
router.get('/techs/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = await db.collection('technicians').doc(id).get(); const techData = docRef.exists ? docRef.data() : null; const techErr = null;
    if (techErr || !techData) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    const bSnap = await db.collection('bookings').where('technician_id', '==', id).get(); const bookings = bSnap.docs.map(d=>d.data());
    
    const allBookings = bookings || [];
    const completed = allBookings.filter(b => b.status === 'Completed');
    const cancelled = allBookings.filter(b => b.status === 'Cancelled' || b.status === 'Refused').length;
    
    const totalEarnings = completed.reduce((sum, b) => {
      // Prioritize actual paid amount, fallback to estimated range upper bound
      const actualAmount = parseFloat(b.total_amount || b.totalAmount || b.finalAmount || 0);
      if (actualAmount > 0) return sum + actualAmount;

      const costStr = b.estimated_cost_range || b.estimatedCostRange || "500";
      const cost = parseInt(costStr.split('-').pop().trim()) || 500;
      return sum + cost;
    }, 0);

    res.json({
      success: true,
      stats: {
        ...techData,
        id,
        ordersCompleted: completed.length,
        ordersCancelled: cancelled,
        totalEarnings,
        earnings: totalEarnings, // Ensure both field names are present
        totalJobs: allBookings.length
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Last Logged In Admin
router.get('/admin/last', async (req, res) => {
  try {
    const aSnap = await db.collection('users').where('role', '==', 'admin').get();
    const admins = aSnap.docs.map(d=>d.data()).sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || '')).slice(0, 1);
      
    if (admins && admins.length > 0) {
      return res.json({ success: true, admin: admins[0] });
    }
    
    res.json({ 
      success: true, 
      admin: { 
        name: 'System Admin',
        company: 'FIXNOW Technologies',
        address: '123 Tech Park, Silicon Valley, CA 94025',
        phone: '+1 (800) 555-0199',
        email: 'admin@fixnow.app'
      } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check Registration Status
router.get('/check-status', async (req, res) => {
  try {
    const { email } = req.query;

    const ptDoc = await db.collection('pending_technicians').where('email', '==', email).limit(1).get(); const pending = ptDoc.empty ? null : ptDoc.docs[0].data();
    
    if (pending) {
      return res.json({ 
        success: true, 
        isPending: true, 
        status: pending.verification_status,
        reason: pending.rejection_reason 
      });
    }

    res.json({ success: true, isPending: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify Password Hint
router.post('/verify-hint', async (req, res) => {
  try {
    const { email, hint } = req.body;
    if (!email || !hint) return res.status(400).json({ error: 'Email and hint are required' });
    
    let storedHint = null;

    const uDoc = await db.collection('users').where('email', '==', email).limit(1).get(); const user = uDoc.empty ? null : uDoc.docs[0].data();
    if (user) {
      storedHint = user.password_hint;
    } else {
      const ptDoc2 = await db.collection('pending_technicians').where('email', '==', email).limit(1).get(); const pending = ptDoc2.empty ? null : ptDoc2.docs[0].data();
      if (pending) storedHint = pending.password_hint;
    }

    if (!storedHint) {
      return res.status(404).json({ error: 'No password hint found for this account.' });
    }

    if (storedHint.trim().toLowerCase() === hint.trim().toLowerCase()) {
      return res.json({ success: true, message: 'Hint verified successfully' });
    } else {
      return res.status(401).json({ error: 'Incorrect password hint' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Password via Hint
router.post('/reset-password', async (req, res) => {
  try {
    const { email, hint, newPassword } = req.body;
    if (!email || !hint || !newPassword) return res.status(400).json({ error: 'Missing required fields' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    let storedHint = null;
    let pendingDocId = null;

    const uDoc3 = await db.collection('users').where('email', '==', email).limit(1).get(); const user = uDoc3.empty ? null : {id: uDoc3.docs[0].id, ...uDoc3.docs[0].data()};
    if (user) {
      storedHint = user.password_hint;
    } else {
      const ptDoc3 = await db.collection('pending_technicians').where('email', '==', email).limit(1).get(); const pending = ptDoc3.empty ? null : {id: ptDoc3.docs[0].id, ...ptDoc3.docs[0].data()};
      if (pending) {
        storedHint = pending.password_hint;
        pendingDocId = pending.id;
      }
    }

    if (!storedHint || storedHint.trim().toLowerCase() !== hint.trim().toLowerCase()) {
      return res.status(401).json({ error: 'Verification failed. Incorrect hint.' });
    }

    let accountUpdated = false;

    try {
      // Update in Firebase Auth
      const authUser = await admin.auth().getUserByEmail(email).catch(() => null);
      if (authUser) {
        await admin.auth().updateUser(authUser.uid, { password: newPassword });
        accountUpdated = true;
      }
    } catch (authErr) {
      console.warn('Auth password reset warning:', authErr.message);
    }

    if (user) {
      await db.collection('users').doc(user.id).update({ password: newPassword });
      const techDoc = await db.collection('technicians').doc(user.id).get();
      if (techDoc.exists) {
        await db.collection('technicians').doc(user.id).update({ password: newPassword });
      }
      accountUpdated = true;
    }

    if (pendingDocId) {
      await db.collection('pending_technicians').doc(pendingDocId).update({ password: newPassword });
      accountUpdated = true;
    }

    if (!accountUpdated) {
      return res.status(404).json({ error: 'Account not found to reset password.' });
    }

    res.json({ success: true, message: 'Password has been successfully reset.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve or Decline Technician Verification
router.post('/techs/verify-action', async (req, res) => {
  try {
    const { id, action, reason } = req.body;
    console.log(`🔍 Tech Verification Action: ${action} for ID: ${id}`);
    
    if (!id) return res.status(400).json({ error: 'Missing technician ID' });

    const ptDoc4 = await db.collection('pending_technicians').doc(id).get(); const pendingData = ptDoc4.exists ? ptDoc4.data() : null; const fetchErr = null;

    if (fetchErr) {
      console.error('❌ Error fetching pending tech:', fetchErr);
      return res.status(500).json({ error: fetchErr.message });
    }

    if (!pendingData) {
      console.warn(`⚠️ No pending technician found for ID: ${id}`);
      return res.status(404).json({ error: 'Registration request not found. It may have already been processed.' });
    }

    if (action === 'decline') {
      console.log(`🗑️ Declining and deleting pending tech: ${pendingData.email}`);
      await db.collection('pending_technicians').doc(id).delete(); const deleteErr = null;

      if (deleteErr) throw deleteErr;
      
      return res.json({ success: true, message: 'Technician request declined successfully.' });
    }

    // APPROVAL: Create Auth User and Move Data
    try {
      console.log(`🔐 Creating Auth account for: ${pendingData.email}`);
      let uid;
      let createErr = null;
      try {
        const newUser = await admin.auth().createUser({
          email: pendingData.email,
          password: pendingData.password || 'FixNow2026!',
          emailVerified: true,
          displayName: pendingData.name
        });
        uid = newUser.uid;
      } catch (e) {
        if (e.code === 'auth/email-already-exists') {
          const existing = await admin.auth().getUserByEmail(pendingData.email);
          if (existing) uid = existing.uid;
          else createErr = e;
        } else {
          createErr = e;
          throw createErr;
        }
      }
      console.log(`✅ Auth UID: ${uid}`);

      const commonData = {
        id: uid,
        name: pendingData.name,
        email: pendingData.email,
        phone: pendingData.phone,
        address: pendingData.address || '',
        role: 'technician',
        updated_at: new Date().toISOString(),
        created_at: pendingData.created_at
      };

      const techData = {
        id: uid,
        name: pendingData.name,
        email: pendingData.email,
        phone: pendingData.phone,
        address: pendingData.address || '',
        category: pendingData.category,
        skills: pendingData.skills || [],
        password_hint: pendingData.password_hint || '',
        gov_id_url: pendingData.gov_id_url,
        approved: true,
        verification_status: 'verified',
        rating: 5.0,
        completed_jobs: 0,
        earnings: 0,
        online: false,
        updated_at: new Date().toISOString(),
        created_at: pendingData.created_at
      };

      // Save to official tables
      await db.collection('users').doc(commonData.id).set(commonData, {merge: true});
      await db.collection('technicians').doc(techData.id).set(techData, {merge: true});

      // Delete from pending
      await db.collection('pending_technicians').doc(id).delete();
      console.log(`🗑️ Removed from pending: ${id}`);

      res.json({ success: true, message: 'Technician approved successfully!' });
    } catch (authErr) {
      console.error('❌ APPROVAL SYSTEM ERROR:', authErr);
      res.status(500).json({ error: authErr.message || 'Auth failure' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Temporary ID Upload (During Signup)
router.post('/upload-temp-id', upload.single('govId'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document uploaded' });
    }
    
    const file = req.file;
    const fileExt = path.extname(file.originalname);
    const fileName = `temp_${Date.now()}${fileExt}`;
    const filePath = `temp/${fileName}`;

    const publicUrl = `/uploads/ids/${file.filename}`;

    res.json({ success: true, govIdUrl: publicUrl });
  } catch (err) {
    console.error('Temp ID upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Gov ID Upload (For existing users)
router.post('/:id/upload-id', upload.single('govId'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document uploaded' });
    }
    const { id } = req.params;
    const file = req.file;
    const fileExt = path.extname(file.originalname);
    const fileName = `${id}_${Date.now()}${fileExt}`;
    const filePath = `${id}/${fileName}`;

    const publicUrl = `/uploads/ids/${file.filename}`;
    
    const update = { 
      gov_id_url: publicUrl, 
      verification_status: 'uploaded',
      updated_at: new Date().toISOString() 
    };

    await db.collection('users').doc(id).set(update, {merge: true});
    try { await db.collection('technicians').doc(id).update(update); } catch(e){}

    res.json({ success: true, govIdUrl: publicUrl });
  } catch (err) {
    console.error('ID upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete User Account Permanently
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await performPermanentDeletion(id);
    res.json({ success: true, message: 'Account and all associated data deleted permanently.' });
  } catch (err) {
    console.error(`❌ Deletion error for user ${req.params.id}:`, err);
    res.status(500).json({ error: 'Failed to delete account: ' + err.message });
  }
});

// Secure ID Proxy (Improved Pro Logic)
router.get('/view-id', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send('No URL provided');

    let cleanPath = url.toString();
    if (cleanPath.includes('/ids/')) {
      cleanPath = cleanPath.split('/ids/').pop();
    }
    cleanPath = cleanPath.split('?')[0];

    const fileLoc = path.join(__dirname, '..', 'uploads', 'ids', cleanPath.split('/').pop());
    if (fs.existsSync(fileLoc)) {
       res.sendFile(fileLoc);
    } else {
       res.status(404).send('Document not found');
    }
  } catch (err) {
    console.error('ID Proxy Error:', err);
    res.status(500).send('Failed to load document');
  }
});

// Emergency Admin Bypass (Resolves Auth Rate Limits)
router.get('/admin-bypass', async (req, res) => {
  try {
    const adminEmail = 'dell@gmail.com';
    console.log(`🚀 Generating Emergency Bypass Link for: ${adminEmail}`);
    const actionCodeSettings = {
      url: 'http://localhost:3001/admin/dashboard',
      handleCodeInApp: true
    };
    try {
      const link = await admin.auth().generateSignInWithEmailLink(adminEmail, actionCodeSettings);
      res.redirect(link);
    } catch(error) {
      console.error('❌ Bypass Link Generation Error:', error);
      return res.status(500).json({ error: 'Failed to generate bypass link: ' + error.message });
    }
  } catch (err) {
    console.error('🔥 Critical Bypass Error:', err);
    res.status(500).json({ error: 'Critical server error during bypass' });
  }
});

// Avatar upload
router.post('/:id/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const { id } = req.params;
    const file = req.file;
    const fileExt = path.extname(file.originalname);
    const fileName = `${id}_${Date.now()}${fileExt}`;
    const filePath = `${id}/${fileName}`;

    const publicUrl = `/uploads/avatars/${file.filename}`;
    
    const update = { avatar: publicUrl, updated_at: new Date().toISOString() };
    await db.collection('users').doc(id).set({ id, ...update }, {merge: true});
    try { await db.collection('technicians').doc(id).update(update); } catch(e){}

    res.json({ success: true, localUrl: publicUrl, avatar: publicUrl });
  } catch (err) {
    console.error('Avatar save error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update profile details
router.post('/:id/update-profile', async (req, res) => {
  try {
    const { id } = req.params;
    const body = { ...req.body };
    
    // Clean dangerous fields
    delete body.specialityTagline; 

    // Convert camelCase to snake_case for DB
    const update = {};
    for (const [key, value] of Object.entries(body)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      update[snakeKey] = value;
    }
    update.updated_at = new Date().toISOString();

    await db.collection('users').doc(id).set(update, {merge: true});
    const tDoc = await db.collection('technicians').doc(id).get();
    if (tDoc.exists) {
      await db.collection('technicians').doc(id).update(update);
    } else {
      const uDoc = await db.collection('users').doc(id).get();
      if (uDoc.exists && uDoc.data().role === 'technician') {
        await db.collection('technicians').doc(id).set({ id, ...update }, {merge: true});
      }
    }

    res.json({ success: true, message: 'Profile updated successfully', data: update });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
