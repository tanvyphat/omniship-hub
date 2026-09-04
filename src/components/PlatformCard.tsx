import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

export function PlatformCard({ title, description, icon, onClick }: { title: string; description: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
      <div className="mb-5 flex items-center justify-between">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-950 text-white">{icon}</div>
        <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
      </div>
      <div className="text-lg font-bold text-slate-950">{title}</div>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </button>
  );
}
