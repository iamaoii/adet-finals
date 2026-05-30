import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

// Import custom WebP logo assets
import logoLeftBg from '../assets/logo/logo_1.webp';  // Icon for dark background
import logoRightBg from '../assets/logo/logo_2.webp'; // Icon for white background

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await register(form.name, form.email, form.password);
      toast.success(res.message || 'Account created! Please verify your email.');
      navigate('/verify', { state: { email: form.email, fallbackCode: res.fallbackCode } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans">

      {/* ═══════════════════════════════════════════════════
          LEFT PANE — Dark editorial / brand panel (identical to LoginPage)
      ═══════════════════════════════════════════════════ */}
      <div
        className="w-full lg:w-1/2 p-12 lg:p-16 min-h-[600px] lg:min-h-screen relative flex flex-col justify-between overflow-hidden"
        style={{
          backgroundColor: '#0D0D0D',
          backgroundImage: 'radial-gradient(ellipse 70% 55% at 80% 110%, rgba(90, 40, 130, 0.22) 0%, transparent 70%)',
        }}
      >
        {/* ── Top Logo ── */}
        <div className="flex items-center gap-4 z-10">
          <img
            src={logoLeftBg}
            alt="InvoiceIQ Icon"
            className="h-[56px] w-[56px] rounded-[12px] object-contain"
          />
          <span 
            className="text-white tracking-tight leading-none"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '31px', fontWeight: 700 }}
          >
            InvoiceIQ
          </span>
        </div>

        {/* ── Centered Hero Copy Group (Perfect vertical balance) ── */}
        <div className="my-auto py-12 lg:py-16 space-y-8 max-w-[520px] z-10 w-full">
          {/* Badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-px bg-slate-500" />
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
              AI-Powered Finance
            </span>
          </div>

          {/* Main Headline */}
          <div
            className="font-serif text-white tracking-tight leading-[1.18]"
            style={{ fontSize: 'clamp(36px, 4.4vw, 52px)', fontWeight: 500 }}
          >
            <div className="whitespace-nowrap">Smarter invoices,</div>
            <div className="whitespace-nowrap">
              <span className="italic font-light text-white">effortlessly</span> managed.
            </div>
          </div>

          {/* Sub-copy */}
          <p className="text-[13.5px] leading-[1.75] text-slate-400 font-light">
            Upload receipts and invoices — our OCR engine extracts every field
            automatically, flags anomalies, and gives you a live view of your finances.
          </p>

          {/* Feature list — Inline layout exactly like Figma */}
          <div className="pt-2 space-y-4">
            {[
              { label: 'OCR Extraction',      desc: 'scan any invoice in under 2 seconds' },
              { label: 'Anomaly Detection',   desc: 'duplicates flagged instantly'         },
              { label: 'Analytics Dashboard', desc: 'real-time spending visibility'        },
            ].map(({ label, desc }) => (
              <div key={label} className="text-[13.5px] leading-relaxed flex items-center gap-3">
                <span className="font-semibold text-white tracking-wide">{label}</span>
                <span className="text-slate-500 font-light">—</span>
                <span className="text-slate-400 font-light">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer Quote (cleanly anchored at the absolute bottom) ── */}
        <div className="border-l border-purple-800/60 pl-4 py-0.5 z-10 max-w-[360px] hidden lg:block">
          <p className="text-[11.5px] italic text-slate-500 leading-relaxed font-light">
            {"\"Automation is not about replacing people — it's about giving them time back to do what matters.\""}
          </p>
          <p className="text-[9.5px] font-semibold uppercase tracking-wider text-slate-600 mt-1">
            Kolina &amp; Davenport, 2017
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          RIGHT PANE — Registration Form
      ═══════════════════════════════════════════════════ */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-12 lg:p-16 min-h-[640px] lg:min-h-screen relative">
        <div className="w-full max-w-[400px] -mt-6 lg:-mt-10">
          
          {/* Brand logo — horizontal, left-aligned on top of the heading */}
          <div className="flex items-center gap-3.5 z-10 justify-start mb-8 lg:mb-10">
            <img
              src={logoRightBg}
              alt="InvoiceIQ Icon"
              className="h-[56px] w-[56px] rounded-[12px] object-contain"
            />
            <span 
              className="text-slate-950 tracking-tight leading-none"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '31px', fontWeight: 700 }}
            >
              InvoiceIQ
            </span>
          </div>

          {/* Heading block — left-aligned */}
          <div className="space-y-1 mb-6">
            <h1 className="font-serif font-bold text-slate-900 tracking-tight text-[30px]">
              Create Account
            </h1>
            <p className="text-[13px] text-slate-400 font-light">
              Get started by setting up your profile.
            </p>
          </div>

          {/* Form */}
          <form id="register-form" onSubmit={handleSubmit} className="space-y-[15px]">

            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="reg-name" className="block text-[13px] font-medium text-slate-700">
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                placeholder="Jane Dela Cruz"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                required
                className="w-full px-3.5 py-[10px] rounded-md border border-slate-200 text-[13.5px] text-slate-800 placeholder-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 transition-all"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="reg-email" className="block text-[13px] font-medium text-slate-700">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                className="w-full px-3.5 py-[10px] rounded-md border border-slate-200 text-[13.5px] text-slate-800 placeholder-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="block text-[13px] font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  className="w-full pl-3.5 pr-11 py-[10px] rounded-md border border-slate-200 text-[13.5px] text-slate-800 placeholder-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 transition-all"
                />
                <button
                  type="button"
                  id="toggle-password-btn"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="reg-confirm" className="block text-[13px] font-medium text-slate-700">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="reg-confirm"
                  type={showConfirmPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                  required
                  className="w-full pl-3.5 pr-11 py-[10px] rounded-md border border-slate-200 text-[13.5px] text-slate-800 placeholder-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 transition-all"
                />
                <button
                  type="button"
                  id="toggle-confirm-password-btn"
                  onClick={() => setShowConfirmPw(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Create Account Button */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-[12.5px] rounded-md bg-[#5B2E7F] hover:bg-[#4A2568] active:bg-[#3D1F55] text-white text-[14px] font-semibold tracking-wide transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-purple-900/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                  <span>Creating Account…</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="text-[12.5px] text-slate-400 font-light mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-[#5B2E7F] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}
