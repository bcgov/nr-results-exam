import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';

interface ProtectedRouteProps {
  requireAuth?: boolean;
  requiredRoles?: string[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectTo = '/'
}) => {
  const { isLoggedIn, isLoading, logout } = useAuth();
  const location = useLocation();

  // Check if we're in an OAuth callback (URL contains authorization code)
  // This happens when Cognito redirects back after authentication
  const urlParams = new URLSearchParams(location.search);
  const isOAuthCallback = urlParams.has('code') || urlParams.has('state');

  // If we're still loading auth state, wait (don't redirect yet)
  // This is critical during OAuth callback - we need to wait for fetchAuthSession()
  // to exchange the authorization code for tokens
  if (isLoading) {
    return null; // Render nothing while loading (or could show a loading spinner)
  }

  // If we're in an OAuth callback but not logged in yet, wait a bit more
  // The AuthProvider should be processing the callback, but we need to give it time
  if (isOAuthCallback && !isLoggedIn) {
    // Still processing the callback - don't redirect yet
    return null;
  }

  // Only redirect/logout if we're definitely not authenticated and NOT in a callback
  // During OAuth callback, we should wait for the token exchange to complete
  if (!isLoggedIn && !isOAuthCallback) {
    logout();
    return <Navigate to={redirectTo} replace />;
  }

  // If all checks pass, render child routes
  return <Outlet />;
};

export default ProtectedRoute;
