import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Upload } from 'lucide-react';
import NotificationButton from '../components/NotificationButton';
import toast from 'react-hot-toast';
import api from '../lib/api';

// ── Risk / Type Config ─────────────────────────────────────────────────────
const RISK_CONFIG = {
  high: {
    borderColor: 'border-l-[#C0392B]',
    titleColor:  'text-[#C0392B]',
    badgeBg:     'bg-[#FDF0EF]',
    badgeText:   'text-[#C0392B]',
    badgeBorder: 'border-[#E8B4AF]',
    label:       'High Risk',
  },
  medium: {
    borderColor: 'border-l-[#B7791F]',
    titleColor:  'text-[#B7791F]',
    badgeBg:     'bg-[#FFFBEB]',
    badgeText:   'text-[#B7791F]',
    badgeBorder: 'border-[#E5C88A]',
    label:       'Medium Risk',
  },
  low: {
    borderColor: 'border-l-[#B7791F]',
    titleColor:  'text-[#B7791F]',
    badgeBg:     'bg-[#FFFBEB]',
    badgeText:   'text-[#B7791F]',
    badgeBorder: 'border-[#E5C88A]',
    label:       'Low Risk',
  },
};

// ── Fallback Alerts matching Figma reference ───────────────────────────────
const FALLBACK_ALERTS = [
  {
    id: '1',
    risk: 'high',
    typeLabel: 'Duplicate Invoice — High Risk',
    title: 'INV-2025-089 is a duplicate of INV-2025-109',
    description: 'Both invoices are from DBTK Supplies Co. for exactly ₱34,500. INV-2025-089 was uploaded 18 days prior — possible duplicate payment risk',
    meta: [
      { label: 'Similarity', value: '99.4%' },
      { label: 'Supplier',   value: 'Apex Supplies Co.' },
      { label: 'Amount',     value: '₱34,500 each' },
    ],
    actions: [
      { label: 'Mark reviewed',    style: 'outline' },
      { label: 'Reject INV-2-25-089', style: 'danger' },
    ],
  },
  {
    id: '2',
    risk: 'medium',
    typeLabel: 'High Amount — Medium Risk',
    title: 'INV-2025-108 exceeds the ₱75,000 threshold by 31%',
    description: 'Invoice from TechServ Corporation totaling ₱98,500 is 31.3% above the configured alert threshold. Management approval may be required.',
    meta: [
      { label: 'Threshold', value: '₱75,000' },
      { label: 'Invoice',   value: '₱95,000' },
      { label: 'Overage',   value: '+₱23,500' },
    ],
    actions: [
      { label: 'Mark reviewed',  style: 'outline' },
      { label: 'Approve Invoice', style: 'primary' },
    ],
  },
  {
    id: '3',
    risk: 'low',
    typeLabel: 'Missing Field — Low Risk',
    title: 'Invoice date could not be extracted from receipt',
    description: 'OCR extraction from Manila Goods Trading (receipt_manila_may25.jpg) returned 61% confidence. Invoice date field is blank',
    meta: [],
    actions: [
      { label: 'Edit Manually', style: 'primary' },
      { label: 'Dismiss',       style: 'outline' },
    ],
  },
];

