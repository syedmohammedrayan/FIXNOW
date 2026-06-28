const express = require('express');
const router = express.Router();
const { db } = require('../config/firebaseAdmin');

// Optional: Add Razorpay for real payments, currently simulating
// const Razorpay = require('razorpay');

// 1. Get all subscription plans
router.get('/plans', async (req, res) => {
  try {
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
        priorityMultiplier: 1.2,
        features: ['AI ranking visibility boost', 'Faster notifications', '22 referrals/month', '10% promotion of visibility to the customer (suitable)']
      },
      {
        id: 'elite',
        name: 'Elite Plan',
        price: 1499,
        bookingLimit: 9999, // unlimited
        priorityMultiplier: 1.5,
        features: ['Unlimited referrals', 'Premium badge', 'Highest AI visibility', 'Priority dispatch', '20% promotion of visibility to the customer (suitable)']
      }
    ];

    // Force overwrite in DB to ensure synchronization with new business rules
    for (const p of defaultPlans) {
      await db.collection('subscription_plans').doc(p.id).set(p);
    }
    
    // Also remove enterprise plan from DB if it exists
    await db.collection('subscription_plans').doc('enterprise').delete().catch(() => {});

    res.json({ success: true, plans: defaultPlans });
  } catch (error) {
    console.error("Fetch Plans Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Get technician's active subscription (with expiry check)
router.get('/:technicianId', async (req, res) => {
  try {
    const { technicianId } = req.params;
    const docRef = await db.collection('technician_subscriptions').doc(technicianId).get();
    
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
      
      // Expiry Check Logic
      if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
        // Expired -> Lockout state (must purchase new plan to get orders again)
        const expiredSub = {
          ...sub,
          paymentStatus: 'expired',
          bookingLimit: 0,
          bookingsUsed: 0
        };
        await db.collection('technician_subscriptions').doc(technicianId).set(expiredSub);
        return res.json({ success: true, subscription: expiredSub, message: "Subscription expired. Please purchase a new plan." });
      }

      res.json({ success: true, subscription: sub });
    } else {
      // Default to free plan if none exists
      await db.collection('technician_subscriptions').doc(technicianId).set(defaultFreeSub);
      
      try {
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

const razorpayService = require('../services/razorpay.service');

// 3. Create Subscription Order (Razorpay Phase 2)
router.post('/create-order', async (req, res) => {
  try {
    const { technicianId, planId } = req.body;
    
    const planDoc = await db.collection('subscription_plans').doc(planId).get();
    if (!planDoc.exists) return res.status(404).json({ success: false, error: "Plan not found" });
    const plan = planDoc.data();
    
    // Free plan bypasses Razorpay entirely
    if (plan.price === 0) {
      return res.status(400).json({ success: false, error: "Cannot create order for free plan" });
    }

    const amountInPaise = Math.round(Number(plan.price) * 100);

    const order = await razorpayService.createOrder(amountInPaise, `sub_${technicianId}_${Date.now()}`, {
      technicianId,
      planId
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("❌ Subscription Create Order Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Verify Subscription Payment (Razorpay Phase 4)
router.post('/verify', async (req, res) => {
  try {
    const { technicianId, planId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
       return res.status(400).json({ success: false, message: 'Missing payment signature' });
    }

    const isValid = razorpayService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
       return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const planDoc = await db.collection('subscription_plans').doc(planId).get();
    if (!planDoc.exists) return res.status(404).json({ success: false, error: "Plan not found" });
    const plan = planDoc.data();

    // Proceed to activate plan
    const newSub = {
      technicianId,
      planId,
      planName: plan.name,
      bookingLimit: plan.bookingLimit,
      bookingsUsed: 0, // reset on upgrade
      priorityMultiplier: plan.priorityMultiplier,
      paymentStatus: 'active',
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await db.collection('technician_subscriptions').doc(technicianId).set(newSub);
    
    // Synchronize to users & technicians collections for Admin Revenue Intel Dashboard
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
    
    // Add ledger entry for subscription purchase
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
