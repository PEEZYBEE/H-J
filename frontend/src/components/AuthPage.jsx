import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaUser, FaLock } from 'react-icons/fa';
import { login, googleAuth } from '../services/api';
import './AuthPage.css';

const AuthPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const googleLoginBtnRef = useRef(null);

  const backendUrl = 'http://localhost:5000';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!googleClientId) {
      setGoogleReady(false);
      return;
    }

    const existingScript = document.getElementById('google-identity-script');
    if (existingScript && window.google?.accounts?.id) {
      setGoogleReady(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleReady(Boolean(window.google?.accounts?.id));
    script.onerror = () => setGoogleReady(false);
    document.body.appendChild(script);
  }, [googleClientId]);

  useEffect(() => {
    if (!googleReady || !googleClientId || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential
    });

    if (googleLoginBtnRef.current) {
      googleLoginBtnRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleLoginBtnRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: 280
      });
    }
  }, [googleReady, googleClientId]);

  const handleGoogleCredential = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setError('Google authentication failed. Please try again.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await googleAuth({
        credential: credentialResponse.credential,
        action: 'login'
      });

      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setSuccess('Google login successful! Redirecting...');

      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.request) {
        setError(`Cannot connect to server at ${backendUrl}. Please check if Flask server is running.`);
      } else {
        setError('Google authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!loginData.username || !loginData.password) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    try {
      const response = await login(loginData);
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setSuccess(`Welcome back, ${response.user.full_name}! Redirecting...`);

      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.request) {
        setError(`Cannot connect to server at ${backendUrl}. Please check if Flask server is running.`);
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert('Forgot password feature coming soon!');
  };

  return (
    <div className="min-h-screen">
      <div className="pt-16">
        <h1 className="text-center text-3xl font-bold text-gray-800">HNj Store</h1>
        <p className="text-center text-gray-600 mt-2">Inventory Management System</p>
      </div>

      <div className="flex-grow">
        <div className="auth-container">
          <div className="form-container">
            <form className="form login-form" onSubmit={handleLogin}>
              <h2>Login</h2>
              <p className="form-subtitle">Welcome back to HNj Store!</p>
              <p className="text-xs text-gray-500 mb-3">Accounts are created by admin only.</p>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="field-group">
                <label className="field-label">Username</label>
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Password</label>
                <div className="password-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showLoginPwd ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    disabled={loading}
                  />
                  <span className="password-toggle" onClick={() => setShowLoginPwd(!showLoginPwd)}>
                    {showLoginPwd ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>

              <button type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <button type="button" className="forgot-password" onClick={handleForgotPassword} disabled={loading}>
                Forgot Password?
              </button>

              <div className="social-login">
                <p>or continue with</p>
                <div ref={googleLoginBtnRef} className="google-btn-container" />
                {!googleReady && googleClientId && (
                  <p className="text-xs text-gray-400 mt-2">Loading Google Sign-In...</p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="pb-6 text-center text-xs text-gray-500">
        <p>HNj Store Management System © 2026</p>
      </div>
    </div>
  );
};

export default AuthPage;