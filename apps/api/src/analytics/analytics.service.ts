import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');

    // Aggregate sent amount
    const sentAgg = await this.prisma.transaction.aggregate({
      where: {
        fromWalletId: wallet.id,
        status: 'COMPLETED',
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    // Aggregate received amount
    const receivedAgg = await this.prisma.transaction.aggregate({
      where: {
        toWalletId: wallet.id,
        status: 'COMPLETED',
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    // Recent 5 transactions
    const rawRecent = await this.prisma.transaction.findMany({
      where: {
        OR: [{ fromWalletId: wallet.id }, { toWalletId: wallet.id }],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        fromWallet: { include: { user: { select: { name: true, phone: true } } } },
        toWallet: { include: { user: { select: { name: true, phone: true } } } },
      },
    });

    const recentTransactions = rawRecent.map((t: any) => {
      const isCredit = t.toWalletId === wallet.id;
      return {
        id: t.id,
        type: t.type,
        status: t.status,
        amount: Number(t.amount),
        currency: t.currency,
        description: t.description,
        referenceId: t.referenceId,
        metadata: t.metadata,
        createdAt: t.createdAt,
        isCredit,
        recipientName: t.toWallet?.user?.name || (t.metadata as any)?.recipientName,
        recipientPhone: t.toWallet?.user?.phone || (t.metadata as any)?.recipientPhone,
        senderName: t.fromWallet?.user?.name || (t.metadata as any)?.senderName,
        senderPhone: t.fromWallet?.user?.phone || (t.metadata as any)?.senderPhone,
      };
    });

    // Weekly activity trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weekTransactions = await this.prisma.transaction.findMany({
      where: {
        OR: [{ fromWalletId: wallet.id }, { toWalletId: wallet.id }],
        status: 'COMPLETED',
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'asc' },
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekMap = new Map<string, { name: string; sent: number; received: number }>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const name = dayNames[d.getDay()];
      weekMap.set(d.toDateString(), { name, sent: 0, received: 0 });
    }

    for (const txn of weekTransactions) {
      const dStr = new Date(txn.createdAt).toDateString();
      if (weekMap.has(dStr)) {
        const item = weekMap.get(dStr)!;
        const amt = Number(txn.amount);
        if (txn.fromWalletId === wallet.id) {
          item.sent += amt;
        }
        if (txn.toWalletId === wallet.id) {
          item.received += amt;
        }
      }
    }

    const weeklyTrend = Array.from(weekMap.values());

    const totalSent = Number(sentAgg._sum.amount ?? 0);
    const totalReceived = Number(receivedAgg._sum.amount ?? 0);
    const transactionCount = (sentAgg._count.id ?? 0) + (receivedAgg._count.id ?? 0);

    // Calculate percentage change vs last month and settlement rate from database
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [sentThisMonthAgg, sentLastMonthAgg, rcvdThisMonthAgg, rcvdLastMonthAgg, allTxnsCount, completedTxnsCount] =
      await Promise.all([
        this.prisma.transaction.aggregate({
          where: {
            fromWalletId: wallet.id,
            status: 'COMPLETED',
            createdAt: { gte: startOfThisMonth },
          },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: {
            fromWalletId: wallet.id,
            status: 'COMPLETED',
            createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
          },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: {
            toWalletId: wallet.id,
            status: 'COMPLETED',
            createdAt: { gte: startOfThisMonth },
          },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: {
            toWalletId: wallet.id,
            status: 'COMPLETED',
            createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
          },
          _sum: { amount: true },
        }),
        this.prisma.transaction.count({
          where: {
            OR: [{ fromWalletId: wallet.id }, { toWalletId: wallet.id }],
          },
        }),
        this.prisma.transaction.count({
          where: {
            OR: [{ fromWalletId: wallet.id }, { toWalletId: wallet.id }],
            status: 'COMPLETED',
          },
        }),
      ]);

    const sentThisMonth = Number(sentThisMonthAgg._sum.amount ?? 0);
    const sentLastMonth = Number(sentLastMonthAgg._sum.amount ?? 0);
    let sentPercentageChange = '+0%';
    let sentIsPositive = true;
    if (sentLastMonth > 0) {
      const diff = ((sentThisMonth - sentLastMonth) / sentLastMonth) * 100;
      sentPercentageChange = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
      sentIsPositive = diff >= 0;
    } else if (sentThisMonth > 0) {
      sentPercentageChange = '+100%';
      sentIsPositive = true;
    }

    const rcvdThisMonth = Number(rcvdThisMonthAgg._sum.amount ?? 0);
    const rcvdLastMonth = Number(rcvdLastMonthAgg._sum.amount ?? 0);
    let receivedPercentageChange = '+0%';
    let receivedIsPositive = true;
    if (rcvdLastMonth > 0) {
      const diff = ((rcvdThisMonth - rcvdLastMonth) / rcvdLastMonth) * 100;
      receivedPercentageChange = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
      receivedIsPositive = diff >= 0;
    } else if (rcvdThisMonth > 0) {
      receivedPercentageChange = '+100%';
      receivedIsPositive = true;
    }

    const settlementRate =
      allTxnsCount > 0
        ? `${Math.round((completedTxnsCount / allTxnsCount) * 100)}%`
        : '100%';

    return {
      walletBalance: Number(wallet.balance),
      currency: wallet.currency,
      totalSent,
      totalReceived,
      transactionCount,
      sentPercentageChange,
      sentIsPositive,
      receivedPercentageChange,
      receivedIsPositive,
      settlementRate,
      weeklyTrend,
      monthlyTrend: weeklyTrend,
      recentTransactions,
    };
  }

  async getSpending(userId: string, monthsCount: number = 6) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const months = Math.max(1, Math.min(Number(monthsCount || 6), 12));
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (months - 1));
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        OR: [{ fromWalletId: wallet.id }, { toWalletId: wallet.id }],
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = new Map<string, { month: string; spend: number; income: number; count: number }>();

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthNames[d.getMonth()]}`;
      monthlyMap.set(key, { month: key, spend: 0, income: 0, count: 0 });
    }

    const categoryMap = new Map<string, number>();
    const dayOfWeekCount = new Map<string, number>();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let totalOutflow = 0;
    let totalInflow = 0;
    let biggestTransaction = 0;
    let allTxnCount = 0;
    let allTxnTotalAmount = 0;

    for (const txn of transactions) {
      const amt = Number(txn.amount);
      const date = new Date(txn.createdAt);
      const monthKey = monthNames[date.getMonth()];
      const dayName = dayNames[date.getDay()];

      allTxnCount++;
      allTxnTotalAmount += amt;
      dayOfWeekCount.set(dayName, (dayOfWeekCount.get(dayName) || 0) + 1);

      if (monthlyMap.has(monthKey)) {
        const item = monthlyMap.get(monthKey)!;
        item.count += 1;
        if (txn.fromWalletId === wallet.id) {
          item.spend += amt;
        }
        if (txn.toWalletId === wallet.id) {
          item.income += amt;
        }
      }

      if (txn.fromWalletId === wallet.id) {
        totalOutflow += amt;
        if (amt > biggestTransaction) {
          biggestTransaction = amt;
        }

        // Determine category
        const cat =
          (txn.metadata as any)?.category ||
          (txn.type === 'TRANSFER'
            ? 'Transfer & Friends'
            : txn.type === 'WITHDRAWAL'
            ? 'Bank Settlement'
            : txn.type === 'PAYMENT'
            ? 'Bills & Utilities'
            : 'Other');
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + amt);
      } else if (txn.toWalletId === wallet.id) {
        totalInflow += amt;
      }
    }

    // Default categories if no spend yet
    const categoryPalette = ['#6366f1', '#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];
    let categoryData = Array.from(categoryMap.entries()).map(([name, value], idx) => ({
      name,
      value,
      color: categoryPalette[idx % categoryPalette.length],
    }));

    if (categoryData.length === 0) {
      categoryData = [
        { name: 'Transfers', value: 0, color: '#6366f1' },
        { name: 'Withdrawals', value: 0, color: '#8b5cf6' },
        { name: 'Utilities', value: 0, color: '#ec4899' },
      ];
    }

    // Find busiest day
    let busiestDayName = 'No activity';
    let maxDayCount = 0;
    for (const [day, count] of dayOfWeekCount.entries()) {
      if (count > maxDayCount) {
        maxDayCount = count;
        busiestDayName = `${day} (${count} Txns)`;
      }
    }

    const avgTransaction = allTxnCount > 0 ? Math.round(allTxnTotalAmount / allTxnCount) : 0;
    const savingsRate =
      totalInflow > 0
        ? `${Math.max(0, Math.round(((totalInflow - totalOutflow) / totalInflow) * 100))}%`
        : '0%';

    const monthlyTrendData = Array.from(monthlyMap.values());

    return {
      totalSpent: totalOutflow,
      totalOutflow,
      totalInflow,
      monthlySpending: monthlyTrendData,
      monthlyTrend: monthlyTrendData,
      categoryBreakdown: categoryData,
      categories: categoryData,
      metrics: {
        avgTransaction,
        biggestTransaction,
        busiestDay: busiestDayName,
        savingsRate,
        totalOutflow,
        totalInflow,
      },
    };
  }
}
