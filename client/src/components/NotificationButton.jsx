import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X, AlertTriangle, Copy, TrendingUp } from 'lucide-react';

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    icon: Copy,
    iconBg: 'bg-[#FDF0EF]',
    iconColor: 'text-[#C0392B]',
    title: 'Duplicate Invoice Detected',
    desc: 'INV-2025-089 is a possible duplicate of INV-2025-109.',
    time: '2 min ago',
    unread: true,
  },
  {
    id: 2,
    icon: TrendingUp,
    iconBg: 'bg-[#FFFBEB]',
    iconColor: 'text-[#B7791F]',
    title: 'High Amount Alert',
    desc: 'INV-2025-108 exceeds the ₱75,000 threshold by 31%.',
    time: '18 min ago',
    unread: true,
  },
  {
    id: 3,
    icon: AlertTriangle,
    iconBg: 'bg-[#FFFBEB]',
    iconColor: 'text-[#B7791F]',
    title: 'Missing Field',
    desc: 'Invoice date could not be extracted from receipt.',
    time: '1 hr ago',
    unread: false,
  },
];

export default function NotificationButton() {
  const [open, setOpen]   = useState(false);
  const [notes, setNotes] = useState(MOCK_NOTIFICATIONS);
  const ref = useRef(null);

  const unreadCount = notes.filter(n => n.unread).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () => setNotes(n => n.map(x => ({ ...x, unread: false })));
  const dismiss = (id) => setNotes(n => n.filter(x => x.id !== id));

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 bg-slate-200/80 hover:bg-slate-300/80 rounded-[10px] flex items-center justify-center text-slate-600 hover:text-slate-800 transition-colors shadow-sm"
        title="Notifications"
      >
        <Bell size={15} className="stroke-[2.2px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C0392B] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-2.5 w-[340px] bg-white border border-slate-100 rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-extrabold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-[#FAF5FF] text-[#5B2E7F] border border-purple-200 rounded-full px-2 py-0.5">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11.5px] font-bold text-[#5B2E7F] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification Items */}
          <div className="max-h-[310px] overflow-y-auto divide-y divide-slate-50">
            {notes.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Bell size={28} className="text-slate-200 mx-auto mb-2" />
                <p className="text-[13px] font-semibold text-slate-400">No notifications</p>
              </div>
            ) : notes.map((n) => {
              const Icon = n.icon;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3.5 px-5 py-4 transition-colors ${n.unread ? 'bg-[#FDFBFF]' : 'bg-white'} hover:bg-slate-50`}
                >
                  <div className={`w-8 h-8 rounded-[8px] ${n.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon size={14} className={n.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-[13px] leading-snug ${n.unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'}`}>
                        {n.title}
                      </p>
                      <button
                        onClick={() => dismiss(n.id)}
                        className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors mt-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <p className="text-[11.5px] text-slate-400 font-medium mt-0.5 leading-relaxed">{n.desc}</p>
                    <p className="text-[10.5px] text-slate-300 font-semibold mt-1">{n.time}</p>
                  </div>
                  {n.unread && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#5B2E7F] shrink-0 mt-2" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-5 py-3">
            <Link
              to="/alerts"
              onClick={() => setOpen(false)}
              className="text-[12px] font-bold text-[#5B2E7F] hover:underline"
            >
              View all anomaly alerts →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
