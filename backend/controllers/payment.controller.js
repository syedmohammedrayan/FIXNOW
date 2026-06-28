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
}

module.exports = new PaymentController();
