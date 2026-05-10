const express = require('express');
const router = require('express').Router();
const { db } = require('../config/firebaseAdmin');
const { notifyUser } = require('../services/notifications');
const { getRealETA, getBatchETA } = require('../services/etaService');

// ── THE ULTIMATE CANONICAL REGISTRY (19 ROLES) ──
const VALID_ROLES = [
  'HVAC / AC Technician', 'Electrician', 'Washing Machine Technician', 
  'Water Systems Technician', 'Refrigerator Technician', 'Kitchen Services Technician', 
  'Installation Services Technician', 'Gas & Utilities', 'Carpentry', 
  'Plumbing', 'Electronics & Smart Home', 'Pest Control', 
  'Cleaning Services', 'Painter', 'Renovation Service', 
  'Moving & Misc', 'Bike Mechanics', 'Car Mechanics', 
  'Rural Area Technicians'
];

// ── FUZZY KEYWORD MAP FOR ROBUST MATCHING (ALL 19 ROLES) ──
const KEYWORD_MAP = {
  'HVAC / AC Technician': ['ac ', 'air condition', 'cooling', 'hvac', 'ventilation', 'compressor', 'split ac', 'window ac', 'central ac', 'duct', 'chiller'],
  'Electrician': ['electr', 'wire', 'switch', 'socket', 'mcb', 'light', 'fan', 'inverter', 'ups', 'battery', 'panel', 'short circuit', 'power'],
  'Washing Machine Technician': ['wash', 'dryer', 'drum', 'bearing', 'washing', 'laundry', 'pump', 'inlet valve'],
  'Water Systems Technician': ['ro ', 'purifier', 'softener', 'pump', 'tank', 'borewell', 'filter', 'uv ', 'uf ', 'submersible', 'drain line'],
  'Refrigerator Technician': ['fridge', 'refrigerator', 'freezer', 'cooling', 'evaporator', 'thermostat', 'condenser'],
  'Kitchen Services Technician': ['kitchen', 'microwave', 'chimney', 'hob', 'cooktop', 'range', 'dishwasher', 'otg', 'convection', 'grill'],
  'Installation Services Technician': ['install', 'mount', 'drill', 'bracket', 'fit ', 'hanging', 'shifting'],
  'Gas & Utilities': ['gas ', 'pipeline', 'lpg', 'png', 'cylinder', 'safety', 'fire ', 'smoke'],
  'Carpentry': ['carpent', 'wood', 'furniture', 'door', 'lock', 'hinge', 'cabinet', 'drawer', 'wardrobe', 'sofa', 'bed '],
  'Plumbing': ['plumb', 'pipe', 'leak', 'tap', 'faucet', 'drain', 'sink', 'toilet', 'flush', 'basin', 'bathroom'],
  'Electronics & Smart Home': ['tv ', 'led ', 'lcd', 'monitor', 'cctv', 'camera', 'smart ', 'home theater', 'speaker', 'iot ', 'doorbell'],
  'Pest Control': ['pest', 'bug', 'insect', 'termite', 'rodent', 'ant ', 'cockroach', 'mosquito', 'fumigation'],
  'Cleaning Services': ['clean', 'sweep', 'mop', 'sanitiz', 'polish', 'housekeep', 'broom', 'dust'],
  'Painter': ['paint', 'wall', 'putty', 'color', 'texture', 'waterproof'],
  'Renovation Service': ['renovate', 'wallpaper', 'panel', 'ceiling', 'aluminium', 'glass', 'grill', 'gate'],
  'Moving & Misc': ['packers', 'movers', 'shifting', 'loading', 'unloading', 'helper', 'labor', 'driver'],
  'Bike Mechanics': ['bike', 'motorcycle', 'scooter', 'two wheeler', 'puncture', 'engine oil'],
  'Car Mechanics': ['car ', 'four wheeler', 'auto repair', 'wheel alignment', 'car wash'],
  'Rural Area Technicians': ['rural', 'village', 'handpump', 'solar', 'transformer', 'agriculture', 'tractor']
};

function getCanonicalCategory(text) {
  if (!text) return null;
  const lowerInput = text.toLowerCase().trim();
  const exactMatch = VALID_ROLES.find(r => r.toLowerCase() === lowerInput);
  if (exactMatch) return exactMatch;
  for (const [role, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some(kw => lowerInput.includes(kw))) return role;
  }
  return null;
}

