import {
  ArrowRight,
  Boxes,
  ClipboardList,
  History,
  PackageCheck,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Store,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const navigate = useNavigate();

  const actionCards = [
    {
      title: 'Tạo phiếu xuất',
      description: 'Tạo phiếu xuất kho nhanh cho Shopee hoặc TikTok Shop.',
      icon: PackageCheck,
      action: 'Bắt đầu tạo phiếu',
      onClick: () => navigate('/warehouse/outbound/platform'),
      wrapper: 'from-blue-500 via-violet-500 to-fuchsia-500',
      glow: 'shadow-violet-500/20',
    },
    {
      title: 'Tạo phiếu hoàn',
      description: 'Ghi nhận đơn hoàn trả về kho và quản lý hàng hoàn.',
      icon: RotateCcw,
      action: 'Tạo phiếu hoàn',
      onClick: () => navigate('/warehouse/returns/platform'),
      wrapper: 'from-emerald-400 via-cyan-500 to-blue-500',
      glow: 'shadow-cyan-500/20',
    },
    {
      title: 'Lịch sử phiếu',
      description: 'Tra cứu phiếu đã tạo theo từng nền tảng và loại phiếu.',
      icon: ClipboardList,
      action: 'Mở lịch sử',
      onClick: () => navigate('/warehouse/history/shopee'),
      wrapper: 'from-orange-400 via-rose-500 to-fuchsia-500',
      glow: 'shadow-rose-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-16 -top-20 h-56 w-56 animate-pulse rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute right-0 top-0 h-64 w-64 animate-pulse rounded-full bg-fuchsia-400/15 blur-3xl [animation-delay:600ms]" />
          <div className="absolute bottom-[-80px] left-1/2 h-52 w-52 animate-pulse rounded-full bg-cyan-300/20 blur-3xl [animation-delay:1200ms]" />
        </div>

        <div className="relative grid gap-8 lg:grid-cols-[1.35fr_.65fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200/70 bg-violet-50/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-violet-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              OmniShip Warehouse Hub
            </div>

            <h1 className="max-w-3xl text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Quản lý kho nhanh hơn với một dashboard
              <span className="ml-2 bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                sống động hơn.
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Tạo phiếu xuất, phiếu hoàn, nhập dữ liệu từ Excel và truy cập lịch sử Shopee / TikTok Shop ngay từ một nơi.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/warehouse/outbound/create?platform=shopee')}
                className="group relative inline-flex cursor-pointer items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl hover:shadow-fuchsia-500/25 active:scale-[0.98]"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <Zap className="relative h-4 w-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                <span className="relative">Tạo phiếu nhanh</span>
                <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/warehouse/history/shopee')}
                className="group inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 hover:shadow-lg active:scale-[0.98]"
              >
                <History className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-12" />
                Xem lịch sử
              </button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute inset-8 animate-pulse rounded-full bg-gradient-to-r from-blue-400/30 via-violet-400/30 to-fuchsia-400/30 blur-3xl" />
            <div className="relative overflow-hidden rounded-[26px] border border-white/70 bg-slate-950 p-5 text-white shadow-2xl shadow-violet-500/20">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.28),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.18),transparent_40%)]" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Warehouse</div>
                    <div className="mt-1 text-xl font-black">Control Center</div>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 shadow-inner shadow-white/10">
                    <Boxes className="h-5 w-5 text-cyan-300" />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/warehouse/outbound/create?platform=shopee')}
                    className="group cursor-pointer rounded-2xl border border-orange-400/20 bg-orange-400/10 p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-orange-300/40 hover:bg-orange-400/15"
                  >
                    <ShoppingBag className="h-5 w-5 text-orange-300 transition-transform duration-300 group-hover:scale-110" />
                    <div className="mt-4 font-bold">Shopee</div>
                    <div className="mt-1 text-[11px] text-slate-400">Tạo phiếu xuất</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/warehouse/outbound/create?platform=tiktok')}
                    className="group cursor-pointer rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-cyan-400/15"
                  >
                    <Store className="h-5 w-5 text-cyan-300 transition-transform duration-300 group-hover:scale-110" />
                    <div className="mt-4 font-bold">TikTok</div>
                    <div className="mt-1 text-[11px] text-slate-400">Tạo phiếu xuất</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">Thao tác nhanh</div>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Bạn muốn làm gì?</h2>
          </div>
          <div className="hidden text-xs text-slate-400 md:block">Chọn một chức năng để bắt đầu</div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {actionCards.map(({ title, description, icon: Icon, action, onClick, wrapper, glow }) => (
            <button
              key={title}
              type="button"
              onClick={onClick}
              className={`group relative cursor-pointer overflow-hidden rounded-[24px] bg-gradient-to-br ${wrapper} p-[1px] text-left shadow-lg ${glow} transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl active:scale-[0.99]`}
            >
              <div className="relative h-full overflow-hidden rounded-[23px] bg-white p-5 md:p-6">
                <div className={`pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${wrapper} opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-20`} />
                <div className="relative">
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${wrapper} text-white shadow-lg transition-all duration-300 group-hover:rotate-6 group-hover:scale-110`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-8 text-xl font-black text-slate-950">{title}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-6 text-slate-500">{description}</p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-slate-800 transition-colors group-hover:text-violet-700">
                    {action}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">Truy cập trực tiếp</div>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Chọn nền tảng</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="group relative overflow-hidden rounded-[24px] border border-orange-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-100/60 md:p-6">
            <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-orange-400/10 blur-3xl transition-all duration-500 group-hover:scale-125" />
            <div className="relative flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-black text-slate-950">Shopee</div>
                <p className="mt-1 text-sm text-slate-500">Đi thẳng vào thao tác dành cho đơn Shopee.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => navigate('/warehouse/outbound/create?platform=shopee')} className="cursor-pointer rounded-xl bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700 transition hover:-translate-y-0.5 hover:bg-orange-100">Phiếu xuất</button>
                  <button type="button" onClick={() => navigate('/warehouse/returns/create?platform=shopee')} className="cursor-pointer rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-200">Phiếu hoàn</button>
                  <button type="button" onClick={() => navigate('/warehouse/history/shopee')} className="cursor-pointer rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-200">Lịch sử</button>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-[24px] border border-cyan-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-100/60 md:p-6">
            <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl transition-all duration-500 group-hover:scale-125" />
            <div className="relative flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-cyan-300 shadow-lg shadow-cyan-500/10">
                <Store className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-black text-slate-950">TikTok Shop</div>
                <p className="mt-1 text-sm text-slate-500">Đi thẳng vào thao tác dành cho đơn TikTok Shop.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => navigate('/warehouse/outbound/create?platform=tiktok')} className="cursor-pointer rounded-xl bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-700 transition hover:-translate-y-0.5 hover:bg-cyan-100">Phiếu xuất</button>
                  <button type="button" onClick={() => navigate('/warehouse/returns/create?platform=tiktok')} className="cursor-pointer rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-200">Phiếu hoàn</button>
                  <button type="button" onClick={() => navigate('/warehouse/history/tiktok')} className="cursor-pointer rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-200">Lịch sử</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
