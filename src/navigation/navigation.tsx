// src/Navigation.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import B8Marketing from '../pages/businessPages/B8Marketing';
import BGr8 from '../pages/businessPages/BGr8';
import B8CarClub from '../pages/businessPages/B8CarClub';
import B8Clothing from '../pages/businessPages/B8Clothing';
import B8League from '../pages/businessPages/B8League';
import B8World from '../pages/businessPages/B8World';
import NotFound from '../pages/NotFound';
import SignInPage from '../pages/authPages/SignInPage';
import RegisterPage from '../pages/authPages/RegisterPage';
import ForgotPasswordPage from '../pages/authPages/ForgotPasswordPage';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/animations/LoadingSpinner';
import Profile from '../pages/utilPages/Profile';
import Settings from '../pages/utilPages/Settings';
import AdminPortal from '../pages/AdminPortal';
import React from 'react';
import { UserProfile } from '../utils/userProfile';
import Bgr8r from '../pages/businessPages/Bgr8r';
import B8Podcast from '../pages/businessPages/B8Podcast';

// Video Library
// import VideoLibrary from '../pages/VideosLibrary';
// import VideoUploadPage from '../pages/VideoUploadPage';
// import VideoPlayer from '../pages/VideoPlayer';

// Profiles
// import MyProfile from '../pages/profile/MyProfile';
// import ManageProfiles from '../pages/profile/ManageProfiles';
// import ForgotPassword from '../pages/auth/ForgotPassword';
// import Error404 from '../pages/errors/Error404';
// import Error403 from '../pages/errors/Error403';
// import Team from '../pages/Team';
// import UserDetails from '../pages/UserDetails';

// Business Pages
// import B8CryptoCurrency from '../pages/businessPages/B8CryptoCurrency';
// import B8Metaverse from '../pages/businessPages/B8Metaverse';
// import B8WorldEntertainment from '../pages/businessPages/B8WorldEntertainment';

// Admin Portal Pages
// import AdminPortalCrypto from '../pages/adminPages/AdminPortalCrypto';
// import AdminPortalMetaverse from '../pages/adminPages/AdminPortalMetaverse';
// import AdminPortalEntertainment from '../pages/adminPages/AdminPortalEntertainment';
// import AdminPortalB8World from '../pages/adminPages/AdminPortalB8World';
// import AdminPortalLeague from '../pages/adminPages/AdminPortalLeague';

// Social Media
// import SocialFeed from '../pages/SocialFeed';

// Check if the user has the required permission
function hasPermission(userProfile: UserProfile | null, permission: string) {
  if (!userProfile) return false;

  switch (permission) {
    case 'admin':
      return userProfile.admin;
    case 'entertainment':
      return false; // Not currently implemented
    case 'metaverse':
      return false; // Not currently implemented
    case 'crypto':
      return false; // Not currently implemented
    case 'world':
      return userProfile.b8Memberships?.world === true;
    case 'league':
      return userProfile.b8Memberships?.league === true;
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
      <Route path="/" element={<HomePage />} />
      <Route path="/b8-marketing" element={<B8Marketing />} />
      <Route path="/bgr8" element={<BGr8 />} />
      <Route path="/b8-car-club" element={<B8CarClub />} />
      <Route path="/b8-clothing" element={<B8Clothing />} />
      <Route path="/b8-league" element={<B8League />} />
      <Route path="/b8-world" element={<B8World />} />
      <Route path="/bgr8r" element={<Bgr8r />} />
      <Route path="/b8-podcast" element={<B8Podcast />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/register" element={<RegisterPage />} />
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
        path="/admin-portal" 
        element={
          <ProtectedRoute permission="admin">
            <AdminPortal />
          </ProtectedRoute>
        } 
      />
      {/* <Route path="/videos" element={<ProtectedRoute element={<VideoLibrary />} />} />
      <Route path="/video/:id" element={<ProtectedRoute element={<VideoPlayer />} />} />
      <Route path="/upload" element={<ProtectedRoute element={<VideoUploadPage />} />} />
      <Route path="/social" element={<ProtectedRoute element={<SocialFeed />} />} />
      <Route path="/team" element={<ProtectedRoute element={<Team />} />} />
      <Route path="/user/:id" element={<ProtectedRoute element={<UserDetails />} />} />
      <Route path="/b8-cryptocurrency" element={<ProtectedRoute element={<B8CryptoCurrency />} permission="crypto" />} />
      <Route path="/b8-metaverse" element={<ProtectedRoute element={<B8Metaverse />} permission="metaverse" />} />
      <Route path="/b8-entertainment" element={<ProtectedRoute element={<B8WorldEntertainment />} permission="entertainment" />} />
      <Route path="/b8-world" element={<ProtectedRoute element={<B8World />} permission="world" />} />
      <Route path="/admin" element={<ProtectedRoute element={<AdminPortal />} permission="admin" />} />
      <Route path="/admin/manage-profiles" element={<ProtectedRoute element={<ManageProfiles />} permission="admin" />} />
      <Route path="/admin/crypto" element={<ProtectedRoute element={<AdminPortalCrypto />} permission="admin" />} />
      <Route path="/admin/metaverse" element={<ProtectedRoute element={<AdminPortalMetaverse />} permission="admin" />} />
      <Route path="/admin/entertainment" element={<ProtectedRoute element={<AdminPortalEntertainment />} permission="admin" />} />
      <Route path="/admin/world" element={<ProtectedRoute element={<AdminPortalB8World />} permission="admin" />} />
      <Route path="/admin/league" element={<ProtectedRoute element={<AdminPortalLeague />} permission="admin" />} /> */}
      <Route path="*" element={<NotFound />} /> {/* Handles undefined routes */}
    </Routes>
  );
}
