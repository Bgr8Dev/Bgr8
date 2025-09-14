// src/Navigation.tsx
import { Routes, Route } from 'react-router-dom';
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
import Success from '../pages/Success';
import Cancel from '../pages/Cancel';
import { AuthLock } from '../components/auth/AuthLock';
import PrivacyPolicy from '../pages/utilPages/PrivacyPolicy';
import TermsOfService from '../pages/utilPages/TermsOfService';
import AmbassadorPage from '../pages/utilPages/AmbassadorPage';

export default function Navigation() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route path="/" element={<BGr8 />} />
      <Route path="/bgr8" element={<BGr8 />} />
      <Route 
        path="/dashboard" 
        element={
          <AuthLock fallbackMessage="You need to be signed in to access the mentor dashboard.">
            <MentorPage />
          </AuthLock>
        } 
      />
      <Route 
        path="/sessions" 
        element={
          <AuthLock fallbackMessage="You need to be signed in to view your sessions.">
            <SessionsPage />
          </AuthLock>
        } 
      />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route 
        path="/profile" 
        element={
          <AuthLock fallbackMessage="You need to be signed in to view your profile.">
            <Profile />
          </AuthLock>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <AuthLock fallbackMessage="You need to be signed in to access settings.">
            <Settings />
          </AuthLock>
        } 
      />
      <Route 
        path="/feedback/:bookingId" 
        element={
          <AuthLock fallbackMessage="You need to be signed in to provide feedback.">
            <FeedbackPage />
          </AuthLock>
        } 
      />
      <Route 
        path="/admin-portal" 
        element={
          <AuthLock 
            requiredPermission="admin"
            fallbackMessage="Admin privileges are required to access this page."
          >
            <AdminPortal />
          </AuthLock>
        } 
      />
      <Route path="*" element={<NotFound />} /> {/* Handles undefined routes */}
      <Route path="/success" element={<Success />} />
      <Route path="/cancel" element={<Cancel />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/ambassador" element={<AmbassadorPage />} />
    </Routes>
  );
}
