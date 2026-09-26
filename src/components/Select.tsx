import type { SelectHTMLAttributes } from 'react';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ label: string; value: string }>;
}

export function Select({ label, options, id, className, ...props }: Props) {
  const selectId = id ?? props.name ?? label;

  return (
    <label className="group grid gap-1.5 text-sm font-semibold text-slate-700" htmlFor={selectId}>
      <span className="transition-colors duration-200 group-focus-within:text-violet-700">
        {label}
        {props.required && <span className="ml-1 text-rose-500">*</span>}
      </span>
      <select
        id={selectId}
        className={`h-11 cursor-pointer rounded-xl border border-slate-200 bg-white/90 px-3 text-sm text-slate-900 outline-none transition-all duration-200 hover:border-slate-300 focus:-translate-y-[1px] focus:border-violet-400 focus:bg-white focus:shadow-lg focus:shadow-violet-100/70 focus:ring-4 focus:ring-violet-100/70 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${className ?? ''}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
