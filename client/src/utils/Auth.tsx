// Description: RequireAuth component, which checks if a user is authenticated before allowing access to certain routes.
import React, { JSX } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface RequireAuthProps {
  children: JSX.Element;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const token = localStorage.getItem('jwtToken');
  const location = useLocation();

  if (!token) {
    // If no token, redirect to /login, preserving attempted path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAuth;
