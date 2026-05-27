import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Upload, Save, Lock, Info, User } from 'lucide-react';
import NotificationButton from '../components/NotificationButton';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../lib/api';

const inputClass = "w-full h-11 px-4 bg-white border border-slate-200 rounded-[12px] text-[13.5px] font-medium text-slate-700 placeholder-slate-400 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus:border-[#5A2D72] transition-all shadow-sm";
const labelClass = "block text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1.5";

export default function SettingsPage() {
  const { user, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name:  user?.name  ?? '',
    email: user?.email ?? '',
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });

  const [savingProfile,  setSavingProfile]  = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const getInitials = () => {
    if (!user?.name) return 'TU';
    const parts = user.name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return user.name.slice(0, 2).toUpperCase();
  };

  const handleProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    try {
      setSavingProfile(true);
      const { data } = await api.patch('/auth/me', {
        name:  profileForm.name.trim(),
        email: profileForm.email.trim(),
      });
      updateUser({ name: data.name, email: data.email });
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    try {
      setSavingPassword(true);
      await api.patch('/auth/me/password', {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F9FA]">

      {/* ── Top Action Header Bar ── */}
      <div className="bg-white border-b border-slate-100 px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 relative z-50">
        <div>
          <span className="text-[10px] tracking-wider uppercase font-bold text-slate-400 block mb-1">
            Account
          </span>
          <h1
            className="text-slate-900 tracking-tight leading-none"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '30px', fontWeight: 700 }}
          >
            Settings
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
        <div className="w-full max-w-[720px] mx-auto space-y-6">

          {/* ── Profile Card ── */}
          <div className="bg-white border border-slate-100/90 rounded-[20px] p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            {/* Section Header */}
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-[8px] bg-[#FAF5FF] flex items-center justify-center">
                <User size={15} className="text-[#5B2E7F]" />
              </div>
              <h2 className="text-[14.5px] font-extrabold text-slate-900">Profile Information</h2>
            </div>

            {/* Avatar + name display */}
            <div className="flex items-center gap-4 mb-7 p-4 bg-slate-50 rounded-[14px]">
              <div className="w-14 h-14 rounded-full border-2 border-purple-200 bg-[#FAF5FF] text-[#5B2E7F] text-[15px] font-bold flex items-center justify-center shrink-0 shadow-sm">
                {getInitials()}
              </div>
              <div>
                <p className="text-[15px] font-extrabold text-slate-900">{user?.name || 'Test User'}</p>
                <p className="text-[12px] font-semibold text-slate-400 capitalize mt-0.5">{user?.role || 'Admin'} · {user?.email || 'user@example.com'}</p>
              </div>
            </div>

            <form id="settings-profile-form" onSubmit={handleProfile} className="space-y-4">
              <div>
                <label htmlFor="settings-name" className={labelClass}>Full Name</label>
                <input
                  id="settings-name"
                  type="text"
                  className={inputClass}
                  placeholder="Your full name"
                  value={profileForm.name}
                  onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="settings-email" className={labelClass}>Email Address</label>
                <input
                  id="settings-email"
                  type="email"
                  className={inputClass}
                  placeholder="you@example.com"
                  value={profileForm.email}
                  onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="pt-1">
                <button
                  id="save-profile-btn"
                  type="submit"
                  disabled={savingProfile}
                  className="h-11 px-6 bg-[#5A2D72] hover:bg-[#4A245C] disabled:opacity-60 text-white text-[13px] font-bold rounded-[12px] flex items-center gap-2.5 transition-all shadow-[0_1px_4px_rgba(90,45,114,0.2)]"
                >
                  <Save size={14} className="stroke-[2.5px]" />
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* ── Change Password Card ── */}
          <div className="bg-white border border-slate-100/90 rounded-[20px] p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-[8px] bg-[#FFF5F5] flex items-center justify-center">
                <Lock size={15} className="text-[#C0392B]" />
              </div>
              <h2 className="text-[14.5px] font-extrabold text-slate-900">Change Password</h2>
            </div>

            <form id="settings-password-form" onSubmit={handlePassword} className="space-y-4">
              {[
                ['settings-current-pw', 'Current Password',  'currentPassword', 'Enter current password'],
                ['settings-new-pw',     'New Password',       'newPassword',     'Enter new password'],
                ['settings-confirm-pw', 'Confirm New Password','confirmPassword','Re-enter new password'],
              ].map(([id, label, key, placeholder]) => (
                <div key={key}>
                  <label htmlFor={id} className={labelClass}>{label}</label>
                  <input
                    id={id}
                    type="password"
                    className={inputClass}
                    placeholder={placeholder}
                    value={pwForm[key]}
                    onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="pt-1">
                <button
                  id="change-password-btn"
                  type="submit"
                  disabled={savingPassword}
                  className="h-11 px-6 bg-white hover:bg-slate-50 disabled:opacity-60 border border-slate-200 text-slate-700 text-[13px] font-bold rounded-[12px] flex items-center gap-2.5 transition-all shadow-sm"
                >
                  <Lock size={14} className="stroke-[2.5px]" />
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* ── System Info Card ── */}
          <div className="bg-white border border-slate-100/90 rounded-[20px] p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-[8px] bg-[#F0F9FF] flex items-center justify-center">
                <Info size={15} className="text-[#1B3B6F]" />
              </div>
              <h2 className="text-[14.5px] font-extrabold text-slate-900">System Info</h2>
            </div>

            <div className="space-y-0 divide-y divide-slate-100">
              {[
                ['Version',     'v1.0.0-prototype'],
                ['OCR Engine',  'Tesseract OCR'],
                ['Database',    'PostgreSQL (Supabase)'],
                ['Storage',     'Cloudinary (free tier)'],
              ].map(([key, val]) => (
                <div key={key} className="flex items-center justify-between py-3.5">
                  <span className="text-[13px] font-semibold text-slate-400">{key}</span>
                  <span className="text-[13px] font-bold text-slate-800 font-mono">{val}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
