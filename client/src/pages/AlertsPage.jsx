import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Copy, TrendingUp, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

const TYPE_CONFIG = {
  duplicate: {
    icon: Copy,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    badge: 'badge-yellow',
  },
  high_value: {
    icon: TrendingUp,
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    badge: 'badge-red',
  },
  missing_field: {
    icon: XCircle,
    color: 'text-slate-500',
    bg: 'bg-slate-50 border-slate-200',
    badge: 'badge-gray',
  },
  other: {
    icon: AlertTriangle,
    color: 'text-primary-600',
    bg: 'bg-primary-50 border-primary-200',
    badge: 'badge-blue',
  },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [resolved, setResolved] = useState(false);

  const load = useCallback(() => {
    return api.get('/alerts', { params: { resolved } }).then((response) => {
      setAlerts(response.data);
    });
  }, [resolved]);

  useEffect(() => {
    load();
  }, [load]);

  const handleResolve = async (id) => {
    try {
      await api.patch(`/alerts/${id}/resolve`);
      toast.success('Alert resolved');
      await load();
    } catch {
      toast.error('Could not resolve alert');
    }
  };

  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Alerts</h1>
          <p className="page-subtitle">Anomalies detected during invoice processing.</p>
        </div>
        <button
          id="toggle-resolved-btn"
          onClick={() => setResolved((value) => !value)}
          className="btn-secondary"
        >
          {resolved ? 'Show Active' : 'Show Resolved'}
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="card card-body flex flex-col items-center justify-center py-20 gap-4">
          <CheckCircle2 size={48} className="text-emerald-400" />
          <p className="text-slate-500 font-medium">
            {resolved ? 'No resolved alerts.' : 'No active alerts - all clear!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const cfg = TYPE_CONFIG[alert.type] ?? TYPE_CONFIG.other;
            const Icon = cfg.icon;

            return (
              <div
                key={alert.id}
                className={`flex items-start gap-4 p-4 rounded-xl border ${cfg.bg} transition-all`}
              >
                <Icon size={20} className={`${cfg.color} mt-0.5 shrink-0`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={cfg.badge}>{alert.type.replace('_', ' ')}</span>
                    {alert.invoice_number && (
                      <span className="text-xs text-slate-400">Invoice #{alert.invoice_number}</span>
                    )}
                    {alert.supplier_name && (
                      <span className="text-xs text-slate-400">- {alert.supplier_name}</span>
                    )}
                  </div>

                  <p className="text-sm text-slate-700">{alert.message}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>

                {!resolved && (
                  <button
                    id={`resolve-alert-${alert.id}`}
                    onClick={() => handleResolve(alert.id)}
                    className="btn-secondary btn-sm shrink-0"
                  >
                    <CheckCircle2 size={14} /> Resolve
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
