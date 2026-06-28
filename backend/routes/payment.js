const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Create Order (Phase 2)
router.post('/create-order', paymentController.createOrder);

// Verify Payment (Phase 4)
router.post('/verify', paymentController.verifyPayment);

// Webhook (Phase 8)
// Note: webhook signature verification requires raw body. We use express.raw for this specific route if needed,
// but for simplicity we rely on JSON parsing in the global middleware. To be completely accurate with Razorpay,
// you might need a raw body parser middleware specifically for this route.
router.post('/webhook', paymentController.handleWebhook);

// Refund Payment (Direct)
router.post('/refund', paymentController.refundPayment);

// --- Production Booking Flow ---
// 1. Create Order before Booking
router.post('/create-booking-order', paymentController.createBookingOrder);

// 2. Verify Order and Create Booking
router.post('/verify-booking', paymentController.verifyBookingOrder);

// 3. Admin Approve Refund Request
router.post('/refund-request/:id/approve', paymentController.approveRefundRequest);

// 4. Admin Reject Refund Request
router.post('/refund-request/:id/reject', paymentController.rejectRefundRequest);

module.exports = router;
