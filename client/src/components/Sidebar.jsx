import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Upload, FileText, BarChart2,
  Bell, Settings, LogOut, FileSearch,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const links = [
  { to: '/dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/upload',     label: 'Upload',        icon: Upload },
  { to: '/invoices',   label: 'Invoices',      icon: FileText },
  { to: '/analytics',  label: 'Analytics',     icon: BarChart2 },
  { to: '/alerts',     label: 'Alerts',        icon: Bell },
  { to: '/settings',   label: 'Settings',      icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-white border-r border-surface-border px-4 py-6 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
          <FileSearch size={18} className="text-white" />
        </div>
        <span className="font-bold text-slate-800 text-lg leading-tight">
          InvoiceAI
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="mt-6 border-t border-surface-border pt-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm uppercase">
            {user?.name?.[0] ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          className="nav-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
