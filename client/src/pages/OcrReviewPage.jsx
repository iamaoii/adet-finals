import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, ExternalLink, Calendar, Loader2 } from 'lucide-react';
import NotificationButton from '../components/NotificationButton';
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
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#F8F9FA]">
        <Loader2 size={32} className="text-[#5A2D72] animate-spin" />
      </div>
    );
  }

  const field = (id, label, type, key, hint) => (
    <div className="mb-4">
      <label htmlFor={id} className="block text-[12px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
        {label}
        {hint && <span className="ml-1.5 text-[10px] text-[#B7791F] font-extrabold bg-[#FFFBEB] px-1.5 py-0.5 rounded-full border border-[#E5C88A]">{hint}</span>}
      </label>
      <input
        id={id} type={type} 
        className="h-11 w-full bg-slate-50 border border-slate-200 focus:border-[#5B2E7F] focus:ring-2 focus:ring-[#5B2E7F]/20 rounded-[10px] px-4 text-[13.5px] font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 shadow-sm"
        value={form[key] ?? ''}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8F9FA]">
      
      {/* ── Top Action Header Bar ── */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-4 flex flex-row items-center justify-between gap-4 shrink-0 relative z-50">
        <div>
          <span className="hidden sm:block text-[10px] tracking-wider uppercase font-bold text-slate-400 mb-1">
            Verification
          </span>
          <h1 
            className="text-slate-900 tracking-tight leading-none animate-fade-in text-xl sm:text-2xl lg:text-[30px]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
          >
            Review Extracted Data
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
        </div>
      </div>

      {/* ── Sub-header bar ── */}
      <div className="bg-[#F8F9FA] border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <p className="text-[13px] font-medium text-slate-500">
          OCR has extracted the following fields. Please verify and correct before saving.
        </p>
      </div>

      {/* ── Page Content ── */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: File Preview */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-100/90 rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] h-full flex flex-col">
                <h2 className="text-[15px] font-extrabold text-slate-900 tracking-tight mb-5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#5B2E7F]"></span>
                  Uploaded Document
                </h2>
                
                <div className="flex-1 bg-slate-50/80 border border-slate-200/60 rounded-[14px] p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                  {invoice.file_url ? (
                    invoice.file_url.endsWith('.pdf') ? (
                      <a
                        href={invoice.file_url} target="_blank" rel="noreferrer"
                        className="h-10 px-6 bg-white border border-slate-200 text-slate-700 text-[13px] font-bold rounded-full shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
                      >
                        <ExternalLink size={16} /> Open PDF Document
                      </a>
                    ) : (
                      <img
                        src={invoice.file_url} alt="Invoice Preview"
                        className="w-full h-auto max-h-[600px] object-contain rounded-[8px]"
                      />
                    )
                  ) : (
                    <div className="flex items-center justify-center h-40 text-slate-400 text-sm font-medium">
                      No preview available
                    </div>
                  )}
                </div>

                {invoice.raw_ocr_text && (
                  <details className="mt-5 group/details">
                    <summary className="text-[12.5px] font-bold text-slate-500 cursor-pointer hover:text-[#5B2E7F] transition-colors select-none flex items-center gap-1.5">
                      <span className="group-open/details:rotate-90 transition-transform">▸</span> Show Raw OCR Text
                    </summary>
                    <div className="mt-3 bg-slate-900 text-slate-300 text-[11px] rounded-[10px] p-4 max-h-[200px] overflow-y-auto font-mono leading-relaxed border border-slate-800 shadow-inner">
                      {invoice.raw_ocr_text}
                    </div>
                  </details>
                )}
              </div>
            </div>

            {/* Right Column: Form */}
            <div>
              <form id="ocr-review-form" onSubmit={handleConfirm} className="bg-white border border-slate-100/90 rounded-[20px] p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden">
                {/* Decorative Top Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#5B2E7F] to-[#9B6B9E]"></div>
                
                <div className="flex items-center gap-3 mb-7 bg-[#FFFBEB] border border-[#E5C88A]/50 px-4 py-3 rounded-[12px]">
                  <AlertCircle size={18} className="text-[#B7791F] shrink-0" />
                  <p className="text-[12.5px] text-[#975A16] font-semibold leading-snug">
                    Fields with badges were <span className="font-extrabold text-[#B7791F]">auto-extracted by AI</span>. Please review for accuracy.
                  </p>
                </div>

                <div className="space-y-1">
                  {field('ocr-supplier',   'Supplier Name',   'text',   'supplier_name',  'OCR Extracted')}
                  {field('ocr-inv-number', 'Invoice Number',  'text',   'invoice_number', 'OCR Extracted')}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {field('ocr-date',       'Invoice Date',    'date',   'invoice_date')}
                    {field('ocr-due',        'Due Date',        'date',   'due_date')}
                  </div>
                  
                  {field('ocr-total',      'Total Amount (₱)','number', 'total_amount',   'OCR Extracted')}

                  <div className="mb-4">
                    <label htmlFor="ocr-category" className="block text-[12px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Category</label>
                    <select
                      id="ocr-category"
                      className="h-11 w-full bg-slate-50 border border-slate-200 focus:border-[#5B2E7F] focus:ring-2 focus:ring-[#5B2E7F]/20 rounded-[10px] px-4 text-[13.5px] font-semibold text-slate-900 outline-none transition-all shadow-sm appearance-none"
                      value={form.category ?? 'Supplies'}
                      onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '40px' }}
                    >
                      <option value="Supplies">Supplies</option>
                      <option value="Services">Services</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Logistics">Logistics</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="ocr-notes" className="block text-[12px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Notes <span className="text-slate-400 font-medium normal-case tracking-normal ml-1">(optional)</span></label>
                    <textarea
                      id="ocr-notes"
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#5B2E7F] focus:ring-2 focus:ring-[#5B2E7F]/20 rounded-[10px] p-4 text-[13.5px] font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 shadow-sm resize-none"
                      placeholder="Add any internal notes about this invoice..."
                      value={form.notes}
                      onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    />
                  </div>
                </div>

                <button
                  id="confirm-invoice-btn"
                  type="submit"
                  disabled={loading}
                  className="h-[52px] w-full bg-[#5A2D72] hover:bg-[#4A245C] text-white font-bold text-[14.5px] rounded-[12px] shadow-[0_4px_20px_rgba(90,45,114,0.15)] flex items-center justify-center gap-2.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-[1px]"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <CheckCircle size={20} className="stroke-[2.5px]" />
                  )}
                  {loading ? 'Saving Invoice...' : 'Confirm & Save Invoice'}
                </button>
              </form>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
