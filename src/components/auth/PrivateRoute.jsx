import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function PrivateRoute({ children }) {
  const { currentUser, isAdmin } = useAuth();

  if (!currentUser) {
    // Redirect to the login page if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin()) {
    // Redirect to login if user is not admin
    return <Navigate to="/login" replace />;
  }

  return children;
}
