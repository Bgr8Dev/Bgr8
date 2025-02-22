// src/Navigation.tsx
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import B8Marketing from '../pages/B8Marketing';
import BGr8 from '../pages/BGr8';
import B8CarClub from '../pages/B8CarClub';
import B8Clothing from '../pages/B8Clothing';
import B8FootballClub from '../pages/B8FootballClub';
import B8Charity from '../pages/B8Charity';
import B8Education from '../pages/B8Education';
import B8Careers from '../pages/B8Careers';
import NotFound from '../pages/NotFound';
import SignInPage from '../pages/SignInPage';
import RegisterPage from '../pages/RegisterPage';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import AdminPortal from '../pages/AdminPortal';
import ProtectedRoute from '../components/ProtectedRoute';
export default function Navigation() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/b8-marketing" element={<B8Marketing />} />
      <Route path="/bgr8" element={<BGr8 />} />
      <Route path="/b8-car-club" element={<B8CarClub />} />
      <Route path="/b8-clothing" element={<B8Clothing />} />
      <Route path="/b8-football-club" element={<B8FootballClub />} />
      <Route path="/b8-charity" element={<B8Charity />} />
      <Route path="/b8-education" element={<B8Education />} />
      <Route path="/b8-careers" element={<B8Careers />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin-portal" 
        element={
          <ProtectedRoute requireAdmin>
            <AdminPortal />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} /> {/* Handles undefined routes */}
    </Routes>
  );
}
