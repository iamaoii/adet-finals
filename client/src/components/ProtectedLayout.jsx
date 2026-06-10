import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from './Sidebar';
import NotificationButton from './NotificationButton';
import { Menu } from 'lucide-react';
import logoRightBg from '../assets/logo/logo_2.webp';

export default function ProtectedLayout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    </div>
  );
}
