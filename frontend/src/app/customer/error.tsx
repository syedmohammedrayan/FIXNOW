'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('[FIXNOW/Customer]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
      <div className="fixed top-0 right-0 w-[50vw] h-[50vw] bg-rose-500/[0.04] blur-[120px] rounded-full pointer-events-none" />
      <div className="relative max-w-sm w-full text-center">
        <div className="mx-auto mb-8 size-20 rounded-[1.8rem] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <AlertTriangle className="size-10 text-rose-400" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tighter uppercase mb-2">Something Went Wrong</h1>
        <p className="text-slate-400 text-sm font-medium mb-8">An error occurred in the customer portal. Your booking data is safe.</p>
        <div className="flex flex-col gap-3">
          <button onClick={reset} className="w-full py-4 bg-white text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2">
            <RefreshCw className="size-4" /> Try Again
          </button>
          <button onClick={() => router.push('/customer/dashboard')} className="w-full py-4 bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.08] font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2">
            <ArrowLeft className="size-4" /> Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