function getMirageTagline(category) {
  const cat = (category || '').toLowerCase();
  const mirageData = {
    'plumbing': 'Expert in: Leakage, Pipe Repair, Tap Installation',
    'electrician': 'Expert in: Wiring, Switchboard, MCB Short Circuit',
    'cleaning services': 'Expert in: Deep Cleaning, Sanitization, Floor Polishing',
    'hvac / ac technician': 'Expert in: AC Gas Filling, Cooling Check, Jet Servicing',
    'carpentry': 'Expert in: Furniture Repair, Door Lock, Bed Assembly',
    'painter': 'Expert in: Interior Paint, Wall Putty, Waterproofing',
    'pest control': 'Expert in: Termite, Cockroach & Mosquito Control',
    'washing machine technician': 'Expert in: Washing Machine, Dryer & Drum Repair',
    'refrigerator technician': 'Expert in: Fridge, Deep Freezer & Compressor Service',
    'kitchen services technician': 'Expert in: Chimney, Hob & Microwave Repair',
    'water systems technician': 'Expert in: RO Purifier, Water Softener & Pump Repair',
    'electronics & smart home': 'Expert in: Smart Lock, CCTV & Smart Lighting',
    'installation services technician': 'Expert in: Physical Mounting, Shifting & Drilling',
    'gas & utilities': 'Expert in: Pipeline Safety, Fire Protection & Fitting',
    'renovation service': 'Expert in: Wallpaper, False Ceiling & Glass Work',
    'moving & misc': 'Expert in: Packing, Home Shifting & Logistic Support',
    'bike mechanics': 'Expert in: Two-wheeler Servicing, Puncture & Engine',
    'car mechanics': 'Expert in: Car Diagnostics, Alignment & Detailing',
    'rural area technicians': 'Expert in: Rural Infrastructure & Community Services'
  };
  return mirageData[cat] || 'Professional Service Technician & Diagnostic Expert';
}

// ── SEARCH ──
router.post('/search', async (req, res) => {
  try {
    const { category, customerLat, customerLng } = req.body;
    const targetCategory = getCanonicalCategory(category);
    
    if (!targetCategory) {
      return res.json({ success: true, technicians: [], message: 'Category not supported' });
    }

    console.log(`🎯 TARGET MATCH: [${targetCategory}]`);

    const snap = await db.collection('technicians').where('approved', '==', true).where('online', '==', true).get();
    const error = null;
    const techs = snap.docs.map(d => ({id: d.id, ...d.data()}));

    if (error) throw error;

    let matched = (techs || []).filter(tech => {
      const techCat = (tech.category || '').toLowerCase();
      const techSkills = (tech.skills || []).map(s => s.toLowerCase());
      const reqCat = targetCategory.toLowerCase();
      
      return techCat === reqCat || 
             techCat.includes(reqCat) || 
             reqCat.includes(techCat) ||
             techSkills.some(s => s === reqCat || s.includes(reqCat) || reqCat.includes(s));
    }).map(t => ({
      ...t,
      specialityTagline: getMirageTagline(t.category)
    }));

    console.log(`✨ FILTERED MATCHES: ${matched.length} (Online & Approved)`);

    if (customerLat && customerLng && matched.length > 0) {
      try {
        const origin = { lat: customerLat, lng: customerLng };
        const destinations = matched.map(t => ({ lat: t.location?.lat || t.lat || 0, lng: t.location?.lng || t.lng || 0 }));
        const etas = await getBatchETA(origin, destinations);
        matched = matched.map((t, i) => ({ ...t, distance: etas[i].distance, distanceValue: etas[i].distanceValue }));
      } catch (e) {
        console.warn('ETA Service failed:', e.message);
      }
    }

    matched.sort((a, b) => (a.distanceValue || 999999) - (b.distanceValue || 999999));
    res.json({ success: true, technicians: matched });

  } catch (error) {
    console.error('SEARCH FAILURE:', error);
    res.status(500).json({ error: 'Search Logic Error' });
  }
});

