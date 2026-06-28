'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '@/lib/config';

interface RefundRequestsTabProps {
  refundRequests: any[];
}

export function RefundRequestsTab({ refundRequests }: RefundRequestsTabProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this refund? This will reverse the payment via Razorpay.')) return;
    setProcessingId(id);
    try {
      const res = await axios.post(`${API_BASE}/api/payment/refund-request/${id}/approve`);
      if (res.data.success) {
        alert('Refund approved successfully!');
      } else {
        alert(res.data.message || 'Refund approval failed');
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || err.message || 'Error approving refund');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Please enter a reason for rejection (optional):');
    if (reason === null) return;
    
    setProcessingId(id);
    try {
      const res = await axios.post(`${API_BASE}/api/payment/refund-request/${id}/reject`, { reason });
      if (res.data.success) {
        alert('Refund request rejected.');
      } else {
        alert(res.data.message || 'Refund rejection failed');
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || err.message || 'Error rejecting refund');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <motion.div key="refunds" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
      <div>
        <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">Refund Requests</h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{refundRequests.length} pending / processed</p>
      </div>

      {refundRequests.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 backdrop-blur-xl border border-white/[0.06] rounded-[2rem] border-dashed">
          <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No refund requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {refundRequests.map(r => (
            <div key={r.id} className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] p-5 rounded-[1.5rem] hover:border-white/[0.15] transition-all duration-200">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-white text-sm uppercase">Booking #{r.bookingId?.slice(-8).toUpperCase() || 'N/A'}</p>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                      r.refundStatus === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      r.refundStatus === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    }`}>
                      {r.refundStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Cancelled by: <span className="text-white font-medium">{r.cancelledBy || 'Unknown'}</span></p>
                  <p className="text-xs text-slate-400">Reason: <span className="text-white italic">{r.cancelReason || 'None'}</span></p>
                </div>
                
                <div className="flex gap-2">
                  {r.refundStatus === 'Pending' && (
                    <>
                      <button 
                        onClick={() => handleApprove(r.id)} 
                        disabled={processingId === r.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider transition"
                      >
                        {processingId === r.id ? <CheckCircle className="w-3 h-3 animate-pulse" /> : <CheckCircle className="w-3 h-3" />} Approve
                      </button>
                      <button 
                        onClick={() => handleReject(r.id)} 
                        disabled={processingId === r.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider transition"
                      >
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-black/20 rounded-xl border border-white/[0.04]">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Customer</p>
                  <p className="text-xs text-white truncate">{r.customerName || r.customerId}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Technician</p>
                  <p className="text-xs text-white truncate">{r.technicianName || r.technicianId || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Amount Paid</p>
                  <p className="text-xs font-black text-emerald-400">₹{r.totalAmount}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Payment ID</p>
                  <p className="text-xs text-slate-300 font-mono truncate">{r.paymentId || r.orderId}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                 <p className="text-[9px] text-slate-600 font-mono">Paid: {new Date(r.paidAt || r.createdAt).toLocaleString()} | Cancelled: {new Date(r.cancelledAt || r.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
