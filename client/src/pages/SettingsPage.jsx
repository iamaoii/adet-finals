import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Save, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name:            user?.name    ?? '',
    email:           user?.email   ?? '',
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });

  const handleProfile = (e) => {
    e.preventDefault();
    // Would call PATCH /api/auth/me — placeholder for now
    toast.success('Profile update coming soon!');
  };

  const handlePassword = (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    toast.success('Password change coming soon!');
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences.</p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Profile */}
        <div className="card card-body">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold uppercase">
              {user?.name?.[0]}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>

          <form id="settings-profile-form" onSubmit={handleProfile} className="space-y-4">
            <div>
              <label htmlFor="settings-name" className="label">Full Name</label>
              <input
                id="settings-name" type="text" className="input"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="settings-email" className="label">Email</label>
              <input
                id="settings-email" type="email" className="input"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              />
            </div>
            <button id="save-profile-btn" type="submit" className="btn-primary">
              <Save size={15} /> Save Profile
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card card-body">
          <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <User size={16} /> Change Password
          </h2>
          <form id="settings-password-form" onSubmit={handlePassword} className="space-y-4">
            {[
              ['settings-current-pw', 'Current Password', 'currentPassword'],
              ['settings-new-pw',     'New Password',     'newPassword'],
              ['settings-confirm-pw', 'Confirm Password', 'confirmPassword'],
            ].map(([id, label, key]) => (
              <div key={key}>
                <label htmlFor={id} className="label">{label}</label>
                <input
                  id={id} type="password" className="input" placeholder="••••••••"
                  value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
            <button id="change-password-btn" type="submit" className="btn-primary">
              <Save size={15} /> Change Password
            </button>
          </form>
        </div>

        {/* App info */}
        <div className="card card-body">
          <h2 className="font-semibold text-slate-700 mb-3">System Info</h2>
          <div className="space-y-2 text-sm text-slate-500">
            <div className="flex justify-between"><span>Version</span><span className="font-mono">v1.0.0-prototype</span></div>
            <div className="flex justify-between"><span>OCR Engine</span><span>Tesseract OCR</span></div>
            <div className="flex justify-between"><span>Database</span><span>PostgreSQL (Supabase)</span></div>
            <div className="flex justify-between"><span>Storage</span><span>Cloudinary (free tier)</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
