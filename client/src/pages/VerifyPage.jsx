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
  const [fallbackCode, setFallbackCode] = useState(location.state?.fallbackCode || '');
  const [code, setCode] = useState(location.state?.fallbackCode || ''); // Initialize code directly
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
      const res = await resendVerification(email);
      if (res.fallbackCode) {
        setFallbackCode(res.fallbackCode);
        setCode(res.fallbackCode); // Directly set code on resend success
        toast.success('Sandbox Mode: Verification bypass code generated!');
      } else {
        toast.success('A new temporary key has been sent to your email inbox!');
      }
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
        className="hidden lg:flex lg:w-1/2 p-12 lg:p-16 min-h-screen relative flex-col justify-between overflow-hidden"
        style={{
          backgroundColor: '#0D0D0D',
          backgroundImage: 'radial-gradient(ellipse 70% 55% at 80% 110%, rgba(90, 40, 130, 0.22) 0%, transparent 70%)',
        }}
      >
        {/* Background Decorative Waves */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.25]">
          <svg className="w-full h-full" viewBox="0 0 500 800" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            {/* Wave 1 */}
            <path d="M-50,200 Q150,100 250,300 T600,400" stroke="url(#wave-line-1)" strokeWidth="2" fill="none" className="animate-pulse" style={{ animationDuration: '6s' }} />
            {/* Wave 2 */}
            <path d="M-100,250 Q100,350 300,200 T600,300" stroke="url(#wave-line-2)" strokeWidth="1.5" fill="none" className="animate-pulse" style={{ animationDuration: '8s' }} />
            {/* Wave 3 */}
            <path d="M-50,150 Q200,400 350,150 T550,250" stroke="url(#wave-line-3)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
            <defs>
              <linearGradient id="wave-line-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#5B2E7F" />
                <stop offset="50%" stopColor="#D946EF" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
              <linearGradient id="wave-line-2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
              <linearGradient id="wave-line-3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D946EF" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#5B2E7F" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

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
      <div 
        className="w-full lg:w-1/2 bg-[#F8F9FA] flex items-center justify-center p-6 sm:p-12 lg:p-16 min-h-screen relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(91, 46, 127, 0.02) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(59, 130, 246, 0.02) 0%, transparent 45%)',
        }}
      >
        {/* Faint decorative waves in right pane background */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.06]">
          <svg className="w-full h-full" viewBox="0 0 500 800" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M-50,600 Q150,500 250,700 T600,800" stroke="#5B2E7F" strokeWidth="1.5" fill="none" />
            <path d="M-100,650 Q100,750 300,600 T600,700" stroke="#3B82F6" strokeWidth="1" fill="none" />
          </svg>
        </div>

        {/* Premium verify card */}
        <div className="w-full max-w-[440px] bg-white border border-slate-100 rounded-[24px] p-8 sm:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative z-10 backdrop-blur-sm">
          
          {/* Brand logo — horizontal, left-aligned on top of the heading */}
          <div className="flex items-center gap-3.5 justify-center lg:justify-start mb-8 lg:mb-10">
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
          <div className="space-y-1 mb-6 text-center lg:text-left">
            <h1 className="font-serif font-bold text-slate-900 tracking-tight text-[30px]">
              Verify Your Email
            </h1>
            <p className="text-[13px] text-slate-400 font-light">
              Enter the 6-digit key to activate your account.
            </p>
          </div>

          {/* Form */}
          <form id="verify-form" onSubmit={handleSubmit} className="space-y-[18px]">

            {/* Professor Sandbox Bypass Banner */}
            {fallbackCode && (
              <div 
                className="p-4 rounded-lg flex flex-col gap-2 mb-4 animate-[fadeIn_0.3s_ease-out]"
                style={{
                  backgroundColor: '#FAF5FF',
                  border: '1px solid #E9D5FF',
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                  <span className="text-[11px] font-semibold text-purple-900 uppercase tracking-wider">
                    🎓 Professor Sandbox Bypass
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed text-purple-700 font-light">
                  Outbound email SMTP port is blocked by your cloud provider (Render free tier). 
                  Use the generated code below to activate your account for presentation and testing:
                </p>
                <div className="flex items-center justify-between bg-white border border-purple-100 px-3 py-1.5 rounded-md mt-1">
                  <span className="text-[11.5px] font-medium text-slate-400">Security Key</span>
                  <span className="font-mono text-[15px] font-bold text-[#5B2E7F] tracking-[0.2em]">{fallbackCode}</span>
                </div>
              </div>
            )}

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
                Check your email inbox for the verification key!
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
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 mt-6 text-[12.5px] text-slate-400 font-light text-center sm:text-left">
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
