import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  if (isAuthenticated) return children;
  const from = location.pathname + location.search + location.hash;
  return <Navigate to="/login" replace state={{ from }} />;
};

export default ProtectedRoute;
