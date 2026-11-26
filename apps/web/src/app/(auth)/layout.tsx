import React from 'react';
import { AuthCoverPanel } from '@/components/auth/auth-cover-panel';
import { Wallet, Sparkles, ShieldCheck } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0f] text-slate-100 flex flex-col lg:flex-row overflow-x-hidden">
      {/* Left Column: Interactive Cover Panel with Financial Wisdom & Highlights */}
      <AuthCoverPanel />

      {/* Right Column: Form Container */}
      <div className="w-full lg:w-1/2 xl:w-[46%] flex flex-col justify-between items-center p-4 sm:p-8 lg:p-12 min-h-screen relative overflow-y-auto bg-[#0a0a0f]">
        {/* Subtle background glow for right side */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Mobile Header Banner (Visible only on < lg screens) */}
        <div className="lg:hidden w-full max-w-md pt-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 p-0.5 flex items-center justify-center shadow-md">
                <div className="w-full h-full bg-[#0d0d17] rounded-[6px] flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                PayFlow
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span>256-Bit SSL</span>
            </div>
          </div>

          {/* Compact Mobile Quote Pill */}
          <div className="p-3 rounded-xl bg-[#12121e] border border-[#1e1e30] flex items-start gap-2.5 text-xs text-slate-300 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-slate-300">
              <span className="italic">&ldquo;Do not save what is left after spending, but spend what is left after saving.&rdquo;</span>
              <span className="block font-semibold text-indigo-400 mt-0.5">— Warren Buffett</span>
            </p>
          </div>
        </div>

        {/* Main Auth Form Container */}
        <div className="w-full max-w-md my-auto py-4 sm:py-6 relative z-10">
          {children}
        </div>

        {/* Form Footer */}
        <div className="w-full max-w-md text-center py-4 text-xs text-slate-500 flex items-center justify-center gap-2 relative z-10">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
          <span>Protected by 256-bit bank-grade encryption</span>
        </div>
      </div>
    </div>
  );
}
