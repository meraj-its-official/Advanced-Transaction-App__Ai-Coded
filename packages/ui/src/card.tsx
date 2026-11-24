import React from 'react';
import { cn } from './utils';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({
  children,
  className,
  hover = false,
  onClick,
  header,
  footer,
  padding = 'md',
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[#12121a] border border-[#1e1e2e] rounded-2xl overflow-hidden',
        hover && 'transition-all duration-200 hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {header && (
        <div className="px-5 py-4 border-b border-[#1e1e2e]">
          {header}
        </div>
      )}
      <div className={paddingMap[padding]}>
        {children}
      </div>
      {footer && (
        <div className="px-5 py-4 border-t border-[#1e1e2e]">
          {footer}
        </div>
      )}
    </div>
  );
}
