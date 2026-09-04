import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { PlatformCard } from '../components/PlatformCard';
import type { DocumentType } from '../types/document';

export function PlatformPage({ type }: { type: DocumentType }) {
  const navigate = useNavigate();
  const title = type === 'outbound' ? 'Tạo phiếu xuất hàng' : 'Tạo phiếu hoàn hàng';
  const description = type === 'outbound' ? 'Bước 1/2 · Chọn nền tảng của đơn hàng cần xuất kho.' : 'Bước 1/2 · Chọn nền tảng của đơn hàng trả về.';
  const prefix = type === 'outbound' ? 'outbound' : 'returns';

  return (
    <div>
      <PageHeader eyebrow="Step 1 / 2" title={title} description={description} action={<Button variant="ghost" onClick={() => navigate('/')}><ArrowLeft className="h-4 w-4" />Dashboard</Button>} />
      <div className="grid max-w-3xl gap-4 md:grid-cols-2">
        <PlatformCard title="TikTok Shop" description="Đơn hàng đến từ TikTok Shop." icon={<span className="font-bold">TT</span>} onClick={() => navigate(`/warehouse/${prefix}/create?platform=tiktok`)} />
        <PlatformCard title="Shopee" description="Đơn hàng đến từ Shopee." icon={<ShoppingBag className="h-5 w-5" />} onClick={() => navigate(`/warehouse/${prefix}/create?platform=shopee`)} />
      </div>
    </div>
  );
}
