'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShoppingCart, DollarSign, Package, TrendingUp } from 'lucide-react';

interface TransactionsTabProps {
  transactions: any[];
}

export function TransactionsTab({ transactions }: TransactionsTabProps) {
  const serviceTotal = transactions.filter(t => t.type === 'service_payment').reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
  const toolTotal    = transactions.filter(t => t.type === 'tool_purchase').reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
  const netTotal     = transactions.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);

  return (
    <motion.div key="transactions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">Financial Ledger</h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{transactions.length} transactions on record</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Service Revenue', value: `₹${serviceTotal.toLocaleString()}`, icon: <Activity className="size-4 sm:size-5 text-slate-300" />, accent: '' },
          { label: 'Tool Purchases',  value: `₹${toolTotal.toLocaleString()}`,    icon: <ShoppingCart className="size-4 sm:size-5 text-slate-300" />, accent: '' },
          { label: 'Net Platform Flow', value: `₹${netTotal.toLocaleString()}`,  icon: <TrendingUp className="size-4 sm:size-5 text-white" />, accent: 'border-white/[0.15] bg-white/[0.06]' },
        ].map(m => (
          <div key={m.label} className={`bg-slate-900/50 backdrop-blur-xl p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/[0.08] ${m.accent}`}>
            <div className="flex justify-between items-start mb-3">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">{m.label}</p>
              {m.icon}
            </div>
            <h4 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">{m.value}</h4>
          </div>
        ))}
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 backdrop-blur-xl border border-white/[0.06] rounded-[2rem] border-dashed">
          <DollarSign className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No transactions found in the ledger</p>
        </div>
      ) : (
        <>
          {/* ── Mobile Card List ── */}
          <div className="md:hidden space-y-3">
            {transactions.map(txn => (
              <div key={txn.id} className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] p-4 rounded-[1.5rem] hover:border-white/[0.15] transition">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-xl flex items-center justify-center shrink-0 bg-white/[0.05] border border-white/[0.08] text-slate-400">
                      {txn.type === 'service_payment' ? <Activity className="size-4" /> : <Package className="size-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-white text-xs uppercase">{txn.type === 'service_payment' ? 'Service Payment' : 'Tool Purchase'}</p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">#{txn.id.slice(-8).toUpperCase()}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 font-black text-base ${txn.type === 'service_payment' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {txn.type === 'tool_purchase' ? '-' : '+'}₹{txn.amount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[9px] pt-2.5 border-t border-white/[0.05]">
                  <span className="text-slate-500 font-mono">{new Date(txn.createdAt).toLocaleDateString()}</span>
                  <span className={`px-2.5 py-1 rounded-full font-black uppercase tracking-wider border ${txn.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                    {txn.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop Table ── */}
          <div className="hidden md:block bg-slate-900/50 backdrop-blur-xl rounded-[1.75rem] overflow-hidden border border-white/[0.08]">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <table className="w-full text-sm text-left min-w-[680px]">
                <thead className="bg-white/[0.04] text-slate-500 font-black uppercase text-[9px] tracking-widest border-b border-white/[0.06]">
                  <tr>
                    <th className="px-6 py-4">TXN ID</th>
                    <th className="px-6 py-4">Type & Reference</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {transactions.map(txn => (
                    <tr key={txn.id} className="hover:bg-white/[0.03] transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.05] border border-white/[0.08] text-slate-400">
                            {txn.type === 'service_payment' ? <Activity className="size-3.5" /> : <Package className="size-3.5" />}
                          </div>
                          <span className="font-bold text-slate-500 font-mono text-[10px]">#{txn.id.slice(-8).toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-xs mb-0.5 uppercase">{txn.type === 'service_payment' ? 'Service Payment' : 'Tool Purchase'}</div>
                        <div className="text-[10px] text-slate-500">Ref: {txn.bookingId || txn.orderId}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                        {new Date(txn.createdAt).toLocaleDateString()}{' '}
                        <span className="text-slate-600">{new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-black text-base ${txn.type === 'service_payment' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {txn.type === 'tool_purchase' ? '-' : '+'}₹{txn.amount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${txn.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
