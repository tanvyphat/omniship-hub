import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';

export function NotFoundPage() {
  const navigate = useNavigate();
  return <div className="grid min-h-screen place-items-center bg-slate-50 p-6"><div className="text-center"><div className="text-6xl font-black text-slate-200">404</div><h1 className="mt-3 text-2xl font-bold text-slate-950">Không tìm thấy trang</h1><p className="mt-2 text-sm text-slate-500">Đường dẫn không tồn tại hoặc đã thay đổi.</p><Button className="mt-6" onClick={() => navigate('/')}>Về dashboard</Button></div></div>;
}
