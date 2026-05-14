const express = require('express');
const router = express.Router();
const { db } = require('../config/firebaseAdmin');
const { notifyUser } = require('../services/notifications');

// Update complaint status and notify customer
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
    await complaintRef.update({
      status,
      updatedAt: new Date().toISOString()
    });

    if (status === 'In Review') {
      // Send SMS to customer
      const customerId = complaintData.customerId || complaintData.customer_id;
      if (customerId) {
        await notifyUser(customerId, 'complaintReview', {
          technicianName: technicianName || 'Your Technician',
          id: complaintData.bookingId || complaintData.booking_id || complaintId
        });
      }
    } else if (status === 'Resolved') {
      // Send SMS & In-app notification to customer
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

// Finalize and remove complaint from database
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
