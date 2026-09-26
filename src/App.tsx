import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './features/layout/AppShell';
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/warehouse/outbound/platform" element={<PlatformPage type="outbound" />} />
          <Route path="/warehouse/outbound/create" element={<CreateDocumentRoute type="outbound" />} />
          <Route path="/warehouse/history/:platform/:id/edit" element={<CreateDocumentPage edit />} />
          <Route path="/warehouse/returns/platform" element={<PlatformPage type="return" />} />
          <Route path="/warehouse/returns/create" element={<CreateDocumentRoute type="return" />} />
          <Route path="/warehouse/history/:platform" element={<HistoryPage />} />
          <Route path="/warehouse" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
