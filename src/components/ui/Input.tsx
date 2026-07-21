import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, type = 'text', id, required, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const descriptionId = error || helperText ? `${inputId}-description` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-neutral-700">
            {label}
            {required && <span className="ml-1 text-accent-700" aria-hidden="true">*</span>}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionId}
          className={`min-h-11 w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-neutral-950 shadow-[0_1px_2px_rgb(36_31_32/0.03)] outline-none placeholder:text-neutral-400 transition-[border-color,box-shadow,background-color] disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 ${
            error 
              ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
              : 'border-neutral-200 hover:border-neutral-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100'
          } ${className}`}
          {...props}
        />
        {error && (
          <p id={descriptionId} role="alert" className="mt-1.5 text-sm text-red-700">{error}</p>
        )}
        {helperText && !error && (
          <p id={descriptionId} className="mt-1.5 text-sm text-neutral-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
