import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { GlobalPageLoader } from './GlobalPageLoader.jsx';

export const ProtectedAdminRoute = () => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <GlobalPageLoader message="Verifying Admin Session..." />;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
