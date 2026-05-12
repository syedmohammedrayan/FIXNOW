'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log to console for debugging — silently in production
    console.error('[FIXNOW] Unhandled error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
      {/* Ambient glows */}
      <div className="fixed top-0 right-0 w-[50vw] h-[50vw] bg-rose-500/[0.04] blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[40vw] h-[40vw] bg-slate-700/[0.06] blur-[100px] rounded-full pointer-events-none" />

      <div className="relative max-w-md w-full text-center">
        {/* Icon */}
        <div className="mx-auto mb-8 size-24 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-2xl">
          <svg className="size-12 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>

        <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-3">System Error</h1>
        <p className="text-slate-400 text-sm font-medium leading-relaxed mb-2">
          An unexpected error occurred. Our team has been notified.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <p className="text-rose-400 text-xs font-mono bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 mb-6 text-left break-all">
            {error.message}
          </p>
        )}

        <div className="flex flex-col gap-3 mt-8">
          <button
            onClick={reset}
            className="w-full py-4 bg-white text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 transition-all active:scale-95 shadow-xl"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full py-4 bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.08] font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95"
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}
