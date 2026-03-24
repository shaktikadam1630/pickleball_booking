import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '../components/common/Alert';
import { useAuth } from '../hooks/useAuth';

const initialRegisterState = {
  name: '',
  email: '',
  password: '',
  mobile: '',
  role: 'BOOKER'
};

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [tab, setTab] = useState('login');
  const [loginState, setLoginState] = useState({ email: '', password: '' });
  const [registerState, setRegisterState] = useState(initialRegisterState);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submitLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await login(loginState.email.trim(), loginState.password);
      navigate('/venues');
    } catch (apiError) {
      setError(apiError.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await register({
        ...registerState,
        name: registerState.name.trim(),
        email: registerState.email.trim()
      });

      setMessage('Registration successful. Please login with your credentials.');
      setRegisterState(initialRegisterState);
      setTab('login');
    } catch (apiError) {
      setError(apiError.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(140deg,_#062b24_0%,_#0d5a49_45%,_#eefdf6_100%)] p-4 sm:p-8">
      <div className="pointer-events-none absolute -top-20 -right-16 h-72 w-72 rounded-full bg-emerald-300/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-4 -left-20 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl" />

      <div className="mx-auto grid max-w-6xl gap-8 rounded-[2rem] border border-white/20 bg-white/95 p-5 shadow-[0_30px_80px_rgba(7,30,24,0.35)] backdrop-blur sm:grid-cols-[1.2fr_1fr] sm:p-8">
        <section className="relative overflow-hidden rounded-[1.5rem] bg-[linear-gradient(140deg,_#102f3b,_#152a47_45%,_#224f5a)] p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-brand-300/30 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-28 w-full bg-gradient-to-t from-black/15 to-transparent" />

          <p className="text-xs uppercase tracking-[0.2em] text-brand-100">Court Management</p>
          <h1 className="relative mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            Book pickleball slots in minutes.
          </h1>
          <p className="relative mt-4 max-w-xl text-slate-200">
            Booker accounts can discover venues, reserve slots, manage cart, checkout and reschedule bookings.
            Owner accounts can view booking traffic for all their venues.
          </p>
          <div className="relative mt-8 grid gap-3 text-sm text-slate-100 sm:grid-cols-2">
            <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur">Real-time slot availability</div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur">10-minute cart hold flow</div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur">Secure JWT auth roles</div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur">Owner booking insights</div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-inner sm:p-5">
          <div className="mb-5 flex rounded-full border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              className={`w-1/2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                tab === 'login' ? 'bg-white text-ink-900 shadow-md' : 'text-slate-600'
              }`}
              onClick={() => setTab('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`w-1/2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                tab === 'register' ? 'bg-white text-ink-900 shadow-md' : 'text-slate-600'
              }`}
              onClick={() => setTab('register')}
            >
              Register
            </button>
          </div>

          <div className="space-y-3">
            <Alert type="success" message={message} />
            <Alert type="error" message={error} />
          </div>

          {tab === 'login' ? (
            <form onSubmit={submitLogin} className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  required
                  value={loginState.email}
                  onChange={(event) => setLoginState((s) => ({ ...s, email: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none ring-brand-500 transition focus:border-brand-400 focus:bg-white focus:ring-2"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
                <input
                  type="password"
                  required
                  value={loginState.password}
                  onChange={(event) => setLoginState((s) => ({ ...s, password: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none ring-brand-500 transition focus:border-brand-400 focus:bg-white focus:ring-2"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:-translate-y-0.5 hover:from-brand-700 hover:to-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Please wait...' : 'Login'}
              </button>
            </form>
          ) : (
            <form onSubmit={submitRegister} className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Name</span>
                <input
                  type="text"
                  required
                  value={registerState.name}
                  onChange={(event) => setRegisterState((s) => ({ ...s, name: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none ring-brand-500 transition focus:border-brand-400 focus:bg-white focus:ring-2"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  required
                  value={registerState.email}
                  onChange={(event) => setRegisterState((s) => ({ ...s, email: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none ring-brand-500 transition focus:border-brand-400 focus:bg-white focus:ring-2"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
                <input
                  type="password"
                  minLength={6}
                  required
                  value={registerState.password}
                  onChange={(event) => setRegisterState((s) => ({ ...s, password: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none ring-brand-500 transition focus:border-brand-400 focus:bg-white focus:ring-2"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Mobile</span>
                <input
                  type="tel"
                  pattern="[6-9][0-9]{9}"
                  required
                  value={registerState.mobile}
                  onChange={(event) => setRegisterState((s) => ({ ...s, mobile: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none ring-brand-500 transition focus:border-brand-400 focus:bg-white focus:ring-2"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Role</span>
                <select
                  value={registerState.role}
                  onChange={(event) => setRegisterState((s) => ({ ...s, role: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none ring-brand-500 transition focus:border-brand-400 focus:bg-white focus:ring-2"
                >
                  <option value="BOOKER">BOOKER</option>
                  <option value="OWNER">OWNER</option>
                </select>
              </label>
              <button
                type="submit"
                disabled={loading}
                className="sm:col-span-2 rounded-xl bg-gradient-to-r from-ink-900 to-slate-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-800/20 transition hover:-translate-y-0.5 hover:from-ink-700 hover:to-slate-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Please wait...' : 'Create Account'}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};

export default AuthPage;
