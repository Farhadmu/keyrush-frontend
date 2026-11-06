'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { api } from '../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.forgotPassword(email);
      setSubmitted(true);
      // In development mode, backend might return debug resetToken
      if (res?.resetToken) {
        setResetToken(res.resetToken);
      }
    } catch (err: any) {
      setError(err.message || 'Password reset request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <div className="glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-black text-text">Reset Password</h1>
          <p className="text-xs text-text-muted">
            Enter your verified racer email address and we will dispatch a secure reset credential.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-xs font-semibold text-danger flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-xs text-emerald-300 space-y-2">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
              <div className="font-bold text-sm">Dispatched Successfully</div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                If an active KEYRUSH account is registered to <strong>{email}</strong>, a recovery token has been generated. Check your inbox and follow the secure instructions.
              </p>
            </div>

            {resetToken && (
              <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-left font-mono text-xs space-y-2">
                <span className="text-warning font-bold uppercase text-[10px]">Dev Environment Debug Token:</span>
                <div className="truncate text-text text-[11px] bg-surface-dark p-2 rounded-lg">{resetToken}</div>
                <Link
                  href={`/reset-password?token=${resetToken}`}
                  className="block text-accent underline font-bold text-[11px]"
                >
                  Proceed to Reset Form →
                </Link>
              </div>
            )}

            <Link
              href="/login"
              className="inline-flex items-center space-x-2 text-xs font-bold text-primary hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Sign In</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="racer@example.com"
                className="w-full rounded-xl border border-white/10 bg-surface px-4 py-2.5 text-xs text-text focus:border-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 disabled:opacity-40 transition-all"
            >
              {loading ? 'Transmitting Request...' : 'Send Recovery Token'}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center space-x-1.5 text-xs text-text-muted hover:text-text"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
