import { Navigate, Route, Routes } from 'react-router-dom';
import RequireAuth from './components/auth/RequireAuth';
import AppLayout from './components/layout/AppLayout';
import AuthPage from './pages/AuthPage';
import BookingsPage from './pages/BookingsPage';
import CartPage from './pages/CartPage';
import CreateVenuePage from './pages/CreateVenuePage';
import NotFoundPage from './pages/NotFoundPage';
import OwnerBookingsPage from './pages/OwnerBookingsPage';
import ProfilePage from './pages/ProfilePage';
import VenueAvailabilityPage from './pages/VenueAvailabilityPage';
import VenuesPage from './pages/VenuesPage';
import { useAuth } from './hooks/useAuth';

function App() {
  const { isAuthenticated, role } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/venues' : '/auth'} replace />}
      />

      <Route
        path="/auth"
        element={isAuthenticated ? <Navigate to="/venues" replace /> : <AuthPage />}
      />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/venues" element={<VenuesPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        <Route
          path="/venues/:id/availability"
          element={
            <RequireAuth role="BOOKER">
              <VenueAvailabilityPage />
            </RequireAuth>
          }
        />

        <Route
          path="/cart"
          element={
            <RequireAuth role="BOOKER">
              <CartPage />
            </RequireAuth>
          }
        />

        <Route
          path="/bookings"
          element={
            <RequireAuth role="BOOKER">
              <BookingsPage />
            </RequireAuth>
          }
        />

        <Route
          path="/owner/venues/create"
          element={
            <RequireAuth role="OWNER">
              <CreateVenuePage />
            </RequireAuth>
          }
        />

        <Route
          path="/owner/bookings"
          element={
            <RequireAuth role="OWNER">
              <OwnerBookingsPage />
            </RequireAuth>
          }
        />
      </Route>

      <Route
        path="*"
        element={
          role ? (
            <RequireAuth>
              <NotFoundPage />
            </RequireAuth>
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
