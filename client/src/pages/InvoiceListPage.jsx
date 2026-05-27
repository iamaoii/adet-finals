import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending:  'badge-yellow',
  verified: 'badge-blue',
  paid:     'badge-green',
  flagged:  'badge-red',
};

const fmt = (n) =>
  n != null
    ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)
    : '—';

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const limit = 10;

  const load = useCallback(() => {
    const params = { page, limit, ...(search && { search }), ...(status && { status }) };
    api.get('/invoices', { params }).then(({ data }) => {
      setInvoices(data.invoices);
      setTotal(data.total);
    });
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      toast.success('Invoice deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const pages = Math.ceil(total / limit);

  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{total} total records</p>
        </div>
        <Link to="/upload" className="btn-primary">
          + Upload Invoice
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="invoice-search"
            type="text"
            className="input pl-9"
            placeholder="Search supplier or invoice number…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            id="status-filter"
            className="input pl-9 pr-4 w-40"
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="paid">Paid</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper mb-4">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Supplier</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-slate-400 py-12">
                  No invoices found.
                </td>
              </tr>
            ) : invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="font-mono text-xs">{inv.invoice_number || '—'}</td>
                <td className="font-medium">{inv.supplier_name || '—'}</td>
                <td>{inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : '—'}</td>
                <td className="font-semibold">{fmt(inv.total_amount)}</td>
                <td>
                  <span className={STATUS_COLORS[inv.status] ?? 'badge-gray'}>
                    {inv.status}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/invoices/${inv.id}`}
                      id={`view-invoice-${inv.id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      <Eye size={13} />
                      View
                    </Link>
                    <button
                      id={`delete-invoice-${inv.id}`}
                      onClick={() => handleDelete(inv.id)}
                      className="btn btn-danger btn-sm"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center gap-2 justify-end">
          <button
            id="prev-page-btn"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary btn-sm disabled:opacity-40"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {pages}
          </span>
          <button
            id="next-page-btn"
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="btn-secondary btn-sm disabled:opacity-40"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
