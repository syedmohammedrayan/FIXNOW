// Sends push notifications to customers at key moments in the booking lifecycle.
const { notifyUser } = require('./notifications');

// In-memory map to prevent spamming the same notification multiple times per booking.
// Key: "<bookingId>_<event>" → value: timestamp of last send.
const lastNotif = new Map();

/**
 * Fires ETA-triggered customer reminders when the technician is close.
 * Called on every throttled location update from server.js.
 * Only acts when booking status is "On the Way" to avoid spurious notifications.
 */
async function runReminderEngine(booking, currentEta) {
  const bookingId = booking.id;
  const status = booking.status;
  
  // Only send proximity reminders while the technician is actively en route.
  if (status !== 'On the Way') return;

  const now = Date.now();
  // Unique key per booking+event so different events don't interfere with each other.
  const key = `${bookingId}_arrival_soon`;
  
  // Rule: Technician is 10 minutes (600 seconds) away AND we haven't notified in the last 15 min.
  if (currentEta.durationValue <= 600) {
    const lastSent = lastNotif.get(key) || 0;
    if (now - lastSent > 15 * 60 * 1000) {
      console.log(`⏰ Reminder Engine: Tech arriving soon for booking ${bookingId}`);
      // Trigger a "technician assigned" notification to the customer with the live ETA.
      await notifyUser(booking.customerId, 'technicianAssigned', {
        id: bookingId,
        category: booking.category,
        techName: booking.technicianName || 'Your Technician',
        eta: currentEta.duration,
        phone: booking.contactNumber
      });
      // Record the send time so we don't repeat the same notification for 15 minutes.
      lastNotif.set(key, now);
    }
  }

  // Rule: Detect Delay
  // In a real app, you'd compare currentEta with the initial ETA stored in DB.
}

module.exports = { runReminderEngine };
