import type { ElementType, ReactNode } from 'react';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: ReactNode;
  helper?: string;
  icon: ElementType;
  tone?: 'primary' | 'accent' | 'success' | 'info';
  className?: string;
}

export default function StatCard({ label, value, helper, icon: Icon, tone = 'primary', className = '' }: StatCardProps) {
  const tones = {
    primary: 'border-primary-100 bg-primary-50 text-primary-700',
    accent: 'border-accent-100 bg-accent-50 text-accent-700',
    success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    info: 'border-sky-100 bg-sky-50 text-sky-700',
  };

  return (
    <Card padding="md" className={`relative overflow-hidden ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-600">{label}</p>
          <div className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-neutral-950">{value}</div>
          {helper && <p className="mt-1.5 text-xs leading-5 text-neutral-500">{helper}</p>}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${tones[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </Card>
  );
}
