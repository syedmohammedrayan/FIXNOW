const Razorpay = require('razorpay');
const crypto = require('crypto');

class RazorpayService {
  constructor() {
    this.key_id = process.env.RAZORPAY_KEY_ID;
    this.key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!this.key_id || !this.key_secret) {
      console.error("⚠️ Razorpay keys are missing from environment variables.");
    } else {
      this.razorpay = new Razorpay({
        key_id: this.key_id,
        key_secret: this.key_secret,
      });
    }
  }

  /**
   * Creates a new Razorpay Order.
   * @param {number} amountInPaise - Amount in smallest currency unit (e.g. paise).
   * @param {string} receiptId - Unique identifier for the transaction/booking.
   * @param {object} notes - Key-value pair for custom metadata.
   * @returns {Promise<object>} The created order object.
   */
  async createOrder(amountInPaise, receiptId, notes = {}) {
    if (!this.razorpay) throw new Error("Razorpay not initialized");
    try {
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId.toString(),
        notes: notes,
      };
      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (error) {
      console.error("❌ Razorpay Order Creation Error:", error);
      throw new Error(error.error?.description || error.message || "Failed to create order");
    }
  }

  /**
   * Verifies the HMAC SHA256 signature from Razorpay.
   * @param {string} orderId - The Razorpay order ID.
   * @param {string} paymentId - The Razorpay payment ID.
   * @param {string} signature - The signature sent by Razorpay.
   * @returns {boolean} True if signature is valid.
   */
  verifySignature(orderId, paymentId, signature) {
    if (!this.key_secret) throw new Error("Razorpay secret not configured");
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', this.key_secret)
      .update(body.toString())
      .digest('hex');
    
    return expectedSignature === signature;
  }

  /**
   * Verifies the HMAC SHA256 signature for webhooks.
   * @param {string} body - The raw request body string.
   * @param {string} signature - The x-razorpay-signature header.
   * @param {string} webhookSecret - The webhook secret configured in Razorpay dashboard.
   * @returns {boolean} True if webhook signature is valid.
   */
  verifyWebhookSignature(body, signature, webhookSecret) {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body.toString())
      .digest('hex');
    return expectedSignature === signature;
  }

  /**
   * Fetches payment details by payment ID.
   * @param {string} paymentId - The Razorpay payment ID.
   * @returns {Promise<object>} Payment details.
   */
  async fetchPayment(paymentId) {
    if (!this.razorpay) throw new Error("Razorpay not initialized");
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      console.error("❌ Razorpay Fetch Payment Error:", error);
      throw new Error(error.error?.description || error.message || "Failed to fetch payment");
    }
  }

  /**
   * Initiates a refund for a specific payment.
   * @param {string} paymentId - The Razorpay payment ID.
   * @param {number} amountInPaise - The amount to refund in paise (optional, defaults to full amount).
   * @param {object} notes - Custom metadata for the refund.
   * @returns {Promise<object>} Refund details.
   */
  async refundPayment(paymentId, amountInPaise = null, notes = {}) {
    if (!this.razorpay) throw new Error("Razorpay not initialized");
    try {
      const options = { notes };
      if (amountInPaise) options.amount = amountInPaise;
      
      const refund = await this.razorpay.payments.refund(paymentId, options);
      return refund;
    } catch (error) {
      console.error("❌ Razorpay Refund Error:", error);
      throw new Error(error.error?.description || error.message || "Failed to initiate refund");
    }
  }
}

module.exports = new RazorpayService();
