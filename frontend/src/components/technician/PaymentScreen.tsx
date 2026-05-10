'use client';

import React from "react";
import { motion } from "framer-motion";
import { X, CheckCircle2, QrCode, Banknote, Smartphone, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface PaymentScreenProps {
  totalAmount: number;
  setShowPaymentScreen: (show: boolean) => void;
  handleConfirmPayment: (method: "QR" | "Cash") => void;
  completing: boolean;
}

export default function PaymentScreen({
  totalAmount,
  setShowPaymentScreen,
  handleConfirmPayment,
  completing,
}: PaymentScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full"
    >
      <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">
                Payment Collection
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">
              Final Settlement
            </h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
              Mission Critical Fund Recovery
            </p>
          </div>
          <button
            onClick={() => setShowPaymentScreen(false)}
            className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-8 mb-10">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                Total Valuation Due
              </p>
              <p className="text-5xl font-black text-white tracking-tighter">
                ₹{totalAmount}
              </p>
              <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest mt-2">
                Unified Protocol Fee Applied
              </p>
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full">
              <Smartphone className="size-4 text-white" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                Multi-Channel
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col items-center bg-white/5 border border-white/10 rounded-[2.5rem] p-8 shadow-sm">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 text-center">
                Scan Secure Node for Digital
              </p>
              <div className="p-8 bg-white rounded-3xl mb-6 shadow-2xl">
                <QRCodeSVG
                  value={`upi://pay?pa=fixnow@upi&pn=FIXNOW%20Systems&am=${totalAmount}&cu=INR&tn=Service%20Payment`}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">
                GPay • PhonePe • Paytm • Amazon
              </p>
              <button
                onClick={() => handleConfirmPayment("QR")}
                disabled={completing}
                className="mt-8 w-full py-5 bg-white text-slate-950 hover:bg-slate-100 font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
              >
                {completing ? (
                  <Loader2 className="animate-spin size-5" />
                ) : (
                  <>
                    <QrCode className="size-5" /> Confirm QR Success
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col bg-white/5 border border-white/10 rounded-[2.5rem] p-8 shadow-sm">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 text-center">
                Manual Currency Ingestion
              </p>
              <div className="flex-1 flex flex-col items-center justify-center py-10">
                <div className="size-28 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8">
                  <Banknote className="size-14 text-emerald-400" />
                </div>
                <p className="text-4xl font-black text-white mb-2 tracking-tighter">
                  ₹{totalAmount}
                </p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-center px-4">
                  Confirm physical collection from client
                </p>
              </div>
              <button
                onClick={() => handleConfirmPayment("Cash")}
                disabled={completing}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
              >
                {completing ? (
                  <Loader2 className="animate-spin size-5" />
                ) : (
                  <>
                    <Banknote className="size-5" /> Confirm Cash In-Hand
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-8 flex items-start gap-4 bg-white/5 border border-white/10 rounded-2xl p-6">
            <CheckCircle2 className="size-5 text-slate-500 mt-0.5 shrink-0" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
              CONFIRMATION ACKNOWLEDGES FULL RECEIPT OF SETTLEMENT. 
              TRANSACTION DATA WILL BE ENCRYPTED AND SYNCED TO THE SERVICE LEDGER IMMEDIATELY.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
