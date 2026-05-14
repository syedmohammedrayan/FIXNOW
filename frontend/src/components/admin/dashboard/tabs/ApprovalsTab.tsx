'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Package, FileText, ExternalLink, X, Eye, CheckCircle2, XCircle, MapPin } from 'lucide-react';
import { ToolOrderCard } from '../shared/ToolOrderCard';
import { getImageUrl, getAvatarUrl } from '@/lib/image-utils';

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
  const [selectedUrls, setSelectedUrls] = React.useState<{ id?: string, selfie?: string } | null>(null);

  const [imageLoading, setImageLoading] = React.useState(true);

  const getValidImageUrl = (url: string, type: 'avatar' | 'id' = 'id') => {
    return getImageUrl(url, type) || '';
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
        {selectedUrls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-950/95 backdrop-blur-xl"
            onClick={() => { setSelectedUrls(null); setImageLoading(true); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 40 }}
              className="relative w-full sm:max-w-6xl bg-slate-900 rounded-t-[2.5rem] sm:rounded-[3rem] overflow-hidden border border-white/[0.08] shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => { setSelectedUrls(null); setImageLoading(true); }}
                className="absolute top-6 right-6 z-20 p-3 bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-400 rounded-full transition border border-white/[0.08] backdrop-blur-md"
              >
                <X className="size-6" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
                {/* ID Image Section */}
                <div className="relative p-6 sm:p-10 bg-slate-900/50 min-h-[40vh] sm:min-h-[60vh] flex flex-col items-center justify-center border-r border-white/5">
                  <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                    <FileText className="size-3.5 text-cyan-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Gov ID Document</span>
                  </div>
                  <img
                    src={getValidImageUrl(selectedUrls.id || '')}
                    alt="Government ID"
                    className="max-w-full max-h-[50vh] object-contain shadow-2xl rounded-xl transition-all duration-700"
                    onLoad={() => setImageLoading(false)}
                    onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x500?text=ID+Not+Found'; }}
                  />
                </div>

                {/* Selfie Image Section */}
                <div className="relative p-6 sm:p-10 bg-slate-900/50 min-h-[40vh] sm:min-h-[60vh] flex flex-col items-center justify-center">
                  <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                    <CheckCircle2 className="size-3.5 text-blue-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Biometric Selfie</span>
                  </div>
                  <img
                    src={getValidImageUrl(selectedUrls.selfie || '')}
                    alt="Biometric Selfie"
                    className="max-w-full max-h-[50vh] object-contain shadow-2xl rounded-xl transition-all duration-700"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x500?text=Selfie+Not+Found'; }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 bg-slate-950 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <ShieldCheck className="size-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white font-black text-xs uppercase tracking-widest italic">Identity Verification Protocol</p>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight">Cross-referencing biometrics with legal documentation</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => window.open(getValidImageUrl(selectedUrls.id || ''), '_blank')}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition border border-white/[0.08] font-black text-[10px] uppercase tracking-widest"
                  >
                    Download ID
                  </button>
                  <button
                    onClick={() => window.open(getValidImageUrl(selectedUrls.selfie || ''), '_blank')}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition border border-white/[0.08] font-black text-[10px] uppercase tracking-widest"
                  >
                    Download Selfie
                  </button>
                </div>
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
                    {tech.address && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <MapPin className="size-3 text-slate-500" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight truncate">{tech.address}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2.5 py-1 bg-white/[0.06] text-white/70 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/[0.08]">
                        {tech.category}
                      </span>
                      {tech.verificationStatus === 'uploaded' && (
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-cyan-500/20 flex items-center gap-1">
                            <FileText className="size-2.5" /> ID Uploaded
                          </span>
                          <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-500/20 flex items-center gap-1">
                            <CheckCircle2 className="size-2.5" /> Face Verified
                          </span>
                        </div>
                      )}

                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-white/[0.05]">
                  {(tech.govIdUrl || tech.gov_id_url || tech.selfieUrl || tech.selfie_url) && (
                    <button
                      onClick={() => {
                        setSelectedUrls({
                          id: tech.govIdUrl || tech.gov_id_url,
                          selfie: tech.selfieUrl || tech.selfie_url
                        });
                      }}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-bold text-[10px] uppercase tracking-widest transition border border-white/[0.07] active:scale-95"
                    >
                      <Eye className="size-3.5" /> Verify Identity
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
