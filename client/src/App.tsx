// Description: Main application file, sets up routing and initializes axios with authentication headers.
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import HomePage from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { OAuthSuccessPage } from './pages/OAuthSuccessPage';
import RequireAuth from './utils/Auth';

// initialize auth header if token exists
const token = localStorage.getItem('jwtToken');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/oauth-success" element={<OAuthSuccessPage />} />
      {/* Protected */}
      <Route
        path="/*"
        element={
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        }
      />
    </Routes>
  </BrowserRouter>
);

export default App;
