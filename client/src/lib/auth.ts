// Description: This file contains the authentication functions that handles token storage and API requests using Axios.
import { toast } from 'sonner';
import api from './api';

export function logout() {
  localStorage.removeItem('jwtToken');
  window.location.href = '/login';
}

export async function login(data: { email: string; password: string }) {
  const res = await api.post('/auth/login', data);
  const { token } = res.data;
  localStorage.setItem('jwtToken', token);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  toast.success('Logged in successfully');
}

export async function signup(data: { email: string; password: string }) {
  const res = await api.post('/auth/signup', data);
  const { token } = res.data;
  localStorage.setItem('jwtToken', token);
  toast.success('Account created');
}
