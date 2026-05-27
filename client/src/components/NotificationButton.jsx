import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X, AlertTriangle, Copy, TrendingUp } from 'lucide-react';
import api from '../lib/api';

const getAlertConfig = (alert) => {
  const type = (alert.type ?? '').toLowerCase();
  const risk = (alert.risk ?? 'medium').toLowerCase();
  
  let icon;
  let iconBg;
  let iconColor;
  
  if (type.includes('duplicate')) {
    icon = Copy;
    iconBg = 'bg-[#FDF0EF]';
    iconColor = 'text-[#C0392B]';
  } else if (type.includes('amount') || type.includes('threshold') || risk === 'high') {
    icon = TrendingUp;
    iconBg = 'bg-[#FFFBEB]';
    iconColor = 'text-[#B7791F]';
    if (risk === 'high') {
      iconBg = 'bg-[#FDF0EF]';
      iconColor = 'text-[#C0392B]';
    }
  } else {
    // missing field or low risk
    icon = AlertTriangle;
    iconBg = 'bg-[#E2ECF7]';
    iconColor = 'text-[#1B3B6F]';
  }
  
  return { icon, iconBg, iconColor };
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - d) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
};

export default function NotificationButton() {
  const [open, setOpen]   = useState(false);
  const [notes, setNotes] = useState([]);
  const ref = useRef(null);

  const unreadCount = notes.filter(n => !n.resolved).length;

  const loadAlerts = useCallback(() => {
    api.get('/alerts', { params: { resolved: false } })
      .then(({ data }) => {
        setNotes(data || []);
      })
      .catch(() => {});
  }, []);


  useEffect(() => {
    loadAlerts();
    // Refresh alerts periodically (every 30s)
    const t = setInterval(loadAlerts, 30000);
    
    // Listen for instant real-time updates from other pages
    window.addEventListener('alerts-updated', loadAlerts);
    
    return () => {
      clearInterval(t);
      window.removeEventListener('alerts-updated', loadAlerts);
    };
  }, [loadAlerts]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    try {
      await Promise.all(notes.map(n => api.patch(`/alerts/${n.id}/resolve`)));
      setNotes([]);
    } catch (err) {
      console.error(err);
    }
  };

  const dismiss = async (id) => {
    try {
      await api.patch(`/alerts/${id}/resolve`);
      setNotes(prev => prev.filter(x => x.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

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
              const { icon: Icon, iconBg, iconColor } = getAlertConfig(n);
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3.5 px-5 py-4 transition-colors ${n.resolved ? 'bg-white opacity-60' : 'bg-[#FDFBFF] hover:bg-slate-50'}`}
                >
                  <div className={`w-8 h-8 rounded-[8px] ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon size={14} className={iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-[13px] leading-snug font-bold ${n.resolved ? 'text-slate-500' : 'text-slate-900'}`}>
                        {n.typeLabel ?? n.type ?? 'Anomaly Alert'}
                      </p>
                      {!n.resolved && (
                        <button
                          onClick={() => dismiss(n.id)}
                          className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors mt-0.5"
                          title="Mark reviewed"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    <p className={`text-[11.5px] font-medium mt-0.5 leading-relaxed ${n.resolved ? 'text-slate-400' : 'text-slate-500'}`}>
                      {n.title ?? n.description ?? 'Anomaly detected in processed invoice.'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-[10.5px] text-slate-400 font-semibold">
                        {timeAgo(n.created_at)}
                      </p>
                      {n.resolved && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          Reviewed
                        </span>
                      )}
                    </div>
                  </div>
                  {!n.resolved && <div className="w-1.5 h-1.5 rounded-full bg-[#5B2E7F] shrink-0 mt-2" />}
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
