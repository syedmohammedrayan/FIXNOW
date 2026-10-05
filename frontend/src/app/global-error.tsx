'use client';

import { useEffect } from 'react';

// global-error.tsx must define its own html and body tags
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="max-w-md w-full">
            <h1 className="text-3xl font-black uppercase tracking-tighter mb-4 text-rose-500">
              Critical Error
            </h1>
            <p className="text-slate-400 mb-8">
              The application failed to load critical resources. This might be due to a poor network connection.
            </p>
            <button
              onClick={() => reset()}
              className="bg-white text-slate-950 font-bold px-6 py-3 rounded-xl uppercase tracking-widest"
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
