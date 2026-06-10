import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Calendar, Upload, ChevronDown, Trash2, SlidersHorizontal } from 'lucide-react';
import NotificationButton from '../components/NotificationButton';
import toast from 'react-hot-toast';
import api from '../lib/api';

const fmt = (n) =>
  n != null
    ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
    : '—';

const getCatColor = (cat) => {
  switch (cat?.toLowerCase()) {
    case 'supplies': return 'text-[#2D7A4F]';
    case 'services': return 'text-[#1B3B6F]';
    case 'equipment': return 'text-[#B7791F]';
    case 'utilities': return 'text-[#5B2E7F]';
    default: return 'text-slate-500';
  }
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'paid': return 'text-[#2D7A4F]';
    case 'flagged': 
    case 'duplicate': return 'text-[#9B2C2C]';
    case 'pending': return 'text-[#B7791F]';
    default: return 'text-slate-500';
  }
};

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  // Custom Dropdown State
  const [status, setStatus] = useState('All Status');
  const [category, setCategory] = useState('All Categories');
  const [date, setDate] = useState('All Dates');
  
  const [statusOpen, setStatusOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Custom Delete Modal State
  const [deleteId, setDeleteId] = useState(null);

  const limit = 8;

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit, ...(search && { search }) };
    api.get('/invoices', { params }).then(({ data }) => {
      setInvoices(data.invoices);
      setTotal(data.total);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    window.addEventListener('alerts-updated', load);
    return () => window.removeEventListener('alerts-updated', load);
  }, [load]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/invoices/${deleteId}`);
      toast.success('Invoice deleted successfully');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Failed to delete invoice');
      setDeleteId(null);
    }
  };

  // Client-side filtering on the already-fetched page of invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (status !== 'All Status') {
      if ((inv.status ?? '').toLowerCase() !== status.toLowerCase()) return false;
    }
    if (category !== 'All Categories') {
      if ((inv.category ?? '').toLowerCase() !== category.toLowerCase()) return false;
    }
    return true;
  });

  const pages = Math.max(1, Math.ceil(total / limit));

  // Option Configs
  const statusOptions = [
    { label: 'All Status', color: 'bg-slate-300' },
    { label: 'Paid', color: 'bg-[#2D7A4F]' },
    { label: 'Pending', color: 'bg-[#B7791F]' },
    { label: 'Flagged', color: 'bg-[#9B2C2C]' },
    { label: 'Duplicate', color: 'bg-[#9B2C2C]' },
  ];

  const categoryOptions = [
    { label: 'All Categories', color: 'bg-slate-300' },
    { label: 'Supplies', color: 'bg-[#2D7A4F]' },
    { label: 'Services', color: 'bg-[#1B3B6F]' },
    { label: 'Equipment', color: 'bg-[#B7791F]' },
    { label: 'Utilities', color: 'bg-[#5B2E7F]' },
  ];

  const dateOptions = [
    { label: 'All Dates' },
    { label: 'May 2025' },
    { label: 'April 2025' },
    { label: 'March 2025' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8F9FA] relative">
      
      {/* Click-outside backdrop */}
      {(statusOpen || categoryOpen || dateOpen) && (
        <div 
          className="fixed inset-0 z-30 cursor-default" 
          onClick={() => { setStatusOpen(false); setCategoryOpen(false); setDateOpen(false); }} 
        />
      )}

      {/* ── Top Header Bar ── */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-4 flex flex-row items-center justify-between gap-4 shrink-0 relative z-50">
        <div>
          <span className="hidden sm:block text-[10px] tracking-wider uppercase font-bold text-slate-400 mb-1">
            Records
          </span>
          <h1 
            className="text-slate-900 tracking-tight leading-none animate-fade-in text-xl sm:text-2xl lg:text-[30px]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
          >
            All Invoices
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

      {/* ── Page Content ── */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="w-full max-w-[1200px] mx-auto flex flex-col min-h-full space-y-6">
          
          {/* Controls Row */}
          <div className="flex flex-col md:flex-row gap-4 relative z-40">
            {/* Search Input & Mobile Filters Toggle */}
            <div className="flex items-center gap-2 w-full md:flex-1">
              <div className="relative flex-1">
                <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-[12px] text-[13.5px] font-medium text-slate-700 placeholder-slate-400 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus:border-[#5A2D72] transition-all shadow-sm"
                  placeholder="Search supplier, invoice #, amount...."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              
              {/* App-like Mobile Filter Button */}
              <button
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className={`h-11 px-4 border rounded-[12px] text-[13px] font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer md:hidden select-none ${
                  mobileFiltersOpen
                    ? 'bg-[#FAF5FF] border-[#5A2D72]/40 text-[#5B2E7F] ring-2 ring-[#5A2D72]/10'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal size={15} />
                <span>Filters</span>
              </button>
            </div>
            
            <div className={`${mobileFiltersOpen ? 'grid grid-cols-1 mt-1 p-4 bg-white border border-slate-100/90 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] w-full' : 'hidden'} md:flex md:flex-wrap md:items-center gap-2 md:w-auto md:bg-transparent md:border-0 md:p-0 md:shadow-none md:mt-0`}>
              
              {/* Custom Status Dropdown */}
              <div className="relative w-full sm:w-auto">
                <button
                  onClick={() => { setStatusOpen(!statusOpen); setCategoryOpen(false); setDateOpen(false); }}
                  className={`h-11 px-4 bg-white border border-slate-200 rounded-[12px] text-[13px] font-bold text-slate-600 flex items-center justify-between gap-3 shadow-sm hover:bg-slate-50 transition-all cursor-pointer w-full sm:w-auto sm:min-w-[130px] ${statusOpen ? 'border-[#5A2D72]/40 ring-2 ring-[#5A2D72]/10' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    {status !== 'All Status' && (
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusOptions.find(o => o.label === status)?.color}`} />
                    )}
                    <span>{status}</span>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${statusOpen ? 'rotate-180 text-[#5A2D72]' : ''}`} />
                </button>

                {statusOpen && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-44 bg-white border border-slate-100 rounded-[12px] shadow-lg py-1.5 z-50 animate-fade-in">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => { setStatus(opt.label); setStatusOpen(false); setPage(1); }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] font-bold flex items-center gap-2.5 transition-colors ${
                          status === opt.label 
                            ? 'bg-[#FAF5FF] text-[#5B2E7F]' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${opt.color}`} />
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Category Dropdown */}
              <div className="relative w-full sm:w-auto">
                <button
                  onClick={() => { setCategoryOpen(!categoryOpen); setStatusOpen(false); setDateOpen(false); }}
                  className={`h-11 px-4 bg-white border border-slate-200 rounded-[12px] text-[13px] font-bold text-slate-600 flex items-center justify-between gap-3 shadow-sm hover:bg-slate-50 transition-all cursor-pointer w-full sm:w-auto sm:min-w-[150px] ${categoryOpen ? 'border-[#5A2D72]/40 ring-2 ring-[#5A2D72]/10' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    {category !== 'All Categories' && (
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${categoryOptions.find(o => o.label === category)?.color}`} />
                    )}
                    <span>{category}</span>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${categoryOpen ? 'rotate-180 text-[#5A2D72]' : ''}`} />
                </button>

                {categoryOpen && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-48 bg-white border border-slate-100 rounded-[12px] shadow-lg py-1.5 z-50 animate-fade-in">
                    {categoryOptions.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => { setCategory(opt.label); setCategoryOpen(false); setPage(1); }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] font-bold flex items-center gap-2.5 transition-colors ${
                          category === opt.label 
                            ? 'bg-[#FAF5FF] text-[#5B2E7F]' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${opt.color}`} />
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Date Dropdown */}
              <div className="relative w-full sm:w-auto">
                <button
                  onClick={() => { setDateOpen(!dateOpen); setStatusOpen(false); setCategoryOpen(false); }}
                  className={`h-11 px-4 bg-white border border-slate-200 rounded-[12px] text-[13px] font-bold text-slate-600 flex items-center justify-between gap-3 shadow-sm hover:bg-slate-50 transition-all cursor-pointer w-full sm:w-auto sm:min-w-[120px] ${dateOpen ? 'border-[#5A2D72]/40 ring-2 ring-[#5A2D72]/10' : ''}`}
                >
                  <span>{date}</span>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${dateOpen ? 'rotate-180 text-[#5A2D72]' : ''}`} />
                </button>

                {dateOpen && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-36 bg-white border border-slate-100 rounded-[12px] shadow-lg py-1.5 z-50 animate-fade-in">
                    {dateOptions.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => { setDate(opt.label); setDateOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] font-bold flex items-center transition-colors ${
                          date === opt.label 
                            ? 'bg-[#FAF5FF] text-[#5B2E7F]' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white border border-slate-100/90 rounded-[20px] p-6 pt-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex-1 overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                  <th className="pb-3.5 font-bold px-4">INVOICE #</th>
                  <th className="pb-3.5 font-bold px-4">SUPPLIER</th>
                  <th className="pb-3.5 font-bold px-4">DATE</th>
                  <th className="pb-3.5 font-bold px-4">CATEGORY</th>
                  <th className="pb-3.5 font-bold px-4">AMOUNT</th>
                  <th className="pb-3.5 font-bold px-4">STATUS</th>
                  <th className="pb-3.5 font-bold px-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="text-[13px] font-semibold text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium animate-pulse">
                      Loading invoices...
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium animate-fade-in">
                      {invoices.length === 0 ? 'No invoices found. Upload your first invoice!' : 'No invoices match the selected filters.'}
                    </td>
                  </tr>
                ) : filteredInvoices.map((inv) => {
                  const rawDate = inv.invoice_date;
                  const dateStr = rawDate
                    ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : '—';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-4 border-b border-slate-100/80 font-bold text-slate-900">{inv.invoice_number || '—'}</td>
                      <td className="py-4 px-4 border-b border-slate-100/80 font-semibold">{inv.supplier_name || '—'}</td>
                      <td className="py-4 px-4 border-b border-slate-100/80 font-semibold text-slate-600">{dateStr}</td>
                      <td className={`py-4 px-4 border-b border-slate-100/80 font-bold ${getCatColor(inv.category)}`}>{inv.category || '—'}</td>
                      <td className="py-4 px-4 border-b border-slate-100/80 font-semibold text-slate-700">{fmt(inv.total_amount)}</td>
                      <td className={`py-4 px-4 border-b border-slate-100/80 font-bold capitalize ${getStatusColor(inv.status)}`}>{inv.status}</td>
                      <td className="py-4 px-4 border-b border-slate-100/80 text-right">
                        <div className="flex items-center justify-end gap-4">
                          <Link
                            to={`/invoices/${inv.id}`}
                            className="font-bold text-[#2D7A4F] hover:underline"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => setDeleteId(inv.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors"
                            title="Delete Invoice"
                          >
                            <Trash2 size={16} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer & Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 px-1 relative z-10">
            <span className="text-[13px] text-slate-400 font-bold">
              Showing {filteredInvoices.length} of {total} invoices
            </span>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 px-3 flex items-center gap-1 text-[12.5px] font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-40"
              >
                <ChevronLeft size={14} strokeWidth={2.5} /> Prev
              </button>
              
              {Array.from({ length: pages }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[12.5px] font-bold transition-colors ${
                    page === num ? 'bg-black text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {num}
                </button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="h-8 px-3 flex items-center gap-1 text-[12.5px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-40"
              >
                Next <ChevronRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Custom Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] animate-fade-in">
          <div className="bg-white rounded-[24px] p-8 max-w-[400px] w-full mx-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="w-12 h-12 rounded-full bg-[#FDF0EF] text-[#C0392B] flex items-center justify-center mb-5">
              <Trash2 size={24} strokeWidth={2} />
            </div>
            <h3 className="text-[20px] font-extrabold text-slate-900 mb-2">Delete Invoice?</h3>
            <p className="text-[13.5px] font-medium text-slate-500 mb-8 leading-relaxed">
              Are you sure you want to permanently delete this invoice? This action cannot be undone and will also remove any related anomaly alerts.
            </p>
            <div className="flex items-center gap-3 w-full">
              <button 
                onClick={() => setDeleteId(null)}
                className="flex-1 h-11 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[13.5px] font-bold rounded-[12px] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 h-11 bg-[#C0392B] hover:bg-[#A93226] text-white text-[13.5px] font-bold rounded-[12px] shadow-[0_2px_10px_rgba(192,57,43,0.2)] transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
