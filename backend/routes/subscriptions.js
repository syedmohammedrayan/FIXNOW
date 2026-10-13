const express = require('express');
const router = express.Router();
const { db } = require('../config/firebaseAdmin');

// Optional: Add Razorpay for real payments, currently simulating
// const Razorpay = require('razorpay');

// GET /api/subscriptions/plans — Returns the available technician subscription tiers.
// Plans also get force-written to Firestore so DB always reflects current business rules.
router.get('/plans', async (req, res) => {
  try {
    // Three subscription tiers that control how many bookings a technician can receive per month.
    const defaultPlans = [
      {
        id: 'free',
        name: 'Free Plan',
        price: 0,
        bookingLimit: 3,
        priorityMultiplier: 1.0,
        features: ['Standard AI ranking', 'Basic analytics', '3 referrals/month']
      },
      {
        id: 'pro',
        name: 'Pro Plan',
        price: 499,
        bookingLimit: 22,
        // priorityMultiplier boosts the technician's score during the AI ranking stage.
        priorityMultiplier: 1.2,
        features: ['AI ranking visibility boost', 'Faster notifications', '22 referrals/month', '10% promotion of visibility to the customer (suitable)']
      },
      {
        id: 'elite',
        name: 'Elite Plan',
        price: 1499,
        bookingLimit: 9999, // Effectively unlimited
        priorityMultiplier: 1.5,
        features: ['Unlimited referrals', 'Premium badge', 'Highest AI visibility', 'Priority dispatch', '20% promotion of visibility to the customer (suitable)']
      }
    ];

    // Overwrite plans in DB on every request so plan changes deploy without a data migration.
    for (const p of defaultPlans) {
      await db.collection('subscription_plans').doc(p.id).set(p);
    }
    
    // Remove any legacy enterprise plan to prevent stale plan references.
    await db.collection('subscription_plans').doc('enterprise').delete().catch(() => {});

    res.json({ success: true, plans: defaultPlans });
  } catch (error) {
    console.error("Fetch Plans Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/subscriptions/:technicianId — Returns the technician's active subscription with exact quota & remaining bookings.
router.get('/:technicianId', async (req, res) => {
  try {
    const { technicianId } = req.params;
    const docRef = await db.collection('technician_subscriptions').doc(technicianId).get();
    
    const now = new Date();
    const defaultFreeSub = {
      technicianId,
      planId: 'free',
      planName: 'Free Plan',
      bookingLimit: 3,
      bookingsUsed: 0,
      remainingBookings: 3,
      priorityMultiplier: 1.0,
      paymentStatus: 'active',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    let sub = docRef.exists ? docRef.data() : null;

    if (!sub) {
      // Create a free plan record with 3 bookings so the technician starts with fresh quota.
      await db.collection('technician_subscriptions').doc(technicianId).set(defaultFreeSub);
      
      try {
        const updateData = { subscriptionPlan: 'free', expiresAt: defaultFreeSub.expiresAt };
        await db.collection('users').doc(technicianId).update(updateData);
        await db.collection('technicians').doc(technicianId).update(updateData);
      } catch (e) {
        console.warn('Failed to sync default plan to users:', e.message);
      }

      return res.json({ success: true, subscription: defaultFreeSub });
    }

    // Auto-expire / Rollover check:
    if (sub.expiresAt && new Date(sub.expiresAt) < now) {
      if (sub.planId !== 'free') {
        // Paid plan expired: revert to standard Free Plan (3 bookings/month)
        sub = {
          technicianId,
          planId: 'free',
          planName: 'Free Plan',
          bookingLimit: 3,
          bookingsUsed: 0,
          priorityMultiplier: 1.0,
          paymentStatus: 'active',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        };
        await db.collection('technician_subscriptions').doc(technicianId).set(sub);
      } else {
        // Free plan monthly cycle: renew cycle with 3 bookings
        sub.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        sub.bookingsUsed = 0;
        sub.paymentStatus = 'active';
        sub.updatedAt = new Date().toISOString();
        await db.collection('technician_subscriptions').doc(technicianId).update({
          expiresAt: sub.expiresAt,
          bookingsUsed: 0,
          paymentStatus: 'active',
          updatedAt: sub.updatedAt
        });
      }
    }

    // Correct plan limits if corrupted, 0, or missing
    let effectiveLimit = sub.bookingLimit;
    if (!effectiveLimit || effectiveLimit <= 0) {
      effectiveLimit = sub.planId === 'pro' ? 22 : (sub.planId === 'elite' ? 9999 : 3);
      sub.bookingLimit = effectiveLimit;
    }

    // Live sync booking count from bookings collection in Firestore for this technician
    let liveBookingsCount = 0;
    try {
      let cycleStart;
      if (sub.cycleStartDate) {
        cycleStart = new Date(sub.cycleStartDate);
      } else if (sub.startedAt) {
        cycleStart = new Date(sub.startedAt);
      } else if (sub.expiresAt) {
        cycleStart = new Date(new Date(sub.expiresAt).getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        cycleStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }
      
      const [snap1, snap2] = await Promise.all([
        db.collection('bookings').where('technician_id', '==', technicianId).get().catch(() => ({ docs: [] })),
        db.collection('bookings').where('technicianId', '==', technicianId).get().catch(() => ({ docs: [] }))
      ]);
      const seenBookingIds = new Set();
      const allDocs = [...(snap1.docs || []), ...(snap2.docs || [])];

      allDocs.forEach(bDoc => {
        if (seenBookingIds.has(bDoc.id)) return;
        seenBookingIds.add(bDoc.id);
        const b = bDoc.data();
        if (b.status && b.status !== 'Cancelled' && b.status !== 'Rejected') {
          const bDate = b.createdAt ? new Date(b.createdAt) : (b.created_at ? new Date(b.created_at) : null);
          if (!bDate || bDate >= cycleStart) {
            liveBookingsCount++;
          }
        }
      });
    } catch (e) {
      console.warn('Could not live count technician bookings:', e.message);
    }

    const effectiveUsed = Math.max(sub.bookingsUsed || 0, liveBookingsCount);
    const effectiveRemaining = effectiveLimit > 9000 ? 9999 : Math.max(0, effectiveLimit - effectiveUsed);

    // Sync updated values to Firestore if they differed
    if (sub.bookingsUsed !== effectiveUsed || sub.bookingLimit !== effectiveLimit) {
      sub.bookingsUsed = effectiveUsed;
      sub.bookingLimit = effectiveLimit;
      await db.collection('technician_subscriptions').doc(technicianId).update({
        bookingsUsed: effectiveUsed,
        bookingLimit: effectiveLimit
      }).catch(() => {});
    }

    const responseSubscription = {
      ...sub,
      bookingLimit: effectiveLimit,
      bookingsUsed: effectiveUsed,
      remainingBookings: effectiveRemaining
    };

    res.json({ success: true, subscription: responseSubscription });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// RazorpayService handles order creation and HMAC signature verification.
const razorpayService = require('../services/razorpay.service');

// POST /api/subscriptions/create-order — Creates a Razorpay order for a paid plan.
// The frontend uses the returned orderId to open the Razorpay checkout modal.
router.post('/create-order', async (req, res) => {
  try {
    const { technicianId, planId } = req.body;
    
    const planDoc = await db.collection('subscription_plans').doc(planId).get();
    if (!planDoc.exists) return res.status(404).json({ success: false, error: "Plan not found" });
    const plan = planDoc.data();
    
    // Free plan has no cost — no order needed.
    if (plan.price === 0) {
      return res.status(400).json({ success: false, error: "Cannot create order for free plan" });
    }

    // Razorpay works in the smallest currency unit (paise for INR; 1 INR = 100 paise).
    const amountInPaise = Math.round(Number(plan.price) * 100);

    const receiptId = `sub_${technicianId.substring(0, 8)}_${Date.now()}`;
    const order = await razorpayService.createOrder(amountInPaise, receiptId, {
      technicianId,
      planId
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: (process.env.RAZORPAY_KEY_ID || 'rzp_test_T7A8g7ghSgCUE5').trim() // Sent to frontend for the checkout modal
    });
  } catch (error) {
    console.error("❌ Subscription Create Order Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/subscriptions/verify — Verifies Razorpay signature and activates the subscription.
// This is the critical step: HMAC signature check proves the payment was genuine.
router.post('/verify', async (req, res) => {
  try {
    const { technicianId, planId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
       return res.status(400).json({ success: false, message: 'Missing payment signature' });
    }

    // Verifies that orderId+paymentId signed with our secret matches Razorpay's signature.
    // Prevents tampering — someone can't fake a successful payment without the secret.
    const isValid = razorpayService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
       return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const planDoc = await db.collection('subscription_plans').doc(planId).get();
    if (!planDoc.exists) return res.status(404).json({ success: false, error: "Plan not found" });
    const plan = planDoc.data();

    // Activate the subscription for 30 days, resetting the bookingsUsed counter on upgrade.
    const newSub = {
      technicianId,
      planId,
      planName: plan.name,
      bookingLimit: plan.bookingLimit,
      bookingsUsed: 0, // Reset on plan upgrade so quota starts fresh
      priorityMultiplier: plan.priorityMultiplier,
      paymentStatus: 'active',
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await db.collection('technician_subscriptions').doc(technicianId).set(newSub);
    
    // Sync subscription plan info to users & technicians collections for the Admin Revenue Intel Dashboard.
    try {
      const updateData = {
        subscriptionPlan: planId,
        expiresAt: newSub.expiresAt,
        updatedAt: newSub.updatedAt
      };
      try { await db.collection('users').doc(technicianId).update(updateData); } catch (e) {}
      try { await db.collection('technicians').doc(technicianId).update(updateData); } catch (e) {}
    } catch (syncErr) {
      console.warn("Could not sync upgraded plan to users/technicians:", syncErr.message);
    }
    
    // Write a ledger entry for admin revenue tracking and audit trails.
    const ledgerRef = db.collection('admin_ledgers').doc();
    await ledgerRef.set({
      type: 'SUBSCRIPTION',
      technicianId: technicianId,
      planId: planId,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      grossAmount: plan.price,
      status: 'COMPLETED',
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, subscription: newSub });
  } catch (error) {
    console.error("❌ Verify Subscription Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
