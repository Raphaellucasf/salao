import { Sparkles } from 'lucide-react';

interface BrandMarkProps {
  compact?: boolean;
  inverse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function BrandMark({ compact = false, inverse = false, size = 'md', className = '' }: BrandMarkProps) {
  const markSizes = {
    sm: 'h-9 w-9 rounded-xl text-xs',
    md: 'h-11 w-11 rounded-2xl text-sm',
    lg: 'h-14 w-14 rounded-2xl text-base',
  };

  return (
    <div className={`inline-flex min-w-0 items-center gap-3 ${className}`}>
      <div className={`${markSizes[size]} relative flex shrink-0 items-center justify-center overflow-hidden bg-linear-to-br from-primary-700 via-primary-800 to-primary-950 text-white shadow-luxury`} aria-hidden="true">
        <span className="font-semibold tracking-[-0.12em]">DD</span>
        <Sparkles className="absolute right-1 top-1 h-3 w-3 text-accent-300" />
      </div>
      {!compact && (
        <span className="min-w-0 leading-none">
          <span className={`block truncate font-semibold tracking-[-0.03em] ${inverse ? 'text-white' : 'text-neutral-950'}`}>Dimas Dona</span>
          <span className={`mt-1 block text-[0.65rem] font-medium uppercase tracking-[0.24em] ${inverse ? 'text-white/55' : 'text-neutral-500'}`}>Concept</span>
        </span>
      )}
    </div>
  );
}
