import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './features/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { CreateDocumentPage } from './pages/CreateDocumentPage';
import { HistoryPage } from './pages/HistoryPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlatformPage } from './pages/PlatformPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/warehouse/outbound/platform" element={<PlatformPage type="outbound" />} />
          <Route path="/warehouse/outbound/create" element={<CreateDocumentPage type="outbound" />} />
          <Route path="/warehouse/history/:platform/:id/edit" element={<CreateDocumentPage edit />} />
          <Route path="/warehouse/returns/platform" element={<PlatformPage type="return" />} />
          <Route path="/warehouse/returns/create" element={<CreateDocumentPage type="return" />} />
          <Route path="/warehouse/history/:platform" element={<HistoryPage />} />
          <Route path="/warehouse" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
