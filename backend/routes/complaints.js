const express = require('express');
const router = express.Router();
const { db } = require('../config/firebaseAdmin');
// notifyUser sends SMS/in-app messages to inform the customer about complaint progress.
const { notifyUser } = require('../services/notifications');

// PATCH /api/complaints/update-status — Admin updates the complaint lifecycle status.
// Triggers customer notifications at "In Review" and "Resolved" milestones.
router.post('/update-status', async (req, res) => {
  try {
    const { complaintId, status, technicianName } = req.body;

    if (!complaintId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const complaintRef = db.collection('complaints').doc(complaintId);
    const doc = await complaintRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaintData = doc.data();
    // Persist the new status and update timestamp in Firestore.
    await complaintRef.update({
      status,
      updatedAt: new Date().toISOString()
    });

    if (status === 'In Review') {
      // Notify the customer that their complaint has been acknowledged and is being investigated.
      const customerId = complaintData.customerId || complaintData.customer_id;
      if (customerId) {
        await notifyUser(customerId, 'complaintReview', {
          technicianName: technicianName || 'Your Technician',
          id: complaintData.bookingId || complaintData.booking_id || complaintId
        });
      }
    } else if (status === 'Resolved') {
      // Notify the customer that the complaint has been fully resolved.
      const customerId = complaintData.customerId || complaintData.customer_id;
      if (customerId) {
        await notifyUser(customerId, 'complaintResolved', {
          technicianName: technicianName || 'Your Technician',
          id: complaintData.bookingId || complaintData.booking_id || complaintId
        });
      }
    }

    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (error) {
    console.error('Complaint update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/complaints/finalize — Permanently deletes a resolved complaint from Firestore.
router.post('/finalize', async (req, res) => {
  try {
    const { complaintId } = req.body;
    if (!complaintId) return res.status(400).json({ error: 'Missing complaint ID' });

    await db.collection('complaints').doc(complaintId).delete();
    res.json({ success: true, message: 'Complaint removed from database' });
  } catch (error) {
    console.error('Complaint finalize error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
