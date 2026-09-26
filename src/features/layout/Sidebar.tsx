import { useEffect, useState } from 'react';
import {
  ChevronDown,
  ClipboardList,
  History,
  LayoutDashboard,
  PackageCheck,
  RotateCcw,
  ShoppingBag,
  Store,
  X,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

interface DropdownItem {
  to: string;
  label: string;
  platform: 'shopee' | 'tiktok';
}

interface DropdownGroupProps {
  label: string;
  icon: typeof PackageCheck;
  items: DropdownItem[];
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}

function DropdownGroup({ label, icon: Icon, items, open, onToggle, onNavigate }: DropdownGroupProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-300 transition-all duration-300 hover:translate-x-0.5 hover:bg-white/10 hover:text-white"
      >
        <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
        <span className="flex-1">{label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180 text-cyan-300' : ''}`} />
      </button>

      <div className={`grid transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="mt-1 space-y-1 pl-5">
            {items.map((item) => {
              const PlatformIcon = item.platform === 'shopee' ? ShoppingBag : Store;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 hover:translate-x-1 ${
                      isActive
                        ? item.platform === 'shopee'
                          ? 'bg-orange-500/15 text-orange-200 shadow-[inset_3px_0_0_#fb923c]'
                          : 'bg-cyan-400/10 text-cyan-200 shadow-[inset_3px_0_0_#22d3ee]'
                        : 'text-slate-400 hover:bg-white/[0.07] hover:text-white'
                    }`
                  }
                >
                  <span
                    className={`absolute inset-0 -translate-x-full bg-gradient-to-r transition-transform duration-500 group-hover:translate-x-0 ${
                      item.platform === 'shopee'
                        ? 'from-orange-500/0 via-orange-400/10 to-orange-500/0'
                        : 'from-cyan-400/0 via-fuchsia-400/10 to-cyan-400/0'
                    }`}
                  />
                  <PlatformIcon
                    className={`relative h-4 w-4 ${item.platform === 'shopee' ? 'text-orange-400' : 'text-cyan-300'}`}
                  />
                  <span className="relative">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();
  const [outboundOpen, setOutboundOpen] = useState(location.pathname.startsWith('/warehouse/outbound'));
  const [returnsOpen, setReturnsOpen] = useState(location.pathname.startsWith('/warehouse/returns'));
  const [historyOpen, setHistoryOpen] = useState(location.pathname.startsWith('/warehouse/history'));

  useEffect(() => {
    if (location.pathname.startsWith('/warehouse/outbound')) setOutboundOpen(true);
    if (location.pathname.startsWith('/warehouse/returns')) setReturnsOpen(true);
    if (location.pathname.startsWith('/warehouse/history')) setHistoryOpen(true);
  }, [location.pathname]);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Đóng menu"
          className="fixed inset-0 z-30 cursor-pointer bg-slate-950/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 overflow-hidden border-r border-white/10 bg-slate-950 text-white shadow-2xl transition-transform duration-300 md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-10 h-48 w-48 animate-pulse rounded-full bg-blue-600/15 blur-3xl" />
          <div className="absolute -right-20 top-1/3 h-56 w-56 animate-pulse rounded-full bg-fuchsia-500/10 blur-3xl [animation-delay:900ms]" />
          <div className="absolute -bottom-16 left-10 h-44 w-44 animate-pulse rounded-full bg-cyan-400/10 blur-3xl [animation-delay:1400ms]" />
        </div>

        <div className="relative flex h-16 items-center justify-between border-b border-white/10 px-5">
          <div>
            <div className="bg-gradient-to-r from-white via-cyan-200 to-fuchsia-300 bg-clip-text text-base font-extrabold tracking-wide text-transparent">
              OMNISHIP HUB
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-400">Warehouse Hub</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-slate-400 transition hover:rotate-90 hover:bg-white/10 hover:text-white md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="relative space-y-1 p-3">
          <NavLink
            end
            to="/"
            onClick={onClose}
            className={({ isActive }) =>
              `group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-300 hover:translate-x-0.5 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            Tổng quan
          </NavLink>

          <DropdownGroup
            label="Tạo phiếu xuất"
            icon={PackageCheck}
            open={outboundOpen}
            onToggle={() => setOutboundOpen((value) => !value)}
            onNavigate={onClose}
            items={[
              { to: '/warehouse/outbound/create?platform=shopee', label: 'Shopee', platform: 'shopee' },
              { to: '/warehouse/outbound/create?platform=tiktok', label: 'TikTok', platform: 'tiktok' },
            ]}
          />

          <DropdownGroup
            label="Tạo phiếu hoàn"
            icon={RotateCcw}
            open={returnsOpen}
            onToggle={() => setReturnsOpen((value) => !value)}
            onNavigate={onClose}
            items={[
              { to: '/warehouse/returns/create?platform=shopee', label: 'Shopee', platform: 'shopee' },
              { to: '/warehouse/returns/create?platform=tiktok', label: 'TikTok', platform: 'tiktok' },
            ]}
          />

          <DropdownGroup
            label="Lịch sử"
            icon={History}
            open={historyOpen}
            onToggle={() => setHistoryOpen((value) => !value)}
            onNavigate={onClose}
            items={[
              { to: '/warehouse/history/shopee', label: 'Shopee', platform: 'shopee' },
              { to: '/warehouse/history/tiktok', label: 'TikTok', platform: 'tiktok' },
            ]}
          />
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-slate-950/60 p-4 text-xs leading-5 text-slate-500 backdrop-blur-xl">
          <div className="mb-1 flex items-center gap-2 font-medium text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            System Online
          </div>
          Dữ liệu được lưu an toàn bằng Supabase RLS.
        </div>
      </aside>
    </>
  );
}
