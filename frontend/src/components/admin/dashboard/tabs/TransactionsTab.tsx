'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShoppingCart, DollarSign, Package } from 'lucide-react';

interface TransactionsTabProps {
  transactions: any[];
}

export function TransactionsTab({ transactions }: TransactionsTabProps) {
  return (
    <motion.div key="transactions" className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Financial Ledger</h2>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Service Revenue</p>
            <Activity className="size-4 text-white" />
          </div>
          <h4 className="text-3xl font-black text-white">₹{transactions.filter(t => t.type === 'service_payment').reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0)}</h4>
        </div>
        <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tool Purchases</p>
            <ShoppingCart className="size-4 text-white" />
          </div>
          <h4 className="text-3xl font-black text-white">₹{transactions.filter(t => t.type === 'tool_purchase').reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0)}</h4>
        </div>
        <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Net Platform Flow</p>
            <DollarSign className="size-4 text-cyan-400" />
          </div>
          <h4 className="text-3xl font-black text-cyan-400">₹{transactions.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0)}</h4>
        </div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden border border-white/10 overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left min-w-[700px]">
          <thead className="bg-white/5 border-white/10 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-white/5">
            <tr>
              <th className="px-6 py-5">TXN ID</th>
              <th className="px-6 py-5">Type & Reference</th>
              <th className="px-6 py-5">Date</th>
              <th className="px-6 py-5 text-right">Amount</th>
              <th className="px-6 py-5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.map(txn => (
              <tr key={txn.id} className="hover:bg-white/5 transition group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg flex items-center justify-center shrink-0 bg-white/5 border border-white/10 text-white">
                      {txn.type === 'service_payment' ? <Activity className="size-4" /> : <Package className="size-4" />}
                    </div>
                    <div className="font-bold text-slate-500 font-mono text-[10px]">#{txn.id.slice(-8).toUpperCase()}</div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="font-bold text-white text-xs mb-1 uppercase">
                    {txn.type === 'service_payment' ? 'Service Payment' : 'Tool Purchase'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Ref: {txn.bookingId || txn.orderId}</div>
                </td>
                <td className="px-6 py-5 text-slate-500 text-xs font-mono">
                  {new Date(txn.createdAt).toLocaleDateString()} <span className="text-slate-600 ml-1">{new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </td>
                <td className="px-6 py-5 text-right">
                  <span className={`font-black text-lg ${txn.type === 'service_payment' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {txn.type === 'tool_purchase' ? '-' : '+'}₹{txn.amount}
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${txn.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                    {txn.status}
                  </span>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-600 font-bold uppercase tracking-widest text-xs">
                  No transactions found in the ledger.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
