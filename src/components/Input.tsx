import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className, ...props }: Props) {
  const inputId = id ?? props.name ?? label;

  return (
    <label className="group grid gap-1.5 text-sm font-semibold text-slate-700" htmlFor={inputId}>
      <span className="transition-colors duration-200 group-focus-within:text-violet-700">
        {label}
        {props.required && <span className="ml-1 text-rose-500">*</span>}
      </span>
      <input
        id={inputId}
        className={`h-11 rounded-xl border bg-white/90 px-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:-translate-y-[1px] focus:border-violet-400 focus:bg-white focus:shadow-lg focus:shadow-violet-100/70 focus:ring-4 focus:ring-violet-100/70 ${
          props.disabled ? 'cursor-not-allowed bg-slate-100 text-slate-400' : ''
        } ${error ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200'} ${className ?? ''}`}
        {...props}
      />
      {error && <span className="text-xs font-normal text-rose-600">{error}</span>}
    </label>
  );
}
