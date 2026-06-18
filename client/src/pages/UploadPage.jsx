import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, Calendar, FileText, Loader } from 'lucide-react';
import NotificationButton from '../components/NotificationButton';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function UploadPage() {
  const navigate = useNavigate();
  const [file,    setFile]    = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = useCallback(() => {
    setLoadingHistory(true);
    api.get('/invoices', { params: { page: 1, limit: 5 } })
      .then(({ data }) => {
        setHistory(data.invoices || []);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  const onDrop = useCallback((accepted) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'application/pdf': [] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDropRejected: () => toast.error('File rejected. Max 10 MB. JPEG, PNG, WebP, PDF only.'),
  });

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/invoices', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('OCR complete! Review the extracted data.');
      navigate(`/invoices/${data.invoice.id}/review`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    loadHistory();
  }, [loadHistory]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'text-[#2D7A4F]';
      case 'flagged':
      case 'duplicate': return 'text-[#9B2C2C]';
      case 'pending': return 'text-[#B7791F]';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8F9FA]">
      
      {/* ── Figma Top Action Header Bar (Full Bleed) ── */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-4 flex flex-row items-center justify-between gap-4 shrink-0 relative z-50">
        <div>
          <span className="hidden sm:block text-[10px] tracking-wider uppercase font-bold text-slate-400 mb-1">
            Documents
          </span>
          <h1 
            className="text-slate-900 tracking-tight leading-none animate-fade-in text-xl sm:text-2xl lg:text-[30px]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
          >
            Upload Invoice
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
        <div className="max-w-[1000px] mx-auto space-y-8">
          
          {/* Title Section */}
          <div className="px-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-[28px] font-bold text-slate-900 tracking-tight mb-2">
                Upload Invoice Or Receipt
              </h2>
              <p className="text-[14px] text-slate-400 font-medium">
                AI-Powered OCR Extracts All Fields Automatically. Supported: JPG, PNG, PDF (Max 10 MB).
              </p>
            </div>
            
            {/* Quick Test File Download Card */}
            <a 
              href="/invoice_sample.png" 
              download="invoice_sample.png"
              className="bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-[14px] p-3 flex items-center gap-3 transition-colors shadow-sm self-start sm:self-auto"
            >
              <div className="w-9 h-9 bg-white border border-[#F59E0B]/20 rounded-[10px] flex items-center justify-center shrink-0 shadow-sm">
                <FileText size={16} className="text-[#D97706]" />
              </div>
              <div className="text-left">
                <div className="text-[12px] font-bold text-[#D97706] leading-none mb-0.5">Need a test file?</div>
                <div className="text-[10px] font-semibold text-slate-500">Download complete sample invoice</div>
              </div>
            </a>
          </div>

          {/* Upload Dropzone Card */}
          <div
            {...getRootProps()}
            className={`bg-white border border-slate-100/90 rounded-[20px] p-6 sm:p-12 lg:p-16 flex flex-col items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.02)] cursor-pointer transition-all min-h-[360px]
              \${isDragActive ? 'border-[#5A2D72] bg-[#5A2D72]/[0.02]' : 'hover:border-[#5A2D72]/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]'}`}
          >
            <input {...getInputProps()} />
            
            {file ? (
              // Selected File State
              <div className="flex flex-col items-center text-center animate-fade-in" onClick={e => e.stopPropagation()}>
                {preview ? (
                  <img src={preview} alt="preview" className="w-[100px] h-[100px] object-cover rounded-[14px] border border-slate-200 mb-5 shadow-sm" />
                ) : (
                  <div className="w-[100px] h-[100px] bg-slate-50 border border-slate-200 rounded-[14px] flex items-center justify-center mb-5 shadow-sm">
                    <FileText size={38} className="text-[#5A2D72]" />
                  </div>
                )}
                <h3 className="text-[18px] font-bold text-slate-800 mb-1.5">{file.name}</h3>
                <p className="text-[13px] text-slate-500 font-medium mb-7">{(file.size / 1024).toFixed(1)} KB</p>
                
                <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }} className="px-5 h-[42px] rounded-[10px] border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors">
                    Cancel
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleUpload(); }} disabled={loading} className="px-6 h-[42px] rounded-[10px] bg-[#5A2D72] hover:bg-[#4A245C] text-white text-[13px] font-bold shadow-[0_1px_3px_rgba(90,45,114,0.15)] transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? <Loader size={16} className="animate-spin" /> : <Upload size={16} className="stroke-[2.5px]" />}
                    {loading ? 'Processing...' : 'Extract Data'}
                  </button>
                </div>
              </div>
            ) : (
              // Empty State
              <div className="flex flex-col items-center text-center pointer-events-none">
                <div className="w-[72px] h-[72px] bg-white border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-[18px] flex items-center justify-center mb-7">
                  <Upload size={28} className="text-[#5A2D72] stroke-[2px]" />
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-xl sm:text-2xl lg:text-[28px] font-bold text-[#5A2D72] mb-2 tracking-tight">
                  {isDragActive ? 'Drop invoice here' : 'Drop your invoice here'}
                </h3>
                <p className="text-[14.5px] font-medium text-slate-400">
                  or <span className="text-[#5A2D72] font-bold">browse files</span> to upload
                </p>
              </div>
            )}
          </div>

          {/* Upload History Table */}
          <div className="bg-white border border-slate-100/90 rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h2 className="text-slate-800 font-bold text-[15px] tracking-tight mb-5">Upload History</h2>
            
            <div className="overflow-x-auto rounded-[12px]">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                    <th className="pb-3.5 font-bold pr-4">INVOICE #</th>
                    <th className="pb-3.5 font-bold pr-4">SUPPLIER</th>
                    <th className="pb-3.5 font-bold pr-4">DATE</th>
                    <th className="pb-3.5 font-bold">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 text-[12.5px] font-semibold text-slate-700">
                  {loadingHistory ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400 animate-pulse">Loading recent uploads...</td>
                    </tr>
                  ) : history.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400">No recently uploaded invoices.</td>
                    </tr>
                  ) : (
                    history.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 font-bold text-slate-900 pr-4">{h.invoice_number || '—'}</td>
                        <td className="py-4 font-semibold text-slate-700 pr-4">{h.supplier_name || '—'}</td>
                        <td className="py-4 font-medium text-slate-500 pr-4">
                          {h.invoice_date ? new Date(h.invoice_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td className={`py-4 font-bold capitalize ${getStatusColor(h.status)}`}>{h.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
