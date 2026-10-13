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

/**
 * Format currency to Indian Rupees
 */
function formatINR(amount) {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Generates an Enterprise-grade A4 PDF Service Report Buffer
 */
async function generateReportPDFBuffer(booking) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const bookingId = (booking.id || '').toUpperCase();
      const refNumber = bookingId.length > 8 ? '#' + bookingId.slice(-8) : '#' + (bookingId || 'N/A');
      const category = booking.category || 'General Maintenance';
      
      const customerName = booking.customer_name || booking.customerName || 'Valued Customer';
      const customerPhone = booking.contact_number || booking.contactNumber || booking.phone || 'N/A';
      const customerEmail = booking.customer_email || booking.customerEmail || booking.email || 'N/A';
      const customerAddress = booking.address || booking.customer_address || 'Registered Location';
      
      const techName = booking.technician_name || booking.technicianName || booking.techName || 'Certified Specialist';
      let techPhone = booking.technician_phone || booking.technician_contact || booking.techPhone || '';
      const techId = booking.technician_id || booking.technicianId || 'TECH-ASSIGNED';

      if (!techPhone && booking.technician_id) {
        try {
          const { db } = require('../config/firebaseAdmin');
          const tDoc = await db.collection('technicians').doc(booking.technician_id).get();
          if (tDoc.exists) {
            techPhone = tDoc.data().phone || tDoc.data().phoneNumber || '';
          }
        } catch (e) {
          // ignore
        }
      }
      if (!techPhone) techPhone = '+91 Support Direct';

      const issueReported = booking.issue_description || booking.issueDescription || 'Standard diagnosis, inspection, and scheduled maintenance.';
      const workDone = booking.services_done || booking.servicesDone || 'Diagnostic inspection completed, corrective adjustments made, and performance verified.';
      
      const accessories = Array.isArray(booking.accessories) ? booking.accessories : [];
      const partsTotal = accessories.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
      
      const totalAmount = Number(booking.total_amount || booking.totalAmount || booking.finalAmount || 0);
      const basePrice = totalAmount > partsTotal ? (totalAmount - partsTotal) : (Number(booking.estimatedCostRange?.split('-')[0]) || totalAmount);
      
      const paymentMode = booking.payment_mode || booking.paymentMode || (booking.paymentMethod === 'later' ? 'Cash' : 'Online / UPI');
      const isPaid = booking.payment_status === 'Paid' || booking.paymentStatus === 'Paid' || booking.isPaid;
      const paymentStage = booking.paymentStage === 'before' ? 'Pre-Paid at Booking' : 'Settled on Site (Post Service)';
      
      const createdAt = booking.created_at || booking.createdAt ? new Date(booking.created_at || booking.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';
      const completedAt = booking.completed_at || booking.completedAt || booking.updated_at || new Date().toISOString();
      const formattedCompletedAt = new Date(completedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

      // ─── PALETTE & STYLING ───
      const cPrimary = '#0F172A';   // Deep Slate Navy
      const cSecondary = '#334155'; // Slate 700
      const cMuted = '#64748B';     // Slate 500
      const cBorder = '#CBD5E1';    // Slate 300
      const cBgLight = '#F8FAFC';   // Slate 50
      const cSuccess = '#059669';   // Emerald 600

      // ─── HEADER BAR ───
      doc.rect(40, 40, 515, 65).fill(cPrimary);
      
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(20).text('FIXNOW', 55, 52);
      doc.fillColor('#94A3B8').font('Helvetica').fontSize(8.5).text('ENTERPRISE FIELD SERVICE AUDIT & COMPLETION REPORT', 55, 76);
      
      // Right header badges
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9.5).text(`ORDER REF: ${refNumber}`, 340, 52, { align: 'right', width: 200 });
      doc.fillColor('#38BDF8').font('Helvetica-Bold').fontSize(8.5).text(`STATUS: VERIFIED & COMPLETED`, 340, 66, { align: 'right', width: 200 });
      doc.fillColor('#94A3B8').font('Helvetica').fontSize(8).text(`ISSUED: ${formattedCompletedAt}`, 340, 80, { align: 'right', width: 200 });

      let currentY = 120;

      // ─── SECTION 1: PARTIES & LOCATION (2-Column Grid) ───
      doc.rect(40, currentY, 250, 110).strokeColor(cBorder).lineWidth(0.75).stroke();
      doc.rect(298, currentY, 257, 110).strokeColor(cBorder).lineWidth(0.75).stroke();

      // Column 1: Client Information
      doc.rect(40, currentY, 250, 20).fill(cBgLight);
      doc.fillColor(cPrimary).font('Helvetica-Bold').fontSize(8.5).text('CLIENT & LOCATION DETAILS', 50, currentY + 6);
      
      let cy = currentY + 28;
      doc.fillColor(cMuted).font('Helvetica').fontSize(8).text('Client Name:', 50, cy);
      doc.fillColor(cPrimary).font('Helvetica-Bold').text(customerName, 120, cy, { width: 165 });
      
      cy += 16;
      doc.fillColor(cMuted).font('Helvetica').text('Phone Number:', 50, cy);
      doc.fillColor(cPrimary).font('Helvetica-Bold').text(customerPhone, 120, cy, { width: 165 });

      cy += 16;
      doc.fillColor(cMuted).font('Helvetica').text('Email Address:', 50, cy);
      doc.fillColor(cPrimary).font('Helvetica').text(customerEmail, 120, cy, { width: 165 });

      cy += 16;
      doc.fillColor(cMuted).font('Helvetica').text('Service Site:', 50, cy);
      doc.fillColor(cSecondary).font('Helvetica').text(customerAddress, 120, cy, { width: 165, height: 26, ellipsis: true });

      // Column 2: Specialist Information
      doc.rect(298, currentY, 257, 20).fill(cBgLight);
      doc.fillColor(cPrimary).font('Helvetica-Bold').fontSize(8.5).text('CERTIFIED SERVICE SPECIALIST', 308, currentY + 6);

      let ty = currentY + 28;
      doc.fillColor(cMuted).font('Helvetica').fontSize(8).text('Lead Specialist:', 308, ty);
      doc.fillColor(cPrimary).font('Helvetica-Bold').text(techName, 385, ty, { width: 165 });

      ty += 16;
      doc.fillColor(cMuted).font('Helvetica').text('Specialist Contact:', 308, ty);
      doc.fillColor(cPrimary).font('Helvetica-Bold').text(techPhone, 385, ty, { width: 165 });

      ty += 16;
      doc.fillColor(cMuted).font('Helvetica').text('Service Domain:', 308, ty);
      doc.fillColor(cPrimary).font('Helvetica').text(category, 385, ty, { width: 165 });

      ty += 16;
      doc.fillColor(cMuted).font('Helvetica').text('Authorization:', 308, ty);
      doc.fillColor(cSuccess).font('Helvetica-Bold').text('Client Passcode OTP Verified', 385, ty, { width: 165 });

      currentY += 122;

      // ─── SECTION 2: TIMELINE AUDIT BAR ───
      doc.rect(40, currentY, 515, 30).fill(cBgLight).strokeColor(cBorder).lineWidth(0.75).stroke();
      doc.fillColor(cMuted).font('Helvetica').fontSize(7.5).text('ORDER INITIATED', 50, currentY + 6);
      doc.fillColor(cPrimary).font('Helvetica-Bold').fontSize(8).text(createdAt, 50, currentY + 16);

      doc.fillColor(cMuted).font('Helvetica').fontSize(7.5).text('ON-SITE EXECUTION', 220, currentY + 6);
      doc.fillColor(cPrimary).font('Helvetica-Bold').fontSize(8).text('Protocol Commenced', 220, currentY + 16);

      doc.fillColor(cMuted).font('Helvetica').fontSize(7.5).text('DISPATCH COMPLETED', 380, currentY + 6);
      doc.fillColor(cSuccess).font('Helvetica-Bold').fontSize(8).text(formattedCompletedAt, 380, currentY + 16);

      currentY += 40;

      // ─── SECTION 3: DIAGNOSTIC & WORK DELIVERED ───
      // Reported Issue
      doc.rect(40, currentY, 515, 48).strokeColor(cBorder).lineWidth(0.75).stroke();
      doc.rect(40, currentY, 515, 16).fill(cBgLight);
      doc.fillColor(cSecondary).font('Helvetica-Bold').fontSize(8).text('REPORTED PROBLEM & CLIENT SYMPTOMS', 50, currentY + 4);
      doc.fillColor(cPrimary).font('Helvetica').fontSize(8.5).text(issueReported, 50, currentY + 22, { width: 495, height: 22, ellipsis: true });

      currentY += 56;

      // Work Delivered
      doc.rect(40, currentY, 515, 52).strokeColor(cBorder).lineWidth(0.75).stroke();
      doc.rect(40, currentY, 515, 16).fill(cBgLight);
      doc.fillColor(cSecondary).font('Helvetica-Bold').fontSize(8).text('ON-SITE DIAGNOSIS, WORK PERFORMED & CORRECTIVE ACTIONS', 50, currentY + 4);
      doc.fillColor(cPrimary).font('Helvetica').fontSize(8.5).text(workDone, 50, currentY + 22, { width: 495, height: 26, ellipsis: true });

      currentY += 60;

      // ─── SECTION 4: BILL OF LABOUR & MATERIALS TABLE ───
      doc.rect(40, currentY, 515, 18).fill(cPrimary);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);
      doc.text('#', 50, currentY + 5);
      doc.text('LINE ITEM DESCRIPTION', 75, currentY + 5);
      doc.text('CLASSIFICATION', 320, currentY + 5);
      doc.text('AMOUNT', 460, currentY + 5, { align: 'right', width: 85 });

      currentY += 18;

      // Row 1: Primary Service
      doc.rect(40, currentY, 515, 20).strokeColor(cBorder).lineWidth(0.5).stroke();
      doc.fillColor(cPrimary).font('Helvetica').fontSize(8.5);
      doc.text('01', 50, currentY + 5);
      doc.font('Helvetica-Bold').text(`${category} - Professional Labour & Service Consultation`, 75, currentY + 5, { width: 235 });
      doc.font('Helvetica').text('Base Operational Labour', 320, currentY + 5);
      doc.font('Helvetica-Bold').text(formatINR(basePrice), 460, currentY + 5, { align: 'right', width: 85 });

      currentY += 20;

      // Spare parts rows
      let rowNum = 2;
      if (accessories.length > 0) {
        accessories.forEach(item => {
          doc.rect(40, currentY, 515, 20).strokeColor(cBorder).lineWidth(0.5).stroke();
          doc.fillColor(cPrimary).font('Helvetica').fontSize(8.5);
          doc.text(String(rowNum).padStart(2, '0'), 50, currentY + 5);
          doc.text(item.name || 'Component Replacement', 75, currentY + 5, { width: 235 });
          doc.fillColor(cMuted).text('Hardware / Material Consumable', 320, currentY + 5);
          doc.fillColor(cPrimary).font('Helvetica-Bold').text(formatINR(item.price), 460, currentY + 5, { align: 'right', width: 85 });
          currentY += 20;
          rowNum++;
        });
      } else {
        doc.rect(40, currentY, 515, 18).strokeColor(cBorder).lineWidth(0.5).stroke();
        doc.fillColor(cMuted).font('Helvetica-Oblique').fontSize(8);
        doc.text('--', 50, currentY + 4);
        doc.text('No additional replacement parts or hardware requested for this service.', 75, currentY + 4);
        doc.text('N/A', 320, currentY + 4);
        doc.text('₹0.00', 460, currentY + 4, { align: 'right', width: 85 });
        currentY += 18;
      }

      // ─── SECTION 5: SETTLEMENT & SUMMARY GRID ───
      const summaryY = currentY + 8;

      // Left Column: Payment Audit
      doc.rect(40, summaryY, 280, 80).strokeColor(cBorder).lineWidth(0.75).stroke();
      doc.rect(40, summaryY, 280, 18).fill(cBgLight);
      doc.fillColor(cPrimary).font('Helvetica-Bold').fontSize(8).text('FINANCIAL SETTLEMENT RECONCILIATION', 50, summaryY + 5);

      let py = summaryY + 24;
      doc.fillColor(cMuted).font('Helvetica').fontSize(8).text('Settlement Timing:', 50, py);
      doc.fillColor(cPrimary).font('Helvetica-Bold').text(paymentStage, 140, py);

      py += 16;
      doc.fillColor(cMuted).font('Helvetica').text('Settlement Method:', 50, py);
      doc.fillColor(cPrimary).font('Helvetica-Bold').text(paymentMode, 140, py);

      py += 16;
      doc.fillColor(cMuted).font('Helvetica').text('Reconciliation Status:', 50, py);
      doc.fillColor(isPaid ? cSuccess : '#D97706').font('Helvetica-Bold').text(isPaid ? 'PAID & SETTLED (RECONCILED)' : 'PENDING PAYMENT', 140, py);

      // Right Column: Price Calculations
      doc.rect(328, summaryY, 227, 80).strokeColor(cBorder).lineWidth(0.75).stroke();
      
      let ry = summaryY + 8;
      doc.fillColor(cMuted).font('Helvetica').fontSize(8).text('Base Labour Fee:', 338, ry);
      doc.fillColor(cPrimary).font('Helvetica').text(formatINR(basePrice), 450, ry, { align: 'right', width: 95 });

      ry += 16;
      doc.fillColor(cMuted).font('Helvetica').text('Parts & Materials Subtotal:', 338, ry);
      doc.fillColor(cPrimary).font('Helvetica').text(formatINR(partsTotal), 450, ry, { align: 'right', width: 95 });

      ry += 16;
      doc.moveTo(338, ry).lineTo(545, ry).strokeColor(cBorder).lineWidth(0.5).stroke();
      
      ry += 8;
      doc.rect(335, ry - 3, 213, 26).fill('#EFF6FF');
      doc.fillColor(cPrimary).font('Helvetica-Bold').fontSize(9).text('TOTAL PAYABLE:', 342, ry + 4);
      doc.fillColor('#2563EB').font('Helvetica-Bold').fontSize(12).text(formatINR(totalAmount), 440, ry + 2, { align: 'right', width: 100 });

      // ─── FOOTER & ENTERPRISE SIGN-OFF ───
      const footerY = 740;
      doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor(cBorder).lineWidth(0.75).stroke();

      doc.fillColor(cMuted).font('Helvetica').fontSize(7.5).text(
        'OFFICIAL SERVICE GUARANTEE: All completed maintenance is backed by the standard FixNow 30-day workmanship assurance. This computer-generated audit report is certified and digitally authenticated upon completion.',
        40,
        footerY + 8,
        { width: 515, align: 'center', lineGap: 2 }
      );

      doc.fillColor(cSecondary).font('Helvetica-Bold').fontSize(8).text(
        `FIXNOW ENTERPRISE SOLUTIONS • SUPPORT: help@fixnow.app • © ${new Date().getFullYear()} ALL RIGHTS RESERVED`,
        40,
        footerY + 28,
        { width: 515, align: 'center' }
      );

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Generates an MNC-style responsive HTML report for email & web preview
 */
function generateReportHTML(booking) {
  const bookingId = (booking.id || '').toUpperCase();
  const refNumber = bookingId.length > 8 ? '#' + bookingId.slice(-8) : '#' + (bookingId || 'N/A');
  const category = booking.category || 'General Maintenance';
  
  const customerName = booking.customer_name || booking.customerName || 'Valued Customer';
  const customerPhone = booking.contact_number || booking.contactNumber || booking.phone || 'N/A';
  const customerEmail = booking.customer_email || booking.customerEmail || booking.email || 'N/A';
  const customerAddress = booking.address || booking.customer_address || 'Registered Location';
  
  const techName = booking.technician_name || booking.technicianName || booking.techName || 'Certified Specialist';
  const techPhone = booking.technician_phone || booking.technician_contact || booking.techPhone || 'Direct Dispatch';
  
  const issueReported = booking.issue_description || booking.issueDescription || 'Standard diagnostics, safety check and maintenance.';
  const workDone = booking.services_done || booking.servicesDone || 'Diagnostic inspection completed, corrective adjustments made, and performance verified.';
  
  const accessories = Array.isArray(booking.accessories) ? booking.accessories : [];
  const partsTotal = accessories.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  
  const totalAmount = Number(booking.total_amount || booking.totalAmount || booking.finalAmount || 0);
  const basePrice = totalAmount > partsTotal ? (totalAmount - partsTotal) : (Number(booking.estimatedCostRange?.split('-')[0]) || totalAmount);
  
  const paymentMode = booking.payment_mode || booking.paymentMode || (booking.paymentMethod === 'later' ? 'Cash' : 'Online / UPI');
  const isPaid = booking.payment_status === 'Paid' || booking.paymentStatus === 'Paid' || booking.isPaid;
  const paymentStage = booking.paymentStage === 'before' ? 'Pre-Paid at Booking' : 'Settled on Site (Post Service)';
  
  const completedAt = booking.completed_at || booking.completedAt || booking.updated_at || new Date().toISOString();
  const formattedCompletedAt = new Date(completedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; background: #ffffff; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
      
      <!-- Top Corporate Bar -->
      <div style="background: #0f172a; padding: 24px 30px; border-bottom: 3px solid #2563eb;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="vertical-align: top;">
              <span style="font-size: 24px; font-weight: 900; letter-spacing: 1.5px; color: #ffffff; display: block;">FIXNOW</span>
              <span style="font-size: 10px; font-weight: 700; letter-spacing: 1px; color: #94a3b8; text-transform: uppercase; margin-top: 4px; display: block;">Enterprise Field Service Audit Report</span>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <span style="display: inline-block; padding: 4px 10px; background: rgba(16,185,129,0.15); border: 1px solid #10b981; color: #34d399; font-size: 10px; font-weight: 800; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">✓ Completed & Verified</span>
              <span style="font-size: 11px; font-weight: 700; color: #cbd5e1; display: block; margin-top: 6px;">REF: ${refNumber}</span>
              <span style="font-size: 10px; color: #94a3b8; display: block; margin-top: 2px;">${formattedCompletedAt}</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Main Body -->
      <div style="padding: 28px 30px;">
        
        <!-- Parties Summary (2-Col) -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 12px;">
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; background: #f8fafc; height: 100%;">
                <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 8px;">Client Information</span>
                <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #0f172a;">${customerName}</p>
                <p style="margin: 0 0 4px; font-size: 12px; color: #334155;">📞 ${customerPhone}</p>
                <p style="margin: 0 0 6px; font-size: 12px; color: #334155;">✉️ ${customerEmail}</p>
                <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.4;">📍 ${customerAddress}</p>
              </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 12px;">
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; background: #f8fafc; height: 100%;">
                <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 8px;">Certified Technician</span>
                <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #0f172a;">${techName}</p>
                <p style="margin: 0 0 4px; font-size: 12px; color: #334155;">📞 ${techPhone}</p>
                <p style="margin: 0 0 4px; font-size: 12px; color: #334155;">🛠️ Domain: <strong>${category}</strong></p>
                <p style="margin: 0; font-size: 11px; font-weight: 600; color: #059669;">🛡️ Protocol Authorized (Passcode Verified)</p>
              </div>
            </td>
          </tr>
        </table>

        <!-- Work Summary -->
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px; overflow: hidden;">
          <div style="background: #f1f5f9; padding: 8px 14px; border-bottom: 1px solid #e2e8f0;">
            <span style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.8px;">Diagnostic Assessment & Resolution Scope</span>
          </div>
          <div style="padding: 14px 16px;">
            <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Reported Issue:</p>
            <p style="margin: 0 0 14px; font-size: 13px; color: #1e293b; line-height: 1.5;">${issueReported}</p>
            
            <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Work Executed & Solved:</p>
            <p style="margin: 0; font-size: 13px; color: #0f172a; font-weight: 500; line-height: 1.5;">${workDone}</p>
          </div>
        </div>

        <!-- Financial Breakdown Table -->
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px; overflow: hidden;">
          <div style="background: #0f172a; padding: 10px 14px;">
            <span style="font-size: 11px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 0.8px;">Itemized Bill of Labour & Replacement Parts</span>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: left; color: #475569;">
                <th style="padding: 10px 14px; font-weight: 700;">Description</th>
                <th style="padding: 10px 14px; font-weight: 700;">Classification</th>
                <th style="padding: 10px 14px; font-weight: 700; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 14px; font-weight: 600; color: #0f172a;">${category} Service Consultation & Labour</td>
                <td style="padding: 12px 14px; color: #64748b;">Primary Operational Labour</td>
                <td style="padding: 12px 14px; font-weight: 700; color: #0f172a; text-align: right;">${formatINR(basePrice)}</td>
              </tr>
              ${accessories.length > 0 ? accessories.map(item => `
                <tr style="border-bottom: 1px solid #e2e8f0; background: #fafafa;">
                  <td style="padding: 10px 14px; font-weight: 600; color: #334155;">${item.name || 'Component Replacement'}</td>
                  <td style="padding: 10px 14px; color: #64748b;">Spare Part / Hardware</td>
                  <td style="padding: 10px 14px; font-weight: 700; color: #0f172a; text-align: right;">${formatINR(item.price)}</td>
                </tr>
              `).join('') : `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td colspan="2" style="padding: 10px 14px; color: #94a3b8; font-style: italic;">No extra spare parts or materials required for this order</td>
                  <td style="padding: 10px 14px; color: #94a3b8; text-align: right;">₹0.00</td>
                </tr>
              `}
            </tbody>
          </table>

          <!-- Totals Bar -->
          <div style="background: #f8fafc; padding: 14px 16px; border-top: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-size: 12px; color: #64748b;">Spare Parts & Materials Subtotal:</td>
                <td style="font-size: 12px; font-weight: 700; color: #0f172a; text-align: right;">${formatINR(partsTotal)}</td>
              </tr>
              <tr>
                <td style="font-size: 14px; font-weight: 800; color: #0f172a; padding-top: 6px;">Total Settled Amount:</td>
                <td style="font-size: 18px; font-weight: 900; color: #2563eb; text-align: right; padding-top: 6px;">${formatINR(totalAmount)}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Payment Settlement Audit -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <tr>
              <td style="color: #64748b;">Settlement Stage:</td>
              <td style="font-weight: 700; color: #0f172a; text-align: right;">${paymentStage}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding-top: 4px;">Payment Method:</td>
              <td style="font-weight: 700; color: #0f172a; text-align: right; padding-top: 4px;">${paymentMode}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding-top: 4px;">Transaction Status:</td>
              <td style="font-weight: 800; color: #059669; text-align: right; padding-top: 4px;">${isPaid ? 'PAID & SETTLED' : 'PENDING'}</td>
            </tr>
          </table>
        </div>

        <!-- Quality & Guarantee -->
        <div style="border-top: 1px dashed #cbd5e1; padding-top: 16px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.5;">
          <p style="margin: 0 0 4px; font-weight: 700; color: #0f172a;">30-Day FixNow Craftsmanship Assurance</p>
          <p style="margin: 0;">This official report certifies that the documented repair protocol was executed in adherence to enterprise quality standards. Please retain this report or the attached PDF for warranty references.</p>
        </div>

      </div>

      <!-- Footer -->
      <div style="background: #0f172a; padding: 12px 30px; text-align: center; font-size: 10px; color: #94a3b8;">
        © ${new Date().getFullYear()} FixNow Technologies Private Limited • Automated Protocol Dispatch
      </div>
    </div>
  `;
}

/**
 * Main function: Generates PDF and emails to customer upon job completion
 */
async function generateAndSendPDF(booking) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email credentials not configured for PDF report');
    return;
  }
  
  // Find customer email
  let recipientEmail = booking.customer_email || booking.customerEmail || booking.email;
  if (!recipientEmail && booking.customer_id) {
    try {
      const { db } = require('../config/firebaseAdmin');
      const uDoc = await db.collection('users').doc(booking.customer_id).get();
      if (uDoc.exists) {
        recipientEmail = uDoc.data().email || '';
      }
    } catch (e) {
      console.warn('Could not fetch user email for PDF delivery:', e.message);
    }
  }

  if (!recipientEmail) {
    console.log(`ℹ️ No customer email available for booking ${booking.id}. Skipping PDF email dispatch.`);
    return;
  }

  try {
    const pdfBuffer = await generateReportPDFBuffer(booking);
    const htmlReport = generateReportHTML(booking);
    const orderId = (booking.id || '').slice(-6).toUpperCase();

    await transporter.sendMail({
      from: `"FixNow Service Dispatch" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `Official Service Completion Report & Receipt #${orderId} - FIXNOW`,
      html: htmlReport,
      attachments: [
        {
          filename: `FixNow_Service_Report_${orderId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    console.log(`📄 Official Service Report & Receipt dispatched to ${recipientEmail} for booking ${booking.id}`);
    return { success: true };
  } catch (err) {
    console.error('Failed to generate/send official service report:', err.message);
    throw err;
  }
}

module.exports = { 
  generateAndSendPDF, 
  generateReportPDFBuffer, 
  generateReportHTML 
};
