import { Link } from 'react-router-dom';
import { Calendar, Upload } from 'lucide-react';
import NotificationButton from '../components/NotificationButton';

const fmt = (n) =>
  n != null
    ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
    : '—';

export default function SuppliersPage() {
  const suppliers = [
    {
      id: 1,
      name: 'DBTK Supplies Co.',
      initials: 'DSC',
      invoiceCount: '38',
      totalSpend: 487200,
      avgInvoice: 12821,
      lastInvoice: 'May 28',
      percent: '70%',
      theme: {
        badgeBg: 'bg-[#E2F0D9]',
        badgeText: 'text-[#2D7A4F]',
        barBg: 'bg-[#2D7A4F]',
      }
    },
    {
      id: 2,
      name: 'TechServ Corporation',
      initials: 'TSC',
      invoiceCount: '38',
      totalSpend: 342000,
      avgInvoice: 28500,
      lastInvoice: 'May 27',
      percent: '45%',
      theme: {
        badgeBg: 'bg-[#E2ECF7]',
        badgeText: 'text-[#1B3B6F]',
        barBg: 'bg-[#1B3B6F]',
      }
    },
    {
      id: 3,
      name: 'Manila Office Goods',
      initials: 'MOG',
      invoiceCount: '38',
      totalSpend: 252000,
      avgInvoice: 21000,
      lastInvoice: 'May 22',
      percent: '30%',
      theme: {
        badgeBg: 'bg-[#FCEFD9]',
        badgeText: 'text-[#B7791F]',
        barBg: 'bg-[#B7791F]',
      }
    },
    {
      id: 4,
      name: 'Global Print Solutions',
      initials: 'GPS',
      invoiceCount: '38',
      totalSpend: 188400,
      avgInvoice: 7850,
      lastInvoice: 'May 25',
      percent: '60%',
      theme: {
        badgeBg: 'bg-[#F2EBF7]',
        badgeText: 'text-[#5B2E7F]',
        barBg: 'bg-[#5B2E7F]',
      }
    },
    {
      id: 5,
      name: 'PhilStar Utilities',
      initials: 'PU',
      invoiceCount: '38',
      totalSpend: 156600,
      avgInvoice: 8700,
      lastInvoice: 'May 24',
      percent: '25%',
      theme: {
        badgeBg: 'bg-[#E2F0D9]',
        badgeText: 'text-[#2D7A4F]',
        barBg: 'bg-[#2D7A4F]',
      }
    }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F9FA]">
      
      {/* ── Top Action Header Bar (Full Bleed) ── */}
      <div className="bg-white border-b border-slate-100 px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <span className="text-[10px] tracking-wider uppercase font-bold text-slate-400 block mb-1">
            Records
          </span>
          <h1 
            className="text-slate-900 tracking-tight leading-none animate-fade-in"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '30px', fontWeight: 700 }}
          >
            Suppliers
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

      {/* ── Suppliers Grid ── */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="w-full max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <div 
              key={supplier.id} 
              className="bg-white border border-slate-100/90 rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_22px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-[280px]"
            >
              <div>
                {/* Initials Badge */}
                <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center text-[12.5px] font-bold ${supplier.theme.badgeBg} ${supplier.theme.badgeText} mb-3.5`}>
                  {supplier.initials}
                </div>
                
                {/* Info */}
                <h3 className="text-slate-900 font-extrabold text-[15.5px] leading-tight mb-1">
                  {supplier.name}
                </h3>
                <p className="text-slate-400 font-semibold text-[11.5px] mb-0">
                  {supplier.invoiceCount} Invoices
                </p>

                <div className="border-t border-slate-100/60 mt-2.5 mb-3.5" />

                {/* Metrics */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[13px] font-bold">
                    <span className="text-slate-400">Total Spend</span>
                    <span className="text-slate-900">{fmt(supplier.totalSpend)}</span>
                  </div>
                  <div className="flex justify-between text-[13px] font-bold">
                    <span className="text-slate-400">Avg Invoice</span>
                    <span className="text-slate-900">{fmt(supplier.avgInvoice)}</span>
                  </div>
                  <div className="flex justify-between text-[13px] font-bold">
                    <span className="text-slate-400">Last Invoice</span>
                    <span className="text-slate-900">{supplier.lastInvoice}</span>
                  </div>
                </div>
              </div>

              {/* Progress Line */}
              <div className="mt-4">
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${supplier.theme.barBg}`} style={{ width: supplier.percent }} />
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
