// src/Navigation.tsx
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import B8Marketing from '../pages/businessPages/B8Marketing';
import BGr8 from '../pages/businessPages/BGr8';
import B8CarClub from '../pages/businessPages/B8CarClub';
import B8Clothing from '../pages/businessPages/B8Clothing';
import B8League from '../pages/businessPages/B8League';
import B8Charity from '../pages/businessPages/B8Charity';
import B8Education from '../pages/businessPages/B8Education';
import B8Careers from '../pages/businessPages/B8Careers';
import NotFound from '../pages/NotFound';
import SignInPage from '../pages/authPages/SignInPage';
import RegisterPage from '../pages/authPages/RegisterPage';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Profile from '../pages/utilPages/Profile';
import Settings from '../pages/utilPages/Settings';
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
      <Route path="/b8-league" element={<B8League />} />
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
