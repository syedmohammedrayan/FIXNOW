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
        <h2 className="text-2xl font-bold text-white">Financial Ledger</h2>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-indigo-500/5">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Service Revenue</p>
            <Activity className="size-4 text-indigo-500" />
          </div>
          <h4 className="text-3xl font-black text-white">₹{transactions.filter(t => t.type === 'service_payment').reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0)}</h4>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-pink-500/20 bg-pink-500/5">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-pink-400">Tool Purchases</p>
            <ShoppingCart className="size-4 text-pink-500" />
          </div>
          <h4 className="text-3xl font-black text-white">₹{transactions.filter(t => t.type === 'tool_purchase').reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0)}</h4>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Net Platform Flow</p>
            <DollarSign className="size-4 text-emerald-500" />
          </div>
          <h4 className="text-3xl font-black text-emerald-400">₹{transactions.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0)}</h4>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left min-w-[700px]">
          <thead className="glass-panel border-white/10 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-6 py-5">TXN ID</th>
              <th className="px-6 py-5">Type & Reference</th>
              <th className="px-6 py-5">Date</th>
              <th className="px-6 py-5 text-right">Amount</th>
              <th className="px-6 py-5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map(txn => (
              <tr key={txn.id} className="hover:bg-slate-800/40 transition group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${txn.type === 'service_payment' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-pink-500/20 text-pink-400'}`}>
                      {txn.type === 'service_payment' ? <Activity className="size-4" /> : <Package className="size-4" />}
                    </div>
                    <div className="font-bold text-slate-300 font-mono text-[10px]">{txn.id}</div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="font-bold text-white text-xs mb-1">
                    {txn.type === 'service_payment' ? 'Service Payment' : 'Tool Purchase'}
                  </div>
                  <div className="text-[10px] text-indigo-300 font-medium">Ref: {txn.bookingId || txn.orderId}</div>
                </td>
                <td className="px-6 py-5 text-slate-400 text-xs font-medium">
                  {new Date(txn.createdAt).toLocaleDateString()} <span className="text-indigo-200">{new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </td>
                <td className="px-6 py-5 text-right">
                  <span className={`font-black text-lg ${txn.type === 'service_payment' ? 'text-indigo-400' : 'text-pink-400'}`}>
                    {txn.type === 'tool_purchase' ? '-' : '+'}₹{txn.amount}
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${txn.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                    {txn.status}
                  </span>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-indigo-300 font-bold">
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
