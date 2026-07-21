import * as React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}

export function Badge({ children, className = '', variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'border-neutral-200 bg-neutral-100 text-neutral-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-primary-200 bg-primary-50 text-primary-800',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
