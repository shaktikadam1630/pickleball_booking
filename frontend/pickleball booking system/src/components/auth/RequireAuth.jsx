import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const RequireAuth = ({ children, role }) => {
  const { isAuthenticated, role: currentRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (role && role !== currentRole) {
    return <Navigate to="/venues" replace />;
  }

  return children;
};

export default RequireAuth;
