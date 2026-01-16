'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function RegisterForm() {
  const [step, setStep] = useState(1); // 1: Enter invite code, 2: Register, 3: Success
  const [inviteCode, setInviteCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 1: Verify invite code
  const verifyInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Verify invite code using our API
      const response = await fetch('/api/auth/register/verify-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitation_code: inviteCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid or expired invite code');
      }

      // If invite code is valid, proceed to registration
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to verify invite code');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Register user with mobile-like fields
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate form
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (!name || name.length < 2) {
      setError('Name must be at least 2 characters long');
      setLoading(false);
      return;
    }

    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      setLoading(false);
      return;
    }

    if (!idNumber || idNumber.length < 5) {
      setError('Please enter a valid ID or passport number');
      setLoading(false);
      return;
    }

    try {
      // Register user using our API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          name,
          phone,
          id_number: idNumber,
          invitation_code: inviteCode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Registration successful!');
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card bg-[var(--surface)] p-10 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-semibold mb-8 text-center text-[var(--text-primary)]">Create Account</h2>

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

        {/* Step 1: Enter Invite Code */}
        {step === 1 && (
          <form onSubmit={verifyInviteCode}>
            <div className="mb-6">
              <label htmlFor="inviteCode" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                邀请码
              </label>
              <input
                type="text"
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="输入您的邀请码"
                className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] text-[var(--text-primary)]"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:transform-none"
              disabled={loading}
            >
              {loading ? '验证中...' : '验证邀请码'}
            </button>
          </form>
        )}

        {/* Step 2: Register */}
        {step === 2 && (
          <>
            <form onSubmit={handleRegister}>
              <div className="mb-6">
                <label htmlFor="name" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  姓名
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入您的姓名"
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] text-[var(--text-primary)]"
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-6">
                <label htmlFor="idNumber" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  身份证/护照号码
                </label>
                <input
                  type="text"
                  id="idNumber"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="请输入您的身份证或护照号码"
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] text-[var(--text-primary)]"
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-6">
                <label htmlFor="phone" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  手机号码
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入您的手机号码"
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
                    placeholder="创建密码"
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

              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  确认密码
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="确认您的密码"
                    className="w-full px-4 py-3 pr-12 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] text-[var(--text-primary)]"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    disabled={loading}
                  >
                    {showConfirmPassword ? '👁️‍🗨️' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="inviteCode" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  邀请码
                </label>
                <input
                  type="text"
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="输入您的邀请码"
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] text-[var(--text-primary)] opacity-70"
                  required
                  disabled={loading}
                  readOnly
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:transform-none"
                disabled={loading}
              >
                {loading ? '注册中...' : '创建账户'}
              </button>
            </form>
          </>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold mb-3 text-[var(--text-primary)]">注册成功!</h3>
            <p className="mb-6 text-[var(--text-secondary)]">请查收邮件以验证您的账户。</p>
            <button
              onClick={() => {
                // Reset form
                setStep(1);
                setInviteCode('');
                setName('');
                setPhone('');
                setIdNumber('');
                setPassword('');
                setConfirmPassword('');
                setSuccess('');
                setError('');
              }}
              className="bg-[var(--secondary)] text-white py-3 px-6 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              注册另一个账户
            </button>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-[var(--text-secondary)]">
          已经有账户?
          <a href="/login" className="text-[var(--primary)] hover:underline ml-1 font-medium">
            登录
          </a>
        </div>
      </div>
    </div>
  );
}