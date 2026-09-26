import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export function Button({ children, loading = false, variant = 'primary', className, disabled, ...props }: Props) {
  const styles = {
    primary:
      'omni-gradient-motion relative overflow-hidden bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-fuchsia-500/25',
    secondary:
      'border border-slate-200 bg-white/90 text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:text-violet-700 hover:shadow-md',
    ghost:
      'text-slate-600 hover:-translate-y-0.5 hover:bg-violet-50 hover:text-violet-700',
    danger:
      'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-500/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-rose-500/25',
  };

  return (
    <button
      className={clsx(
        'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0',
        styles[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
