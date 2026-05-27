import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedLayout   from './components/ProtectedLayout';

import LoginPage         from './pages/LoginPage';
import RegisterPage      from './pages/RegisterPage';
import VerifyPage        from './pages/VerifyPage';
import DashboardPage     from './pages/DashboardPage';
import UploadPage        from './pages/UploadPage';
import OcrReviewPage     from './pages/OcrReviewPage';
import InvoiceListPage   from './pages/InvoiceListPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import AnalyticsPage     from './pages/AnalyticsPage';
import AlertsPage        from './pages/AlertsPage';
import SettingsPage      from './pages/SettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{ duration: 4000, style: { fontSize: '14px' } }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify"   element={<VerifyPage />} />

          {/* Protected */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard"              element={<DashboardPage />} />
            <Route path="/upload"                 element={<UploadPage />} />
            <Route path="/invoices/:id/review"    element={<OcrReviewPage />} />
            <Route path="/invoices/:id"           element={<InvoiceDetailPage />} />
            <Route path="/invoices"               element={<InvoiceListPage />} />
            <Route path="/analytics"              element={<AnalyticsPage />} />
            <Route path="/alerts"                 element={<AlertsPage />} />
            <Route path="/settings"               element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
