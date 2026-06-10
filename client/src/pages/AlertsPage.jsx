import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
/*
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
*/

export default function AlertsPage() {
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolved]             = useState(false);
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    api.get('/alerts', { params: { resolved } })
      .then((r) => setAlerts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [resolved]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const handleResolve = async (id, autoVerify = false) => {
    // Optimistically update the UI
    if (autoVerify) {
      // If approving, remove it from the list
      setAlerts(prev => prev.filter(a => a.id !== id));
    } else {
      // If just marking reviewed, keep it in the list but set resolved = true
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
    }

    try {
      await api.patch(`/alerts/${id}/resolve`, { autoVerify });
      toast.success(autoVerify ? 'Invoice Approved' : 'Alert marked as reviewed');
      window.dispatchEvent(new CustomEvent('alerts-updated'));
      // No need to call load() since we optimistically updated it
    } catch {
      toast.error('Could not update alert');
      load(); // restore original list on failure
    }
  };

  const handleRejectInvoice = async (invoiceId) => {
    // Optimistically remove any alerts tied to this invoice
    setAlerts(prev => prev.filter(a => a.invoice_id !== invoiceId));
    try {
      await api.delete(`/invoices/${invoiceId}`);
      toast.success('Invoice rejected and deleted');
      window.dispatchEvent(new CustomEvent('alerts-updated'));
      load();
    } catch {
      toast.error('Could not reject invoice');
    }
  };

  const handleMarkAll = async () => {
    const previousAlerts = [...alerts];
    // Optimistically mark all as resolved instead of clearing them
    setAlerts(prev => prev.map(a => ({ ...a, resolved: true }))); 
    try {
      await Promise.all(previousAlerts.map(a => api.patch(`/alerts/${a.id}/resolve`, { autoVerify: false })));
      toast.success('All alerts marked as reviewed');
      window.dispatchEvent(new CustomEvent('alerts-updated'));
    } catch {
      toast.error('Could not update alerts');
      setAlerts(previousAlerts); // Restore on failure
    }
  };

  const RISK_ORDER = { high: 1, medium: 2, low: 3 };
  const activeAlerts = [...alerts].sort(
    (a, b) => (RISK_ORDER[a.risk] ?? 4) - (RISK_ORDER[b.risk] ?? 4)
  );


  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8F9FA]">

      {/* ── Top Action Header Bar ── */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-4 flex flex-row items-center justify-between gap-4 shrink-0 relative z-50">
        <div>
          <span className="hidden sm:block text-[10px] tracking-wider uppercase font-bold text-slate-400 mb-1">
            Insights
          </span>
          <h1 
            className="text-slate-900 tracking-tight leading-none animate-fade-in text-xl sm:text-2xl lg:text-[30px]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
          >
            Anomaly Alerts
          </h1>
          <span className="sm:hidden text-[11px] font-semibold text-slate-400 block mt-1">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Calendar Select Badge */}
          <div className="hidden sm:flex bg-white border border-slate-200 rounded-[10px] h-9 px-3.5 text-[12.5px] font-semibold text-slate-600 items-center gap-2 shadow-sm">
            <Calendar size={14} className="text-slate-600" />
            <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <NotificationButton className="hidden lg:block" />
          <Link to="/upload" className="bg-[#5A2D72] hover:bg-[#4A245C] active:bg-[#3B1D4A] text-white text-[12.5px] font-semibold rounded-[10px] h-9 px-5 flex items-center justify-center gap-2.5 shadow-[0_1px_3px_rgba(90,45,114,0.15)] transition-all cursor-pointer select-none whitespace-nowrap">
            <Upload size={14} className="stroke-[2.5px] text-white" />
            <span>Upload Invoice</span>
          </Link>
        </div>
      </div>

      {/* ── Sub-header bar ── */}
      <div className="bg-[#F8F9FA] border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[13.5px] font-semibold text-slate-400">
          {activeAlerts.length} Active {activeAlerts.length === 1 ? 'Anomaly' : 'Anomalies'} Require Your Attention.
        </p>
        <button
          onClick={handleMarkAll}
          className="h-8 px-4 bg-white border border-[#E8DEF8] rounded-full text-[12px] font-semibold text-[#5B2E7F] hover:bg-[#FAF5FF] hover:border-[#D0B8E8] transition-colors shadow-sm whitespace-nowrap self-start sm:self-auto"
        >
          Mark all reviewed
        </button>
      </div>

      {/* ── Alerts List ── */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="w-full max-w-[1200px] mx-auto space-y-5">

          {loading ? (
            <div className="py-16 text-center text-slate-400 font-medium animate-pulse">
              Loading alerts...
            </div>
          ) : activeAlerts.length === 0 ? (
            <div className="bg-white border border-slate-100/90 rounded-[16px] px-6 py-12 text-center shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <p className="text-slate-400 font-semibold text-[14px]">No active anomaly alerts. Your invoices look clean!</p>
            </div>
          ) : activeAlerts.map((alert) => {
            const risk = alert.risk ?? 'medium';
            const cfg  = RISK_CONFIG[risk] ?? RISK_CONFIG.medium;

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

                {/* Meta Pills Row — built from real DB fields for real alerts */}
                {alert.similarity != null && (
                  <>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3 border-t border-b border-slate-100 mb-4">
                      {alert.similarity != null && (
                        <span className="text-[12px]">
                          <span className="text-slate-400 font-semibold">Similarity </span>
                          <span className="text-slate-800 font-bold">{alert.similarity}%</span>
                        </span>
                      )}
                      {alert.supplier_name && (
                        <span className="text-[12px]">
                          <span className="text-slate-400 font-semibold">Supplier </span>
                          <span className="text-slate-800 font-bold">{alert.supplier_name}</span>
                        </span>
                      )}
                      {alert.total_amount && (
                        <span className="text-[12px]">
                          <span className="text-slate-400 font-semibold">Amount </span>
                          <span className="text-slate-800 font-bold">₱{parseFloat(alert.total_amount).toLocaleString()}</span>
                        </span>
                      )}
                    </div>
                  </>
                )}

                {/* Divider when no meta */}
                {alert.similarity == null && (
                  <div className="border-t border-slate-100 mb-4" />
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {alert.type === 'duplicate' && (
                    <button
                      onClick={() => handleRejectInvoice(alert.invoice_id)}
                      className="h-9 px-5 bg-[#FDF0EF] hover:bg-[#FAE0DD] text-[#C0392B] border border-[#E8B4AF] text-[12.5px] font-bold rounded-[10px] transition-colors"
                    >
                      Reject Invoice
                    </button>
                  )}
                  {alert.type === 'high_value' && (
                    <button
                      onClick={() => handleResolve(alert.id, true)}
                      className="h-9 px-5 bg-[#5A2D72] hover:bg-[#4A245C] text-white text-[12.5px] font-bold rounded-[10px] transition-colors"
                    >
                      Approve Invoice
                    </button>
                  )}
                  {alert.type === 'missing_field' && (
                    <button
                      onClick={() => navigate(`/invoices/${alert.invoice_id}`)}
                      className="h-9 px-5 bg-[#5A2D72] hover:bg-[#4A245C] text-white text-[12.5px] font-bold rounded-[10px] transition-colors"
                    >
                      Edit Manually
                    </button>
                  )}
                  {alert.resolved ? (
                    <button
                      disabled
                      className="h-9 px-5 bg-slate-50 text-slate-400 border border-slate-200 text-[12.5px] font-bold rounded-[10px] cursor-not-allowed flex items-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Reviewed
                    </button>
                  ) : (
                    <button
                      onClick={() => handleResolve(alert.id, false)}
                      className="h-9 px-5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-[12.5px] font-bold rounded-[10px] transition-colors"
                    >
                      Mark reviewed
                    </button>
                  )}
                </div>
              </div>
            )
          })}

        </div>
      </div>

    </div>
  );
}
