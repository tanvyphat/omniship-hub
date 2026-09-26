import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type HealthStatus = 'checking' | 'online' | 'degraded' | 'offline';

interface HealthState {
  status: HealthStatus;
  latency: number | null;
  checkedAt: Date | null;
}

const CHECK_INTERVAL_MS = 30_000;
const REQUEST_TIMEOUT_MS = 5_000;
const DEGRADED_LATENCY_MS = 1_500;

export function SystemStatus() {
  const [health, setHealth] = useState<HealthState>({
    status: 'checking',
    latency: null,
    checkedAt: null,
  });

  const checkHealth = useCallback(async () => {
    setHealth((current) => ({ ...current, status: 'checking' }));
    const startedAt = performance.now();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const request = Promise.resolve(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('warehouse_documents').select('id').limit(1),
      );

      const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Supabase health check timed out')), REQUEST_TIMEOUT_MS);
      });

      const result = await Promise.race([request, timeout]);
      const elapsed = Math.round(performance.now() - startedAt);

      if (result?.error) throw result.error;

      setHealth({
        status: elapsed >= DEGRADED_LATENCY_MS ? 'degraded' : 'online',
        latency: elapsed,
        checkedAt: new Date(),
      });
    } catch {
      setHealth({
        status: 'offline',
        latency: null,
        checkedAt: new Date(),
      });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    void checkHealth();
    const intervalId = window.setInterval(() => void checkHealth(), CHECK_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [checkHealth]);

  const config = {
    checking: {
      label: 'Checking System',
      text: 'text-sky-300',
      dot: 'bg-sky-400',
      ring: 'bg-sky-400',
      description: 'Đang kiểm tra kết nối Supabase…',
    },
    online: {
      label: 'System Online',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
      ring: 'bg-emerald-400',
      description: 'Supabase Connected',
    },
    degraded: {
      label: 'System Degraded',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
      ring: 'bg-amber-400',
      description: 'Supabase phản hồi chậm',
    },
    offline: {
      label: 'System Offline',
      text: 'text-rose-300',
      dot: 'bg-rose-400',
      ring: 'bg-rose-400',
      description: 'Không thể kết nối Supabase',
    },
  }[health.status];

  const checkedTime = health.checkedAt
    ? health.checkedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  return (
    <button
      type="button"
      onClick={() => void checkHealth()}
      className="group w-full cursor-pointer rounded-xl p-1 text-left transition hover:bg-white/[0.04]"
      title="Bấm để kiểm tra lại trạng thái hệ thống"
    >
      <div className={`flex items-center gap-2 font-semibold ${config.text}`}>
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          {health.status !== 'offline' && (
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.ring} opacity-60`} />
          )}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${config.dot}`} />
        </span>
        <span>{config.label}</span>
        <RefreshCw
          className={`ml-auto h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100 ${health.status === 'checking' ? 'animate-spin opacity-100' : ''}`}
        />
      </div>
      <div className="mt-1 text-[11px] leading-4 text-slate-500">
        <div>{config.description}{health.latency !== null ? ` · ${health.latency}ms` : ''}</div>
        <div>Lần kiểm tra: {checkedTime}</div>
      </div>
    </button>
  );
}
