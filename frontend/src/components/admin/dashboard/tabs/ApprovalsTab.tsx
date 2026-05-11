'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Package, FileText, ExternalLink, X, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { ToolOrderCard } from '../shared/ToolOrderCard';
import { getAvatarUrl } from '@/lib/image-utils';
import { API_BASE } from '@/lib/config';

interface ApprovalsTabProps {
  techs: any[];
  toolOrders: any[];
  handleApprove: (id: string) => void;
  handleReject: (id: string) => void;
  updateToolOrderStatus: (id: string, status: string) => void;
  handleVerifyPayment: (id: string) => void;
  setSelectedOrder: (order: any) => void;
}

export function ApprovalsTab({
  techs,
  toolOrders,
  handleApprove,
  handleReject,
  updateToolOrderStatus,
  handleVerifyPayment,
  setSelectedOrder
}: ApprovalsTabProps) {
  const [selectedIdUrl, setSelectedIdUrl] = React.useState<string | null>(null);
  const [imageLoading, setImageLoading] = React.useState(true);

  const getValidImageUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('/ids/') || url.includes('gov_id')) {
      return `${API_BASE}/api/users/view-id?url=${encodeURIComponent(url)}`;
    }
    return getAvatarUrl(url) || '';
  };

  return (
    <motion.div
      key="approvals"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 sm:space-y-12"
    >
      {/* ── ID Viewer Modal ── */}
      <AnimatePresence>
        {selectedIdUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-950/90 backdrop-blur-md"
            onClick={() => { setSelectedIdUrl(null); setImageLoading(true); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 40 }}
              className="relative w-full sm:max-w-4xl bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2rem] overflow-hidden border border-white/[0.08] shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Handle bar (mobile) */}
              <div className="sm:hidden w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1" />

              {/* Close button */}
              <button
                onClick={() => { setSelectedIdUrl(null); setImageLoading(true); }}
                className="absolute top-4 right-4 z-20 p-2.5 bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-400 rounded-full transition border border-white/[0.08]"
              >
                <X className="size-5" />
              </button>

              {/* Image area */}
              <div className="relative p-4 bg-black/40 min-h-[50vh] sm:min-h-[65vh] flex items-center justify-center">
                {imageLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="size-10 border-4 border-white/10 border-t-white rounded-full animate-spin" />
                    <p className="text-white font-bold text-xs uppercase tracking-widest animate-pulse">Scanning Document...</p>
                  </div>
                )}
                <img
                  src={getValidImageUrl(selectedIdUrl)}
                  alt="Government ID"
                  className={`max-w-full max-h-[60vh] object-contain shadow-2xl transition-all duration-700 ${imageLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                  onLoad={() => setImageLoading(false)}
                  onError={e => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x500?text=ID+Not+Found';
                    setImageLoading(false);
                  }}
                />
              </div>

              {/* Footer */}
              <div className="px-5 sm:px-8 py-4 sm:py-5 bg-slate-900/80 border-t border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-white/[0.05] flex items-center justify-center border border-white/[0.08]">
                    <FileText className="size-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-black text-xs uppercase tracking-wider">Verified Identity Protocol</p>
                    <p className="text-slate-500 text-[10px] font-medium">Encrypted Document Transfer Active</p>
                  </div>
                </div>
                <button
                  onClick={() => window.open(getValidImageUrl(selectedIdUrl), '_blank')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 hover:text-white rounded-xl transition border border-white/[0.08] font-bold text-xs w-full sm:w-auto justify-center"
                >
                  <ExternalLink className="size-3.5" /> Open Original
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pending Technician Registrations ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">Pending Registrations</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              {techs.length} applicant{techs.length !== 1 ? 's' : ''} awaiting review
            </p>
          </div>
        </div>

        {techs.length > 0 ? (
          <div className="grid gap-3 sm:gap-4">
            {techs.map(tech => (
              <div
                key={tech.id}
                className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] p-4 sm:p-6 rounded-[1.75rem] hover:border-white/[0.15] transition-all duration-300"
              >
                {/* Top: avatar + info */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-xl font-bold text-slate-400 overflow-hidden shrink-0">
                    {tech.avatar
                      ? <img src={getValidImageUrl(tech.avatar)} className="w-full h-full object-cover" alt={tech.name} />
                      : tech.name?.charAt(0)
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-black text-white truncate">{tech.name}</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate mt-0.5">{tech.email}</p>
                    {tech.phone && <p className="text-[10px] text-slate-600 font-medium mt-0.5">{tech.phone}</p>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2.5 py-1 bg-white/[0.06] text-white/70 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/[0.08]">
                        {tech.category}
                      </span>
                      {tech.verificationStatus === 'uploaded' && (
                        <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-cyan-500/20 flex items-center gap-1">
                          <FileText className="size-2.5" /> ID Uploaded
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-white/[0.05]">
                  {(tech.govIdUrl || tech.gov_id_url) && (
                    <button
                      onClick={() => {
                        const url = tech.govIdUrl || tech.gov_id_url;
                        if (url) setSelectedIdUrl(url);
                      }}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-bold text-[10px] uppercase tracking-widest transition border border-white/[0.07] active:scale-95"
                    >
                      <Eye className="size-3.5" /> View ID
                    </button>
                  )}
                  <button
                    onClick={() => handleApprove(tech.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-black text-[10px] uppercase tracking-widest transition shadow-lg active:scale-95"
                  >
                    <CheckCircle2 className="size-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(tech.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-rose-500/10 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 font-black text-[10px] uppercase tracking-widest transition active:scale-95"
                  >
                    <XCircle className="size-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 sm:py-20 bg-slate-900/40 backdrop-blur-xl border border-white/[0.06] rounded-[2rem] border-dashed">
            <ShieldCheck className="w-12 h-12 sm:w-14 sm:h-14 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Queue is clear</p>
            <p className="text-slate-600 font-medium text-xs mt-1">No pending registrations</p>
          </div>
        )}
      </div>

      {/* ── Pending Tool Requisitions ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">Pending Tool Requisitions</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            {toolOrders.filter(o => o.status === 'Pending').length} order{toolOrders.filter(o => o.status === 'Pending').length !== 1 ? 's' : ''} awaiting review
          </p>
        </div>

        {toolOrders.filter(o => o.status === 'Pending').length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {toolOrders.filter(o => o.status === 'Pending').map(order => (
              <ToolOrderCard
                key={order.id}
                order={order}
                onUpdate={updateToolOrderStatus}
                onVerify={handleVerifyPayment}
                setSelectedOrder={setSelectedOrder}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 sm:py-20 bg-slate-900/40 backdrop-blur-xl border border-white/[0.06] rounded-[2rem] border-dashed">
            <Package className="w-12 h-12 sm:w-14 sm:h-14 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No pending tool orders</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
