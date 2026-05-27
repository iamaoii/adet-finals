import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Upload, FileText, Users, BarChart2, Bell, LogOut
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import logoRightBg from '../assets/logo/logo_2.webp';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get initials for user avatar
  const getInitials = () => {
    if (!user?.name) return 'IQ';
    const parts = user.name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return user.name.slice(0, 2).toUpperCase();
  };

  const menuGroups = [
    {
      title: 'Overview',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/upload', label: 'Upload', icon: Upload },
      ]
    },
    {
      title: 'Records',
      items: [
        { to: '/invoices', label: 'Invoices', icon: FileText },
        { to: '/suppliers', label: 'Suppliers', icon: Users }, // Mocked or settings map
      ]
    },
    {
      title: 'Insights',
      items: [
        { to: '/analytics', label: 'Analytics', icon: BarChart2 },
        { to: '/alerts', label: 'Alerts', icon: Bell },
      ]
    }
  ];

  return (
    <aside className="flex flex-col w-[250px] min-h-screen bg-white border-r border-slate-100 px-5 py-7 shrink-0 font-sans justify-between">
      
      {/* Top Section */}
      <div className="space-y-7">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 px-1 mb-8">
          <img
            src={logoRightBg}
            alt="InvoiceIQ Icon"
            className="h-[34px] w-[34px] rounded-[8px] object-contain"
          />
          <span 
            className="text-slate-900 tracking-tight leading-none"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 700 }}
          >
            InvoiceIQ
          </span>
        </div>

        {/* Dynamic Nav Groups */}
        <div className="space-y-6">
          {menuGroups.map((group) => (
            <div key={group.title} className="space-y-1.5">
              {/* Group Title (uppercase, muted, small font) */}
              <p className="text-[10px] uppercase font-bold tracking-[0.1em] text-slate-400 px-2.5">
                {group.title}
              </p>
              
              {/* Group Items */}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3.5 px-3 py-2.5 rounded-[10px] text-[13.5px] transition-all duration-150 group ${
                        isActive
                          ? 'bg-[#FAF5FF] text-[#5B2E7F] font-semibold'
                          : 'text-[#64748B] hover:bg-slate-50 hover:text-slate-900 font-medium'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon 
                          size={18} 
                          className={`transition-colors duration-150 ${
                            isActive ? 'text-[#5B2E7F]' : 'text-[#64748B] group-hover:text-slate-900'
                          }`}
                        />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* User Footer Profile & Logout (Bottom) */}
      <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Circular initials badge in purple theme */}
          <div className="w-9 h-9 rounded-full border border-purple-200 bg-[#FAF5FF] text-[#5B2E7F] text-xs font-semibold flex items-center justify-center shrink-0 shadow-sm">
            {getInitials()}
          </div>
          <span 
            className="text-[#5B2E7F] font-semibold text-[13.5px] truncate max-w-[120px]"
            title={user?.name || 'Username'}
          >
            {user?.name || 'Username'}
          </span>
        </div>

        {/* Small transparent logout button */}
        <button
          onClick={handleLogout}
          title="Logout"
          className="p-2 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>

    </aside>
  );
}
