const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../config/firebaseAdmin');
const cloudinary = require('../config/cloudinary');

// Use memory storage — files go straight to Cloudinary, never saved to disk
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

/**
 * Upload a buffer to Cloudinary and return the secure URL.
 */
async function uploadToCloudinary(fileBuffer, folder = 'fixnow/tools') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
}

// Get catalog
router.get('/catalog', async (req, res) => {
  try {
    const snap = await db.collection('tool_catalog').get();
    const catalog = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, catalog });
  } catch (error) {
    console.error('Catalog fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch catalog' });
  }
});

// Place a tool order
router.post('/order', upload.single('toolImage'), async (req, res) => {
  try {
    const { technicianId, technicianName, items, totalAmount, paymentMethod, customToolName, customToolDescription } = req.body;

    if (!technicianId || !technicianName) {
      return res.status(400).json({ error: 'Technician information required' });
    }

    let parsedItems = [];
    if (items) {
      try {
        parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
      } catch (err) {
        console.error('Failed to parse items:', err);
      }
    }

    const orderId = 'TO_' + Date.now();
    
    // Determine payment status based on method
    const payMethod = paymentMethod || 'deduct_from_earnings';
    const paymentStatus = payMethod === 'pay_now' ? 'Awaiting Verification' : 'Awaiting Approval';

    const order = {
      id: orderId,
      technician_id: technicianId,
      technician_name: technicianName,
      items: parsedItems,
      custom_tool: customToolName ? {
        name: customToolName,
        description: customToolDescription || '',
        image: req.file ? await uploadToCloudinary(req.file.buffer) : null,
      } : null,
      total_amount: parseFloat(totalAmount) || 0,
      payment_method: payMethod,
      payment_status: paymentStatus,
      status: 'Pending',
      created_at: new Date().toISOString()
    };

    await db.collection('tool_orders').doc(orderId).set(order);

    // Create transaction record for tool purchase
    const transaction = {
      id: 'TXN_TOOL_' + Date.now(),
      type: 'tool_purchase',
      order_id: orderId,
      technician_id: technicianId,
      technician_name: technicianName,
      amount: order.total_amount,
      status: 'Pending',
      payment_method: payMethod,
      created_at: new Date().toISOString()
    };
    
    await db.collection('transactions').doc(transaction.id).set(transaction);

    res.json({ success: true, order });
  } catch (error) {
    console.error('Failed to create tool order:', error);
    res.status(500).json({ error: 'Failed to create tool order' });
  }
});

// Admin: Verify payment for tool order
router.post('/orders/:id/verify-payment', async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection('tool_orders').doc(id).update({
      payment_status: 'Verified',
      updated_at: new Date().toISOString()
    });

    // Update related transaction
    const txnSnap = await db.collection('transactions').where('order_id', '==', id).limit(1).get();
    if (!txnSnap.empty) {
      await db.collection('transactions').doc(txnSnap.docs[0].id).update({
        status: 'Success',
        updated_at: new Date().toISOString()
      });
    }

    res.json({ success: true, message: 'Payment verified' });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Get all tool orders (for admin)
router.get('/orders', async (req, res) => {
  try {
    const snap = await db.collection('tool_orders').get();
    const orders = snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tool orders' });
  }
});

// Update tool order status
router.post('/orders/:id/update', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, deliveryEstimate, deliveryTime, deliveryDay } = req.body;

    let estimate = deliveryEstimate;
    if (!estimate && (deliveryTime || deliveryDay)) {
      estimate = `${deliveryDay || ''} at ${deliveryTime || ''}`.trim();
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };
    if (estimate) updateData.delivery_estimate = estimate;

    await db.collection('tool_orders').doc(id).update(updateData);

    // If approved and it was a deduction, finalize the transaction and payment status
    if (status === 'Approved') {
      const docRef = await db.collection('tool_orders').doc(id).get();
      const orderData = docRef.exists ? docRef.data() : null;
      
      if (orderData?.payment_method === 'deduct_from_earnings') {
        await db.collection('tool_orders').doc(id).update({
          payment_status: 'Settled'
        });

        const txnSnap = await db.collection('transactions').where('order_id', '==', id).limit(1).get();
        if (!txnSnap.empty) {
          await db.collection('transactions').doc(txnSnap.docs[0].id).update({
            status: 'Success',
            updated_at: new Date().toISOString()
          });
        }
      }
    }

    // Create notification for the technician
    const oDoc = await db.collection('tool_orders').doc(id).get();
    const orderDoc = oDoc.exists ? oDoc.data() : null;
    
    if (orderDoc) {
      const notification = {
        id: 'NOTIF_TOOL_' + Date.now(),
        user_id: orderDoc.technician_id,
        type: 'tool_order_update',
        title: status === 'Approved' ? '📦 Tool Request Approved' : '❌ Tool Request Declined',
        message: status === 'Approved'
          ? `Your requisition for tools has been approved. It will be delivered within ${estimate || 'the scheduled time'}.`
          : `Your requisition for tools was declined. Please contact administration for more details.`,
        order_id: id,
        read: false,
        created_at: new Date().toISOString()
      };
      await db.collection('notifications').doc(notification.id).set(notification);
    }

    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Failed to update order status:', error);
    res.status(404).json({ error: 'Failed to update order' });
  }
});

module.exports = router;
