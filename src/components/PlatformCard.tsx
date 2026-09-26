import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

export function PlatformCard({ title, description, icon, onClick }: { title: string; description: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-5 text-left shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-500/10 active:scale-[0.99]"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-cyan-300/20 via-violet-300/20 to-fuchsia-300/20 blur-2xl transition-transform duration-500 group-hover:scale-150" />
      <div className="relative mb-5 flex items-center justify-between">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900 text-white shadow-lg transition-all duration-300 group-hover:rotate-3 group-hover:scale-105">
          {icon}
        </div>
        <ArrowRight className="h-5 w-5 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-violet-600" />
      </div>
      <div className="relative text-lg font-bold text-slate-950 transition-colors group-hover:text-violet-700">{title}</div>
      <p className="relative mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </button>
  );
}
