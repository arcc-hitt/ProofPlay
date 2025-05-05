// Description: This page handles the OAuth success response from the provider.
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

export const OAuthSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('jwtToken', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      toast.success('Logged in successfully!');
      navigate('/', { replace: true });
    } else {
      toast.error('No token returned from provider');
      navigate('/login', { replace: true });
    }
  }, [search, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Processing authentication…</p>
    </div>
  );
};
