import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Upload } from 'lucide-react';
import NotificationButton from '../components/NotificationButton';
import api from '../lib/api';

const fmt = (n) =>
  n != null
    ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
    : '—';

// Deterministic theme per supplier name initial
const THEMES = [
  { badgeBg: 'bg-[#E2F0D9]', badgeText: 'text-[#2D7A4F]', barBg: 'bg-[#2D7A4F]' },
  { badgeBg: 'bg-[#E2ECF7]', badgeText: 'text-[#1B3B6F]', barBg: 'bg-[#1B3B6F]' },
  { badgeBg: 'bg-[#FCEFD9]', badgeText: 'text-[#B7791F]', barBg: 'bg-[#B7791F]' },
  { badgeBg: 'bg-[#F2EBF7]', badgeText: 'text-[#5B2E7F]', barBg: 'bg-[#5B2E7F]' },
  { badgeBg: 'bg-[#E2F0D9]', badgeText: 'text-[#2D7A4F]', barBg: 'bg-[#2D7A4F]' },
];

function getInitials(name) {
  return (name ?? '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [maxSpend,  setMaxSpend]  = useState(1);
  const [loading,   setLoading]   = useState(true);

  const loadSuppliers = useCallback(() => {
    api.get('/analytics/by-supplier')
      .then(({ data }) => {
        setSuppliers(data);
        const max = Math.max(...data.map(s => parseFloat(s.total) || 0), 1);
        setMaxSpend(max);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadSuppliers();
    window.addEventListener('alerts-updated', loadSuppliers);
    return () => window.removeEventListener('alerts-updated', loadSuppliers);
  }, [loadSuppliers]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8F9FA]">
      
      {/* ── Top Action Header Bar (Full Bleed) ── */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-4 flex flex-row items-center justify-between gap-4 shrink-0 relative z-50">
        <div>
          <span className="hidden sm:block text-[10px] tracking-wider uppercase font-bold text-slate-400 mb-1">
            Records
          </span>
          <h1 
            className="text-slate-900 tracking-tight leading-none animate-fade-in text-xl sm:text-2xl lg:text-[30px]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
          >
            Suppliers
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

      {/* ── Suppliers Grid ── */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {loading ? (
          <div className="text-center text-slate-400 font-medium py-20 animate-pulse">Loading suppliers...</div>
        ) : suppliers.length === 0 ? (
          <div className="text-center text-slate-400 font-medium py-20">No supplier data yet. Upload your first invoice!</div>
        ) : (
          <div className="w-full max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier, idx) => {
              const theme   = THEMES[idx % THEMES.length];
              const total   = parseFloat(supplier.total) || 0;
              const count   = parseInt(supplier.count) || 0;
              const avg     = count > 0 ? total / count : 0;
              const percent = Math.round((total / maxSpend) * 100);

              return (
                <div 
                  key={supplier.supplier} 
                  className="bg-white border border-slate-100/90 rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_22px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-[280px]"
                >
                  <div>
                    {/* Initials Badge */}
                    <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center text-[12.5px] font-bold ${theme.badgeBg} ${theme.badgeText} mb-3.5`}>
                      {getInitials(supplier.supplier)}
                    </div>
                    
                    {/* Info */}
                    <h3 className="text-slate-900 font-extrabold text-[15.5px] leading-tight mb-1">
                      {supplier.supplier}
                    </h3>
                    <p className="text-slate-400 font-semibold text-[11.5px] mb-0">
                      {count} Invoice{count !== 1 ? 's' : ''}
                    </p>

                    <div className="border-t border-slate-100/60 mt-2.5 mb-3.5" />

                    {/* Metrics */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[13px] font-bold">
                        <span className="text-slate-400">Total Spend</span>
                        <span className="text-slate-900">{fmt(total)}</span>
                      </div>
                      <div className="flex justify-between text-[13px] font-bold">
                        <span className="text-slate-400">Avg Invoice</span>
                        <span className="text-slate-900">{fmt(avg)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="mt-4">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${theme.barBg}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
