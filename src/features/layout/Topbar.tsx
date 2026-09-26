import { useState } from 'react';
import { LogOut, Menu, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { FeatureControlPanel } from '../featureFlags/FeatureControlPanel';

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { session, logout, isAdmin } = useAuth();
  const [featureControlOpen, setFeatureControlOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 shadow-sm backdrop-blur-xl md:px-6">
        <button
          type="button"
          onClick={onMenu}
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl text-slate-600 transition-all duration-300 hover:rotate-3 hover:bg-violet-50 hover:text-violet-700 md:hidden"
          aria-label="Mở menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden md:block">
          <span className="bg-gradient-to-r from-slate-950 via-violet-700 to-fuchsia-600 bg-clip-text text-sm font-bold text-transparent">
            OmniShip Hub
          </span>
          <span className="ml-2 rounded-full bg-violet-50 px-2 py-1 text-[10px] font-bold tracking-wider text-violet-600">ADMIN</span>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setFeatureControlOpen(true)}
              className="group grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 text-violet-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:rotate-3 hover:border-violet-300 hover:text-fuchsia-600 hover:shadow-md active:scale-95"
              title="Feature Control"
              aria-label="Mở Feature Control"
            >
              <SlidersHorizontal className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            </button>
          )}

          <div className="hidden text-right sm:block">
            <div className="text-sm font-semibold text-slate-800">{session?.user.email}</div>
            <div className="text-xs text-slate-400">Administrator</div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="group grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 hover:shadow-md active:scale-95"
            title="Đăng xuất"
          >
            <LogOut className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
        </div>
      </header>

      {featureControlOpen && isAdmin && <FeatureControlPanel onClose={() => setFeatureControlOpen(false)} />}
    </>
  );
}
