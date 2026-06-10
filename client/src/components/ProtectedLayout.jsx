import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from './Sidebar';
import NotificationButton from './NotificationButton';
import { Menu, X, Download } from 'lucide-react';
import logoRightBg from '../assets/logo/logo_2.webp';

export default function ProtectedLayout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

    // If the app is already installed, this event won't fire.
    // Check if we are running in standalone mode (already installed)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden relative">
      {/* Mobile Backdrop overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[90] lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar drawer container */}
      <div className={`
        fixed inset-y-0 left-0 z-[100] transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none lg:transition-none lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between lg:hidden shrink-0 z-[60]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title="Open Sidebar"
            >
              <Menu size={20} />
            </button>
            
            <div className="flex items-center gap-2">
              <img
                src={logoRightBg}
                alt="InvoiceIQ Icon"
                className="h-7 w-7 rounded-md object-contain"
              />
              <span 
                className="text-slate-900 tracking-tight leading-none font-bold"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px' }}
              >
                InvoiceIQ
              </span>
            </div>
          </div>
          <NotificationButton className="shrink-0" />
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Outlet />
        </main>
      </div>

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
    </div>
  );
}

