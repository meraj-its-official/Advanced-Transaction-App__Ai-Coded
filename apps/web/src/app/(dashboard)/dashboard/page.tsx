"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Calendar,
  ChevronRight,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { WalletBalanceCard } from "@/components/features/wallet-balance-card";
import {
  TransactionCard,
  TransactionItem,
} from "@/components/features/transaction-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { walletApi, paymentsApi, analyticsApi } from "@/lib/api";

interface DashboardStatsData {
  walletBalance: number;
  totalSent: number;
  totalReceived: number;
  transactionCount: number;
  sentPercentageChange?: string;
  sentIsPositive?: boolean;
  receivedPercentageChange?: string;
  receivedIsPositive?: boolean;
  settlementRate?: string;
  monthlyTrend: { name: string; sent: number; received: number }[];
}

const defaultTrend = [
  { name: "Mon", sent: 0, received: 0 },
  { name: "Tue", sent: 0, received: 0 },
  { name: "Wed", sent: 0, received: 0 },
  { name: "Thu", sent: 0, received: 0 },
  { name: "Fri", sent: 0, received: 0 },
  { name: "Sat", sent: 0, received: 0 },
  { name: "Sun", sent: 0, received: 0 },
];

export default function DashboardPage() {
  const { user, wallet, setWallet } = useAuthStore();
  const [stats, setStats] = useState<DashboardStatsData>({
    walletBalance: wallet?.balance ?? 0,
    totalSent: 0,
    totalReceived: 0,
    transactionCount: 0,
    sentPercentageChange: "+0%",
    sentIsPositive: true,
    receivedPercentageChange: "+0%",
    receivedIsPositive: true,
    settlementRate: "100%",
    monthlyTrend: defaultTrend,
  });
  const [recentTransactions, setRecentTransactions] = useState<
    TransactionItem[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [walletRes, txRes, statsRes] = await Promise.allSettled([
          walletApi.getWallet(),
          paymentsApi.getTransactions({ limit: 5 }),
          analyticsApi.getDashboardStats(),
        ]);

        if (walletRes.status === "fulfilled" && walletRes.value.data) {
          const w = walletRes.value.data?.data || walletRes.value.data;
          setWallet(w);
          setStats((prev) => ({
            ...prev,
            walletBalance: w.balance ?? prev.walletBalance,
          }));
        }

        let loadedTxns: TransactionItem[] = [];

        if (txRes.status === "fulfilled" && txRes.value.data) {
          const raw = txRes.value.data?.data || txRes.value.data;
          const items = raw?.items || raw?.data || (Array.isArray(raw) ? raw : []);
          if (Array.isArray(items)) {
            loadedTxns = items;
          }
        }

        if (statsRes.status === "fulfilled" && statsRes.value.data) {
          const s = statsRes.value.data?.data || statsRes.value.data;
          setStats((prev) => ({
            ...prev,
            totalSent: s.totalSent ?? prev.totalSent,
            totalReceived: s.totalReceived ?? prev.totalReceived,
            transactionCount: s.transactionCount ?? prev.transactionCount,
            sentPercentageChange: s.sentPercentageChange ?? "+0%",
            sentIsPositive: s.sentIsPositive ?? true,
            receivedPercentageChange: s.receivedPercentageChange ?? "+0%",
            receivedIsPositive: s.receivedIsPositive ?? true,
            settlementRate: s.settlementRate ?? "100%",
            monthlyTrend: s.weeklyTrend || s.monthlyTrend || prev.monthlyTrend,
          }));

          if (loadedTxns.length === 0 && s.recentTransactions && Array.isArray(s.recentTransactions)) {
            loadedTxns = s.recentTransactions;
          }
        }

        setRecentTransactions(loadedTxns);
      } catch (err) {
        console.error("Error loading dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [setWallet]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] || "User"} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Here is your live financial activity and wallet summary.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#12121a] px-3.5 py-2 rounded-xl border border-[#1e1e2e]">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span>
            {new Date().toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Hero Wallet Balance Card */}
      <WalletBalanceCard
        balance={wallet?.balance ?? stats.walletBalance}
        currency={wallet?.currency ?? "INR"}
      />

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Sent */}
        <Card className="bg-[#12121a] border-[#1e1e2e]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Sent
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(stats.totalSent)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <span
              className={`font-semibold flex items-center ${
                stats.sentIsPositive ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> {stats.sentPercentageChange}
            </span>
            <span>vs last month</span>
          </div>
        </Card>

        {/* Total Received */}
        <Card className="bg-[#12121a] border-[#1e1e2e]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Received
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(stats.totalReceived)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <span
              className={`font-semibold flex items-center ${
                stats.receivedIsPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> {stats.receivedPercentageChange}
            </span>
            <span>vs last month</span>
          </div>
        </Card>

        {/* Total Transactions */}
        <Card className="bg-[#12121a] border-[#1e1e2e]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Transactions
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">
            {stats.transactionCount}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <span className="text-indigo-400 font-semibold">{stats.settlementRate} Success</span>
            <span>settlement rate</span>
          </div>
        </Card>
      </div>

      {/* Main Section: Chart & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Spending Bar Chart (3 cols) */}
        <div className="lg:col-span-3">
          <Card className="bg-[#12121a] border-[#1e1e2e] h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Weekly Activity
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Money inflow vs outflow comparison
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="text-slate-400">Received</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-slate-400">Sent</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyTrend} barGap={6}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1e1e2e"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: "#1e1e2e" }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#12121a",
                        borderColor: "#2d2d44",
                        borderRadius: "0.75rem",
                        color: "#fff",
                        fontSize: "0.75rem",
                      }}
                      formatter={(val: number) => [`₹${val}`, "Amount"]}
                    />
                    <Bar
                      dataKey="received"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar dataKey="sent" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#1e1e2e] flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-4 h-4" /> UPI & IMPS Real-time sync
              </span>
              <Link
                href="/analytics"
                className="text-indigo-400 hover:underline"
              >
                View detailed analytics →
              </Link>
            </div>
          </Card>
        </div>

        {/* Recent Transactions (2 cols) */}
        <div className="lg:col-span-2">
          <Card className="bg-[#12121a] border-[#1e1e2e] h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Recent Transactions
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Latest transfers & payouts
                  </p>
                </div>
                <Link href="/transactions">
                  <Button
                    variant="ghost"
                    size="sm"
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  >
                    View All
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((tx) => (
                    <TransactionCard key={tx.id} transaction={tx} />
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400">
                    <p className="text-sm font-medium text-slate-300">No recent transactions</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Send money to contacts or add funds to see activity here
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#1e1e2e]">
              <Link href="/send" className="w-full block">
                <Button variant="primary" fullWidth size="sm">
                  Send Money to Contact
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
