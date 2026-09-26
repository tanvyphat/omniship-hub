import {
  ArrowRight,
  ClipboardList,
  PackageCheck,
  RotateCcw,
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
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">Thao tác nhanh</div>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Bạn muốn làm gì?</h1>
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
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl shadow-lg shadow-orange-500/20 transition-all duration-300 group-hover:scale-110">
                <img src="/shopee-logo.svg" alt="Shopee" className="h-full w-full object-cover" />
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
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl shadow-lg shadow-cyan-500/10 transition-all duration-300 group-hover:scale-110">
                <img src="/tiktok-logo.svg" alt="TikTok Shop" className="h-full w-full object-cover" />
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
