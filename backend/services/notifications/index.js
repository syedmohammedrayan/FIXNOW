// Twilio SDK sends SMS and WhatsApp messages using the FixNow Twilio account.
const twilio = require('twilio');
require('dotenv').config();

// Single authenticated Twilio client shared across all notification calls.
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Normalises phone numbers to E.164 format (required by Twilio).
 * Handles Indian numbers (10 digits → +91XXXXXXXXXX) and already-formatted numbers.
 */
function normalizePhone(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, ''); // Strip all non-digit characters
  
  // If user entered 0 + 10-digit number (e.g. 06305097299), strip the 0
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  if (cleaned.length === 10) return `+91${cleaned}`;         // 10-digit Indian number
  if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`; // 91XXXXXXXXXX
  return phone.startsWith('+') ? phone : `+${cleaned}`;
}

// Notification templates — each booking lifecycle event has SMS, WhatsApp, and push variants.
// Keeping templates here makes copy changes a single file edit rather than a code hunt.
const templates = {
  // Sent when the customer confirms a booking and the system records it.
  bookingConfirmed: (data) => ({
    sms: `FIXNOW: Your ${data.category} booking #${(data.id || '').slice(-6).toUpperCase()} is confirmed! Tech: ${data.technician_name || data.techName || 'Assigned soon'}.`,
    whatsapp: `Your ${data.category} booking *#${(data.id || '').slice(-6).toUpperCase()}* is confirmed! 👷 Technician: *${data.technician_name || data.techName || 'Assigned soon'}*.`,
    push: { title: 'Booking Confirmed', body: `Your ${data.category} service is confirmed.` }
  }),
  // Sent when a specific technician accepts the broadcast or is directly assigned.
  technicianAssigned: (data) => ({
    sms: `FIXNOW: ${data.technician_name || data.techName} has been assigned to your booking #${(data.id || '').slice(-6).toUpperCase()}. ETA: ${data.last_eta || data.eta || 'Calculating...'}`,
    whatsapp: `*${data.technician_name || data.techName}* has been assigned to your booking *#${(data.id || '').slice(-6).toUpperCase()}*. ⏱️ ETA: *${data.last_eta || data.eta || 'Calculating...'}*`,
    push: { title: 'Technician Assigned', body: `${data.technician_name || data.techName} is on the way!` }
  }),
  // Sent when the technician marks status 'Arrived' — OTP is included to verify physical arrival.
  technicianArrived: (data) => ({
    sms: `FIXNOW: Your technician ${data.technician_name || data.techName} has arrived! Share OTP ${data.otp} to start.`,
    whatsapp: `Your technician *${data.technician_name || data.techName}* has arrived! 🔑 Share OTP: *${data.otp}* to start the service.`,
    push: { title: 'Technician Arrived', body: 'Share your OTP to begin the service.' }
  }),
  // Sent on job completion with the formatted rupee amount due.
  serviceCompleted: (data) => {
    const amount = Number(data.total_amount || data.amount || data.estimatedCostRange?.split('-')[0] || 0);
    const formattedAmount = amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return {
      sms: `FIXNOW: Service completed! Final amount: ₹${formattedAmount}. Please rate us!`,
      whatsapp: `Service completed! ✅ Final amount: *₹${formattedAmount}*. Thank you for using FIXNOW!`,
      push: { title: 'Service Completed', body: `Please settle the payment of ₹${formattedAmount} and rate your experience.` }
    };
  },
  serviceStarted: (data) => ({
    sms: `FIXNOW: Service started for booking #${(data.id || '').slice(-6).toUpperCase()}!`,
    whatsapp: `Service started for booking *#${(data.id || '').slice(-6).toUpperCase()}*! 🛠️ Your technician is now working.`,
    push: { title: 'Service Started', body: 'The technician has begun working.' }
  }),
  bookingDeclined: (data) => ({
    sms: `FIXNOW: Your booking #${(data.id || '').slice(-6).toUpperCase()} was declined. Please try another technician.`,
    whatsapp: `Your booking *#${(data.id || '').slice(-6).toUpperCase()}* was declined by the technician. ❌ Please try booking someone else.`,
    push: { title: 'Booking Declined', body: 'The technician is unavailable. Try another?' }
  }),
  serviceCancelled: (data) => ({
    sms: `FIXNOW: Your booking #${(data.id || '').slice(-6).toUpperCase()} has been cancelled.`,
    whatsapp: `Your booking *#${(data.id || '').slice(-6).toUpperCase()}* has been cancelled. ⚠️`,
    push: { title: 'Booking Cancelled', body: 'The service booking was cancelled.' }
  }),
  complaintReview: (data) => ({
    sms: `FIXNOW: Technician ${data.technicianName} will check for the complaint to resolve it soon.`,
    whatsapp: `Technician *${data.technicianName}* will check for the complaint to resolve it soon. 🛠️`,
    push: { title: 'Complaint Under Review', body: `${data.technicianName} is reviewing your complaint.` }
  }),
  complaintResolved: (data) => ({
    sms: `FIXNOW: Your complaint for booking #${(data.id || '').slice(-6).toUpperCase()} has been resolved by ${data.technicianName}. Thank you for your patience!`,
    whatsapp: `Your complaint for booking *#${(data.id || '').slice(-6).toUpperCase()}* has been resolved by *${data.technicianName}*. ✅ Thank you for your patience!`,
    push: { title: 'Complaint Resolved', body: `Technician ${data.technicianName} has resolved your complaint.` }
  }),
  // paymentRequested: sent when the technician finishes and asks the customer to pay the balance.
  paymentRequested: (data) => {
    const amount = Number(data.totalAmount || data.amount || 0);
    const formattedAmount = amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    // Deep-link into the customer dashboard so the customer lands directly on the payment page.
    const link = `https://fixnow.app/customer/dashboard?booking=${data.id}`;
    return {
      sms: `FIXNOW: Payment requested for booking #${(data.id || '').slice(-6).toUpperCase()}. Amount due: ₹${formattedAmount}. Tap to pay via UPI or Card: ${link}`,
      whatsapp: `Payment requested for booking *#${(data.id || '').slice(-6).toUpperCase()}*. 💳 Amount due: *₹${formattedAmount}*. Tap to pay via UPI or Card: ${link}`,
      push: { title: 'Payment Required', body: `Please settle the payment of ₹${formattedAmount} to complete the service.` }
    };
  }
};

