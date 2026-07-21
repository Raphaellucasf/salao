import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 focus:outline-none disabled:pointer-events-none disabled:opacity-50 active:translate-y-px';
    
    const variants = {
      primary: 'bg-primary-800 text-white shadow-card hover:bg-primary-900 hover:shadow-luxury',
      secondary: 'border border-neutral-200 bg-white text-neutral-800 shadow-card hover:border-neutral-300 hover:bg-neutral-50',
      accent: 'bg-accent-600 text-white shadow-card hover:bg-accent-700 hover:shadow-luxury',
      outline: 'border border-primary-300 bg-transparent text-primary-800 hover:border-primary-500 hover:bg-primary-50',
      ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-900/5 hover:text-neutral-950',
    };
    
    const sizes = {
      sm: 'min-h-9 px-3.5 py-2 text-sm',
      md: 'px-5 py-2.5 text-sm',
      lg: 'min-h-12 px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
