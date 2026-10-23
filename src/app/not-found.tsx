import Link from 'next/link';
import { AlertCircle, Home, LayoutDashboard } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center px-4 sm:px-6 py-16">
      <div className="max-w-md w-full bg-[#181818] border border-[#262626] rounded-2xl p-8 sm:p-10 text-center shadow-2xl flex flex-col items-center">
        
        {/* Sleek Icon Container */}
        <div className="w-14 h-14 rounded-xl bg-[#202020] border border-[#2e2e2e] flex items-center justify-center mb-6">
          <AlertCircle className="w-7 h-7 text-zinc-300" />
        </div>

        {/* 404 Status */}
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Error 404</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
          Page Not Found
        </h1>

        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
          The requested creator portal route or brand resource does not exist or has been relocated.
        </p>

        {/* Action CTAs */}
        <div className="w-full flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="w-full bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <LayoutDashboard className="w-4 h-4" />
            Go to Creator Dashboard
          </Link>

          <Link
            href="/"
            className="w-full bg-[#202020] hover:bg-[#282828] text-zinc-300 hover:text-white font-semibold text-xs uppercase tracking-wider py-3.5 px-6 rounded-lg border border-[#2e2e2e] transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Portal Home
          </Link>
        </div>

      </div>
    </div>
  );
}
