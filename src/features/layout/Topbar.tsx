import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../auth/useAuth';

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { session, logout } = useAuth();
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <button onClick={onMenu} className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 md:hidden" aria-label="Mở menu"><Menu className="h-5 w-5" /></button>
      <div className="hidden md:block"><span className="text-sm font-semibold text-slate-900">OmniShip Hub</span><span className="ml-2 text-xs text-slate-400">ADMIN</span></div>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block"><div className="text-sm font-semibold text-slate-800">{session?.user.email}</div><div className="text-xs text-slate-400">Administrator</div></div>
        <button onClick={() => void logout()} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-rose-600" title="Đăng xuất"><LogOut className="h-4 w-4" /></button>
      </div>
    </header>
  );
}
