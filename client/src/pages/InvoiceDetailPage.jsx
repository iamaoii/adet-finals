import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

const STATUS_OPTIONS = ['pending', 'verified', 'paid', 'flagged'];

function DetailRow({ label, value }) {
  return (
    <div className="py-3 border-b border-surface-border last:border-0 flex justify-between gap-4">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-slate-800 text-right">{value || '--'}</span>
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
        status: data.status ?? 'pending',
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
      toast.success('Invoice updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/invoices" className="btn-secondary btn-sm">
            <ArrowLeft size={14} /> Back
          </Link>
          <div>
            <h1 className="page-title">{invoice.invoice_number || 'Invoice Details'}</h1>
            <p className="page-subtitle">{invoice.supplier_name}</p>
          </div>
        </div>
        <button
          id="edit-toggle-btn"
          onClick={() => setEditing((value) => !value)}
          className="btn-secondary"
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card card-body">
          {editing ? (
            <form id="invoice-edit-form" onSubmit={handleSave} className="space-y-4">
              {[
                ['edit-supplier', 'Supplier Name', 'text', 'supplier_name'],
                ['edit-inv-num', 'Invoice Number', 'text', 'invoice_number'],
                ['edit-date', 'Invoice Date', 'date', 'invoice_date'],
                ['edit-due', 'Due Date', 'date', 'due_date'],
                ['edit-total', 'Total Amount', 'number', 'total_amount'],
              ].map(([inputId, label, type, key]) => (
                <div key={key}>
                  <label htmlFor={inputId} className="label">{label}</label>
                  <input
                    id={inputId}
                    type={type}
                    className="input"
                    value={form[key] ?? ''}
                    onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
                  />
                </div>
              ))}

              <div>
                <label htmlFor="edit-category" className="label">Category</label>
                <select
                  id="edit-category"
                  className="input"
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
                <label htmlFor="edit-status" className="label">Status</label>
                <select
                  id="edit-status"
                  className="input"
                  value={form.status}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="edit-notes" className="label">Notes</label>
                <textarea
                  id="edit-notes"
                  rows={3}
                  className="input resize-none"
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>

              <button
                id="save-invoice-btn"
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center"
              >
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          ) : (
            <div>
              <DetailRow label="Supplier" value={invoice.supplier_name} />
              <DetailRow label="Invoice #" value={invoice.invoice_number} />
              <DetailRow
                label="Invoice Date"
                value={invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : null}
              />
              <DetailRow
                label="Due Date"
                value={invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : null}
              />
              <DetailRow
                label="Total Amount"
                value={invoice.total_amount ? `PHP ${parseFloat(invoice.total_amount).toLocaleString()}` : null}
              />
              <DetailRow label="Category" value={invoice.category} />
              <DetailRow label="Status" value={invoice.status} />
              <DetailRow label="Notes" value={invoice.notes} />
              <DetailRow label="Uploaded At" value={new Date(invoice.created_at).toLocaleString()} />
            </div>
          )}
        </div>

        <div className="card card-body">
          <h2 className="font-semibold text-slate-700 mb-4">Invoice File</h2>
          {invoice.file_url ? (
            <>
              <img
                src={invoice.file_url}
                alt="Invoice file"
                className="w-full rounded-lg border border-surface-border object-contain max-h-96"
                onError={(event) => {
                  event.target.style.display = 'none';
                }}
              />
              <a
                id="open-file-link"
                href={invoice.file_url}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary mt-3 inline-flex"
              >
                <ExternalLink size={14} /> Open original
              </a>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 bg-slate-50 rounded-lg text-slate-400 text-sm">
              No file attached
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
