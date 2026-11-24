'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Calendar,
  Zap,
  Target,
  Award,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { analyticsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface MonthlyTrendItem {
  month: string;
  spend: number;
  income: number;
}

interface CategoryItem {
  name: string;
  value: number;
  color: string;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'30D' | '90D' | '1Y'>('30D');
  const [loading, setLoading] = useState(false);

  const [trendData, setTrendData] = useState<MonthlyTrendItem[]>([
    { month: 'Jan', spend: 0, income: 0 },
    { month: 'Feb', spend: 0, income: 0 },
    { month: 'Mar', spend: 0, income: 0 },
    { month: 'Apr', spend: 0, income: 0 },
    { month: 'May', spend: 0, income: 0 },
    { month: 'Jun', spend: 0, income: 0 },
  ]);

  const [categoryData, setCategoryData] = useState<CategoryItem[]>([
    { name: 'Transfers', value: 0, color: '#6366f1' },
    { name: 'Withdrawals', value: 0, color: '#8b5cf6' },
    { name: 'Utilities', value: 0, color: '#ec4899' },
  ]);

  const [metrics, setMetrics] = useState({
    avgTransaction: 0,
    biggestTransaction: 0,
    busiestDay: 'No activity',
    savingsRate: '0%',
    totalOutflow: 0,
    totalInflow: 0,
  });

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const months = timeRange === '30D' ? 1 : timeRange === '90D' ? 3 : 12;
        const res = await analyticsApi.getSpendingTrend(months);
        const data = res.data?.data || res.data;

        if (data) {
          if (data.monthlyTrend && Array.isArray(data.monthlyTrend)) {
            setTrendData(data.monthlyTrend);
          }
          if (data.categoryBreakdown && Array.isArray(data.categoryBreakdown)) {
            setCategoryData(data.categoryBreakdown);
          } else if (data.categories && Array.isArray(data.categories)) {
            setCategoryData(data.categories);
          }
          if (data.metrics) {
            setMetrics({
              avgTransaction: data.metrics.avgTransaction ?? 0,
              biggestTransaction: data.metrics.biggestTransaction ?? 0,
              busiestDay: data.metrics.busiestDay ?? 'No activity',
              savingsRate: data.metrics.savingsRate ?? '0%',
              totalOutflow: data.metrics.totalOutflow ?? 0,
              totalInflow: data.metrics.totalInflow ?? 0,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load analytics data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [timeRange]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Financial Analytics &amp; Insights
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Analyze your spending patterns, categories, and wallet velocity
          </p>
        </div>

        {/* Time Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-[#12121a] rounded-xl border border-[#1e1e2e]">
          {(['30D', '90D', '1Y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                timeRange === range
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {range === '30D' ? 'Last 30 Days' : range === '90D' ? 'Last 3 Months' : 'Last 1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#12121a] border-[#1e1e2e]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Avg. Transaction</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(metrics.avgTransaction)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Across all transfers</p>
        </Card>

        <Card className="bg-[#12121a] border-[#1e1e2e]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Biggest Outflow</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(metrics.biggestTransaction)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Single highest transfer</p>
        </Card>

        <Card className="bg-[#12121a] border-[#1e1e2e]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Busiest Day</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-white tracking-tight">
            {metrics.busiestDay}
          </p>
          <p className="text-xs text-slate-400 mt-1">Peak transaction day</p>
        </Card>

        <Card className="bg-[#12121a] border-[#1e1e2e]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Net Balance Ratio</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400 tracking-tight">
            +{metrics.savingsRate}
          </p>
          <p className="text-xs text-slate-400 mt-1">Inflow exceeds outflow</p>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending & Income Area Chart (2 cols) */}
        <div className="lg:col-span-2">
          <Card className="bg-[#12121a] border-[#1e1e2e] p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-white">Cash Flow Trend</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Monthly comparison between earnings received &amp; expenses spent
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-slate-300">Income</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-slate-300">Spent</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#1e1e2e' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => (val >= 1000 ? `₹${Math.round(val / 1000)}k` : `₹${val}`)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#12121a',
                      borderColor: '#2d2d44',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: '0.75rem',
                    }}
                    formatter={(val: number) => [`₹${val}`, 'Amount']}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#incomeGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="spend"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#spendGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Categories Pie Chart (1 col) */}
        <div>
          <Card className="bg-[#12121a] border-[#1e1e2e] p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Spending by Category</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Top expenditure breakdown</p>
                </div>
                <PieIcon className="w-4 h-4 text-slate-400" />
              </div>

              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#12121a',
                        borderColor: '#2d2d44',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '0.75rem',
                      }}
                      formatter={(val: number) => [`₹${val}`, 'Amount']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="space-y-2 mt-4">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-slate-300 truncate">{cat.name}</span>
                    </div>
                    <span className="font-semibold text-white">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1e1e2e] text-center">
              <span className="text-xs text-slate-400">
                Categorization updated automatically with each payment.
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
