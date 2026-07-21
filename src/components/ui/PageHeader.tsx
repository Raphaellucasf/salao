import type { ElementType, ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ElementType;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}

export default function PageHeader({ eyebrow, title, description, icon: Icon, actions, meta, className = '' }: PageHeaderProps) {
  return (
    <header className={`flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="flex min-w-0 items-start gap-4">
        {Icon && (
          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent-200 bg-accent-50 text-accent-700 shadow-card">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent-700">{eyebrow}</p>}
          <h1 className="text-balance text-2xl font-semibold tracking-[-0.035em] text-neutral-950 sm:text-3xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600 sm:text-base">{description}</p>}
          {meta && <div className="mt-3 text-sm text-neutral-500">{meta}</div>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
