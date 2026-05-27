import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

// Import custom WebP logo assets
import logoLeftBg from '../assets/logo/logo_1.webp';  // Icon for dark background
import logoRightBg from '../assets/logo/logo_2.webp'; // Icon for white background

export default function VerifyPage() {
  const { verify, resendVerification } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve email passed from login/register, or allow manual entry if accessed directly
  const initialEmail = location.state?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Simple countdown timer for resending codes
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email is required');
      return;
    }
    if (code.length < 6) {
      toast.error('Please enter the full 6-digit key');
      return;
    }

    setLoading(true);
    try {
      await verify(email, code);
      toast.success('Account verified successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Email is required to resend the code');
      return;
    }

    setResending(true);
    try {
      await resendVerification(email);
      toast.success('A new temporary key has been logged to the console!');
      setCountdown(60); // 60-second cooldown
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
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
            <div className="whitespace-nowrap">Verify your identity,</div>
            <div className="whitespace-nowrap">
              <span className="italic font-light text-white">secure</span> your account.
            </div>
          </div>

          {/* Sub-copy */}
          <p className="text-[13.5px] leading-[1.75] text-slate-400 font-light">
            We take your ledger privacy seriously. Enter the 6-digit security key
            we generated for you to activate your multi-tenant data container.
          </p>

          {/* Feature list — Inline layout exactly like Figma */}
          <div className="pt-2 space-y-4">
            {[
              { label: 'One-Time Keys',       desc: 'temporary codes keep your email secure' },
              { label: 'Isolated Ledgers',    desc: 'highly encrypted, unique user boundaries' },
              { label: 'Instant Activation',  desc: 'enter key to unlock spent dashboards'   },
            ].map(({ label, desc }) => (
              <div key={label} className="text-[13.5px] leading-relaxed flex items-center gap-3">
                <span className="font-semibold text-white tracking-wide">{label}</span>
                <span className="text-slate-500 font-light">—</span>
                <span className="text-slate-400 font-light">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer Quote ── */}
        <div className="border-l border-purple-800/60 pl-4 py-0.5 z-10 max-w-[360px] hidden lg:block">
          <p className="text-[11.5px] italic text-slate-500 leading-relaxed font-light">
            {"\"Security is not a product, but a process. Isolation is the foundation of digital ledger confidence.\""}
          </p>
          <p className="text-[9.5px] font-semibold uppercase tracking-wider text-slate-600 mt-1">
            Bruce Schneier, 2003
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          RIGHT PANE — Security Key Verification Form
      ═══════════════════════════════════════════════════ */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-12 lg:p-16 min-h-[580px] lg:min-h-screen relative">
        <div className="w-full max-w-[400px] -mt-10 lg:-mt-14">
          
          {/* Brand logo — horizontal, left-aligned on top of the heading */}
          <div className="flex items-center gap-3.5 z-10 justify-start mb-10 lg:mb-12">
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
              Verify Your Email
            </h1>
            <p className="text-[13px] text-slate-400 font-light">
              Enter the 6-digit key to activate your account.
            </p>
          </div>

          {/* Form */}
          <form id="verify-form" onSubmit={handleSubmit} className="space-y-[18px]">

            {/* Email (readonly if passed, editable otherwise) */}
            <div className="space-y-1.5">
              <label htmlFor="verify-email" className="block text-[13px] font-medium text-slate-700">
                Verifying Email
              </label>
              <input
                id="verify-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                readOnly={!!initialEmail}
                required
                className={`w-full px-3.5 py-[11px] rounded-md border border-slate-200 text-[13.5px] text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 transition-all ${
                  initialEmail ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed font-light' : ''
                }`}
              />
            </div>

            {/* Verification Code */}
            <div className="space-y-1.5">
              <label htmlFor="verify-code" className="block text-[13px] font-medium text-slate-700">
                6-Digit Temporary Key
              </label>
              <input
                id="verify-code"
                type="text"
                maxLength={6}
                placeholder="••••••"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))} // only allow numbers
                required
                className="w-full tracking-[0.6em] text-center font-bold px-3.5 py-[12px] rounded-md border border-slate-200 text-[18px] text-slate-800 placeholder-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 transition-all"
              />
              <p className="text-[11px] text-slate-400 font-light pt-0.5">
                💡 Check your backend server console for the generated code!
              </p>
            </div>

            {/* Submit Button */}
            <button
              id="verify-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-[13px] rounded-md bg-[#5B2E7F] hover:bg-[#4A2568] active:bg-[#3D1F55] text-white text-[14px] font-semibold tracking-wide transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-purple-900/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                  <span>Activating Account…</span>
                </>
              ) : (
                'Activate Account'
              )}
            </button>
          </form>

          {/* Resend and Actions footer */}
          <div className="flex items-center justify-between mt-6 text-[12.5px] text-slate-400 font-light">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || countdown > 0}
              className="text-[#5B2E7F] font-semibold hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
            >
              {countdown > 0 ? `Resend key in ${countdown}s` : 'Resend temporary key'}
            </button>

            <Link to="/login" className="text-slate-400 font-medium hover:underline">
              Back to Sign In
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}
