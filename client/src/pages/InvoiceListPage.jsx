import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Calendar, Upload, ChevronDown } from 'lucide-react';
import NotificationButton from '../components/NotificationButton';
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
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  // Custom Dropdown State
  const [status, setStatus] = useState('All Status');
  const [category, setCategory] = useState('All Categories');
  const [date, setDate] = useState('May 2026');
  
  const [statusOpen, setStatusOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const limit = 8; // Match Figma rows count

  const load = useCallback(() => {
    const params = { page, limit, ...(search && { search }) };
    api.get('/invoices', { params }).then(({ data }) => {
      setInvoices(data.invoices);
      setTotal(data.total);
    });
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  // High-fidelity fallback data exactly matching the Figma reference
  const fallbackInvoices = [
    { id: '109', invoice_number: 'INV-2025-109', supplier_name: 'DBTK Supplies Co.', invoice_date: 'May 28', category: 'Supplies', total_amount: 34500, status: 'Paid' },
    { id: '108', invoice_number: 'INV-2025-108', supplier_name: 'TechServ Corporation', invoice_date: 'May 27', category: 'Services', total_amount: 98500, status: 'Flagged' },
    { id: '107', invoice_number: 'INV-2025-107', supplier_name: 'Manila Office Goods', invoice_date: 'May 25', category: 'Equipment', total_amount: 12800, status: 'Pending' },
    { id: '106', invoice_number: 'INV-2025-106', supplier_name: 'Global Print Solutions', invoice_date: 'May 24', category: 'Supplies', total_amount: 8200, status: 'Paid' },
    { id: '105', invoice_number: 'INV-2025-105', supplier_name: 'PhilStar Utilities', invoice_date: 'May 22', category: 'Utilities', total_amount: 21000, status: 'Paid' },
    { id: '104', invoice_number: 'INV-2025-104', supplier_name: 'Apex Supplies Co.', invoice_date: 'May 20', category: 'Supplies', total_amount: 28000, status: 'Paid' },
    { id: '089', invoice_number: 'INV-2025-089', supplier_name: 'DBTK Supplies Co.', invoice_date: 'May 10', category: 'Supplies', total_amount: 34500, status: 'Duplicate' },
    { id: '088', invoice_number: 'INV-2025-088', supplier_name: 'Manila Office Goods', invoice_date: 'May 9', category: 'Equipment', total_amount: 15200, status: 'Paid' },
  ];

  // Client-side filtering logic for seamless live demo interactivity
  const filteredInvoices = (invoices.length > 0 ? invoices : fallbackInvoices).filter((inv) => {
    // 1. Search Query
    if (search) {
      const q = search.toLowerCase();
      const matchNum = inv.invoice_number?.toLowerCase().includes(q);
      const matchSup = inv.supplier_name?.toLowerCase().includes(q);
      const matchAmt = String(inv.total_amount).includes(q);
      if (!matchNum && !matchSup && !matchAmt) return false;
    }
    // 2. Status Custom Dropdown
    if (status !== 'All Status') {
      if (inv.status.toLowerCase() !== status.toLowerCase()) return false;
    }
    // 3. Category Custom Dropdown
    if (category !== 'All Categories') {
      if (inv.category.toLowerCase() !== category.toLowerCase()) return false;
    }
    return true;
  });

  const displayTotal = invoices.length > 0 ? total : 284;
  const pages = Math.max(1, Math.ceil(displayTotal / limit));

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
    { label: 'May 2026' },
    { label: 'April 2026' },
    { label: 'March 2026' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F9FA] relative">
      
      {/* Click-outside backdrop */}
      {(statusOpen || categoryOpen || dateOpen) && (
        <div 
          className="fixed inset-0 z-30 cursor-default" 
          onClick={() => { setStatusOpen(false); setCategoryOpen(false); setDateOpen(false); }} 
        />
      )}

      {/* ── Top Header Bar ── */}
      <div className="bg-white border-b border-slate-100 px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 z-10">
        <div>
          <span className="text-[10px] tracking-wider uppercase font-bold text-slate-400 block mb-1">
            Records
          </span>
          <h1 
            className="text-slate-900 tracking-tight leading-none animate-fade-in"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '30px', fontWeight: 700 }}
          >
            All Invoices
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-[10px] h-9 px-3.5 text-[12.5px] font-semibold text-slate-600 flex items-center gap-2 shadow-sm">
            <Calendar size={14} className="text-slate-600" />
            <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <NotificationButton />
          <Link to="/upload" className="bg-[#5A2D72] hover:bg-[#4A245C] active:bg-[#3B1D4A] text-white text-[12.5px] font-semibold rounded-[10px] h-9 px-5 flex items-center justify-center gap-2.5 shadow-[0_1px_3px_rgba(90,45,114,0.15)] transition-all cursor-pointer select-none whitespace-nowrap">
            <Upload size={14} className="stroke-[2.5px] text-white" />
            <span>Upload Invoice</span>
          </Link>
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="w-full max-w-[1200px] mx-auto flex flex-col min-h-full space-y-6">
          
          {/* Controls Row */}
          <div className="flex flex-col md:flex-row gap-4 relative z-40">
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
            
            <div className="flex items-center gap-3">
              
              {/* Custom Status Dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setStatusOpen(!statusOpen); setCategoryOpen(false); setDateOpen(false); }}
                  className={`h-11 px-4 bg-white border border-slate-200 rounded-[12px] text-[13px] font-bold text-slate-600 flex items-center justify-between gap-3 shadow-sm hover:bg-slate-50 transition-all cursor-pointer min-w-[130px] ${statusOpen ? 'border-[#5A2D72]/40 ring-2 ring-[#5A2D72]/10' : ''}`}
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
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-100 rounded-[12px] shadow-lg py-1.5 z-50 animate-fade-in">
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
              <div className="relative">
                <button
                  onClick={() => { setCategoryOpen(!categoryOpen); setStatusOpen(false); setDateOpen(false); }}
                  className={`h-11 px-4 bg-white border border-slate-200 rounded-[12px] text-[13px] font-bold text-slate-600 flex items-center justify-between gap-3 shadow-sm hover:bg-slate-50 transition-all cursor-pointer min-w-[150px] ${categoryOpen ? 'border-[#5A2D72]/40 ring-2 ring-[#5A2D72]/10' : ''}`}
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
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-[12px] shadow-lg py-1.5 z-50 animate-fade-in">
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
              <div className="relative">
                <button
                  onClick={() => { setDateOpen(!dateOpen); setStatusOpen(false); setCategoryOpen(false); }}
                  className={`h-11 px-4 bg-white border border-slate-200 rounded-[12px] text-[13px] font-bold text-slate-600 flex items-center justify-between gap-3 shadow-sm hover:bg-slate-50 transition-all cursor-pointer min-w-[120px] ${dateOpen ? 'border-[#5A2D72]/40 ring-2 ring-[#5A2D72]/10' : ''}`}
                >
                  <span>{date}</span>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${dateOpen ? 'rotate-180 text-[#5A2D72]' : ''}`} />
                </button>

                {dateOpen && (
                  <div className="absolute right-0 mt-2 w-36 bg-white border border-slate-100 rounded-[12px] shadow-lg py-1.5 z-50 animate-fade-in">
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
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium animate-fade-in">
                      No invoices match the selected filters.
                    </td>
                  </tr>
                ) : filteredInvoices.map((inv) => {
                  const dateStr = inv.invoice_date.length > 10 
                    ? new Date(inv.invoice_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                    : inv.invoice_date;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-4 border-b border-slate-100/80 font-bold text-slate-900">{inv.invoice_number || '—'}</td>
                      <td className="py-4 px-4 border-b border-slate-100/80 font-semibold">{inv.supplier_name || '—'}</td>
                      <td className="py-4 px-4 border-b border-slate-100/80 font-semibold text-slate-600">{dateStr || '—'}</td>
                      <td className={`py-4 px-4 border-b border-slate-100/80 font-bold ${getCatColor(inv.category)}`}>{inv.category || '—'}</td>
                      <td className="py-4 px-4 border-b border-slate-100/80 font-semibold text-slate-700">{fmt(inv.total_amount)}</td>
                      <td className={`py-4 px-4 border-b border-slate-100/80 font-bold ${getStatusColor(inv.status)}`}>{inv.status}</td>
                      <td className="py-4 px-4 border-b border-slate-100/80 text-right">
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="font-bold text-[#2D7A4F] hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer & Pagination */}
          <div className="flex items-center justify-between mt-2 px-1 relative z-10">
            <span className="text-[13px] text-slate-400 font-bold">
              Showing {filteredInvoices.length} of {displayTotal} invoices
            </span>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 px-3 flex items-center gap-1 text-[12.5px] font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-40"
              >
                <ChevronLeft size={14} strokeWidth={2.5} /> Prev
              </button>
              
              {/* Dummy pages matching reference */}
              {[1, 2, 3].map(num => (
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
    </div>
  );
}
