const { notifyUser } = require('./notifications');

// Store last notification timestamps to avoid spam
const lastNotif = new Map();

async function runReminderEngine(booking, currentEta) {
  const bookingId = booking.id;
  const status = booking.status;
  
  if (status !== 'On the Way') return;

  const now = Date.now();
  const key = `${bookingId}_arrival_soon`;
  
  // Rule: If ETA <= 10 min and we haven't sent a reminder in the last 15 min
  if (currentEta.durationValue <= 600) {
    const lastSent = lastNotif.get(key) || 0;
    if (now - lastSent > 15 * 60 * 1000) {
      console.log(`⏰ Reminder Engine: Tech arriving soon for booking ${bookingId}`);
      await notifyUser(booking.customerId, 'technicianAssigned', {
        id: bookingId,
        category: booking.category,
        techName: booking.technicianName || 'Your Technician',
        eta: currentEta.duration,
        phone: booking.contactNumber
      });
      lastNotif.set(key, now);
    }
  }

  // Rule: Detect Delay
  // In a real app, you'd compare currentEta with the initial ETA stored in DB
}

module.exports = { runReminderEngine };
