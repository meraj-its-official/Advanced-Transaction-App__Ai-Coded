import React from 'react';
import { cn } from './utils';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
  success: 'bg-green-500/10 text-green-400 border border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
};

export function Badge({ children, variant = 'default', className, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function TransactionStatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, BadgeVariant> = {
    COMPLETED: 'success',
    PENDING: 'warning',
    FAILED: 'danger',
    CANCELLED: 'danger',
    REVERSED: 'info',
  };

  const labelMap: Record<string, string> = {
    COMPLETED: 'Completed',
    PENDING: 'Pending',
    FAILED: 'Failed',
    CANCELLED: 'Cancelled',
    REVERSED: 'Reversed',
  };

  return (
    <Badge variant={variantMap[status] || 'default'}>
      {labelMap[status] || status}
    </Badge>
  );
}
