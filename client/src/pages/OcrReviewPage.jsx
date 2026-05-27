import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function OcrReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [form,    setForm]    = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/invoices/${id}`).then(({ data }) => {
      setInvoice(data);
      setForm({
        supplier_name:  data.supplier_name  ?? '',
        invoice_number: data.invoice_number ?? '',
        invoice_date:   data.invoice_date   ? data.invoice_date.split('T')[0] : '',
        total_amount:   data.total_amount   ?? '',
        due_date:       data.due_date       ? data.due_date.split('T')[0] : '',
        category:       data.category       ?? 'Supplies',
        notes:          data.notes          ?? '',
      });
    });
  }, [id]);

  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/invoices/${id}/confirm`, form);
      toast.success('Invoice saved successfully!');
      navigate('/invoices');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save invoice');
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

  const field = (id, label, type, key, hint) => (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {hint && <span className="ml-1 text-xs text-slate-400">{hint}</span>}
      </label>
      <input
        id={id} type={type} className="input"
        value={form[key] ?? ''}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Review Extracted Data</h1>
        <p className="page-subtitle">
          OCR has extracted the following fields. Please verify and correct before saving.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* File preview */}
        <div className="card card-body">
          <h2 className="font-semibold text-slate-700 mb-4">Uploaded File</h2>
          {invoice.file_url ? (
            invoice.file_url.endsWith('.pdf') ? (
              <a
                href={invoice.file_url} target="_blank" rel="noreferrer"
                className="btn-secondary inline-flex"
              >
                <ExternalLink size={16} /> Open PDF
              </a>
            ) : (
              <img
                src={invoice.file_url} alt="Invoice"
                className="w-full rounded-lg border border-surface-border object-contain max-h-80"
              />
            )
          ) : (
            <div className="flex items-center justify-center h-40 bg-slate-50 rounded-lg text-slate-400 text-sm">
              No preview available
            </div>
          )}

          {invoice.raw_ocr_text && (
            <details className="mt-4">
              <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
                Raw OCR text
              </summary>
              <pre className="mt-2 text-xs text-slate-500 bg-slate-50 rounded p-3 overflow-auto max-h-40 whitespace-pre-wrap">
                {invoice.raw_ocr_text}
              </pre>
            </details>
          )}
        </div>

        {/* Form */}
        <form id="ocr-review-form" onSubmit={handleConfirm} className="card card-body space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-amber-500" />
            <p className="text-sm text-amber-600 font-medium">
              Fields highlighted were auto-extracted — please verify accuracy.
            </p>
          </div>

          {field('ocr-supplier',   'Supplier Name',   'text',   'supplier_name',  '(OCR extracted)')}
          {field('ocr-inv-number', 'Invoice Number',  'text',   'invoice_number', '(OCR extracted)')}
          {field('ocr-date',       'Invoice Date',    'date',   'invoice_date')}
          {field('ocr-due',        'Due Date',        'date',   'due_date')}
          {field('ocr-total',      'Total Amount (₱)','number', 'total_amount',   '(OCR extracted)')}

          <div>
            <label htmlFor="ocr-category" className="label">Category</label>
            <select
              id="ocr-category"
              className="input"
              value={form.category ?? 'Supplies'}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
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
            <label htmlFor="ocr-notes" className="label">Notes (optional)</label>
            <textarea
              id="ocr-notes"
              rows={3}
              className="input resize-none"
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            />
          </div>

          <button
            id="confirm-invoice-btn"
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-2.5"
          >
            <CheckCircle size={18} />
            {loading ? 'Saving…' : 'Confirm & Save Invoice'}
          </button>
        </form>
      </div>
    </div>
  );
}
