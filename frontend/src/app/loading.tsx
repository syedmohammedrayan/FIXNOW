'use client';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-[3px] border-white/5 rounded-full" />
          <div className="absolute inset-0 border-[3px] border-t-cyan-400 rounded-full animate-spin shadow-[0_0_15px_rgba(34,211,238,0.3)]" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-black text-white uppercase tracking-[0.5em] animate-pulse">Initializing</p>
          <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">Secure Node Synchronization</p>
        </div>
      </div>
    </div>
  );
}
