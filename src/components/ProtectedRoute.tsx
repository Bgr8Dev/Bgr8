import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './animations/LoadingSpinner';
import { hasRole } from '../utils/userProfile';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/signin" />;
  }

  // TEMPORARY: Allow admin access to anyone for role reset
  // if (requireAdmin && !hasRole(userProfile, 'admin')) {
  //   return <Navigate to="/" />;
  // }

  return <>{children}</>;
} 