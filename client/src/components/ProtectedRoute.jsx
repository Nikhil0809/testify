import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FullScreenLoader from './Loader';

// role: optional 'admin' requirement
const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, initializing, user } = useAuth();
  const location = useLocation();

  if (initializing) return <FullScreenLoader label="Restoring session" />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user?.role !== role) return <Navigate to="/dashboard" replace />;

  return children;
};

export default ProtectedRoute;