export default function AlertsPage() {
  const [alerts, setAlerts]     = useState([]);
  const [resolved]               = useState(false);

  const load = useCallback(() => {
    api.get('/alerts', { params: { resolved } })
      .then((r) => setAlerts(r.data))
      .catch(() => {});
  }, [resolved]);

  useEffect(() => { load(); }, [load]);

  const handleResolve = async (id) => {
    try {
      await api.patch(`/alerts/${id}/resolve`);
      toast.success('Alert marked as reviewed');
      load();
    } catch {
      toast.error('Could not update alert');
    }
  };

  const handleMarkAll = async () => {
    try {
      await Promise.all(alerts.map(a => api.patch(`/alerts/${a.id}/resolve`)));
      toast.success('All alerts marked as reviewed');
      load();
    } catch {
      toast.error('Could not update alerts');
    }
  };

  const activeAlerts = alerts.length > 0 ? alerts : FALLBACK_ALERTS;
  const isFallback   = alerts.length === 0;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F9FA]">

      {/* ── Top Action Header Bar ── */}
      <div className="bg-white border-b border-slate-100 px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <span className="text-[10px] tracking-wider uppercase font-bold text-slate-400 block mb-1">
            Insights
          </span>
          <h1
            className="text-slate-900 tracking-tight leading-none"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '30px', fontWeight: 700 }}
          >
            Anomaly Alerts
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-[10px] h-9 px-3.5 text-[12.5px] font-semibold text-slate-600 flex items-center gap-2 shadow-sm">
            <Calendar size={14} />
            <span>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
          <NotificationButton />
          <Link to="/upload" className="bg-[#5A2D72] hover:bg-[#4A245C] text-white text-[12.5px] font-semibold rounded-[10px] h-9 px-5 flex items-center justify-center gap-2.5 transition-all whitespace-nowrap">
            <Upload size={14} className="stroke-[2.5px]" />
            <span>Upload Invoice</span>
          </Link>
        </div>
      </div>

      {/* ── Sub-header bar ── */}
      <div className="bg-[#F8F9FA] border-b border-slate-100 px-8 py-3.5 flex items-center justify-between">
        <p className="text-[13.5px] font-semibold text-slate-400">
          {activeAlerts.length} Active {activeAlerts.length === 1 ? 'Anomaly' : 'Anomalies'} Require Your Attention.
        </p>
        <button
          onClick={handleMarkAll}
          className="h-8 px-4 bg-white border border-[#E8DEF8] rounded-full text-[12px] font-semibold text-[#5B2E7F] hover:bg-[#FAF5FF] hover:border-[#D0B8E8] transition-colors shadow-sm"
        >
          Mark all reviewed
        </button>
      </div>

      {/* ── Alerts List ── */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="w-full max-w-[1200px] mx-auto space-y-5">

          {activeAlerts.map((alert) => {
            const isReal = !isFallback;
            const risk   = alert.risk ?? 'medium';
            const cfg    = RISK_CONFIG[risk] ?? RISK_CONFIG.medium;

            return (
              <div
                key={alert.id}
                className={`bg-white border border-slate-100/90 border-l-4 ${cfg.borderColor} rounded-[16px] px-6 py-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]`}
              >
                {/* Top Row — type label + badge */}
                <div className="flex items-start justify-between gap-4 mb-2.5">
                  <span className={`text-[12.5px] font-extrabold ${cfg.titleColor}`}>
                    {alert.typeLabel ?? alert.type ?? 'Alert'}
                  </span>
                  <span className={`text-[11px] font-bold border rounded-full px-3 py-0.5 shrink-0 ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Main Alert Title */}
                <p className="text-[15px] font-bold text-slate-900 mb-1.5 leading-snug">
                  {alert.title ?? alert.message ?? '—'}
                </p>

                {/* Description */}
                {alert.description && (
                  <p className="text-[12.5px] font-medium text-slate-400 leading-relaxed mb-4">
                    {alert.description}
                  </p>
                )}

                {/* Meta Pills Row */}
                {alert.meta && alert.meta.length > 0 && (
                  <>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3 border-t border-b border-slate-100 mb-4">
                      {alert.meta.map((m, i) => (
                        <span key={i} className="text-[12px]">
                          <span className="text-slate-400 font-semibold">{m.label} </span>
                          <span className="text-slate-800 font-bold">{m.value}</span>
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {/* Divider when no meta */}
                {(!alert.meta || alert.meta.length === 0) && (
                  <div className="border-t border-slate-100 mb-4" />
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {(alert.actions ?? [{ label: 'Mark reviewed', style: 'outline' }]).map((action, i) => {
                    if (action.style === 'primary') {
                      return (
                        <button
                          key={i}
                          onClick={() => isReal && handleResolve(alert.id)}
                          className="h-9 px-5 bg-[#5A2D72] hover:bg-[#4A245C] text-white text-[12.5px] font-bold rounded-[10px] transition-colors"
                        >
                          {action.label}
                        </button>
                      );
                    }
                    if (action.style === 'danger') {
                      return (
                        <button
                          key={i}
                          className="h-9 px-5 bg-[#FDF0EF] hover:bg-[#FAE0DD] text-[#C0392B] border border-[#E8B4AF] text-[12.5px] font-bold rounded-[10px] transition-colors"
                        >
                          {action.label}
                        </button>
                      );
                    }
                    // outline (default)
                    return (
                      <button
                        key={i}
                        onClick={() => isReal && handleResolve(alert.id)}
                        className="h-9 px-5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-[12.5px] font-bold rounded-[10px] transition-colors"
                      >
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

        </div>
      </div>

    </div>
  );
}
