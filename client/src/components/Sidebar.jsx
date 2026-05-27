import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Upload, FileText, Users, BarChart2, Bell, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import logoRightBg from '../assets/logo/logo_2.webp';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);

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
        { to: '/suppliers', label: 'Suppliers', icon: Users },
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
    <aside className={`relative flex flex-col h-screen bg-white border-r border-slate-100 py-7 shrink-0 font-sans justify-between transition-all duration-300 ease-in-out z-20 ${isExpanded ? 'w-[250px] px-5' : 'w-[80px] px-3'}`}>
      
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3.5 top-9 bg-white border border-slate-200 rounded-full p-1.5 shadow-sm text-slate-400 hover:text-[#5B2E7F] hover:border-slate-300 transition-all z-50 flex items-center justify-center"
        title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        {isExpanded ? <ChevronLeft size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />}
      </button>

      {/* Top Section */}
      <div className="space-y-7 overflow-hidden">
        
        {/* Brand Logo & Title */}
        <div className={`flex items-center gap-3 mb-8 transition-all ${isExpanded ? 'px-1' : 'justify-center'}`}>
          <img
            src={logoRightBg}
            alt="InvoiceIQ Icon"
            className="h-[34px] w-[34px] rounded-[8px] object-contain shrink-0"
          />
          {isExpanded && (
            <span 
              className="text-slate-900 tracking-tight leading-none whitespace-nowrap animate-fade-in"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 700 }}
            >
              InvoiceIQ
            </span>
          )}
        </div>

        {/* Dynamic Nav Groups */}
        <div className="space-y-6">
          {menuGroups.map((group) => (
            <div key={group.title} className="space-y-1.5">
              {/* Group Title */}
              {isExpanded ? (
                <p className="text-[10px] uppercase font-bold tracking-[0.1em] text-slate-400 px-2.5 whitespace-nowrap animate-fade-in">
                  {group.title}
                </p>
              ) : (
                <div className="h-[15px] w-full flex items-center justify-center">
                  <div className="w-4 border-b-2 border-slate-100 rounded-full" />
                </div>
              )}
              
              {/* Group Items */}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={!isExpanded ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center py-2.5 rounded-[10px] text-[13.5px] transition-all duration-150 group ${isExpanded ? 'gap-3.5 px-3' : 'justify-center px-0'} ${
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
                          className={`shrink-0 transition-colors duration-150 ${
                            isActive ? 'text-[#5B2E7F]' : 'text-[#64748B] group-hover:text-slate-900'
                          }`}
                        />
                        {isExpanded && <span className="whitespace-nowrap animate-fade-in">{item.label}</span>}
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
      <div className={`mt-8 pt-4 border-t border-slate-100 flex ${isExpanded ? 'items-center justify-between' : 'flex-col items-center justify-center gap-4'}`}>
        <Link
          to="/settings"
          className={`flex items-center gap-2.5 min-w-0 rounded-[10px] transition-colors hover:bg-slate-50 py-1 ${isExpanded ? 'px-2 -ml-2' : 'justify-center'}`}
          title={!isExpanded ? 'Settings' : undefined}
        >
          {/* Circular initials badge */}
          <div 
            className="w-9 h-9 rounded-full border border-purple-200 bg-[#FAF5FF] text-[#5B2E7F] text-xs font-semibold flex items-center justify-center shrink-0 shadow-sm"
          >
            {getInitials()}
          </div>
          {isExpanded && (
            <span 
              className="text-[#5B2E7F] font-semibold text-[13.5px] truncate max-w-[120px] whitespace-nowrap animate-fade-in"
              title={user?.name || 'Username'}
            >
              {user?.name || 'Test User'}
            </span>
          )}
        </Link>

        {/* Small transparent logout button */}
        <button
          onClick={handleLogout}
          title="Logout"
          className={`p-2 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors ${!isExpanded && 'bg-slate-50'}`}
        >
          <LogOut size={16} />
        </button>
      </div>

    </aside>
  );
}
