"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Send,
  Plus,
  Landmark,
  QrCode,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface WalletBalanceCardProps {
  balance: number;
  currency?: string;
  isLocked?: boolean;
  onAddMoneyClick?: () => void;
  onWithdrawClick?: () => void;
  onScanQrClick?: () => void;
}

export function WalletBalanceCard({
  balance,
  currency = "INR",
  isLocked = false,
  onAddMoneyClick,
  onWithdrawClick,
  onScanQrClick,
}: WalletBalanceCardProps) {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-[#1b1a38] via-[#151428] to-[#11111d] border border-indigo-500/20 shadow-2xl shadow-indigo-950/40">
      {/* Decorative background glows */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top row: Status and Toggle */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center gap-1.5 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>PayFlow Primary Wallet</span>
          </div>
          {isLocked && (
            <div className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center gap-1 text-rose-400 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Locked</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowBalance(!showBalance)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors"
          title={showBalance ? "Hide balance" : "Show balance"}
        >
          {showBalance ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Balance Display */}
      <div className="relative z-10 mb-8">
        <p className="text-sm font-medium text-slate-400">Available Balance</p>
        <div className="flex items-baseline gap-2 mt-1">
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            {showBalance ? formatCurrency(balance, currency) : "₹••••••••"}
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Instant settlement • Zero transaction fee on wallet transfers
        </p>
      </div>

      {/* Quick Action Buttons Grid */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/send" className="w-full">
          <Button
            variant="primary"
            fullWidth
            leftIcon={<Send className="w-4 h-4" />}
            className="rounded-xl py-3 text-sm font-semibold shadow-lg shadow-indigo-600/30"
          >
            Send Money
          </Button>
        </Link>

        {onAddMoneyClick ? (
          <Button
            variant="secondary"
            onClick={onAddMoneyClick}
            leftIcon={<Plus className="w-4 h-4 text-emerald-400" />}
            className="rounded-xl py-3 text-sm font-semibold border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 text-slate-200"
          >
            Add Money
          </Button>
        ) : (
          <Link href="/wallet?action=add" className="w-full">
            <Button
              variant="secondary"
              fullWidth
              leftIcon={<Plus className="w-4 h-4 text-emerald-400" />}
              className="rounded-xl py-3 text-sm font-semibold border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 text-slate-200"
            >
              Add Money
            </Button>
          </Link>
        )}

        {onWithdrawClick ? (
          <Button
            variant="secondary"
            onClick={onWithdrawClick}
            leftIcon={<Landmark className="w-4 h-4 text-amber-400" />}
            className="rounded-xl py-3 text-sm font-semibold border-white/10 hover:border-amber-500/30 hover:bg-amber-500/5 text-slate-200"
          >
            Withdraw
          </Button>
        ) : (
          <Link href="/wallet?action=withdraw" className="w-full">
            <Button
              variant="secondary"
              fullWidth
              leftIcon={<Landmark className="w-4 h-4 text-amber-400" />}
              className="rounded-xl py-3 text-sm font-semibold border-white/10 hover:border-amber-500/30 hover:bg-amber-500/5 text-slate-200"
            >
              Withdraw
            </Button>
          </Link>
        )}

        {onScanQrClick ? (
          <Button
            variant="secondary"
            onClick={onScanQrClick}
            leftIcon={<QrCode className="w-4 h-4 text-indigo-400" />}
            className="rounded-xl py-3 text-sm font-semibold border-white/10 hover:border-indigo-500/30 hover:bg-indigo-500/5 text-slate-200"
          >
            Scan QR
          </Button>
        ) : (
          <Link href="/send?mode=scan" className="w-full">
            <Button
              variant="secondary"
              fullWidth
              leftIcon={<QrCode className="w-4 h-4 text-indigo-400" />}
              className="rounded-xl py-3 text-sm font-semibold border-white/10 hover:border-indigo-500/30 hover:bg-indigo-500/5 text-slate-200"
            >
              Scan QR
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default WalletBalanceCard;
