import { useEffect, useState } from 'react';
import { LockKeyhole, PackageSearch } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { signInAdmin } from '../features/auth/auth.service';
import { useAuth } from '../features/auth/useAuth';

function getAuthErrorMessage(error: { message?: string; code?: string } | null) {
  if (!error) return '';

  switch (error.code) {
    case 'email_not_confirmed':
      return 'Tài khoản chưa xác nhận email. Vào Supabase → Authentication → Users → mở admin@gmail.com và xác nhận email.';
    case 'invalid_credentials':
      return 'Sai email hoặc mật khẩu, hoặc frontend đang kết nối nhầm Supabase project.';
    case 'user_not_found':
      return 'Không tìm thấy tài khoản trong Supabase project mà frontend đang kết nối.';
    default:
      return `Supabase Auth: ${error.message ?? 'Đăng nhập thất bại.'}${error.code ? ` (${error.code})` : ''}`;
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { session, isAdmin } = useAuth();
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    params.get('error') === 'forbidden' ? 'Tài khoản này không có quyền ADMIN.' : '',
  );

  useEffect(() => {
    if (session && isAdmin) navigate('/', { replace: true, state: { from: location.pathname } });
  }, [session, isAdmin, navigate, location.pathname]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const result = await signInAdmin(email.trim(), password);
    setLoading(false);

    if (result.error) {
      console.error('[Auth] signInWithPassword failed', result.error);
      setError(getAuthErrorMessage(result.error));
      return;
    }

    if (!result.data.session) {
      setError('Supabase không trả về session sau khi đăng nhập. Kiểm tra cấu hình Authentication.');
      return;
    }

    navigate('/', { replace: true });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-white">
            <PackageSearch className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-slate-950">OMNISHIP HUB</div>
            <div className="text-xs text-slate-400">OmniShip Hub</div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-950">Đăng nhập ADMIN</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Đăng nhập bằng tài khoản đã được thiết lập trong Supabase Authentication.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Mật khẩu"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm leading-5 text-rose-700">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            <LockKeyhole className="h-4 w-4" />
            Đăng nhập
          </Button>
        </form>
      </div>
    </div>
  );
}
