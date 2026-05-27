import { useEffect, useState } from 'react';
import {
  FileText, DollarSign, Clock, AlertTriangle, TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary,  setSummary]  = useState(null);
  const [monthly,  setMonthly]  = useState([]);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    api.get('/analytics/summary').then(r => setSummary(r.data));
    api.get('/analytics/monthly').then(r => setMonthly(r.data));
    api.get('/analytics/by-status').then(r => setStatuses(r.data));
  }, []);

  const fmt = (n) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n ?? 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {user?.name} 👋</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={FileText}   label="Total Invoices"
          value={summary?.totalInvoices ?? '—'}
          color="bg-primary-600"
        />
        <StatCard
          icon={DollarSign} label="Total Expenses"
          value={summary ? fmt(summary.totalExpenses) : '—'}
          color="bg-emerald-500"
        />
        <StatCard
          icon={Clock}      label="Pending Review"
          value={summary?.pendingInvoices ?? '—'}
          color="bg-amber-500"
        />
        <StatCard
          icon={AlertTriangle} label="Flagged"
          value={summary?.flaggedInvoices ?? '—'}
          color="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <div className="card card-body xl:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-primary-600" />
            <h2 className="font-semibold text-slate-700">Monthly Expense Trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthly} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => fmt(v)} />
              <Area
                type="monotone" dataKey="total" name="Expenses"
                stroke="#2563eb" strokeWidth={2}
                fill="url(#gradBlue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie */}
        <div className="card card-body">
          <h2 className="font-semibold text-slate-700 mb-4">Invoice Status</h2>
          {statuses.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statuses} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                  {statuses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
