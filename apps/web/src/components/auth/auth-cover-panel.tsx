'use client';

import React, { useState, useEffect } from 'react';
import {
  Quote,
  ShieldCheck,
  Zap,
  TrendingUp,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Lock,
} from 'lucide-react';

export interface FinancialQuote {
  quote: string;
  author: string;
  role: string;
  tag: string;
  metric: string;
  metricLabel: string;
}

export const FINANCIAL_QUOTES: FinancialQuote[] = [
  {
    quote:
      'Do not save what is left after spending, but spend what is left after saving.',
    author: 'Warren Buffett',
    role: 'Chairman & CEO, Berkshire Hathaway',
    tag: 'Disciplined Investing',
    metric: '99.99%',
    metricLabel: 'Uptime & Reliability',
  },
  {
    quote:
      'A budget is not about limiting yourself; it is about telling your money where to go instead of wondering where it went.',
    author: 'John C. Maxwell',
    role: 'Leadership Strategist & Author',
    tag: 'Smart Budgeting',
    metric: '₹0',
    metricLabel: 'Hidden Account Fees',
  },
  {
    quote:
      'An investment in knowledge and financial awareness always pays the greatest and most enduring interest.',
    author: 'Benjamin Franklin',
    role: 'Founding Father & Polymath',
    tag: 'Financial Wisdom',
    metric: '< 2s',
    metricLabel: 'Instant P2P Settlements',
  },
  {
    quote:
      'True wealth is not about acquiring possessions; it is about having options, peace of mind, and financial sovereignty.',
    author: 'Morgan Housel',
    role: 'Author, The Psychology of Money',
    tag: 'Financial Freedom',
    metric: '256-Bit',
    metricLabel: 'Bank-Grade AES Security',
  },
  {
    quote:
      'The habit of saving is itself an education. It fosters virtue, cultivates discipline, and empowers your future.',
    author: 'T.T. Munger',
    role: 'Philosopher & Essayist',
    tag: 'Wealth Creation',
    metric: '50k+',
    metricLabel: 'Trusted Smart Wallets',
  },
];

export function AuthCoverPanel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance quotes every 6.5 seconds unless user is hovering
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % FINANCIAL_QUOTES.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const currentQuote = FINANCIAL_QUOTES[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? FINANCIAL_QUOTES.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % FINANCIAL_QUOTES.length);
  };

  return (
    <div
      className="hidden lg:flex lg:w-1/2 xl:w-[54%] relative flex-col justify-between p-10 xl:p-14 overflow-hidden bg-[#0c0c14] border-r border-[#1e1e2e]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Ambient background blur elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Decorative Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

      {/* Top Header & Brand */}
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-[#0d0d17] rounded-[10px] flex items-center justify-center">
                <Wallet className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent tracking-tight">
                PayFlow
              </span>
              <p className="text-[11px] font-medium text-indigo-400/90 tracking-wide">
                Smart Digital Wallet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>256-Bit SSL Secured</span>
          </div>
        </div>
      </div>

      {/* Center Section: Financial Wisdom & Quote Carousel */}
      <div className="relative z-10 my-auto py-10 max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Financial Wisdom</span>
          <span className="text-slate-500">•</span>
          <span className="text-indigo-200">{currentQuote.tag}</span>
        </div>

        {/* Quotation card with glassmorphism */}
        <div className="relative rounded-2xl bg-[#12121d]/90 border border-[#232338] p-8 xl:p-9 shadow-2xl backdrop-blur-xl transition-all duration-300">
          <div className="absolute top-6 right-6 opacity-15 text-indigo-400">
            <Quote className="w-16 h-16 rotate-180" />
          </div>

          <p className="text-lg xl:text-xl font-medium text-slate-100 leading-relaxed tracking-normal relative z-10 min-h-[85px] transition-opacity duration-300">
            &ldquo;{currentQuote.quote}&rdquo;
          </p>

          <div className="mt-8 pt-6 border-t border-[#1e1e30] flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
                {currentQuote.author
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {currentQuote.author}
                </h4>
                <p className="text-xs text-slate-400">
                  {currentQuote.role}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-base font-bold text-indigo-400 font-mono">
                {currentQuote.metric}
              </span>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                {currentQuote.metricLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Carousel Navigation Controls */}
        <div className="flex items-center justify-between mt-6 px-1">
          <div className="flex items-center gap-2">
            {FINANCIAL_QUOTES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to quotation ${idx + 1}`}
                className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? 'w-7 bg-indigo-500'
                    : 'w-2 bg-[#252538] hover:bg-[#35354e]'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous quote"
              className="w-8 h-8 rounded-lg bg-[#151522] border border-[#232336] text-slate-400 hover:text-white hover:border-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next quote"
              className="w-8 h-8 rounded-lg bg-[#151522] border border-[#232336] text-slate-400 hover:text-white hover:border-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Feature Badges */}
      <div className="relative z-10 pt-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-[#12121e]/80 border border-[#1e1e30] flex flex-col gap-1.5 backdrop-blur-sm">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-200">
              ₹0 Transfer Fees
            </span>
            <span className="text-[11px] text-slate-500">
              Zero platform cost on instant payouts
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#12121e]/80 border border-[#1e1e30] flex flex-col gap-1.5 backdrop-blur-sm">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-200">
              Bank-Grade Vault
            </span>
            <span className="text-[11px] text-slate-500">
              6-digit secure payment PIN & alerts
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#12121e]/80 border border-[#1e1e30] flex flex-col gap-1.5 backdrop-blur-sm">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-200">
              Real-Time Insights
            </span>
            <span className="text-[11px] text-slate-500">
              Smart monthly spending analytics
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-6 mt-6 border-t border-[#181826]">
          <p>© {new Date().getFullYear()} PayFlow Technologies. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </div>
  );
}
