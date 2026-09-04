import { ClipboardList, History, LayoutDashboard, PackageCheck, RotateCcw, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/warehouse/outbound/platform', label: 'Tạo phiếu xuất', icon: PackageCheck },
  { to: '/warehouse/returns/platform', label: 'Tạo phiếu hoàn', icon: RotateCcw },
  { to: '/warehouse/history/tiktok', label: 'Lịch sử TikTok', icon: History },
  { to: '/warehouse/history/shopee', label: 'Lịch sử Shopee', icon: ClipboardList },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <button aria-label="Đóng menu" className="fixed inset-0 z-30 bg-slate-950/30 md:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-slate-950 text-white transition-transform md:static md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <div><div className="text-base font-bold">OMNISHIP HUB</div><div className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-400">Warehouse Hub</div></div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-white/10 md:hidden"><X className="h-4 w-4" /></button>
        </div>
        <nav className="space-y-1 p-3">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} end={to === '/'} onClick={onClose} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${isActive ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
              <Icon className="h-4 w-4" />{label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4 text-xs leading-5 text-slate-500">Dữ liệu được lưu an toàn bằng Supabase RLS.</div>
      </aside>
    </>
  );
}
