const express = require('express');
const router = express.Router();
// Razorpay payment business logic lives in the controller to keep the route thin.
const paymentController = require('../controllers/payment.controller');

// ── Razorpay Payment Flow ──
// Phase 1: Frontend calls create-order → backend creates a Razorpay order with amount.
router.post('/create-order', paymentController.createOrder);

// Phase 2: After user pays, Razorpay redirects; frontend sends IDs here to verify the signature.
router.post('/verify', paymentController.verifyPayment);

// Razorpay webhook: receives server-to-server payment events (charge.failed, payment.captured).
// Note: full webhook accuracy requires a raw body parser to verify the HMAC signature correctly.
router.post('/webhook', paymentController.handleWebhook);

// Initiate a refund for a payment that was previously captured.
router.post('/refund', paymentController.refundPayment);

// ── Production Booking Payment Flow ──

// Step 1: Customer confirms booking → create a 10% advance Razorpay order.
router.post('/create-booking-order', paymentController.createBookingOrder);

// Step 2: Verify the 10% advance payment; on success, create the booking in Firestore.
router.post('/verify-booking', paymentController.verifyBookingOrder);

// Step 3: After service completion, create a Razorpay order for the remaining 90% balance.
router.post('/create-balance-order', paymentController.createBalanceOrder);

// Step 4: Verify the balance payment and mark the booking as fully paid.
router.post('/verify-balance-payment', paymentController.verifyBalancePayment);

// Admin approves a customer's refund request and triggers the Razorpay refund API.
router.post('/refund-request/:id/approve', paymentController.approveRefundRequest);

// Admin rejects a customer's refund request with an explanation.
router.post('/refund-request/:id/reject', paymentController.rejectRefundRequest);

module.exports = router;
