'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Package, FileText, ExternalLink, Eye, X } from 'lucide-react';
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
      className="space-y-12 relative"
    >
      <AnimatePresence>
        {selectedIdUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-slate-950/90 backdrop-blur-md"
            onClick={() => { setSelectedIdUrl(null); setImageLoading(true); }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative max-w-5xl w-full bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-8 right-8 z-20">
                <button 
                  onClick={() => { setSelectedIdUrl(null); setImageLoading(true); }}
                  className="p-4 bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-400 rounded-full transition-all duration-300 border border-white/5 hover:border-rose-500/30"
                >
                  <X className="size-6" />
                </button>
              </div>

              <div className="p-4 bg-black/40 min-h-[70vh] flex items-center justify-center relative">
                {imageLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                    <div className="size-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
                    <p className="text-white font-bold text-xs uppercase tracking-widest animate-pulse">Scanning Document...</p>
                  </div>
                )}
                
                <img 
                  src={getValidImageUrl(selectedIdUrl)} 
                  alt="Government ID" 
                  className={`max-w-full max-h-[85vh] object-contain shadow-2xl transition-all duration-700 ${imageLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                  onLoad={() => setImageLoading(false)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/1200x800?text=Identity+Document+Not+Found";
                    setImageLoading(false);
                  }}
                />
              </div>

              <div className="px-10 py-8 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                    <FileText className="size-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-black uppercase tracking-wider text-sm">Verified Identity Protocol</p>
                    <p className="text-slate-500 text-xs font-medium">Encrypted Document Transfer Active</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => window.open(getValidImageUrl(selectedIdUrl), '_blank')}
                  className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all border border-white/10 font-bold text-sm"
                >
                  <ExternalLink className="size-4" /> Expand Original
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Pending Registrations</h2>
        </div>
        {techs.length > 0 ? (
          <div className="grid gap-4">
            {techs.map(tech => (
              <div key={tech.id} className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 flex flex-col md:flex-row justify-between items-center gap-6 rounded-[2rem] shadow-xl">
                <div className="flex items-center gap-5 w-full md:w-auto">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-2xl font-bold text-slate-400 border border-white/10 overflow-hidden shrink-0">
                    {tech.avatar ? (
                      <img src={getValidImageUrl(tech.avatar)} className="w-full h-full object-cover" alt={tech.name} />
                    ) : (
                      tech.name?.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{tech.name}</h3>
                    <p className="text-slate-500 font-medium">{tech.email} • {tech.phone}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-1 bg-white/10 text-white rounded-md text-xs font-bold border border-white/10">{tech.category}</span>
                      {tech.verificationStatus === 'uploaded' && (
                         <span className="px-2 py-1 bg-cyan-400/10 text-cyan-400 rounded-md text-xs font-bold border border-cyan-400/20 flex items-center gap-1">
                          <FileText className="size-3" /> ID Uploaded
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  {(tech.govIdUrl || tech.gov_id_url || tech.verificationStatus === 'uploaded' || tech.verification_status === 'uploaded') && (
                    <button 
                      onClick={() => {
                        const url = tech.govIdUrl || tech.gov_id_url;
                        if (url) setSelectedIdUrl(url);
                      }}
                      className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold transition border border-white/10 flex items-center gap-2"
                    >
                      <Eye className="size-4" /> View ID
                    </button>
                  )}
                  <button onClick={() => handleApprove(tech.id)} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold transition">Approve</button>
                  <button onClick={() => handleReject(tech.id)} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold transition border border-white/10">Reject</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[3rem]">
            <ShieldCheck className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No pending registrations</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Pending Tool Requisitions</h2>
        </div>
        {toolOrders.filter(o => o.status === 'Pending').length > 0 ? (
          <div className="space-y-4">
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
          <div className="text-center py-20 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[3rem]">
            <Package className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No pending tool orders</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
