import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/useAuth';

export type FeatureKey = 'outbound' | 'returns' | 'history';

export type FeatureFlags = Record<FeatureKey, boolean>;

interface FeatureFlagRow {
  feature_key: FeatureKey;
  enabled: boolean;
}

interface FeatureFlagContextValue {
  features: FeatureFlags;
  loading: boolean;
  configured: boolean;
  error: string;
  updatingFeature: FeatureKey | null;
  refresh: () => Promise<void>;
  setFeatureEnabled: (feature: FeatureKey, enabled: boolean) => Promise<void>;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  outbound: true,
  returns: true,
  history: true,
};

const FeatureFlagContext = createContext<FeatureFlagContextValue | undefined>(undefined);

function rowsToFlags(rows: FeatureFlagRow[]): FeatureFlags {
  const next = { ...DEFAULT_FEATURE_FLAGS };
  for (const row of rows) {
    if (row.feature_key in next) next[row.feature_key] = row.enabled;
  }
  return next;
}

function getFeatureErrorMessage(error: unknown) {
  const candidate = error as { code?: string; message?: string } | null;
  const code = candidate?.code ?? '';
  const message = candidate?.message ?? '';

  if (code === '42P01' || code === 'PGRST205' || /feature_flags/i.test(message) && /not found|does not exist|schema cache/i.test(message)) {
    return 'Feature Control chưa được cài trong Supabase. Hãy chạy bản supabase/schema.sql mới nhất.';
  }

  return message || 'Không thể đồng bộ Feature Control với Supabase.';
}

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading, isAdmin } = useAuth();
  const [features, setFeatures] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState('');
  const [updatingFeature, setUpdatingFeature] = useState<FeatureKey | null>(null);

  const refresh = useCallback(async () => {
    if (!session) {
      setFeatures(DEFAULT_FEATURE_FLAGS);
      setLoading(false);
      setConfigured(true);
      setError('');
      return;
    }

    try {
      // Database.ts may lag behind schema.sql, so this query intentionally bypasses generated table typing.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: queryError } = await (supabase as any)
        .from('feature_flags')
        .select('feature_key, enabled');

      if (queryError) throw queryError;

      setFeatures(rowsToFlags((data ?? []) as FeatureFlagRow[]));
      setConfigured(true);
      setError('');
    } catch (queryError) {
      console.warn('[Feature Flags] load failed', queryError);
      setFeatures(DEFAULT_FEATURE_FLAGS);
      setConfigured(false);
      setError(getFeatureErrorMessage(queryError));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    void refresh();
  }, [authLoading, refresh]);

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('omniship-feature-flags')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feature_flags' },
        (payload) => {
          const row = payload.new as Partial<FeatureFlagRow>;
          if (!row.feature_key || typeof row.enabled !== 'boolean') return;
          setFeatures((current) => ({ ...current, [row.feature_key as FeatureKey]: row.enabled }));
          setConfigured(true);
          setError('');
        },
      )
      .subscribe();

    const poll = window.setInterval(() => void refresh(), 10000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refresh();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      void supabase.removeChannel(channel);
    };
  }, [session, refresh]);

  const setFeatureEnabled = useCallback(async (feature: FeatureKey, enabled: boolean) => {
    if (!isAdmin) throw new Error('Chỉ Administrator mới có quyền thay đổi Feature Control.');

    const previous = features[feature];
    setUpdatingFeature(feature);
    setFeatures((current) => ({ ...current, [feature]: enabled }));
    setError('');

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('feature_flags')
        .update({ enabled })
        .eq('feature_key', feature);

      if (updateError) throw updateError;
      setConfigured(true);
    } catch (updateError) {
      setFeatures((current) => ({ ...current, [feature]: previous }));
      setConfigured(false);
      setError(getFeatureErrorMessage(updateError));
      throw updateError;
    } finally {
      setUpdatingFeature(null);
    }
  }, [features, isAdmin]);

  const value = useMemo<FeatureFlagContextValue>(() => ({
    features,
    loading,
    configured,
    error,
    updatingFeature,
    refresh,
    setFeatureEnabled,
  }), [features, loading, configured, error, updatingFeature, refresh, setFeatureEnabled]);

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>;
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (!context) throw new Error('useFeatureFlags must be used within FeatureFlagProvider');
  return context;
}
