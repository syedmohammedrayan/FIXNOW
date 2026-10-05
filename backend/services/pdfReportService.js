const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Create Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function generateAndSendPDF(booking) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Email credentials not configured for PDF report');
    return;
  }
  
  if (!booking.email) {
    console.log('No customer email provided for booking', booking.id);
    return;
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', async () => {
        const pdfData = Buffer.concat(buffers);
        try {
          await transporter.sendMail({
            from: `"FixNow Support" <${process.env.EMAIL_USER}>`,
            to: booking.email,
            subject: `FixNow Order Completed - Receipt for #${(booking.id || '').slice(-6).toUpperCase()}`,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #4F46E5;">Thank you for choosing FixNow!</h2>
                    <p>Your service is now complete. Please find attached the professional report and receipt for your order.</p>
                   </div>`,
            attachments: [
              {
                filename: `FixNow_Receipt_${(booking.id || '').slice(-6).toUpperCase()}.pdf`,
                content: pdfData,
                contentType: 'application/pdf'
              }
            ]
          });
          resolve({ success: true });
        } catch (err) {
          reject(err);
        }
      });

      // --- PDF DESIGN ---
      // Header
      doc.fillColor('#4F46E5').fontSize(24).text('FIXNOW', { align: 'center' });
      doc.fillColor('#666666').fontSize(12).text('Professional Service Report', { align: 'center' });
      doc.moveDown(2);
      
      doc.moveTo(50, 120).lineTo(545, 120).strokeColor('#E5E7EB').stroke();
      doc.moveDown(2);

      // Details
      doc.fillColor('#333333').fontSize(16).text('Booking Summary', { underline: true });
      doc.moveDown(1);
      
      const details = [
        { label: 'Booking ID:', value: '#' + (booking.id || '').slice(-6).toUpperCase() },
        { label: 'Category:', value: booking.category || 'N/A' },
        { label: 'Status:', value: 'Completed' },
        { label: 'Customer Name:', value: booking.customer_name || 'N/A' },
        { label: 'Customer Contact:', value: booking.contact_number || booking.phone || 'N/A' },
        { label: 'Technician Name:', value: booking.technician_name || booking.technicianName || 'N/A' },
        { label: 'Technician Contact:', value: booking.technician_contact || 'N/A' },
        { label: 'Customer Address:', value: booking.address || 'N/A' },
        { label: 'Booking Date & Time:', value: new Date(booking.created_at || booking.createdAt).toLocaleString() },
        { label: 'Service Started At:', value: booking.service_started_at ? new Date(booking.service_started_at).toLocaleString() : 'N/A' },
        { label: 'Service Completed At:', value: booking.completed_at ? new Date(booking.completed_at).toLocaleString() : new Date().toLocaleString() }
      ];

      doc.fontSize(10).fillColor('#444444');
      let y = doc.y;
      details.forEach(item => {
        doc.font('Helvetica-Bold').text(item.label, 50, y, { width: 150 });
        doc.font('Helvetica').text(item.value, 200, y);
        y += 18;
      });

      doc.y = y + 20;
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E5E7EB').stroke();
      doc.moveDown(2);

      // Requirements / Fixes
      doc.fillColor('#333333').fontSize(16).font('Helvetica-Bold').text('Issue Description & Fixes', 50, doc.y);
      doc.moveDown(1);
      doc.fontSize(10).font('Helvetica').fillColor('#555555').text(booking.issue_description || 'No description provided.', { width: 495, align: 'justify' });
      doc.moveDown(2);

      // Payment Details
      doc.fillColor('#333333').fontSize(16).font('Helvetica-Bold').text('Payment Details');
      doc.moveDown(1);
      
      const amount = Number(booking.total_amount || booking.amount || booking.estimatedCostRange?.split('-')[0] || 0);
      const formattedAmount = amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      
      doc.fontSize(14).fillColor('#10B981').text(`Total Amount: INR ${formattedAmount}`);
      
      doc.moveDown(4);
      doc.fontSize(10).fillColor('#999999').text('Thank you for choosing FixNow. We look forward to serving you again.', { align: 'center' });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { generateAndSendPDF };
