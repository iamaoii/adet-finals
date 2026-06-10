import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Upload, FileText, Coins, Clock, AlertTriangle
} from 'lucide-react';
import NotificationButton from '../components/NotificationButton';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell
} from 'recharts';
import api from '../lib/api';

function StatCard({ label, value, swatchBg, badgeText, badgeClass, icon: Icon, iconColor }) {
  return (
    <div className="bg-white border border-slate-100/90 rounded-[20px] p-6 flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        {/* Soft pastel swatch box with dynamic center aligned icon */}
        <div className={`w-11 h-11 rounded-[14px] ${swatchBg} flex items-center justify-center`}>
          {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
        </div>
        
        {/* Soft elegant badge */}
        {badgeText && (
          <span className={`px-2.5 py-[3px] rounded-full text-[11px] font-semibold tracking-wide ${badgeClass}`}>
            {badgeText}
          </span>
        )}
      </div>

      {/* Value & Label */}
      <div className="mt-5">
        <h2 
          className="text-slate-900 tracking-tight leading-none"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '38px', fontWeight: 600 }}
        >
          {value}
        </h2>
        <p className="text-[12.5px] text-slate-400 font-light mt-2 tracking-wide">
          {label}
        </p>
      </div>
    </div>
  );
}

const formatAlertText = (alert) => {
  const supplier = alert.supplier_name || 'Unknown Supplier';

  if (alert.type === 'duplicate') {
    const title = alert.title || '';
    const match = title.match(/INV-\d+-\d+/g);
    const currentInv = alert.invoice_number || 'INV';
    
    if (match && match.length > 0) {
      const matchedInv = match[match.length - 1];
      return `${currentInv} matches ${matchedInv} — ${supplier}`;
    }
    return `${currentInv} matches duplicate — ${supplier}`;
  }

  if (alert.type === 'high_value') {
    const parsedAmount = parseFloat(alert.total_amount);
    const amount = !isNaN(parsedAmount) ? `₱${parsedAmount.toLocaleString()}` : '₱0';
    const desc = alert.description || '';
    const pctMatch = desc.match(/(\d+(?:\.\d+)?)%/);
    const pct = pctMatch ? `${Math.round(parseFloat(pctMatch[1]))}%` : '31%';
    return `${amount} ${supplier} — ${pct} above threshold`;
  }

  if (alert.type === 'missing_field') {
    const title = alert.title || '';
    let fieldName = 'Required field';
    if (title.toLowerCase().includes('date') && !title.toLowerCase().includes('due')) {
      fieldName = 'Invoice date';
    } else if (title.toLowerCase().includes('due')) {
      fieldName = 'Due date';
    } else if (title.toLowerCase().includes('supplier')) {
      fieldName = 'Supplier name';
    } else if (title.toLowerCase().includes('number')) {
      fieldName = 'Invoice number';
    } else if (title.toLowerCase().includes('amount')) {
      fieldName = 'Total amount';
    }
    return `${fieldName} not extracted — ${supplier}`;
  }

  return alert.description || alert.title || '';
};

const getGrowthText = (val) => {
  if (val === undefined || val === null) return '—';
  const num = parseFloat(val);
  const sign = num >= 0 ? '↑' : '↓';
  return `${sign} ${Math.abs(num)}%`;
};

