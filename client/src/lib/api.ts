// Description: API configuration for making HTTP requests to the backend server using Axios, includes interceptors for handling authentication tokens and error responses.
import axios from 'axios';
import { toast } from 'sonner';
import { logout } from './auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('jwtToken');
  if (token) config.headers!['Authorization'] = `Bearer ${token}`;
  return config;
});

// Global error handling
api.interceptors.response.use(
  res => res,
  err => {
    const { config, response } = err;
    const url = config.url || '';

    // do not auto-logout on login/signup failures
    if (!url.includes('/auth/login') && !url.includes('/auth/signup')) {
      if (response?.status === 401 || response?.status === 403) {
        toast.error('Session expired, please log in again');
        logout();
      } else if (!response) {
        toast.error('Network error. Check your connection.');
      }
    }
    return Promise.reject(err);
  }
);

export default api;