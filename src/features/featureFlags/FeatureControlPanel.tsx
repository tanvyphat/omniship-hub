import { Clock3, History, PackageCheck, RotateCcw, Settings2, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FeatureKey } from './useFeatureFlags';
import { useFeatureFlags } from './useFeatureFlags';

const FEATURES: Array<{
  key: FeatureKey;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    key: 'outbound',
    label: 'Phiếu xuất',
    description: 'Ẩn/hiện toàn bộ chức năng tạo phiếu xuất.',
    icon: PackageCheck,
  },
  {
    key: 'returns',
    label: 'Phiếu hoàn',
    description: 'Ẩn/hiện toàn bộ chức năng phiếu hoàn.',
    icon: RotateCcw,
  },
  {
    key: 'history',
    label: 'Lịch sử',
    description: 'Ẩn/hiện lịch sử và các thao tác tra cứu.',
    icon: History,
  },
];

export function FeatureControlPanel({ onClose }: { onClose: () => void }) {
  const {
    features,
    loading,
    configured,
    error,
    updatingFeature,
    refresh,
    setFeatureEnabled,
  } = useFeatureFlags();

  async function toggleFeature(key: FeatureKey) {
    try {
      await setFeatureEnabled(key, !features[key]);
    } catch {
      // Error is already surfaced by the provider so the switch can roll back cleanly.
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-end bg-slate-950/20 p-3 pt-20 backdrop-blur-[2px] sm:p-5 sm:pt-20"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section className="w-full max-w-sm overflow-hidden rounded-[26px] border border-white/70 bg-white/95 shadow-2xl shadow-violet-950/20 backdrop-blur-2xl animate-[omni-page-in_240ms_ease-out]">
        <div className="relative overflow-hidden border-b border-slate-100 px-5 py-4">
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-400/15 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20">
                <Settings2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-950">Feature Control</div>
                <div className="mt-0.5 text-xs leading-5 text-slate-500">Remote bật/tắt module OmniHub.</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl text-slate-400 transition-all hover:rotate-90 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Đóng Feature Control"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3 p-4">
          {FEATURES.map(({ key, label, description, icon: Icon }) => {
            const enabled = features[key];
            const updating = updatingFeature === key;
            const disabled = loading || updating || !configured;

            return (
              <div
                key={key}
                className={`rounded-2xl border p-3.5 transition-all duration-300 ${
                  enabled
                    ? 'border-violet-100 bg-gradient-to-r from-violet-50/80 to-fuchsia-50/60 shadow-sm'
                    : 'border-slate-200 bg-slate-50/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-all duration-300 ${enabled ? 'bg-white text-violet-600 shadow-sm' : 'bg-slate-200/70 text-slate-400'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-black tracking-wider ${enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                        {enabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{description}</p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-label={`${enabled ? 'Tắt' : 'Bật'} ${label}`}
                    onClick={() => void toggleFeature(key)}
                    disabled={disabled}
                    className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full p-1 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
                      enabled
                        ? 'bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 shadow-md shadow-violet-500/25'
                        : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${enabled ? 'translate-x-5' : 'translate-x-0'} ${updating ? 'animate-pulse' : ''}`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] leading-4 text-rose-700">{error}</div>
          ) : (
            <div className="flex items-center justify-between gap-3 text-[10px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3 w-3" />
                Đồng bộ toàn hệ thống qua Supabase
              </span>
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={loading}
                className="cursor-pointer font-bold text-violet-600 transition hover:text-fuchsia-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Đồng bộ lại
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
