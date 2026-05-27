import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import api from '../lib/api';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const fmt = v => `₱${(v / 1000).toFixed(1)}k`;

export default function AnalyticsPage() {
  const [monthly,   setMonthly]   = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [statuses,  setStatuses]  = useState([]);

  useEffect(() => {
    api.get('/analytics/monthly').then(r => setMonthly(r.data));
    api.get('/analytics/by-supplier').then(r => setSuppliers(r.data));
    api.get('/analytics/by-status').then(r => setStatuses(r.data));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Visual insights into your invoice data.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Monthly expense trend — Line */}
        <div className="card card-body xl:col-span-2">
          <h2 className="font-semibold text-slate-700 mb-4">Monthly Expense Trend (Line)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthly} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={fmt} />
              <Tooltip formatter={v => `₱${parseFloat(v).toLocaleString()}`} />
              <Line type="monotone" dataKey="total" name="Expenses" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="count" name="Count"    stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} yAxisId="right" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Supplier Spending — Bar */}
        <div className="card card-body">
          <h2 className="font-semibold text-slate-700 mb-4">Top Suppliers by Spending</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={suppliers}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 60, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={fmt} />
              <YAxis type="category" dataKey="supplier" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={v => `₱${parseFloat(v).toLocaleString()}`} />
              <Bar dataKey="total" name="Total (₱)" radius={[0, 4, 4, 0]}>
                {suppliers.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status breakdown — Pie */}
        <div className="card card-body">
          <h2 className="font-semibold text-slate-700 mb-4">Invoice Status Distribution</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statuses} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}>
                {statuses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly invoice count — Bar */}
        <div className="card card-body xl:col-span-2">
          <h2 className="font-semibold text-slate-700 mb-4">Monthly Invoice Count</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" name="Invoices" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
