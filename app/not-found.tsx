import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-3xl font-extrabold text-[#10B981] mb-4">404 - Cozy Hood Lost</h2>
      <p className="text-zinc-400 max-w-md mb-8">
        We couldn&apos;t find the page you were looking for. Keep it cozy, and return to safety.
      </p>
      <Link href="/" className="px-6 py-3 bg-[#10B981] text-black font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-emerald-400 transition-all">
        Back to the Hood
      </Link>
    </div>
  );
}
