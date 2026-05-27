import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Upload } from 'lucide-react';
import NotificationButton from '../components/NotificationButton';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  PieChart, Pie,
} from 'recharts';
import api from '../lib/api';

// ── Brand Palette ──────────────────────────────────────────────
const SUPPLIER_COLORS = ['#2D5A27', '#8B6914', '#1B3B6F', '#5B2E7F', '#2D5A27'];

const CATEGORY_COLORS = {
  Supplies:  '#2D7A4F',
  Services:  '#1B3B6F',
  Equipment: '#8B6914',
  Utilities: '#5B2E7F',
};

const fmt = (v) => `₱${(v / 1000).toFixed(0)}k`;
const fmtPHP = (v) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(v);

// ── Fallback data matching the reference ──────────────────────
const FALLBACK_SUPPLIERS = [
  { supplier: 'DBTK Supplies Co.', total: 487200 },
  { supplier: 'PhilStar Utilities', total: 342000 },
  { supplier: 'Kween Corp',         total: 252000 },
  { supplier: 'Manila Office',      total: 188400 },
  { supplier: 'Global Print',       total: 156600 },
];

const FALLBACK_MONTHLY = [
  { month: 'Jan', count: 38 },
  { month: 'Feb', count: 50 },
  { month: 'Mar', count: 65 },
  { month: 'Apr', count: 58 },
  { month: 'May', count: 82 },
];

const FALLBACK_CATEGORIES = [
  { name: 'Supplies',  value: 487200, color: CATEGORY_COLORS.Supplies  },
  { name: 'Services',  value: 342000, color: CATEGORY_COLORS.Services  },
  { name: 'Equipment', value: 252000, color: CATEGORY_COLORS.Equipment },
  { name: 'Utilities', value: 157000, color: CATEGORY_COLORS.Utilities },
];

// ── Custom Tooltip ─────────────────────────────────────────────
const SupplierTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-[10px] shadow-lg px-3.5 py-2.5">
      <p className="text-[12px] font-bold text-slate-900">{fmtPHP(payload[0].value)}</p>
    </div>
  );
};

const MonthlyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-[10px] shadow-lg px-3.5 py-2.5">
      <p className="text-[11px] font-semibold text-slate-400 mb-0.5">{label}</p>
      <p className="text-[13px] font-bold text-slate-900">{payload[0].value} invoices</p>
    </div>
  );
};

// ── Custom Donut Label (hidden) ──────────────────────────────
const renderCustomLabel = () => null;

export default function AnalyticsPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [monthly,   setMonthly]   = useState([]);

  useEffect(() => {
    api.get('/analytics/by-supplier').then(r => setSuppliers(r.data)).catch(() => {});
    api.get('/analytics/monthly').then(r => setMonthly(r.data)).catch(() => {});
  }, []);

  const activeSuppliers = suppliers.length > 0 ? suppliers : FALLBACK_SUPPLIERS;
  const activeMonthly   = monthly.length   > 0 ? monthly   : FALLBACK_MONTHLY;

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
            Analytics
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-[10px] h-9 px-3.5 text-[12.5px] font-semibold text-slate-600 flex items-center gap-2 shadow-sm">
            <Calendar size={14} className="text-slate-600" />
            <span>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
          <NotificationButton />
          <Link to="/upload" className="bg-[#5A2D72] hover:bg-[#4A245C] text-white text-[12.5px] font-semibold rounded-[10px] h-9 px-5 flex items-center justify-center gap-2.5 shadow-[0_1px_3px_rgba(90,45,114,0.15)] transition-all whitespace-nowrap">
            <Upload size={14} className="stroke-[2.5px]" />
            <span>Upload Invoice</span>
          </Link>
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="w-full max-w-[1200px] mx-auto space-y-6">

          {/* ── Stat Cards Row ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Avg Invoice */}
            <div className="bg-white border border-slate-100/90 rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Avg Invoice</p>
              <p className="text-[38px] font-black text-slate-900 leading-none tracking-tight mb-2"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                ₱24,850
              </p>
              <p className="text-[12px] font-semibold text-slate-400">Per transaction this month</p>
            </div>

            {/* OCR Accuracy */}
            <div className="bg-white border border-slate-100/90 rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">OCR Accuracy</p>
              <p className="text-[38px] font-black text-slate-900 leading-none tracking-tight mb-2"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                97%
              </p>
              <p className="text-[12px] font-semibold text-slate-400 mb-2">Avg extraction confidence</p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#5A2D72]" style={{ width: '97%' }} />
              </div>
            </div>

            {/* Processing Speed */}
            <div className="bg-white border border-slate-100/90 rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Processing Speed</p>
              <p className="text-[38px] font-black text-slate-900 leading-none tracking-tight mb-2"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                1.4S
              </p>
              <p className="text-[12px] font-semibold text-slate-400">Avg OCR extraction time</p>
            </div>
          </div>

          {/* ── Top Suppliers By Spend (Horizontal Bar Chart) ── */}
          <div className="bg-white border border-slate-100/90 rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h2 className="text-[15.5px] font-extrabold text-slate-900 mb-5">Top Suppliers By Spend</h2>
            <ResponsiveContainer width="100%" height={270}>
              <BarChart
                data={activeSuppliers}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                barCategoryGap="18%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                  tickFormatter={fmt}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 500000]}
                  ticks={[0, 50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000]}
                />
                <YAxis
                  type="category"
                  dataKey="supplier"
                  tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  width={120}
                />
                <Tooltip content={<SupplierTooltip />} cursor={{ fill: 'rgba(241,245,249,0.6)' }} />
                <Bar dataKey="total" radius={[0, 6, 6, 0]} maxBarSize={52}>
                  {activeSuppliers.map((_, i) => (
                    <Cell key={i} fill={SUPPLIER_COLORS[i % SUPPLIER_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Bottom Row: Invoice Volume + Category Breakdown ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Invoice Volume By Month */}
            <div className="bg-white border border-slate-100/90 rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <h2 className="text-[15.5px] font-extrabold text-slate-900 mb-5">Invoice Volume By Month</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={activeMonthly} margin={{ top: 0, right: 10, left: -20, bottom: 0 }} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    ticks={[0, 20, 40, 60, 80]}
                  />
                  <Tooltip content={<MonthlyTooltip />} cursor={{ fill: 'rgba(241,245,249,0.5)' }} />
                  <Bar dataKey="count" fill="#1B3B6F" radius={[5, 5, 0, 0]} maxBarSize={56} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Breakdown Donut */}
            <div className="bg-white border border-slate-100/90 rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <h2 className="text-[15.5px] font-extrabold text-slate-900 mb-5">Category Breakdown</h2>
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  <PieChart width={190} height={190}>
                    <Pie
                      data={FALLBACK_CATEGORIES}
                      cx={90}
                      cy={90}
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={renderCustomLabel}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {FALLBACK_CATEGORIES.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-3 flex-1">
                  {FALLBACK_CATEGORIES.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-[13px] font-semibold text-slate-600">{cat.name}</span>
                      </div>
                      <span className="text-[13px] font-bold text-slate-900">
                        ₱{(cat.value / 1000).toFixed(0)}K
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
