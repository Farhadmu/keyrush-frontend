'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { api } from '../../lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword({ token, newPassword: password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Password reset failed. Token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <div className="glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-black text-text">Choose New Password</h1>
          <p className="text-xs text-text-muted">
            Set your new secure password using Argon2id protected credential storage.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-xs font-semibold text-danger flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="space-y-4 text-center">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-xs text-emerald-300 space-y-2">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
              <div className="font-bold text-sm">Password Successfully Reset!</div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Your credentials have been securely updated and previous active sessions have been invalidated for your safety.
              </p>
            </div>

            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95"
            >
              <span>Sign In with New Password</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text block mb-1">Reset Token</label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token or follow email link"
                className="w-full rounded-xl border border-white/10 bg-surface px-4 py-2.5 text-xs font-mono text-text focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text block mb-1">New Password (Min 8 Chars)</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-white/10 bg-surface px-4 py-2.5 text-xs text-text focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text block mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-white/10 bg-surface px-4 py-2.5 text-xs text-text focus:border-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token || !password || !confirmPassword}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 disabled:opacity-40 transition-all"
            >
              {loading ? 'Encrypting & Updating...' : 'Reset Password'}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center space-x-1.5 text-xs text-text-muted hover:text-text"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
