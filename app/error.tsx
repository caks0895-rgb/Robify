'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-3xl font-extrabold text-[#10B981] mb-4">Something Went Wrong</h2>
      <p className="text-zinc-400 max-w-md mb-8">
        A cozy issue occurred in the generator stream.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-3 bg-[#10B981] text-black font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-emerald-400 transition-all cursor-pointer"
      >
        Try Again
      </button>
    </div>
  );
}
