import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const linkClassName = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
    isActive
      ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/30'
      : 'bg-white/65 text-ink-700 hover:-translate-y-0.5 hover:bg-white hover:shadow-md'
  }`;

const AppLayout = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const displayName =
    user?.name || user?.email?.split('@')[0] || 'User';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!profileRef.current?.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <div className="relative min-h-screen bg-[linear-gradient(130deg,_#e8fff4_0%,_#f3fbff_32%,_#f9f8ff_100%)]">

      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/70 border-b border-white/40 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>

            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-green-600 to-emerald-400 bg-clip-text text-transparent">
              Pickleball Booking
            </h1>
          </div>

          <nav className="flex items-center gap-2 bg-white/60 backdrop-blur px-2 py-1.5 rounded-full shadow-sm border border-white/40">

            <NavLink to="/venues" className={linkClassName}>
              Venues
            </NavLink>

            {role === 'BOOKER' && (
              <>
                <NavLink to="/cart" className={linkClassName}>
                  Cart
                </NavLink>
                <NavLink to="/bookings" className={linkClassName}>
                  Bookings
                </NavLink>
              </>
            )}

            {role === 'OWNER' && (
              <>
                <NavLink to="/owner/venues/create" className={linkClassName}>
                  Create Venue
                </NavLink>
                <NavLink to="/owner/bookings" className={linkClassName}>
                  Owner Bookings
                </NavLink>
              </>
            )}
          </nav>

          <div ref={profileRef} className="relative">
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-full border border-white/50 bg-white/80 px-3 py-2 shadow-sm hover:shadow-md transition"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-400 text-white font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>

              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-900">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500">{role}</p>
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-white shadow-xl border p-4">

                <p className="text-xs text-gray-500">Profile</p>

                <p className="mt-2 font-semibold">{displayName}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>

                <div className="mt-3 text-sm">
                  <p><b>Role:</b> {role}</p>
                  <p><b>Mobile:</b> {user?.mobile || '-'}</p>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="mt-4 block w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  View Profile
                </Link>

                <button
                  onClick={onLogout}
                  className="mt-2 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>

    </div>
  );
};

export default AppLayout;