const cron = require('node-cron');
const { db } = require('./config/firebaseAdmin');

function initCronJobs() {
  console.log('Initializing Cron Jobs...');
  
  // Run on the 1st of every month at midnight (0 0 1 * *)
  cron.schedule('0 0 1 * *', async () => {
    console.log('[CRON] Running monthly subscription reset for all technicians...');
    try {
      const snapshot = await db.collection('technician_subscriptions').get();

      if (snapshot.empty) {
        console.log('[CRON] No subscriptions to reset.');
        return;
      }

      const batch = db.batch();
      
      const nextMonthDate = new Date();
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
      const expiresAtString = nextMonthDate.toISOString();
      const updatedAtString = new Date().toISOString();

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { 
          planId: 'free',
          planName: 'Free Plan',
          bookingLimit: 3,
          bookingsUsed: 0,
          priorityMultiplier: 1.0,
          paymentStatus: 'active',
          expiresAt: expiresAtString,
          updatedAt: updatedAtString
        });
      });

      await batch.commit();
      console.log(`[CRON] Successfully reset ${snapshot.size} subscriptions to the Free Plan.`);
    } catch (err) {
      console.error('[CRON] Error resetting subscriptions:', err);
    }
  });
}

module.exports = { initCronJobs };
