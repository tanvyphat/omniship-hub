import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';

export function ProtectedRoute() {
  const { session, loading, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Đang kiểm tra phiên đăng nhập…</div>;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) return <Navigate to="/login?error=forbidden" replace />;
  return <Outlet />;
}
