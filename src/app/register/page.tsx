'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setAuthSession } from '../../lib/api';
import { UserPlus, User, Mail, Lock, Globe, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('BD');
  const [languagePreference, setLanguagePreference] = useState('EN');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.register({
        username,
        email,
        password,
        country,
        languagePreference,
      });
      setAuthSession(res.user, res.accessToken);
      router.push('/practice');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-surface/90 p-8 shadow-2xl backdrop-blur-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/25">
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold text-text">Create Racer Account</h2>
          <p className="mt-1 text-xs text-text-muted">Register to compete in live multiplayer and official tournaments.</p>
        </div>

        {error && (
          <div className="mt-4 flex items-center space-x-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs font-semibold text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-text">Racer Handle (Username)</label>
            <div className="relative mt-1">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-text-muted" />
              <input
                type="text"
                required
                minLength={3}
                maxLength={20}
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="CyberDrifter"
                className="w-full rounded-xl border border-white/10 bg-surface-dark px-10 py-2.5 text-xs text-text focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text">Email Address</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="racer@keyrush.io"
                className="w-full rounded-xl border border-white/10 bg-surface-dark px-10 py-2.5 text-xs text-text focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text">Password (min 8 chars)</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-text-muted" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-surface-dark px-10 py-2.5 text-xs text-text focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text">Country</label>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-surface-dark px-3 py-2 text-xs text-text focus:border-primary focus:outline-none"
              >
                <option value="BD">Bangladesh 🇧🇩</option>
                <option value="US">United States 🇺🇸</option>
                <option value="GB">United Kingdom 🇬🇧</option>
                <option value="IN">India 🇮🇳</option>
                <option value="CA">Canada 🇨🇦</option>
                <option value="AU">Australia 🇦🇺</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-text">Typing Language</label>
              <select
                value={languagePreference}
                onChange={e => setLanguagePreference(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-surface-dark px-3 py-2 text-xs text-text focus:border-primary focus:outline-none"
              >
                <option value="EN">English</option>
                <option value="BN">বাঙলা (Bangla)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 disabled:opacity-50 transition-all"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-text-muted">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-accent hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
