const twilio = require('twilio');
require('dotenv').config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Normalizes phone numbers to E.164 format
 * Specifically handles Indian numbers (10 digits) by adding +91
 */
function normalizePhone(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
  return phone.startsWith('+') ? phone : `+${cleaned}`;
}

const templates = {
  bookingConfirmed: (data) => ({
    sms: `FIXNOW: Your ${data.category} booking #${(data.id || '').slice(-6).toUpperCase()} is confirmed! Tech: ${data.technician_name || data.techName || 'Assigned soon'}.`,
    whatsapp: `Your ${data.category} booking *#${(data.id || '').slice(-6).toUpperCase()}* is confirmed! 👷 Technician: *${data.technician_name || data.techName || 'Assigned soon'}*.`,
    push: { title: 'Booking Confirmed', body: `Your ${data.category} service is confirmed.` }
  }),
  technicianAssigned: (data) => ({
    sms: `FIXNOW: ${data.technician_name || data.techName} has been assigned to your booking #${(data.id || '').slice(-6).toUpperCase()}. ETA: ${data.last_eta || data.eta || 'Calculating...'}`,
    whatsapp: `*${data.technician_name || data.techName}* has been assigned to your booking *#${(data.id || '').slice(-6).toUpperCase()}*. ⏱️ ETA: *${data.last_eta || data.eta || 'Calculating...'}*`,
    push: { title: 'Technician Assigned', body: `${data.technician_name || data.techName} is on the way!` }
  }),
  technicianArrived: (data) => ({
    sms: `FIXNOW: Your technician ${data.technician_name || data.techName} has arrived! Share OTP ${data.otp} to start.`,
    whatsapp: `Your technician *${data.technician_name || data.techName}* has arrived! 🔑 Share OTP: *${data.otp}* to start the service.`,
    push: { title: 'Technician Arrived', body: 'Share your OTP to begin the service.' }
  }),
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
  })
};

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

async function sendWhatsApp(to, message, contentSid = null, contentVariables = null) {
  try {
    const normalizedTo = normalizePhone(to);
    if (!normalizedTo) return { success: false, error: 'Invalid phone number' };

    const options = {
      from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
      to: `whatsapp:${normalizedTo}`
    };

    if (contentSid) {
      options.contentSid = contentSid;
      options.contentVariables = contentVariables;
    } else {
      options.body = message;
    }

    const result = await client.messages.create(options);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('WhatsApp Send Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendPush(token, title, body, data = {}) {
  // Push notifications via Supabase or web-push can be added later
  // For now, log and return
  if (!token) return { success: false, error: 'No push token' };
  console.log(`📲 Push notification queued: [${title}] ${body}`);
  return { success: false, error: 'Push via Supabase not yet configured' };
}

async function notifyUser(userId, type, data) {
  const template = templates[type] ? templates[type](data) : null;
  if (!template) return console.error('Invalid notification type:', type);

  // Fetch user profile from DB to get phone
  const { db } = require('../../config/firebaseAdmin');
  let recipientPhone = data.phone || data.contact_number;
  let pushToken = data.fcm_token;

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

  // Validation for production: ensure we have a phone number
  if (!recipientPhone) {
    console.warn(`⚠️ Notification abort: No phone number found for user ${userId || 'anonymous'}`);
    // Only continue if we have a push token as an alternative
    if (!pushToken) return [];
  }

  recipientPhone = normalizePhone(recipientPhone); 

  console.log(`🔔 Sending ${type} notifications to user ${userId} (${recipientPhone || 'PUSH ONLY'})...`);

  const results = await Promise.allSettled([
    sendSMS(recipientPhone, template.sms),
    sendWhatsApp(recipientPhone, template.whatsapp),
    pushToken ? sendPush(pushToken, template.push.title, template.push.body, { bookingId: data.id }) : Promise.resolve({ success: false, error: 'No token' })
  ]);

  // Log to Database & Create In-App Notification
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
