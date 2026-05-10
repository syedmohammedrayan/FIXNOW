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
      <div className="glass-panel border-white/10 border border-slate-200 rounded-[2rem] overflow-hidden shadow-xl">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Payment Collection
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Final Settlement
            </h2>
            <p className="text-indigo-300 text-sm font-medium mt-1">
              Collect payment to finalize the service
            </p>
          </div>
          <button
            onClick={() => setShowPaymentScreen(false)}
            className="p-3 glass-panel border-white/10 rounded-xl hover:bg-slate-800/40 backdrop-blur-md transition-colors"
          >
            <X className="size-5 text-indigo-300" />
          </button>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between glass-panel border-white/10 border border-slate-100 rounded-2xl p-8 mb-10">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Total Amount Due
              </p>
              <p className="text-5xl font-extrabold text-white tracking-tighter">
                ₹{totalAmount}
              </p>
              <p className="text-xs text-indigo-300 font-medium mt-2">
                All taxes and fees included
              </p>
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 border border-slate-800 rounded-full">
              <Smartphone className="size-4 text-indigo-600" />
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                UPI / Cash
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col items-center glass-panel border-white/10 border border-slate-200 rounded-[2rem] p-8 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-6">
                Scan QR for Digital Payment
              </p>
              <div className="p-6 glass-panel border-white/10 rounded-3xl mb-6 shadow-md border border-slate-100">
                <QRCodeSVG
                  value={`upi://pay?pa=fixnow@upi&pn=FIXNOW%20Systems&am=${totalAmount}&cu=INR&tn=Service%20Payment`}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                UPI • GPay • PhonePe • Paytm
              </p>
              <button
                onClick={() => handleConfirmPayment("QR")}
                disabled={completing}
                className="mt-8 w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
              >
                {completing ? (
                  <Loader2 className="animate-spin size-5" />
                ) : (
                  <>
                    <QrCode className="size-5" /> Payment Received
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col glass-panel border-white/10 border border-slate-200 rounded-[2rem] p-8 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-6">
                Collect Physical Cash
              </p>
              <div className="flex-1 flex flex-col items-center justify-center py-10">
                <div className="size-28 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-8">
                  <Banknote className="size-14 text-emerald-600" />
                </div>
                <p className="text-4xl font-extrabold text-white mb-2">
                  ₹{totalAmount}
                </p>
                <p className="text-xs text-indigo-300 font-medium text-center px-4">
                  Collect this exact amount from the client physically
                </p>
              </div>
              <button
                onClick={() => handleConfirmPayment("Cash")}
                disabled={completing}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
              >
                {completing ? (
                  <Loader2 className="animate-spin size-5" />
                ) : (
                  <>
                    <Banknote className="size-5" /> Cash Received
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-8 flex items-start gap-4 text-indigo-300 glass-panel border-white/10 border border-slate-100 rounded-2xl p-6">
            <CheckCircle2 className="size-5 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-xs font-semibold leading-relaxed">
              By confirming, you acknowledge receipt of the full payment amount.
              This transaction will be recorded in your service ledger.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
