import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, X, Loader } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function UploadPage() {
  const navigate = useNavigate();
  const [file,    setFile]    = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Upload Invoice</h1>
        <p className="page-subtitle">Upload a JPEG, PNG, WebP, or PDF invoice to extract data automatically.</p>
      </div>

      <div className="max-w-2xl">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          id="upload-dropzone"
          className={`card card-body flex flex-col items-center justify-center gap-4 py-16 cursor-pointer
            border-2 border-dashed transition-colors duration-150
            ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-surface-border hover:border-primary-400 hover:bg-slate-50'}`}
        >
          <input {...getInputProps()} id="upload-file-input" />
          <UploadCloud
            size={48}
            className={`transition-colors duration-150 ${isDragActive ? 'text-primary-500' : 'text-slate-300'}`}
          />
          <div className="text-center">
            <p className="font-medium text-slate-700">
              {isDragActive ? 'Drop the file here…' : 'Drag & drop your invoice here'}
            </p>
            <p className="text-sm text-slate-400 mt-1">or click to browse files</p>
            <p className="text-xs text-slate-300 mt-2">JPEG · PNG · WebP · PDF — Max 10 MB</p>
          </div>
        </div>

        {/* File preview */}
        {file && (
          <div className="card mt-4">
            <div className="card-body flex items-center gap-4">
              {preview ? (
                <img
                  src={preview} alt="invoice preview"
                  className="w-20 h-20 object-cover rounded-lg border border-surface-border"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-primary-50 flex items-center justify-center">
                  <FileText size={32} className="text-primary-400" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700 truncate">{file.name}</p>
                <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>

              <button
                id="remove-file-btn"
                onClick={() => { setFile(null); setPreview(null); }}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Upload button */}
        <div className="flex gap-3 mt-4">
          <button
            id="process-invoice-btn"
            onClick={handleUpload}
            disabled={!file || loading}
            className="btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Processing OCR…
              </>
            ) : (
              <>
                <UploadCloud size={18} />
                Upload & Extract
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
