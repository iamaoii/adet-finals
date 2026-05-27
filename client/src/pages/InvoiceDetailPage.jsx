import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

function DetailRow({ label, value, isBadge = false, badgeColor = '' }) {
  return (
    <div className="py-4 border-b border-slate-100 last:border-0 flex items-center justify-between gap-4">
      <span className="text-sm font-semibold text-slate-400">{label}</span>
      {isBadge ? (
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${badgeColor}`}>
          {value || '--'}
        </span>
      ) : (
        <span className="text-sm font-bold text-slate-800 text-right">{value || '--'}</span>
      )}
    </div>
  );
}

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    api.get(`/invoices/${id}`).then(({ data }) => {
      setInvoice(data);
      setForm({
        supplier_name: data.supplier_name ?? '',
        invoice_number: data.invoice_number ?? '',
        invoice_date: data.invoice_date ? data.invoice_date.split('T')[0] : '',
        due_date: data.due_date ? data.due_date.split('T')[0] : '',
        total_amount: data.total_amount ?? '',
        category: data.category ?? 'Supplies',
        notes: data.notes ?? '',
      });
    });
  }, [id]);

  const handleSave = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.patch(`/invoices/${id}`, form);
      setInvoice(data);
      setEditing(false);
      window.dispatchEvent(new CustomEvent('alerts-updated'));
      toast.success('Invoice updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePayment = async () => {
    setLoading(true);
    try {
      const { data } = await api.patch(`/invoices/${id}/payment`);
      setInvoice(data);
      window.dispatchEvent(new CustomEvent('alerts-updated'));
      toast.success(data.status === 'paid' ? 'Invoice marked as paid' : 'Invoice marked as unpaid');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#EFF1F5] border-t-[#4A245C] rounded-full animate-spin" />
      </div>
    );
  }

  // Get dynamic badge coloring matching dashboard Figma designs
  const getStatusBadgeColor = (status) => {
    const s = (status ?? 'pending').toLowerCase();
    if (s === 'flagged' || s === 'duplicate') return 'bg-[#FDF0EF] text-[#C0392B]';
    if (s === 'pending') return 'bg-[#FFFBEB] text-[#B7791F]';
    if (s === 'verified') return 'bg-[#E2F0D9] text-[#2D7A4F]';
    if (s === 'paid') return 'bg-[#E0F2FE] text-[#0369A1]';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F9FA]">
      {/* Top Standard Action Header Bar */}
      <div className="relative z-50 flex flex-col md:flex-row md:items-center justify-between px-8 py-5 border-b border-[#EFF1F5] bg-white gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/invoices"
            className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 transition-all text-slate-600 shadow-sm"
            title="Go Back"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-3.5">
              <h1 className="text-2xl font-extrabold text-[#1E293B] tracking-tight">{invoice.invoice_number || 'Invoice Details'}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeColor(invoice.status)}`}>
                {invoice.status}
              </span>
            </div>
            <p className="text-[13px] text-slate-500 font-semibold mt-0.5">{invoice.supplier_name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!editing && (invoice.status === 'verified' || invoice.status === 'paid') && (
            <button
              id="toggle-payment-btn"
              onClick={handleTogglePayment}
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center gap-2 cursor-pointer shadow-sm ${
                invoice.status === 'paid'
                  ? 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
                  : 'bg-[#2D7A4F] hover:bg-[#256541] active:bg-[#1E5234] text-white border border-[#2D7A4F]'
              }`}
            >
              {invoice.status === 'paid' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Mark as Unpaid</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>Mark as Paid</span>
                </>
              )}
            </button>
          )}

          <button
            id="edit-toggle-btn"
            onClick={() => setEditing((value) => !value)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-95 ${
              editing
                ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            {editing ? 'Cancel' : 'Edit Invoice'}
          </button>
        </div>
      </div>

      {/* Page Panel Layout */}
      <div className="p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form/Data Panel */}
        <div className="lg:col-span-7 bg-white border border-[#EFF1F5] rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
          {editing ? (
            <form id="invoice-edit-form" onSubmit={handleSave} className="space-y-5">
              <h2 className="text-lg font-extrabold text-[#1E293B] mb-2">Edit Invoice Details</h2>
              {[
                ['edit-supplier', 'Supplier Name', 'text', 'supplier_name'],
                ['edit-inv-num', 'Invoice Number', 'text', 'invoice_number'],
                ['edit-date', 'Invoice Date', 'date', 'invoice_date'],
                ['edit-due', 'Due Date', 'date', 'due_date'],
                ['edit-total', 'Total Amount (PHP)', 'number', 'total_amount'],
              ].map(([inputId, label, type, key]) => (
                <div key={key}>
                  <label htmlFor={inputId} className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">{label}</label>
                  <input
                    id={inputId}
                    type={type}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3B1D4A] focus:border-[#3B1D4A] text-sm font-semibold text-slate-800 transition-all bg-slate-50/50 hover:bg-slate-50"
                    value={form[key] ?? ''}
                    onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
                  />
                </div>
              ))}

              <div>
                <label htmlFor="edit-category" className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Category</label>
                <select
                  id="edit-category"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3B1D4A] focus:border-[#3B1D4A] text-sm font-semibold text-slate-800 transition-all bg-slate-50/50 hover:bg-slate-50"
                  value={form.category ?? 'Supplies'}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                >
                  <option value="Supplies">Supplies</option>
                  <option value="Services">Services</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit-notes" className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Notes</label>
                <textarea
                  id="edit-notes"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3B1D4A] focus:border-[#3B1D4A] text-sm font-semibold text-slate-800 transition-all bg-slate-50/50 hover:bg-slate-50 resize-none"
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>

              <button
                id="save-invoice-btn"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#4A245C] hover:bg-[#3B1D4A] active:bg-[#2C1537] text-white font-bold rounded-xl transition-all shadow-md text-sm active:scale-[0.98]"
              >
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          ) : (
            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-[#1E293B] mb-5">Invoice Fields</h2>
              <DetailRow label="Supplier" value={invoice.supplier_name} />
              <DetailRow label="Invoice #" value={invoice.invoice_number} />
              <DetailRow
                label="Invoice Date"
                value={invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : null}
              />
              <DetailRow
                label="Due Date"
                value={invoice.due_date ? new Date(invoice.due_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : null}
              />
              <DetailRow
                label="Total Amount"
                value={invoice.total_amount ? `₱${parseFloat(invoice.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null}
              />
              <DetailRow label="Category" value={invoice.category} />
              <DetailRow label="Status" value={invoice.status} isBadge badgeColor={getStatusBadgeColor(invoice.status)} />
              <DetailRow label="Notes" value={invoice.notes} />
              <DetailRow label="Uploaded At" value={new Date(invoice.created_at).toLocaleString()} />
            </div>
          )}
        </div>

        {/* Right Attachment Panel */}
        <div className="lg:col-span-5 bg-white border border-[#EFF1F5] rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.015)] flex flex-col">
          <h2 className="text-lg font-extrabold text-[#1E293B] mb-5">Invoice Attachment</h2>
          {invoice.file_url ? (
            <div className="flex-1 flex flex-col justify-between">
              <div className="relative group rounded-xl overflow-hidden border border-slate-100 bg-slate-50/50 flex items-center justify-center p-4 min-h-[300px] shadow-inner">
                <img
                  src={invoice.file_url}
                  alt="Invoice file"
                  className="max-w-full rounded-lg object-contain max-h-[320px] transition-transform duration-300 group-hover:scale-[1.02]"
                  onError={(event) => {
                    event.target.style.display = 'none';
                  }}
                />
              </div>
              <a
                id="open-file-link"
                href={invoice.file_url}
                target="_blank"
                rel="noreferrer"
                className="mt-6 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 active:scale-95 transition-all shadow-sm bg-white"
              >
                <ExternalLink size={14} className="text-slate-500" />
                Open full document
              </a>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
              <p className="text-sm font-bold">No attachment file attached</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
