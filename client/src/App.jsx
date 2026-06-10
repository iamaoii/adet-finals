import { useState, useEffect } from 'react';
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
import SuppliersPage     from './pages/SuppliersPage';

import { X, Download } from 'lucide-react';

export default function App() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
      // Update UI to show the install banner
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If the app is already installed in standalone mode, don't show the banner
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    // Show the browser's install prompt dialog
    installPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    console.log(`[PWA] User response to install prompt: ${outcome}`);
    // Discard the prompt since it can only be used once
    setInstallPrompt(null);
    setShowInstallBanner(false);
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="bottom-right"
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
            <Route path="/suppliers"              element={<SuppliersPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      {/* Floating PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[360px] bg-slate-900 text-white p-4 rounded-[16px] shadow-[0_12px_40px_rgba(0,0,0,0.18)] border border-slate-800 z-[9999] flex items-center justify-between gap-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="bg-[#5B2E7F] p-2.5 rounded-[10px] shrink-0 shadow-[0_2px_8px_rgba(91,46,127,0.3)]">
              <Download size={16} className="text-white" />
            </div>
            <div>
              <h4 className="text-[13px] font-bold tracking-tight text-white leading-tight">Install InvoiceIQ</h4>
              <p className="text-[11px] text-slate-400 font-light leading-normal mt-0.5">Add to your home screen for quick access</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-[#5B2E7F] hover:bg-[#4A2568] active:bg-[#3D1F55] text-white text-[12px] font-semibold px-3.5 py-1.5 rounded-[8px] transition-colors shadow-sm cursor-pointer"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </AuthProvider>
  );
}
