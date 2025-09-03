// src/Navigation.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import BGr8 from '../pages/businessPages/BGr8';
import NotFound from '../pages/NotFound';
import SignInPage from '../pages/authPages/SignInPage';
import ForgotPasswordPage from '../pages/authPages/ForgotPasswordPage';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/animations/LoadingSpinner';
import Profile from '../pages/utilPages/Profile';
import Settings from '../pages/utilPages/Settings';
import FeedbackPage from '../pages/utilPages/FeedbackPage';
import AdminPortal from '../pages/AdminPortal';
import MentorPage from '../pages/mentorPages/MentorPage';
import { SessionsPage } from '../pages/SessionsPage';
import React from 'react';
import { UserProfile } from '../utils/userProfile';
import Success from '../pages/Success';
import Cancel from '../pages/Cancel';

// Check if the user has the required permission
function hasPermission(userProfile: UserProfile | null, permission: string) {
  if (!userProfile) return false;

  switch (permission) {
    case 'admin':
      return userProfile.admin;
    default:
      return false;
  }
}

// Protected route component
function ProtectedRoute({ children, permission }: { children: React.ReactNode, permission?: string }) {
  const { currentUser, userProfile } = useAuth();

  // If a permission is specified, check if the user has it
  if (permission && !hasPermission(userProfile, permission)) {
    return <Navigate to="/403" />;
  }

  // If the user is not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/signin" />;
  }

  return <>{children}</>;
}

export default function Navigation() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route path="/" element={<BGr8 />} />
      <Route path="/bgr8" element={<BGr8 />} />
      <Route path="/mentors" element={<MentorPage />} />
      <Route 
        path="/sessions" 
        element={
          <ProtectedRoute>
            <SessionsPage />
          </ProtectedRoute>
        } 
      />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
        path="/feedback/:bookingId" 
        element={
          <ProtectedRoute>
            <FeedbackPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin-portal" 
        element={
          <ProtectedRoute permission="admin">
            <AdminPortal />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} /> {/* Handles undefined routes */}
      <Route path="/success" element={<Success />} />
      <Route path="/cancel" element={<Cancel />} />
    </Routes>
  );
}
