'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Plus, Landmark, RefreshCw } from 'lucide-react';
import { TransactionStatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface TransactionItem {
  id: string;
  type: 'TRANSFER' | 'TOP_UP' | 'WITHDRAWAL' | 'PAYMENT' | 'REFUND';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  amount: number;
  currency?: string;
  recipientName?: string;
  recipientPhone?: string;
  senderName?: string;
  senderPhone?: string;
  description?: string;
  referenceId?: string;
  createdAt: string | Date;
  isCredit?: boolean;
}

interface TransactionCardProps {
  transaction: TransactionItem;
  onClick?: (transaction: TransactionItem) => void;
}

export function TransactionCard({ transaction, onClick }: TransactionCardProps) {
  const isCredit =
    transaction.isCredit !== undefined
      ? transaction.isCredit
      : transaction.type === 'TOP_UP' ||
        transaction.type === 'REFUND' ||
        (transaction.type === 'TRANSFER' && Boolean(transaction.senderName));

  const getIcon = () => {
    switch (transaction.type) {
      case 'TOP_UP':
        return <Plus className="w-4 h-4 text-emerald-400" />;
      case 'WITHDRAWAL':
        return <Landmark className="w-4 h-4 text-amber-400" />;
      case 'REFUND':
        return <RefreshCw className="w-4 h-4 text-indigo-400" />;
      case 'TRANSFER':
      case 'PAYMENT':
      default:
        return isCredit ? (
          <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
        ) : (
          <ArrowUpRight className="w-4 h-4 text-rose-400" />
        );
    }
  };

  const getPartyTitle = () => {
    if (transaction.type === 'TOP_UP') return 'Wallet Top-Up';
    if (transaction.type === 'WITHDRAWAL') return 'Bank Withdrawal';
    if (transaction.type === 'REFUND') return 'Payment Refund';
    if (isCredit) {
      return transaction.senderName || transaction.senderPhone || 'Received from User';
    }
    return transaction.recipientName || transaction.recipientPhone || 'Sent to User';
  };

  const getSubtitle = () => {
    if (transaction.description) return transaction.description;
    if (transaction.referenceId) return `Ref: ${transaction.referenceId.slice(0, 10)}...`;
    return transaction.type;
  };

  return (
    <div
      onClick={() => onClick?.(transaction)}
      className={cn(
        'group flex items-center justify-between p-4 rounded-xl bg-[#12121a] border border-[#1e1e2e]',
        'hover:border-indigo-500/30 hover:bg-[#161622] transition-all duration-200',
        onClick && 'cursor-pointer'
      )}
    >
      {/* Icon & Title */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105',
            isCredit
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-rose-500/10 border-rose-500/20'
          )}
        >
          {getIcon()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-100 truncate group-hover:text-indigo-300 transition-colors">
            {getPartyTitle()}
          </p>
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {getSubtitle()} • {formatDate(transaction.createdAt)}
          </p>
        </div>
      </div>

      {/* Amount & Status Badge */}
      <div className="flex flex-col items-end gap-1.5 shrink-0 pl-4">
        <span
          className={cn(
            'text-sm font-bold tracking-tight',
            isCredit ? 'text-emerald-400' : 'text-slate-100'
          )}
        >
          {isCredit ? '+' : '-'}{' '}
          {formatCurrency(transaction.amount, transaction.currency || 'INR')}
        </span>
        <TransactionStatusBadge status={transaction.status} />
      </div>
    </div>
  );
}

export default TransactionCard;
