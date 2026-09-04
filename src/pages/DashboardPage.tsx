import { ArrowRight, ClipboardList, PackageCheck, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { PlatformCard } from '../components/PlatformCard';

export function DashboardPage() {
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader eyebrow="Warehouse" title="Tổng quan" description="Quản lý phiếu xuất hàng, phiếu hoàn hàng và lịch sử đối soát theo TikTok Shop / Shopee." />
      <div className="grid gap-4 md:grid-cols-3">
        <button onClick={() => navigate('/warehouse/outbound/platform')} className="rounded-2xl bg-slate-950 p-5 text-left text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
          <PackageCheck className="h-6 w-6" /><div className="mt-10 text-lg font-bold">Tạo phiếu xuất</div><div className="mt-1 text-sm text-slate-300">Ghi nhận đơn hàng đã xuất kho.</div><div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">Bắt đầu <ArrowRight className="h-4 w-4" /></div>
        </button>
        <button onClick={() => navigate('/warehouse/returns/platform')} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
          <RotateCcw className="h-6 w-6 text-slate-950" /><div className="mt-10 text-lg font-bold text-slate-950">Tạo phiếu hoàn</div><div className="mt-1 text-sm text-slate-500">Ghi nhận đơn hàng trả về kho.</div><div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">Bắt đầu <ArrowRight className="h-4 w-4" /></div>
        </button>
        <button onClick={() => navigate('/warehouse/history/tiktok')} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
          <ClipboardList className="h-6 w-6 text-slate-950" /><div className="mt-10 text-lg font-bold text-slate-950">Lịch sử phiếu</div><div className="mt-1 text-sm text-slate-500">Tra cứu, lọc và phân trang tối đa 100 đơn mỗi trang.</div><div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">Mở lịch sử <ArrowRight className="h-4 w-4" /></div>
        </button>
      </div>
      <div className="mt-8"><h2 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Chọn nhanh nền tảng</h2><div className="grid gap-4 md:grid-cols-2"><PlatformCard title="TikTok Shop" description="Tạo phiếu hoặc xem lịch sử TikTok." icon={<span className="font-bold">TT</span>} onClick={() => navigate('/warehouse/history/tiktok')} /><PlatformCard title="Shopee" description="Tạo phiếu hoặc xem lịch sử Shopee." icon={<span className="font-bold">S</span>} onClick={() => navigate('/warehouse/history/shopee')} /></div></div>
    </div>
  );
}
