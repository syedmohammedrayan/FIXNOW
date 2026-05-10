export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin" />
        </div>
        <p className="text-sm font-semibold text-slate-400 tracking-wider uppercase shimmer-text">Loading...</p>
      </div>
    </div>
  );
}
