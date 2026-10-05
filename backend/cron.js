const cron = require('node-cron');
const { db } = require('./config/firebaseAdmin');

function initCronJobs() {
  console.log('Initializing Cron Jobs...');
  
  // Run on the 1st of every month at midnight (0 0 1 * *)
  cron.schedule('0 0 1 * *', async () => {
    console.log('[CRON] Running monthly subscription reset for Free Plans...');
    try {
      const snapshot = await db.collection('technician_subscriptions')
        .where('planId', '==', 'free')
        .get();

      if (snapshot.empty) {
        console.log('[CRON] No free plans to reset.');
        return;
      }

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { 
          bookingsUsed: 0,
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
      console.log(`[CRON] Successfully reset ${snapshot.size} free plans.`);
    } catch (err) {
      console.error('[CRON] Error resetting free plans:', err);
    }
  });
}

module.exports = { initCronJobs };
