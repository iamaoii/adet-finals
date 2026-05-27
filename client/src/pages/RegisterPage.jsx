import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileSearch } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const field = (id, label, type, key, placeholder) => (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input
        id={id} type={type} className="input" placeholder={placeholder}
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        required
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <FileSearch size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">InvoiceAI</h1>
              <p className="text-xs text-slate-400">Create your account</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">Get started</h2>
          <p className="text-sm text-slate-500 mb-6">Create an account to start processing invoices.</p>

          <form id="register-form" onSubmit={handleSubmit} className="space-y-4">
            {field('reg-name',     'Full Name',        'text',     'name',     'Jane Dela Cruz')}
            {field('reg-email',    'Email',            'email',    'email',    'you@example.com')}
            {field('reg-password', 'Password',         'password', 'password', '••••••••')}
            {field('reg-confirm',  'Confirm Password', 'password', 'confirm',  '••••••••')}

            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
