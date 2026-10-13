'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Download, Printer, ShieldCheck, CheckCircle2, 
  MapPin, Phone, Mail, User, Wrench, Calendar, CreditCard, 
  Package, FileText, ArrowUpRight
} from 'lucide-react';
import { API_BASE } from '@/lib/config';

interface ServiceReportModalProps {
  booking: any | null;
  onClose: () => void;
}

export default function ServiceReportModal({ booking, onClose }: ServiceReportModalProps) {
  if (!booking) return null;

  const bookingId = (booking.id || '').toUpperCase();
  const refNumber = bookingId.length > 8 ? '#' + bookingId.slice(-8) : '#' + (bookingId || 'N/A');
  const category = booking.category || 'General Maintenance';

  const customerName = booking.customer_name || booking.customerName || 'Valued Customer';
  const customerPhone = booking.contact_number || booking.contactNumber || booking.phone || 'N/A';
  const customerEmail = booking.customer_email || booking.customerEmail || booking.email || 'N/A';
  const customerAddress = booking.address || booking.customer_address || 'Registered Location';

  const techName = booking.technician?.name || booking.technician_name || booking.technicianName || booking.techName || 'Certified Specialist';
  const techPhone = booking.technician?.phone || booking.technician_phone || booking.technician_contact || booking.techPhone || 'Direct Dispatch';

  const issueReported = booking.issue_description || booking.issueDescription || 'Standard diagnostic inspection & maintenance request.';
  const workDone = booking.services_done || booking.servicesDone || 'Diagnostic inspection completed, corrective adjustments executed, and protocol performance verified.';

  const accessories = Array.isArray(booking.accessories) ? booking.accessories : [];
  const partsTotal = accessories.reduce((sum: number, item: any) => sum + (Number(item.price) || 0), 0);

  const totalAmount = Number(booking.total_amount || booking.totalAmount || booking.finalAmount || 0);
  const basePrice = totalAmount > partsTotal ? (totalAmount - partsTotal) : (Number(booking.estimatedCostRange?.split('-')[0]) || totalAmount);

  const paymentMode = booking.payment_mode || booking.paymentMode || (booking.paymentMethod === 'later' ? 'Cash Handover' : 'Online / UPI');
  const isPaid = booking.payment_status === 'Paid' || booking.paymentStatus === 'Paid' || booking.isPaid;
  const paymentStage = booking.paymentStage === 'before' ? 'Pre-Paid at Booking' : 'Settled on Site (Post Service)';

  const createdAt = booking.created_at || booking.createdAt ? new Date(booking.created_at || booking.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';
  const completedAt = booking.completed_at || booking.completedAt || booking.updated_at || new Date().toISOString();
  const formattedCompletedAt = new Date(completedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const formatINR = (amt: number) => {
    return '₹' + amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleDownloadPDF = () => {
    window.open(`${API_BASE}/api/bookings/${booking.id}/report-pdf`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 my-auto max-h-[92vh] flex flex-col"
        >
          {/* Action Bar (Top Controls) */}
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-sm">
                FN
              </div>
              <div>
                <h2 className="text-sm font-black tracking-wider uppercase">Executive Service Audit Report</h2>
                <p className="text-[10px] text-slate-400 tracking-wider">OFFICIAL RECONCILIATION DOCUMENT</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-sm"
              >
                <Download className="size-3.5" />
                <span className="hidden sm:inline">Download PDF</span>
              </button>
              <button 
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-all active:scale-95 border border-slate-700"
              >
                <Printer className="size-3.5" />
                <span className="hidden sm:inline">Print</span>
              </button>
              <button 
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Report Sheet (Printable Document View) */}
          <div className="p-6 sm:p-10 overflow-y-auto scrollbar-thin text-xs sm:text-sm">
            
            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-5 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-2xl font-black tracking-tighter text-slate-900">FIXNOW</span>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Enterprise Field Service & Maintenance Network</p>
              </div>
              <div className="text-left sm:text-right">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-black uppercase tracking-wider mb-1">
                  <CheckCircle2 className="size-3" /> Reconciled & Closed
                </span>
                <p className="text-xs font-bold text-slate-900 font-mono">ORDER REF: {refNumber}</p>
                <p className="text-[11px] text-slate-500">Issued: {formattedCompletedAt}</p>
              </div>
            </div>

            {/* Parties 2-Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Customer Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1.5">Client Information</p>
                <p className="font-bold text-slate-900 text-sm mb-1">{customerName}</p>
                <p className="text-slate-600 text-xs mb-0.5">📞 {customerPhone}</p>
                <p className="text-slate-600 text-xs mb-1.5">✉️ {customerEmail}</p>
                <p className="text-slate-500 text-xs leading-relaxed">📍 {customerAddress}</p>
              </div>

              {/* Technician Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1.5">Certified Specialist</p>
                <p className="font-bold text-slate-900 text-sm mb-1">{techName}</p>
                <p className="text-slate-600 text-xs mb-0.5">📞 {techPhone}</p>
                <p className="text-slate-600 text-xs mb-1.5">🛠️ Service Trade: <span className="font-semibold text-slate-900">{category}</span></p>
                <p className="text-emerald-700 text-xs font-bold inline-flex items-center gap-1">
                  <ShieldCheck className="size-3.5" /> Client OTP Authorized
                </p>
              </div>
            </div>

            {/* Timeline Audit Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Scheduled</p>
                <p className="text-xs font-semibold text-slate-900 mt-0.5">{createdAt}</p>
              </div>
              <div className="border-x border-slate-200">
                <p className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Protocol Status</p>
                <p className="text-xs font-semibold text-slate-900 mt-0.5">Physical Verification Completed</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Closed At</p>
                <p className="text-xs font-semibold text-emerald-700 mt-0.5">{formattedCompletedAt}</p>
              </div>
            </div>

            {/* Diagnostics & Work Performed */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">Diagnostic Assessment & Technical Resolution</p>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Reported Issue / Symptoms</p>
                  <p className="text-xs text-slate-800 leading-relaxed">{issueReported}</p>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Corrective Action Executed & Work Solved</p>
                  <p className="text-xs font-medium text-slate-900 leading-relaxed">{workDone}</p>
                </div>
              </div>
            </div>

            {/* Itemized Bill of Materials & Labour */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
              <div className="bg-slate-900 text-white px-4 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-wider">Itemized Bill of Labour & Replacement Parts</p>
              </div>
              
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-2.5 px-4">Line Item Description</th>
                    <th className="py-2.5 px-4">Classification</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {category} Professional Labour & Diagnostics
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">Primary Technical Service</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(basePrice)}</td>
                  </tr>

                  {accessories.length > 0 ? (
                    accessories.map((acc: any, i: number) => (
                      <tr key={i} className="bg-slate-50/50">
                        <td className="py-2.5 px-4 font-medium text-slate-800">
                          {acc.name || 'Component Replacement'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 text-xs">Spare Part / Hardware Consumable</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatINR(acc.price)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-2.5 px-4 text-slate-400 italic text-xs">
                        No additional spare parts or materials required
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-400 font-mono">₹0.00</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Summary Calculation */}
              <div className="bg-slate-50 border-t border-slate-200 p-4">
                <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                  <span>Spare Parts & Materials Subtotal:</span>
                  <span className="font-bold text-slate-900">{formatINR(partsTotal)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                  <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Total Reconciled Amount:</span>
                  <span className="text-xl font-black text-blue-600">{formatINR(totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Financial Settlement Reconciliation Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1.5">Settlement Audit</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Settlement Timing</span>
                  <span className="font-bold text-slate-900">{paymentStage}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Method</span>
                  <span className="font-bold text-slate-900">{paymentMode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Reconciliation Status</span>
                  <span className={`font-black ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {isPaid ? '✓ PAID IN FULL (SETTLED)' : 'PENDING SETTLEMENT'}
                  </span>
                </div>
              </div>
            </div>

            {/* Warranty & Assurance Footer */}
            <div className="border-t border-dashed border-slate-300 pt-4 text-center">
              <p className="text-xs font-bold text-slate-900 mb-1">30-Day FixNow Craftsmanship Assurance</p>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-lg mx-auto">
                All maintenance executed is certified in compliance with enterprise service quality standards. Keep this report as official record of completed service for warranty verification.
              </p>
            </div>

          </div>

          {/* Modal Footer Controls */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <span className="text-[11px] text-slate-400">Computer generated audit document • FixNow Inc.</span>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                onClick={handleDownloadPDF}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow"
              >
                <Download className="size-3.5" />
                Download PDF
              </button>
              <button 
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
