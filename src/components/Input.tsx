import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> { label: string; error?: string; }

export function Input({ label, error, id, className, ...props }: Props) {
  const inputId = id ?? props.name ?? label;
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700" htmlFor={inputId}>
      <span>{label}{props.required && <span className="ml-1 text-rose-500">*</span>}</span>
      <input id={inputId} className={`h-11 rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 ${error ? 'border-rose-300' : 'border-slate-200'} ${className ?? ''}`} {...props} />
      {error && <span className="text-xs font-normal text-rose-600">{error}</span>}
    </label>
  );
}