// Sends an SMS via Twilio's messages API.
async function sendSMS(to, message) {
  try {
    if (!process.env.TWILIO_PHONE) return { success: false, error: 'No Twilio phone configured' };
    const normalizedTo = normalizePhone(to);
    if (!normalizedTo) return { success: false, error: 'Invalid phone number' };

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: normalizedTo
    });
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('SMS Send Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Sends a WhatsApp message via Twilio. Uses Twilio's WhatsApp sandbox number in development.
// The 'whatsapp:' prefix is required by Twilio's WhatsApp API to distinguish from regular SMS.
async function sendWhatsApp(to, message, contentSid = null, contentVariables = null) {
  try {
    const normalizedTo = normalizePhone(to);
    if (!normalizedTo) return { success: false, error: 'Invalid phone number' };

    const options = {
      from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
      to: `whatsapp:${normalizedTo}`
    };

    if (contentSid) {
      // Template-based WhatsApp messages (WhatsApp Business API approved templates).
      options.contentSid = contentSid;
      options.contentVariables = contentVariables;
    } else {
      // Free-form text messages (only allowed during 24h session window).
      options.body = message;
    }

    const result = await client.messages.create(options);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('WhatsApp Send Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Push notifications are a stub — FCM/Supabase web push integration can be added here later.
async function sendPush(token, title, body, data = {}) {
  if (!token) return { success: false, error: 'No push token' };
  console.log(`📲 Push notification queued: [${title}] ${body}`);
  return { success: false, error: 'Push via Supabase not yet configured' };
}

/**
 * notifyUser — the main entrypoint for all notifications in the system.
 * Fetches the user's phone from Firestore if not provided in data,
 * then fires SMS + WhatsApp + push notifications in parallel using Promise.allSettled.
 * Promise.allSettled (vs Promise.all) ensures one channel failing doesn't block the others.
 */
async function notifyUser(userId, type, data) {
  const template = templates[type] ? templates[type](data) : null;
  if (!template) return console.error('Invalid notification type:', type);

  // Lazily require firebaseAdmin to avoid circular dependency at module load time.
  const { db } = require('../../config/firebaseAdmin');
  let recipientPhone = data.phone || data.contact_number;
  let pushToken = data.fcm_token;

  // If phone or push token is missing, look them up in the user's Firestore document.
  if (userId && (!recipientPhone || !pushToken)) {
    try {
      const uDoc = await db.collection('users').doc(userId).get();
      const userData = uDoc.exists ? uDoc.data() : null;
      if (userData) {
        recipientPhone = recipientPhone || userData.phone;
        pushToken = pushToken || userData.fcm_token;
      }
    } catch (e) {
      console.error('Failed to fetch user for notification:', e.message);
    }
  }

  if (!recipientPhone) {
    console.warn(`⚠️ Notification abort: No phone number found for user ${userId || 'anonymous'}`);
    // Only continue if we have a push token as an alternative channel.
    if (!pushToken) return [];
  }

  recipientPhone = normalizePhone(recipientPhone); 

  console.log(`🔔 Sending ${type} notifications to user ${userId} (${recipientPhone || 'PUSH ONLY'})...`);

  // Send all three channels concurrently; individual failures are caught per-channel.
  const results = await Promise.allSettled([
    sendSMS(recipientPhone, template.sms),
    sendWhatsApp(recipientPhone, template.whatsapp),
    pushToken ? sendPush(pushToken, template.push.title, template.push.body, { bookingId: data.id }) : Promise.resolve({ success: false, error: 'No token' })
  ]);

  // Persist a notification record in Firestore for in-app notification center.
  try {
    await db.collection('notification_logs').add({
      user_id: userId,
      type,
      booking_id: data.id,
      timestamp: new Date().toISOString(),
      channels: {
        sms: results[0],
        whatsapp: results[1],
        push: results[2]
      }
    });

    // In-app notification for the customer's notification centre (bell icon in the UI).
    const notif = {
      id: 'NOTIF_' + Date.now(),
      user_id: userId,
      type,
      title: template.push.title,
      message: template.push.body,
      booking_id: data.id,
      read: false,
      created_at: new Date().toISOString()
    };
    await db.collection('notifications').doc(notif.id).set(notif);
  } catch (err) {
    console.error('Notification DB Log failed:', err.message);
  }

  return results;
}

module.exports = { notifyUser, templates };
