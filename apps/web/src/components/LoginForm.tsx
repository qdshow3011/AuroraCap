'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginForm() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ loginId, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setSuccess('Login successful! Redirecting...');
      
      // If it's a mock session, save it to localStorage and cookie
      if (data.mockSession) {
        console.log('Saving mock session to localStorage and cookie:', data.data);
        localStorage.setItem('mock_session', JSON.stringify(data.data));
        
        // Set mock session as cookie for middleware access
        document.cookie = `mock_session=${JSON.stringify(data.data)}; path=/; max-age=86400`;
      }
      
      // Get redirect URL from query string, default to /user
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect') || '/user';
      
      // Redirect to the appropriate URL after successful login
      setTimeout(() => {
        console.log(`Redirecting to ${redirectUrl}...`);
        window.location.href = redirectUrl;
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card bg-[var(--surface)] p-10 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-semibold mb-8 text-center text-[var(--text-primary)]">登录</h2>

        {error && (
          <div className="bg-[var(--error)]/10 border border-[var(--error)] text-[var(--error)] px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-[var(--success)]/10 border border-[var(--success)] text-[var(--success)] px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-6">
            <label htmlFor="loginId" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              身份证/护照/手机号码
            </label>
            <input
              type="text"
              id="loginId"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="请输入您的身份证、护照或手机号码"
              className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] text-[var(--text-primary)]"
              required
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              密码
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入您的密码"
                className="w-full px-4 py-3 pr-12 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] text-[var(--text-primary)]"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                disabled={loading}
              >
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:transform-none"
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-[var(--text-secondary)]">
          还没有账户?
          <a href="/register" className="text-[var(--primary)] hover:underline ml-1 font-medium">
            注册
          </a>
        </div>
      </div>
    </div>
  );
}