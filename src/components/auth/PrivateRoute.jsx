import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function PrivateRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // Redirect to the login page if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children;
}
