import type { SelectHTMLAttributes } from 'react';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> { label: string; options: Array<{ label: string; value: string }>; }

export function Select({ label, options, id, className, ...props }: Props) {
  const selectId = id ?? props.name ?? label;
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700" htmlFor={selectId}>
      <span>{label}{props.required && <span className="ml-1 text-rose-500">*</span>}</span>
      <select id={selectId} className={`h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 ${className ?? ''}`} {...props}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
