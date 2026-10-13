// Twilio SDK sends SMS and WhatsApp messages using the FixNow Twilio account.
const twilio = require('twilio');
require('dotenv').config();

// Single authenticated Twilio client shared across all notification calls.
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const nodemailer = require('nodemailer');

const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

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
  technicianArrived: (data) => {
    const otpCode = data.otp || '----';
    const techName = data.technician_name || data.technicianName || data.techName || 'Your technician';
    const serviceCategory = data.category || 'Service';
    return {
      sms: `FIXNOW: Your technician ${techName} has arrived! Your verification OTP is ${otpCode}. Share this code with the technician to begin your ${serviceCategory}. Do not share with anyone else.`,
      whatsapp: `*FIXNOW Service Verification*\n\nYour OTP code is: *${otpCode}*\n\nTechnician *${techName}* has arrived for your *${serviceCategory}*. Please share this 4-digit code with the technician to begin your service. Keep this code secure.`,
      push: { title: 'Technician Arrived', body: `Your OTP is ${otpCode}. Share it with ${techName} to begin service.` },
      email: { 
        subject: `FIXNOW: Technician Arrived - Your OTP is ${otpCode}`, 
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
            <div style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #ffffff;">FIXNOW</h1>
              <p style="margin: 5px 0 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255,255,255,0.9);">Technician Arrival Passcode</p>
            </div>
            <div style="padding: 30px 25px; text-align: center;">
              <p style="font-size: 16px; color: #94a3b8; margin: 0 0 20px;">Technician <strong style="color: #ffffff;">${techName}</strong> has arrived at your location for <strong style="color: #38bdf8;">${serviceCategory}</strong>.</p>
              <p style="font-size: 14px; color: #cbd5e1; margin: 0 0 15px;">Please provide the following 4-digit Passcode to the technician to commence the service:</p>
              <div style="background: rgba(16, 185, 129, 0.12); border: 2px dashed #10b981; border-radius: 16px; padding: 20px; margin: 20px auto; max-width: 240px;">
                <span style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #34d399; display: block; font-family: monospace;">${otpCode}</span>
                <span style="font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #6ee7b7;">Verification Code</span>
              </div>
              <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 15px; margin: 25px 0 0; text-align: left; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                <strong style="color: #f59e0b;">Important:</strong> Only share this code once the technician is physically present. Once entered, the service protocol starts and cannot be cancelled.
              </div>
            </div>
            <div style="background: rgba(0,0,0,0.3); padding: 15px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.05);">
              © ${new Date().getFullYear()} FIXNOW Services • Automated Protocol Dispatch
            </div>
          </div>
        `
      }
    };
  },
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
    console.log(`📱 SMS successfully dispatched to ${normalizedTo} (SID: ${result.sid})`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('SMS Send Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Sends a WhatsApp message via Twilio.
async function sendWhatsApp(to, message, contentSid = null, contentVariables = null) {
  try {
    const normalizedTo = normalizePhone(to);
    if (!normalizedTo) return { success: false, error: 'Invalid phone number' };

    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+17372508034';
    const formattedFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;

    if (contentSid) {
      try {
        const payload = {
          contentSid,
          from: formattedFrom,
          to: `whatsapp:${normalizedTo}`
        };
        if (contentVariables) payload.contentVariables = contentVariables;
        const result = await client.messages.create(payload);
        console.log(`💬 WhatsApp template dispatched to ${normalizedTo} (SID: ${result.sid})`);
        return { success: true, sid: result.sid };
      } catch (tmplErr) {
        console.warn('Twilio WhatsApp Content Template failed, trying fallback to text:', tmplErr.message);
      }
    }

    const result = await client.messages.create({
      body: message,
      from: formattedFrom,
      to: `whatsapp:${normalizedTo}`
    });
    console.log(`💬 WhatsApp message dispatched to ${normalizedTo} (SID: ${result.sid})`);
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

async function sendEmail(to, subject, html) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return { success: false, error: 'No email credentials configured' };
    }
    if (!to) return { success: false, error: 'No email provided' };

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const info = await transporter.sendMail({
      from: `"FIXNOW" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`📧 Email dispatched to ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email Send Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * notifyUser — the main entrypoint for all notifications in the system.
 * Sends SMS, WhatsApp, Email, Push concurrently so that failures in any one channel do not block others.
 */
async function notifyUser(userId, type, data = {}) {
  const template = templates[type] ? templates[type](data) : null;
  if (!template) {
    console.error('Invalid notification type:', type);
    return [];
  }

  // Lazily require firebaseAdmin to avoid circular dependency at module load time.
  const { db } = require('../../config/firebaseAdmin');
  let recipientPhone = data.phone || data.contact_number || data.contactNumber || data.customerPhone || data.customer_phone;
  let pushToken = data.fcm_token || data.fcmToken;
  let recipientEmail = data.email || data.customer_email || data.customerEmail;

  // 1. If phone or email is missing, check the user's Firestore document.
  if (userId && (!recipientPhone || !recipientEmail || !pushToken)) {
    try {
      const uDoc = await db.collection('users').doc(userId).get();
      if (uDoc.exists) {
        const userData = uDoc.data();
        recipientPhone = recipientPhone || userData.phone || userData.contact_number || userData.contactNumber;
        pushToken = pushToken || userData.fcm_token || userData.fcmToken;
        recipientEmail = recipientEmail || userData.email || userData.customer_email || userData.customerEmail;
      }
    } catch (e) {
      console.error('Failed to fetch user for notification:', e.message);
    }
  }

  // 2. If still missing, check the booking document itself.
  if ((!recipientPhone || !recipientEmail) && (data.id || data.bookingId)) {
    try {
      const bDoc = await db.collection('bookings').doc(data.id || data.bookingId).get();
      if (bDoc.exists) {
        const bData = bDoc.data();
        recipientPhone = recipientPhone || bData.contact_number || bData.contactNumber || bData.phone;
        recipientEmail = recipientEmail || bData.customer_email || bData.customerEmail || bData.email;
      }
    } catch (e) {
      console.error('Failed to fetch booking for notification:', e.message);
    }
  }

  console.log(`🔔 Sending ${type} notifications to user ${userId || 'anonymous'} (Phone: ${recipientPhone || 'N/A'}, Email: ${recipientEmail || 'N/A'})...`);

  const tasks = [];

  // Channel 1 & 2: SMS & WhatsApp
  if (recipientPhone) {
    const normalized = normalizePhone(recipientPhone);
    tasks.push(sendSMS(normalized, template.sms));
    tasks.push(sendWhatsApp(normalized, template.whatsapp));
  } else {
    tasks.push(Promise.resolve({ success: false, error: 'No phone number available' }));
    tasks.push(Promise.resolve({ success: false, error: 'No phone number available' }));
  }

  // Channel 3: Push Notification
  tasks.push(pushToken ? sendPush(pushToken, template.push.title, template.push.body, { bookingId: data.id }) : Promise.resolve({ success: false, error: 'No push token' }));

  // Channel 4: Email Notification
  if (template.email && recipientEmail) {
    tasks.push(sendEmail(recipientEmail, template.email.subject, template.email.html));
  } else {
    tasks.push(Promise.resolve({ success: false, error: 'No recipient email or email template' }));
  }

  // Send all channels concurrently; individual failures are caught per-channel.
  const results = await Promise.allSettled(tasks);

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
