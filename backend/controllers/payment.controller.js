const razorpayService = require('../services/razorpay.service');
const { db } = require('../config/firebaseAdmin');

class PaymentController {
  /**
   * Creates a Razorpay Order for a specific booking.
   * Calculates the exact payable amount securely from the backend.
   */
  async createOrder(req, res) {
    try {
      const { bookingId } = req.body;
      if (!bookingId) {
        return res.status(400).json({ success: false, message: 'bookingId is required' });
      }

      const bookingRef = db.collection('bookings').doc(bookingId);
      const bookingDoc = await bookingRef.get();

      if (!bookingDoc.exists) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      const bookingData = bookingDoc.data();

      // Ensure the booking is unpaid
      if (bookingData.payment_status === 'Paid' || bookingData.paymentStatus === 'Paid') {
        return res.status(400).json({ success: false, message: 'Booking is already paid' });
      }

      // Calculate amount (using totalAmount or total_amount)
      const rawAmount = bookingData.totalAmount || bookingData.total_amount;
      if (!rawAmount || rawAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid booking amount' });
      }

      // Convert to paise (Razorpay expects smallest currency unit)
      const amountInPaise = Math.round(Number(rawAmount) * 100);

      // Create Order via Service
      const order = await razorpayService.createOrder(amountInPaise, bookingId, {
        customerId: bookingData.customer_id,
        technicianId: bookingData.technician_id,
        category: bookingData.category
      });

      // Update Firestore with the new order ID and pending status
      await bookingRef.update({
        razorpayOrderId: order.id,
        paymentStatus: 'Pending', // Setting to pending as order is created but not paid
        payment_status: 'Pending'
      });

      return res.status(200).json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID // Send key ID for frontend checkout
      });
    } catch (error) {
      console.error('❌ Create Order Error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
  }

  /**
   * Verifies the Razorpay signature and finalizes the payment.
   * Disburses funds into technician wallet and creates an admin ledger entry.
   */
  async verifyPayment(req, res) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
        return res.status(400).json({ success: false, message: 'Missing required payment verification parameters' });
      }

      // 1. Verify cryptographic signature
      const isValid = razorpayService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature' });
      }

      // 2. Fetch booking
      const bookingRef = db.collection('bookings').doc(bookingId);
      const bookingDoc = await bookingRef.get();
      if (!bookingDoc.exists) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      const bookingData = bookingDoc.data();
      
      // Prevent duplicate processing
      if (bookingData.payment_status === 'Paid') {
        return res.status(200).json({ success: true, message: 'Payment already processed' });
      }

      // 3. Financial Splits (Phase 5 & 6)
      // Example: 15% Platform Commission + 18% GST on Commission
      const rawAmount = Number(bookingData.totalAmount || bookingData.total_amount);
      const commissionRate = 0.15;
      const commission = Number((rawAmount * commissionRate).toFixed(2));
      const gst = Number((commission * 0.18).toFixed(2));
      const technicianAmount = Number((rawAmount - commission - gst).toFixed(2));

      // Fetch payment details from Razorpay to confirm captured status
      const paymentDetails = await razorpayService.fetchPayment(razorpay_payment_id);
      if (paymentDetails.status !== 'captured') {
         // If it's authorized but not captured, we might need to manually capture it depending on account settings
         // For now, assuming auto-capture is enabled in Razorpay settings
         console.warn(`Payment ${razorpay_payment_id} status is ${paymentDetails.status}, expected 'captured'`);
      }

      // 4. Batch write to Firestore for atomicity
      const batch = db.batch();

      // Update Booking
      batch.update(bookingRef, {
        paymentStatus: 'Paid',
        payment_status: 'Paid',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paidAt: new Date().toISOString()
      });

      // Update Technician Earnings
      if (bookingData.technician_id) {
        const techRef = db.collection('users').doc(bookingData.technician_id);
        const techDoc = await techRef.get();
        if (techDoc.exists) {
           const currentEarnings = Number(techDoc.data().earnings || 0);
           batch.update(techRef, {
             earnings: currentEarnings + technicianAmount
           });

           // Wallet Transaction Log
           const walletRef = db.collection('users').doc(bookingData.technician_id).collection('wallet_transactions').doc();
           batch.set(walletRef, {
             bookingId: bookingId,
             paymentId: razorpay_payment_id,
             type: 'CREDIT',
             amount: technicianAmount,
             description: `Payment for booking ${bookingId}`,
             timestamp: new Date().toISOString()
           });
        }
      }

      // Admin Ledger Entry
      const ledgerRef = db.collection('admin_ledgers').doc();
      batch.set(ledgerRef, {
        bookingId: bookingId,
        customerId: bookingData.customer_id,
        technicianId: bookingData.technician_id,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        grossAmount: rawAmount,
        commission: commission,
        gst: gst,
        technicianAmount: technicianAmount,
        status: 'COMPLETED',
        timestamp: new Date().toISOString()
      });

      await batch.commit();

      // Emit real-time socket event if io is available
      const io = req.app.get('io');
      if (io) {
        io.to(`booking_${bookingId}`).emit('payment_success', {
          bookingId,
          paymentId: razorpay_payment_id
        });
      }

      return res.status(200).json({ success: true, message: 'Payment verified and processed successfully' });
    } catch (error) {
      console.error('❌ Verify Payment Error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
  }

  /**
   * Handles Razorpay Webhooks.
   */
  async handleWebhook(req, res) {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET; // Optional, configure in dashboard
      
      // If webhook secret is configured, verify signature
      if (webhookSecret) {
         const signature = req.headers['x-razorpay-signature'];
         const isValid = razorpayService.verifyWebhookSignature(req.rawBody || JSON.stringify(req.body), signature, webhookSecret);
         if (!isValid) {
            return res.status(400).send('Invalid webhook signature');
         }
      }

      const event = req.body.event;
      const payload = req.body.payload;

      console.log(`🔔 Razorpay Webhook Received: ${event}`);

      switch (event) {
        case 'payment.captured':
          // Handle payment success out-of-band if frontend dropped
          // (Can extract order_id and payment_id from payload.payment.entity)
          break;
        case 'payment.failed':
          // Handle failed payment, notify customer
          break;
        case 'refund.processed':
          // Handle successful refund
          break;
      }

      // Always return 200 OK to acknowledge receipt
      res.status(200).send('OK');
    } catch (error) {
      console.error('❌ Webhook Error:', error);
      res.status(500).send('Webhook Error');
    }
  }

  /**
   * Processes a refund for a cancelled booking.
   */
  async refundPayment(req, res) {
    try {
      const { bookingId } = req.body;
      if (!bookingId) {
        return res.status(400).json({ success: false, message: 'bookingId is required' });
      }

      const bookingRef = db.collection('bookings').doc(bookingId);
      const bookingDoc = await bookingRef.get();

      if (!bookingDoc.exists) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      const bookingData = bookingDoc.data();

      // Ensure the booking is Paid and Cancelled
      if (bookingData.payment_status !== 'Paid' && bookingData.paymentStatus !== 'Paid') {
        return res.status(400).json({ success: false, message: 'Only paid bookings can be refunded' });
      }

      if (bookingData.status !== 'Cancelled') {
        return res.status(400).json({ success: false, message: 'Booking must be cancelled to process a refund' });
      }

      if (!bookingData.razorpayPaymentId) {
        return res.status(400).json({ success: false, message: 'Missing Razorpay Payment ID on booking' });
      }

      // Initiate refund through Razorpay
      const refund = await razorpayService.refundPayment(bookingData.razorpayPaymentId, null, {
        bookingId: bookingId,
        customerId: bookingData.customer_id
      });

      // Update Firestore
      await bookingRef.update({
        paymentStatus: 'Refunded',
        payment_status: 'Refunded',
        refundId: refund.id,
        refundedAt: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        refundId: refund.id
      });

    } catch (error) {
      console.error('❌ Process Refund Error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
  }

  // ==========================================
  // PRODUCTION BOOKING FLOW (PRE-BOOKING PAY)
  // ==========================================

  /**
   * 1. Create Order for a booking that hasn't been created in Firestore yet.
   * Calculates the exact payable amount securely from the backend.
   */
  async createBookingOrder(req, res) {
    try {
      const { estimatedCostRange, customerId, technicianId, category } = req.body;
      
      // Calculate amount securely on backend based on estimated cost range
      // e.g. "499-999" -> 499
      let rawAmount = 499; // Fallback
      if (estimatedCostRange) {
        const firstPart = String(estimatedCostRange).split('-')[0].replace(/[^\d.]/g, '');
        const parsed = parseFloat(firstPart);
        if (!isNaN(parsed) && parsed > 0) {
          rawAmount = parsed;
        }
      }

      if (!rawAmount || rawAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid booking amount calculated' });
      }

      // Convert to paise (Razorpay expects smallest currency unit)
      const amountInPaise = Math.round(Number(rawAmount) * 100);
      const tempReceiptId = `tmp_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;

      // Create Order via Service
      const order = await razorpayService.createOrder(amountInPaise, tempReceiptId, {
        customerId,
        technicianId,
        category,
        isPreBooking: "true"
      });

      return res.status(200).json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID // Send key ID for frontend checkout
      });
    } catch (error) {
      console.error('❌ Create Booking Order Error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
  }

  /**
   * 2. Verifies the Razorpay signature, creates the booking, assigns technician.
   */
  async verifyBookingOrder(req, res) {
    try {
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature, 
        bookingPayload 
      } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingPayload) {
        return res.status(400).json({ success: false, message: 'Missing required payment verification parameters' });
      }

      // 1. Verify cryptographic signature
      const isValid = razorpayService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature' });
      }

      // 2. Fetch payment details from Razorpay to confirm captured status & get amount
      const paymentDetails = await razorpayService.fetchPayment(razorpay_payment_id);
      if (paymentDetails.status !== 'captured') {
         console.warn(`Payment ${razorpay_payment_id} status is ${paymentDetails.status}, expected 'captured'`);
      }
      
      const paidAmount = Number(paymentDetails.amount) / 100;

      // Ensure customer name is retrieved and stored properly
      let customerName = bookingPayload.customerName;
      if (!customerName && bookingPayload.customerId) {
        try {
          const userDoc = await db.collection('users').doc(bookingPayload.customerId).get();
          if (userDoc.exists) {
            customerName = userDoc.data()?.name || userDoc.data()?.fullName || 'Valued Customer';
          }
        } catch (e) {
          console.warn("Failed to fetch customer name for booking:", e.message);
        }
      }
      if (!customerName) customerName = 'Valued Customer';

      // 3. Create the Booking in Firestore
      const bookingId = 'BK_' + Date.now();
      const now = new Date().toISOString();
      const otp = Math.floor(1000 + Math.random() * 9000).toString();

      const bookingRef = db.collection('bookings').doc(bookingId);
      
      const bookingData = { 
        id: bookingId, 
        status: 'Pending',
        category: bookingPayload.category || '',
        
        // Dates (dual format)
        created_at: now,
        createdAt: now,
        updated_at: now,
        updatedAt: now,
        
        // Payment (dual format)
        payment_status: 'Paid',
        paymentStatus: 'Paid',
        payment_mode: 'Online',
        paymentMode: 'Online',
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpaySignature: razorpay_signature,
        paidAt: now,
        totalAmount: paidAmount,
        total_amount: paidAmount,
        
        // Customer info
        customer_id: bookingPayload.customerId || 'guest',
        customerId: bookingPayload.customerId || 'guest',
        customer_name: customerName,
        customerName: customerName,
        contact_number: bookingPayload.contactNumber || '',
        contactNumber: bookingPayload.contactNumber || '',
        
        // Address & location
        address: bookingPayload.address || '',
        customer_lat: bookingPayload.customerLat || null,
        customerLat: bookingPayload.customerLat || null,
        customer_lng: bookingPayload.customerLng || null,
        customerLng: bookingPayload.customerLng || null,
        
        // Service info
        estimated_cost_range: bookingPayload.estimatedCostRange || '',
        estimatedCostRange: bookingPayload.estimatedCostRange || '',
        issue_description: bookingPayload.issueDescription || bookingPayload.technicalTerms || '',
        issueDescription: bookingPayload.issueDescription || bookingPayload.technicalTerms || '',
        serviceSpecs: bookingPayload.serviceSpecs || null,
        service_time: bookingPayload.serviceTime || '',
        serviceTime: bookingPayload.serviceTime || '',
        
        // Technician (ONLY assign selected technician, never broadcast for direct paid bookings)
        technician_id: bookingPayload.technicianId || '',
        technicianId: bookingPayload.technicianId || '',
        technician_name: bookingPayload.technicianName || '',
        technicianName: bookingPayload.technicianName || '',
        
        // Operations
        otp: otp
      };

      const batch = db.batch();
      batch.set(bookingRef, bookingData);

      // Log Transaction History
      const txnRef = db.collection('paymentTransactions').doc(razorpay_payment_id);
      batch.set(txnRef, {
        id: razorpay_payment_id,
        bookingId: bookingId,
        orderId: razorpay_order_id,
        customerId: bookingPayload.customerId,
        technicianId: bookingPayload.technicianId,
        amount: paidAmount,
        status: 'SUCCESS',
        method: 'RAZORPAY',
        createdAt: now
      });
      
      await batch.commit();

      // Notifications
      const { notifyUser } = require('../services/notification.service');
      // Notify technician about the assigned paid booking
      if (bookingData.technicianId) {
        notifyUser(bookingData.technicianId, 'bookingAssigned', bookingData);
        const io = req.app.get('io');
        if (io) {
           io.to(`tech_${bookingData.technicianId}`).emit('new_assigned_booking', bookingData);
        }
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Payment verified and booking created',
        bookingId: bookingId,
        booking: bookingData 
      });
    } catch (error) {
      console.error('❌ Verify Booking Order Error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
  }

  /**
   * Admin approves a pending refund request
   */
  async approveRefundRequest(req, res) {
    try {
      const { id } = req.params; // refund request doc ID

      const refundReqRef = db.collection('refundRequests').doc(id);
      const refundReqDoc = await refundReqRef.get();

      if (!refundReqDoc.exists) {
        return res.status(404).json({ success: false, message: 'Refund request not found' });
      }

      const refundData = refundReqDoc.data();
      if (refundData.refundStatus !== 'Pending') {
        return res.status(400).json({ success: false, message: 'Refund is not pending' });
      }

      const bookingId = refundData.bookingId;
      const paymentId = refundData.paymentId;

      // Initiate refund via Razorpay
      const refund = await razorpayService.refundPayment(paymentId, null, {
        bookingId: bookingId,
        customerId: refundData.customerId
      });

      const now = new Date().toISOString();
      const batch = db.batch();

      // Update refund request
      batch.update(refundReqRef, {
        refundStatus: 'Completed',
        refundId: refund.id,
        refundedAt: now,
        updatedAt: now
      });

      // Update booking status
      const bookingRef = db.collection('bookings').doc(bookingId);
      batch.update(bookingRef, {
        paymentStatus: 'Refunded',
        payment_status: 'Refunded',
        status: 'Cancelled', // finalize cancel
        updatedAt: now,
        updated_at: now
      });

      // Add to admin audit logs
      const auditRef = db.collection('adminAuditLogs').doc();
      batch.set(auditRef, {
        action: 'APPROVE_REFUND',
        refundRequestId: id,
        bookingId: bookingId,
        adminId: req.user ? req.user.uid : 'admin',
        timestamp: now
      });

      await batch.commit();
      
      const { notifyUser } = require('../services/notification.service');
      notifyUser(refundData.customerId, 'refundCompleted', { id: bookingId });

      return res.status(200).json({ success: true, message: 'Refund approved successfully' });
    } catch (error) {
      console.error('❌ Approve Refund Error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
  }

  /**
   * Admin rejects a pending refund request
   */
  async rejectRefundRequest(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const refundReqRef = db.collection('refundRequests').doc(id);
      const refundReqDoc = await refundReqRef.get();

      if (!refundReqDoc.exists) {
         return res.status(404).json({ success: false, message: 'Refund request not found' });
      }

      const refundData = refundReqDoc.data();
      if (refundData.refundStatus !== 'Pending') {
         return res.status(400).json({ success: false, message: 'Refund is not pending' });
      }

      const now = new Date().toISOString();
      const batch = db.batch();

      batch.update(refundReqRef, {
        refundStatus: 'Rejected',
        rejectReason: reason || 'Policy violation',
        updatedAt: now
      });

      const auditRef = db.collection('adminAuditLogs').doc();
      batch.set(auditRef, {
        action: 'REJECT_REFUND',
        refundRequestId: id,
        bookingId: refundData.bookingId,
        reason: reason || 'Policy violation',
        adminId: req.user ? req.user.uid : 'admin',
        timestamp: now
      });

      await batch.commit();

      return res.status(200).json({ success: true, message: 'Refund rejected successfully' });
    } catch (error) {
      console.error('❌ Reject Refund Error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
  }
}

module.exports = new PaymentController();
