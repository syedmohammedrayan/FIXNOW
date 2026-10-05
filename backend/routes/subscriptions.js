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
        bookingLimit: 5,
        priorityMultiplier: 1.0,
        features: ['Standard AI ranking', 'Basic analytics', '5 referrals/month']
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

// GET /api/subscriptions/:technicianId — Returns the technician's active subscription with expiry check.
router.get('/:technicianId', async (req, res) => {
  try {
    const { technicianId } = req.params;
    const docRef = await db.collection('technician_subscriptions').doc(technicianId).get();
    
    // Default free plan issued when no subscription record exists (new technician signup).
    const defaultFreeSub = {
      technicianId,
      planId: 'free',
      planName: 'Free Plan',
      bookingLimit: 5,
      bookingsUsed: 0,
      priorityMultiplier: 1.0,
      paymentStatus: 'active',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };

    if (docRef.exists) {
      const sub = docRef.data();
      
      // Auto-expire: if the subscription date has passed, lock the technician out of new bookings.
      if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
        const expiredSub = {
          ...sub,
          paymentStatus: 'expired',
          bookingLimit: 0, // Blocks all new bookings until they renew
          bookingsUsed: 0
        };
        await db.collection('technician_subscriptions').doc(technicianId).set(expiredSub);
        return res.json({ success: true, subscription: expiredSub, message: "Subscription expired. Please purchase a new plan." });
      }

      res.json({ success: true, subscription: sub });
    } else {
      // Create a free plan record so the technician can start receiving bookings immediately.
      await db.collection('technician_subscriptions').doc(technicianId).set(defaultFreeSub);
      
      try {
        // Sync plan info to both users and technicians collections for the Admin dashboard.
        const updateData = { subscriptionPlan: 'free', expiresAt: defaultFreeSub.expiresAt };
        await db.collection('users').doc(technicianId).update(updateData);
        await db.collection('technicians').doc(technicianId).update(updateData);
      } catch (e) {
        console.warn('Failed to sync default plan to users:', e.message);
      }

      res.json({ success: true, subscription: defaultFreeSub });
    }
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
      keyId: process.env.RAZORPAY_KEY_ID // Sent to frontend for the checkout modal
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
