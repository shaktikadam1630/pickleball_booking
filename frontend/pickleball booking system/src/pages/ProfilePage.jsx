import { useEffect, useState } from 'react';
import Alert from '../components/common/Alert';
import PageHeader from '../components/common/PageHeader';
import { changePassword, updateMyProfile } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';

const ProfilePage = () => {
  const { token, user, updateSession } = useAuth();

  const [formState, setFormState] = useState({
    name: '',
    email: '',
    role: 'BOOKER'
  });

  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!user) return;

    setFormState({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'BOOKER'
    });
  }, [user]);

  const onChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await updateMyProfile({
        payload: {
          name: formState.name.trim(),
          email: formState.email.trim(),
          role: formState.role,
        },
        token
      });

      updateSession({ token: data.token, user: data.user });
      setMessage('Profile updated successfully');
    } catch (apiError) {
      setError(apiError.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (!passwordState.currentPassword || !passwordState.newPassword || !passwordState.confirmPassword) {
      setPasswordError('All password fields are required.');
      return;
    }

    if (passwordState.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (passwordState.newPassword !== passwordState.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword({
        payload: {
          currentPassword: passwordState.currentPassword,
          newPassword: passwordState.newPassword,
        },
        token,
      });

      setPasswordMessage('Password changed successfully.');
      setPasswordState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (apiError) {
      setPasswordError(apiError.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader title="My Profile" subtitle="Manage your account and security settings." />

      <Alert type="success" message={message} />
      <Alert type="error" message={error} />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg">
            <svg viewBox="0 0 24 24" className="h-12 w-12 fill-current" aria-hidden="true">
              <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
            </svg>
          </div>
          <p className="mt-4 text-center text-lg font-bold text-slate-900">{user?.name || 'User'}</p>
          <p className="text-center text-sm text-slate-500">{user?.email || '-'}</p>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="flex items-center justify-between">
              <span className="font-semibold">Role</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                {user?.role || '-'}
              </span>
            </p>
          </div>
        </aside>

        <div className="space-y-6">
          <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                  <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
                </svg>
              </span>
              <h2 className="text-lg font-semibold text-slate-900">Profile Details</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Full Name</span>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(e) => onChange('name', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(e) => onChange('email', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  required
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Role</span>
                <select
                  value={formState.role}
                  onChange={(e) => onChange('role', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="BOOKER">BOOKER</option>
                  <option value="OWNER">OWNER</option>
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-emerald-700 to-teal-500 px-4 py-3 font-semibold text-white shadow-md transition hover:from-emerald-800 hover:to-teal-600 disabled:opacity-60"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>

          <form onSubmit={onChangePassword} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                  <path d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm-6 7.73V17a1 1 0 0 0 2 0v-1.27a2 2 0 1 0-2 0zM10 8V6a2 2 0 0 1 4 0v2z" />
                </svg>
              </span>
              <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
            </div>

            <Alert type="success" message={passwordMessage} />
            <Alert type="error" message={passwordError} />

            <div className="grid grid-cols-1 gap-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Current Password</span>
                <input
                  type="password"
                  value={passwordState.currentPassword}
                  onChange={(e) => setPasswordState((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">New Password</span>
                <input
                  type="password"
                  minLength={6}
                  value={passwordState.newPassword}
                  onChange={(e) => setPasswordState((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Confirm New Password</span>
                <input
                  type="password"
                  minLength={6}
                  value={passwordState.confirmPassword}
                  onChange={(e) => setPasswordState((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  required
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 px-4 py-3 font-semibold text-white shadow-md transition hover:from-amber-700 hover:to-orange-600 disabled:opacity-60"
            >
              {passwordLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;