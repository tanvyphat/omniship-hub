import type { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './features/layout/AppShell';
import { useFeatureFlags } from './features/featureFlags/useFeatureFlags';
import type { FeatureKey } from './features/featureFlags/useFeatureFlags';
import { DashboardPage } from './pages/DashboardPage';
import { CreateDocumentPage } from './pages/CreateDocumentPage';
import { HistoryPage } from './pages/HistoryPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlatformPage } from './pages/PlatformPage';
import type { DocumentType } from './types/document';

function CreateDocumentRoute({ type }: { type: DocumentType }) {
  const location = useLocation();
  return <CreateDocumentPage key={`${type}:${location.search}`} type={type} />;
}

function FeatureRoute({ feature, children }: { feature: FeatureKey; children: ReactNode }) {
  const { features, loading } = useFeatureFlags();

  if (loading) {
    return (
      <div className="grid min-h-[240px] place-items-center rounded-[24px] border border-slate-200 bg-white/80 text-sm font-semibold text-slate-500 shadow-sm">
        Đang đồng bộ quyền truy cập tính năng…
      </div>
    );
  }

  if (!features[feature]) return <Navigate to="/" replace />;
  return children;
}

function EditDocumentRoute() {
  const location = useLocation();
  const type = new URLSearchParams(location.search).get('type');
  const documentFeature: FeatureKey | null = type === 'outbound' ? 'outbound' : type === 'return' ? 'returns' : null;

  if (!documentFeature) return <Navigate to="/" replace />;

  return (
    <FeatureRoute feature="history">
      <FeatureRoute feature={documentFeature}>
        <CreateDocumentPage edit />
      </FeatureRoute>
    </FeatureRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/warehouse/outbound/platform" element={<FeatureRoute feature="outbound"><PlatformPage type="outbound" /></FeatureRoute>} />
          <Route path="/warehouse/outbound/create" element={<FeatureRoute feature="outbound"><CreateDocumentRoute type="outbound" /></FeatureRoute>} />
          <Route path="/warehouse/history/:platform/:id/edit" element={<EditDocumentRoute />} />
          <Route path="/warehouse/returns/platform" element={<FeatureRoute feature="returns"><PlatformPage type="return" /></FeatureRoute>} />
          <Route path="/warehouse/returns/create" element={<FeatureRoute feature="returns"><CreateDocumentRoute type="return" /></FeatureRoute>} />
          <Route path="/warehouse/history/:platform" element={<FeatureRoute feature="history"><HistoryPage /></FeatureRoute>} />
          <Route path="/warehouse" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
