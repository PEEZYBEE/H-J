// src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  // Check authentication
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // If no token, redirect to auth
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  
  // If user is inactive/blocked
  if (user.is_blocked || !user.is_active) {
    localStorage.clear();
    return <Navigate to="/auth" replace />;
  }
  
  // Check role permissions if specified
  if (allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // Redirect to dashboard if user doesn't have required role
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
};

export default ProtectedRoute;