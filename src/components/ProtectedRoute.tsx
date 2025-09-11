import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './animations/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth();

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