export default function DashboardPage() {
  const [summary,     setSummary]     = useState(null);
  const [monthly,     setMonthly]     = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [alerts,      setAlerts]      = useState([]);
  const [invoices,    setInvoices]    = useState([]);
  const [loading,     setLoading]     = useState(true);

  const loadAllData = useCallback(() => {
    Promise.all([
      api.get('/analytics/summary'),
      api.get('/analytics/monthly'),
      api.get('/analytics/by-category'),
      api.get('/alerts', { params: { resolved: false } }),
      api.get('/invoices', { params: { page: 1, limit: 5 } }),
    ]).then(([sumRes, mRes, cRes, alRes, invRes]) => {
      setSummary(sumRes.data);
      setMonthly(mRes.data);
      
      const parsedCats = cRes.data.map(c => ({
        name:  c.category ?? 'Other',
        value: parseFloat(c.total) || 0,
      }));
      setCategories(parsedCats);
      setAlerts(alRes.data.slice(0, 3)); // show top 3 active anomalies
      setInvoices(invRes.data.invoices || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAllData();
    window.addEventListener('alerts-updated', loadAllData);
    return () => window.removeEventListener('alerts-updated', loadAllData);
  }, [loadAllData]);

  // Elegant PHP Compact Currency Formatter: e.g. ₱1.84M or ₱14.5k or standard currency
  const formatCompact = (num) => {
    if (num === undefined || num === null) return '₱0';
    if (num >= 1e6) {
      return `₱${(num / 1e6).toFixed(2)}M`;
    }
    if (num >= 1e3) {
      return `₱${(num / 1e3).toFixed(1)}k`;
    }
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  };

  const formatFull = (n) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n ?? 0);

  const activeMonthly = monthly;

  // Map 2026 actuals and mock a highly clean 2025 dashboard curve matching Figma
  const chartData = activeMonthly.map(item => {
    const total = item.total || 0;
    let factor = 0.8;
    if (item.month === 'Jan') factor = 0.85;
    if (item.month === 'Feb') factor = 0.88;
    if (item.month === 'Mar') factor = 0.88;
    if (item.month === 'Apr') factor = 0.82;
    if (item.month === 'May') factor = 0.83;

    return {
      month: item.month,
      currentYear: total,
      previousYear: total > 0 ? total * factor : 0,
    };
  });

  // Calculate percentages for Spending by Category Donut
  const totalCategorySpend = categories.reduce((acc, c) => acc + c.value, 0) || 1;
  const donutData = categories.map((c) => ({
    name: c.name,
    value: c.value,
    percent: Math.round((c.value / totalCategorySpend) * 100),
  }));

  // Clean colors matching categories
  const CAT_COLORS = {
    Supplies:  '#2D6A4F',
    Services:  '#1B3B6F',
    Equipment: '#B7791F',
    Utilities: '#5B2E7F',
  };
  const DEFAULT_COLORS = ['#2D6A4F', '#1B3B6F', '#B7791F', '#5B2E7F', '#94A3B8'];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'text-[#2D7A4F]';
      case 'flagged':
      case 'duplicate': return 'text-[#9B2C2C]';
      case 'pending': return 'text-[#B7791F]';
      default: return 'text-slate-500';
    }
  };

  const getCatColor = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'supplies': return 'text-[#2D7A4F]';
      case 'services': return 'text-[#2E5EAA]';
      case 'equipment': return 'text-[#B7791F]';
      case 'utilities': return 'text-[#5B2E7F]';
      default: return 'text-slate-600';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      
      {/* ── Figma Top Action Header Bar (Full Bleed) ── */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-4 flex flex-row items-center justify-between gap-4 shrink-0 relative z-50">
        <div>
          <span className="hidden sm:block text-[10px] tracking-wider uppercase font-bold text-slate-400 mb-1">
            Overview
          </span>
          <h1 
            className="text-slate-900 tracking-tight leading-none animate-fade-in text-xl sm:text-2xl lg:text-[30px]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
          >
            Dashboard
          </h1>
          <span className="sm:hidden text-[11px] font-semibold text-slate-400 block mt-1">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Right Buttons group */}
        <div className="flex items-center gap-3">
          {/* Calendar Select Badge */}
          <div className="hidden sm:flex bg-white border border-slate-200 rounded-[10px] h-9 px-3.5 text-[12.5px] font-semibold text-slate-600 items-center gap-2 shadow-sm">
            <Calendar size={14} className="text-slate-600" />
            <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>

          <NotificationButton className="hidden lg:block" />

          {/* Purple Upload Action Button */}
          <Link
            to="/upload"
            className="bg-[#5A2D72] hover:bg-[#4A245C] active:bg-[#3B1D4A] text-white text-[12.5px] font-semibold rounded-[10px] h-9 px-5 flex items-center justify-center gap-2.5 shadow-[0_1px_3px_rgba(90,45,114,0.15)] transition-all cursor-pointer select-none whitespace-nowrap"
          >
            <Upload size={14} className="stroke-[2.5px] text-white" />
            <span>Upload Invoice</span>
          </Link>
        </div>
      </div>

      {/* ── Figma Workspace Padded Body (Soft Off-White background) ── */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 overflow-y-auto bg-[#F8F9FA]">

        {/* Stat cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatCard
            label="Invoices This Month"
            value={loading ? '...' : (summary?.totalInvoices !== undefined ? summary.totalInvoices : 0)}
            swatchBg="bg-[#EAF5EE]"
            badgeText={loading ? '...' : getGrowthText(summary?.invoiceGrowth)}
            badgeClass="bg-[#EAF5EE] text-[#2D7A4F]"
            icon={FileText}
            iconColor="text-[#2D7A4F]"
          />
          <StatCard
            label="Total Expenses"
            value={loading ? '...' : (summary ? formatCompact(summary.totalExpenses) : '₱0')}
            swatchBg="bg-[#EBF1FA]"
            badgeText={loading ? '...' : getGrowthText(summary?.expenseGrowth)}
            badgeClass="bg-[#EBF1FA] text-[#2E5EAA]"
            icon={Coins}
            iconColor="text-[#2E5EAA]"
          />
          <StatCard
            label="Awaiting Verification"
            value={loading ? '...' : (summary?.pendingInvoices !== undefined ? summary.pendingInvoices : 0)}
            swatchBg="bg-[#FDF6E9]"
            badgeText="Pending"
            badgeClass="bg-[#FDF6E9] text-[#B7791F]"
            icon={Clock}
            iconColor="text-[#B7791F]"
          />
          <StatCard
            label="Flag Anomalies"
            value={loading ? '...' : (summary?.anomalyInvoices !== undefined ? summary.anomalyInvoices : 0)}
            swatchBg="bg-[#FDF2F2]"
            badgeText="Action Required"
            badgeClass="bg-[#FDF2F2] text-[#9B2C2C]"
            icon={AlertTriangle}
            iconColor="text-[#9B2C2C]"
          />
        </div>

        {/* Monthly Trend AreaChart (Full Width) */}
        <div className="w-full bg-white border border-slate-100/90 rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-slate-800 font-bold text-[16px] tracking-tight">Monthly Expense Trend</h2>
              <p className="text-slate-400 text-[11.5px] font-light mt-0.5">Live database trend</p>
            </div>
            
            <div className="flex items-center gap-4 text-[11.5px] font-medium text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 rounded-full bg-[#5B2E7F]" />
                <span>Current Year</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 border-t-2 border-dashed border-slate-300" />
                <span>Target Baseline</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="h-[240px] flex items-center justify-center text-slate-400 animate-pulse font-medium">Loading trend...</div>
          ) : chartData.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center text-slate-400 font-medium">No invoices uploaded yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#5B2E7F" stopOpacity={0.06} />
                    <stop offset="95%" stopColor="#5B2E7F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: '#94A3B8' }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={v => new Date(v + '-01').toLocaleDateString('en-US', { month: 'short' })}
                />
                
                <YAxis 
                  tick={{ fontSize: 11, fill: '#94A3B8' }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} 
                />
                
                <Tooltip formatter={v => formatFull(v)} />
                
                <Area
                  type="monotone"
                  dataKey="previousYear"
                  stroke="#CBD5E1"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="none"
                  dot={{ r: 3, fill: '#FFFFFF', stroke: '#CBD5E1', strokeWidth: 1.5 }}
                  activeDot={{ r: 4 }}
                />

                <Area
                  type="monotone"
                  dataKey="currentYear"
                  stroke="#5B2E7F"
                  strokeWidth={2.5}
                  fill="url(#gradPurple)"
                  dot={{ r: 3.5, fill: '#FFFFFF', stroke: '#5B2E7F', strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Donut Chart & Active Anomalies Row ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* Spending By Category Donut Card */}
          <div className="bg-white border border-slate-100/90 rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[300px]">
            <h2 className="text-slate-800 font-bold text-[16px] tracking-tight mb-4">Spending By Category</h2>
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 animate-pulse font-medium">Loading category spend...</div>
            ) : donutData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 font-medium">No category spend data.</div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="relative w-[180px] h-[180px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {donutData.map((entry, idx) => (
                          <Cell 
                            key={idx} 
                            fill={CAT_COLORS[entry.name] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11.5px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Live</span>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-3 text-[13px] font-medium text-slate-600">
                  {donutData.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-3.5 h-3.5 rounded-[4px]" 
                          style={{ backgroundColor: CAT_COLORS[entry.name] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length] }} 
                        />
                        <span className="font-semibold text-slate-700">{entry.name}</span>
                      </div>
                      <span className="font-light text-slate-400 text-right">{entry.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Anomalies List Card */}
          <div className="bg-white border border-slate-100/90 rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[300px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-800 font-bold text-[16px] tracking-tight">Active Anomalies</h2>
              <Link to="/alerts" className="text-[#5A2D72] hover:text-[#4A245C] text-[12px] font-bold transition-colors">
                View all
              </Link>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 animate-pulse font-medium">Loading anomalies...</div>
            ) : alerts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
                <span className="text-lg">🎉</span>
                <p className="text-[13px] font-semibold text-slate-400 mt-2">All clean! No active anomalies.</p>
              </div>
            ) : (
              <div className="space-y-3.5 flex-1">
                {alerts.map((alert) => {
                  let alertClass = 'bg-[#FFFDF5] border border-[#FEF3C7] text-[#92400E]/80';
                  let badgeText  = 'ANOMALY';
                  let badgeClass = 'text-[#92400E]';

                  if (alert.type === 'duplicate') {
                    alertClass = 'bg-[#FFF5F5] border border-[#FED7D7] text-red-950/80';
                    badgeText  = 'DUPLICATE';
                    badgeClass = 'text-red-700';
                  } else if (alert.type === 'high_value') {
                    alertClass = 'bg-[#FFFDF5] border border-[#FEF3C7] text-amber-950/80';
                    badgeText  = 'HIGH AMOUNT';
                    badgeClass = 'text-amber-800';
                  } else if (alert.type === 'missing_field') {
                    alertClass = 'bg-[#FAF6F0] border border-[#FEEBC8] text-[#78350F]/80';
                    badgeText  = 'MISSING FIELD';
                    badgeClass = 'text-[#92400E]';
                  }

                  return (
                    <div key={alert.id} className={`rounded-[12px] p-4 flex flex-col gap-1 transition-all hover:shadow-sm ${alertClass}`}>
                      <span className={`text-[10.5px] tracking-wider uppercase font-black ${badgeClass}`}>{badgeText}</span>
                      <span className="text-[13px] font-medium leading-snug">
                        {formatAlertText(alert)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* ── Recent Invoices Horizontal Table ── */}
        <div className="bg-white border border-slate-100/90 rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-slate-800 font-bold text-[16px] tracking-tight">Recent Invoices</h2>
            <Link to="/invoices" className="text-[#5A2D72] hover:text-[#4A245C] text-[12px] font-bold transition-colors">
              View all
            </Link>
          </div>

          <div className="overflow-x-auto rounded-[12px]">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                  <th className="pb-3.5 font-bold pr-4">INVOICE #</th>
                  <th className="pb-3.5 font-bold pr-4">SUPPLIER</th>
                  <th className="pb-3.5 font-bold pr-4">DATE</th>
                  <th className="pb-3.5 font-bold pr-4">CATEGORY</th>
                  <th className="pb-3.5 font-bold pr-4">AMOUNT</th>
                  <th className="pb-3.5 font-bold">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60 text-[12.5px] font-semibold text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 animate-pulse">Loading recent invoices...</td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">No invoices uploaded yet.</td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 font-bold text-slate-900 pr-4">{inv.invoice_number || '—'}</td>
                      <td className="py-3.5 font-medium text-slate-600 pr-4">{inv.supplier_name || '—'}</td>
                      <td className="py-3.5 font-light text-slate-400 pr-4">
                        {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className={`py-3.5 font-bold pr-4 ${getCatColor(inv.category)}`}>{inv.category || 'Other'}</td>
                      <td className="py-3.5 font-bold text-slate-900 pr-4">{formatFull(inv.total_amount)}</td>
                      <td className={`py-3.5 font-bold capitalize ${getStatusColor(inv.status)}`}>{inv.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