// ── BOOKING CREATE ──
router.post('/create', async (req, res) => {
  try {
    const bookingId = 'BK_' + Date.now();
    const { category, customerId } = req.body;
    
    let eligibleTechIds = [];
    try {
      const snap = await db.collection('technicians').where('online', '==', true).where('approved', '==', true).get();
      const onlineTechs = snap.docs.map(d => ({id: d.id, ...d.data()}));
      
      (onlineTechs || []).forEach(tech => {
        const techCat = (tech.category || '').toLowerCase();
        const techSkills = (tech.skills || []).map(s => s.toLowerCase());
        const reqCat = (category || '').toLowerCase();
        
        const isMatch = techCat === reqCat || 
                        techCat.includes(reqCat) || 
                        reqCat.includes(techCat) ||
                        techSkills.some(s => s === reqCat || s.includes(reqCat) || reqCat.includes(s));
        
        if (isMatch) eligibleTechIds.push(tech.id);
      });
    } catch (err) {
      console.warn("Failed to fetch eligible techs for broadcast:", err.message);
    }

    // Ensure customer name is retrieved and stored properly
    let customerName = req.body.customerName;
    if (!customerName && customerId) {
      try {
        const userDoc = await db.collection('users').doc(customerId).get();
        if (userDoc.exists) {
          customerName = userDoc.data()?.name || userDoc.data()?.fullName || 'Valued Customer';
        }
      } catch (e) {
        console.warn("Failed to fetch customer name for booking:", e.message);
      }
    }
    if (!customerName) customerName = 'Valued Customer';

    const now = new Date().toISOString();
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Store BOTH snake_case + camelCase for every field so all consumers work
    const booking = { 
      id: bookingId, 
      status: 'Pending',
      category: req.body.category || '',
      // Dates (dual format)
      created_at: now,
      createdAt: now,
      updated_at: now,
      updatedAt: now,
      // Payment (dual format)
      payment_status: 'Unpaid',
      paymentStatus: 'Unpaid',
      payment_mode: req.body.paymentMode || 'Cash',
      paymentMode: req.body.paymentMode || 'Cash',
      // Customer info (dual format)
      customer_id: customerId || req.body.customer_id || '',
      customerId: customerId || req.body.customer_id || '',
      customer_name: customerName,
      customerName: customerName,
      contact_number: req.body.contactNumber || req.body.contact_number || '',
      contactNumber: req.body.contactNumber || req.body.contact_number || '',
      // Address & location (dual format)
      address: req.body.address || '',
      customer_location: req.body.customerLocation || req.body.customer_location || null,
      customerLocation: req.body.customerLocation || req.body.customer_location || null,
      customer_lat: req.body.customerLat || req.body.customer_lat || null,
      customerLat: req.body.customerLat || req.body.customer_lat || null,
      customer_lng: req.body.customerLng || req.body.customer_lng || null,
      customerLng: req.body.customerLng || req.body.customer_lng || null,
      // Service info (dual format)
      estimated_cost_range: req.body.estimatedCostRange || req.body.estimated_cost_range || '',
      estimatedCostRange: req.body.estimatedCostRange || req.body.estimated_cost_range || '',
      issue_description: req.body.issueDescription || req.body.issue_description || '',
      issueDescription: req.body.issueDescription || req.body.issue_description || '',
      service_time: req.body.serviceTime || req.body.service_time || '',
      serviceTime: req.body.serviceTime || req.body.service_time || '',
      urgency: req.body.urgency || 'normal',
      // Technician (dual format - set on accept)
      technician_id: req.body.technicianId || req.body.technician_id || 'broadcast',
      technicianId: req.body.technicianId || req.body.technician_id || 'broadcast',
      technician_name: req.body.technicianName || req.body.technician_name || '',
      technicianName: req.body.technicianName || req.body.technician_name || '',
      // OTP & broadcast
      otp: otp, 
      eligible_tech_ids: eligibleTechIds,
    };
    
    await db.collection('bookings').doc(booking.id).set(booking);
    res.json({ success: true, bookingId, booking, otp: booking.otp });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ACTIVE BROADCASTS ──
router.get('/active-broadcasts', async (req, res) => {
  try {
    const { techId } = req.query;
    const snap = await db.collection('bookings').where('technician_id', '==', 'broadcast').where('status', '==', 'Pending').get();
    const error = null;
    const broadcasts = snap.docs.map(d => ({id: d.id, ...d.data()}));
    
    if (error) throw error;
    let result = broadcasts || [];
    
    if (techId) {
      result = result.filter(b => (b.eligible_tech_ids || []).includes(techId));
    }
    
    res.json({ success: true, broadcasts: result });
  } catch (err) { 
    console.error("Broadcast Fetch Error:", err.message);
    res.json({ success: true, broadcasts: [], message: "Database temporarily unavailable" }); 
  }
});

// ── ACCEPT BROADCAST ──
router.post('/accept-broadcast', async (req, res) => {
  try {
    const { bookingId, technicianId, technicianName, technicianAvatar, technicianPhone, technicianRating } = req.body;
    
    // Use a transaction-like check to prevent double acceptance
    const docRef = await db.collection('bookings').doc(bookingId).get();
    const booking = docRef.exists ? {id: docRef.id, ...docRef.data()} : null;
    const fetchErr = null;
    
    if (fetchErr || !booking) return res.status(404).json({ error: 'Booking not found' });
    
    if (booking.status !== 'Pending') {
      return res.status(400).json({ error: 'This order has already been claimed or cancelled.' });
    }

    const update = {
      technician_id: technicianId,
      technicianId: technicianId,
      technician_name: technicianName,
      technicianName: technicianName,
      technician_avatar: technicianAvatar || null,
      technicianAvatar: technicianAvatar || null,
      technician_phone: technicianPhone || null,
      technicianPhone: technicianPhone || null,
      technician_rating: technicianRating || 5.0,
      technicianRating: technicianRating || 5.0,
      status: 'Accepted',
      accepted_at: new Date().toISOString(),
      acceptedAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await db.collection('bookings').doc(bookingId).update(update);
    const updateErr = null;
    if (updateErr) throw updateErr;

    res.json({ success: true, booking: { ...booking, ...update } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── MISSED BROADCASTS & ORDERS ──
router.get('/missed-broadcasts/:techId', async (req, res) => {
  try {
    const { techId } = req.params;
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    // Fetch bookings that were either accepted by someone else or cancelled recently
    // where THIS technician was eligible but missed it.
    // Firestore doesn't support OR queries natively like this easily without composite index, we can just fetch all recent and filter
    const snap = await db.collection('bookings').where('created_at', '>', tenMinsAgo).get();
    const error = null;
    const data = snap.docs.map(d => ({id: d.id, ...d.data()})).filter(b => b.status === 'Accepted' || b.status === 'Cancelled');
      
    if (error) throw error;
    
    const missed = (data || []).filter(b => 
      (b.eligible_tech_ids || []).includes(techId) && 
      b.technician_id !== techId
    );
    
    res.json({ success: true, missed });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── CUSTOMER BOOKINGS ──
router.get('/customer/:userId', async (req, res) => {
  try {
    const snap = await db.collection('bookings').where('customer_id', '==', req.params.userId).get();
    const error = null;
    const data = snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    
    if (error) throw error;
    res.json({ success: true, bookings: data || [] });
  } catch (err) { 
    console.error("Customer Booking Fetch Error:", err.message);
    res.json({ success: true, bookings: [], message: "Database temporarily unavailable" }); 
  }
});

// ── TECHNICIAN BOOKINGS ──
router.get('/technician/:techId', async (req, res) => {
  try {
    const snap = await db.collection('bookings').where('technician_id', '==', req.params.techId).get();
    const error = null;
    const data = snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    
    if (error) throw error;
    res.json({ success: true, bookings: data || [] });
  } catch (err) { 
    console.error("Technician Booking Fetch Error:", err.message);
    res.json({ success: true, bookings: [], message: "Database temporarily unavailable" }); 
  }
});

// ── VERIFY OTP ──
router.post('/verify-otp', async (req, res) => {
  try {
    const { bookingId, otp, technicianId } = req.body;
    const docRef = await db.collection('bookings').doc(bookingId).get();
    
    if (!docRef.exists) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = docRef.data();
    
    // Convert to string to avoid type mismatches
    if (String(booking.otp) !== String(otp)) {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }
    
    const update = {
      status: 'In Progress',
      otp_verified_at: new Date().toISOString(),
      otpVerifiedAt: new Date().toISOString(),
      serviceStartedAt: new Date().toISOString(),
      service_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await db.collection('bookings').doc(bookingId).update(update);
    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    console.error('OTP Verification Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── UPDATE STATUS ──
router.post('/update-status', async (req, res) => {
  try {
    const { bookingId, status, paymentStatus, technicianId, technicianName, isPaid, totalAmount, servicesDone, accessories } = req.body;
    const update = { status, updated_at: new Date().toISOString(), updatedAt: new Date().toISOString() };
    if (paymentStatus) update.payment_status = paymentStatus;
    // Handle payment confirmation from technician
    if (isPaid === true) {
      update.payment_status = 'Paid';
      update.paymentStatus = 'Paid';
      update.paid_at = new Date().toISOString();
    } else if (isPaid === false && status === 'Completed') {
      update.payment_status = 'Unpaid';
      update.paymentStatus = 'Unpaid';
    }
    if (totalAmount !== undefined) {
      update.total_amount = totalAmount;
      update.totalAmount = totalAmount;
      update.finalAmount = totalAmount;
    }
    if (servicesDone) {
      update.services_done = servicesDone;
      update.servicesDone = servicesDone;
    }
    if (accessories && Array.isArray(accessories)) {
      update.accessories = accessories;
    }
    if (technicianId) {
      update.technician_id = technicianId;
      update.technicianId = technicianId;
    }
    if (technicianName) {
      update.technician_name = technicianName;
      update.technicianName = technicianName;
    }
    
    await db.collection('bookings').doc(bookingId).update(update);
    
    const dRef = await db.collection('bookings').doc(bookingId).get();
    const booking = dRef.exists ? {id: dRef.id, ...dRef.data()} : null;
    if (booking) {
      if (status === 'Accepted') notifyUser(booking.customer_id, 'technicianAssigned', booking);
      if (status === 'Arrived') notifyUser(booking.customer_id, 'technicianArrived', booking);
      if (status === 'Completed') notifyUser(booking.customer_id, 'serviceCompleted', booking);
    }
    
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DECLINE ──
router.post('/decline', async (req, res) => {
  try {
    const { bookingId, technicianId, reason } = req.body;
    await db.collection('bookings').doc(bookingId).update({
      status: 'Declined',
      declined_at: new Date().toISOString(),
      declinedAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      decline_reason: reason || '',
      declineReason: reason || ''
    });
    
    const dRef = await db.collection('bookings').doc(bookingId).get();
    const booking = dRef.exists ? {id: dRef.id, ...dRef.data()} : null;
    if (booking) notifyUser(booking.customer_id, 'bookingDeclined', booking);
    
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── CANCEL BY CUSTOMER ──
router.post('/cancel', async (req, res) => {
  try {
    const { bookingId, reason } = req.body;
    await db.collection('bookings').doc(bookingId).update({
      status: 'Cancelled',
      cancelled_at: new Date().toISOString(),
      cancelledAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cancel_reason: reason || '',
      cancelReason: reason || ''
    });
    
    // Optionally notify technician if they were already assigned
    const dRef = await db.collection('bookings').doc(bookingId).get();
    const booking = dRef.exists ? {id: dRef.id, ...dRef.data()} : null;
    if (booking && booking.technician_id && booking.technician_id !== 'broadcast') {
      notifyUser(booking.technician_id, 'bookingCancelled', booking);
      
      // Emit socket event for real-time dashboard popup
      const io = req.app.get('io');
      if (io) {
        // Send to both the booking room AND the tech's private room
        io.to(`booking_${bookingId}`).to(`tech_${booking.technician_id}`).emit('booking_cancelled', {
          bookingId,
          customerName: booking.customer_name || 'A customer',
          category: booking.category,
          reason: reason || 'No reason provided'
        });
      }
    }
    
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── SINGLE BOOKING ──
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = await db.collection('bookings').doc(id).get();
    if (!docRef.exists) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ success: true, booking: { id: docRef.id, ...docRef.data() } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── REMINDERS ──
router.get('/reminders/:uid', async (req, res) => {
  try {
    const snap = await db.collection('reminders').where('user_id', '==', req.params.uid).get();
    const error = null;
    const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
    if (error) throw error;
    res.json({ success: true, reminders: data || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── NOTIFICATIONS ──
router.get('/notifications/:userId', async (req, res) => {
  try {
    const snap = await db.collection('notifications').where('user_id', '==', req.params.userId).get();
    const error = null;
    const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
    if (error) throw error;
    res.json({ success: true, notifications: data || [] });
  } catch (err) { 
    console.error("Notification Fetch Error:", err.message);
    res.json({ success: true, notifications: [], message: "Database temporarily unavailable" }); 
  }
});

router.post('/notifications/:id/read', async (req, res) => {
  try {
    await db.collection('notifications').doc(req.params.id).update({ read: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/notifications/:userId/read-all', async (req, res) => {
  try {
    const batch = db.batch();
    const snap = await db.collection('notifications').where('user_id', '==', req.params.userId).where('read', '==', false).get();
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── TRANSACTIONS ──
router.get('/transactions/all', async (req, res) => {
  try {
    const snap = await db.collection('transactions').limit(100).get();
    const error = null;
    const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
    if (error) throw error;
    res.json({ success: true, transactions: data || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/transactions/technician/:techId', async (req, res) => {
  try {
    const snap = await db.collection('transactions').where('technician_id', '==', req.params.techId).get();
    const error = null;
    const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
    if (error) throw error;
    res.json({ success: true, transactions: data || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
