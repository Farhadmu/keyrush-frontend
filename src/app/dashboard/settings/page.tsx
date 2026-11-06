'use client';

import React, { useState, useEffect } from 'react';
import { api, getCurrentUser } from '../../../lib/api';
import { Shield, Smartphone, Key, Monitor, LogOut, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [twoFactorSetup, setTwoFactorSetup] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [userRes, sessRes] = await Promise.all([
        api.me(),
        api.getSessions().catch(() => []),
      ]);
      setTwoFactorEnabled(userRes?.user?.twoFactorEnabled || false);
      setSessions(sessRes || []);
    } catch (e) {}
    setLoading(false);
  };

  const handleStart2Fa = async () => {
    try {
      const res = await api.setup2Fa();
      setTwoFactorSetup(res);
    } catch (err: any) {
      alert(err.message || 'Could not initiate 2FA setup');
    }
  };

  const handleConfirm2Fa = async () => {
    try {
      await api.enable2Fa(verificationCode);
      setTwoFactorEnabled(true);
      setTwoFactorSetup(null);
      setMsg('Two-Factor Authentication enabled successfully!');
      setTimeout(() => setMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Invalid 2FA code');
    }
  };

  const handleRevokeSession = async (id: string) => {
    try {
      await api.revokeSession(id);
      setSessions(sessions.filter((s) => s._id !== id));
    } catch (err: any) {
      alert(err.message || 'Could not revoke session');
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('Log out from all active sessions? You will need to log in again.')) return;
    try {
      await api.logoutAll();
      window.location.href = '/login';
    } catch (err: any) {
      alert(err.message || 'Failed to logout from all sessions');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-black font-display text-text">Account Security & Sessions</h1>
          <p className="text-xs text-text-muted">Manage multi-factor authentication, active devices, and session security.</p>
        </div>

        {msg && (
          <div className="flex items-center space-x-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            <CheckCircle2 className="h-4 w-4" />
            <span>{msg}</span>
          </div>
        )}

        {/* 2FA Section */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-text">Two-Factor Authentication (2FA)</h2>
                <p className="text-xs text-text-muted">Require an authenticator app code during sensitive logins.</p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${twoFactorEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-text-muted'}`}>
              {twoFactorEnabled ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>

          {!twoFactorEnabled && !twoFactorSetup && (
            <button
              onClick={handleStart2Fa}
              className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-all"
            >
              Configure Authenticator App
            </button>
          )}

          {twoFactorSetup && (
            <div className="p-4 rounded-xl bg-surface border border-white/10 space-y-4">
              <div className="text-xs text-text-muted">
                Scan the secret or configure your authenticator app (Google Authenticator, Authy):
              </div>
              <div className="p-3 rounded-lg bg-background font-mono text-xs text-accent break-all select-all border border-white/5">
                Secret: {twoFactorSetup.secret}
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-background border border-white/10 text-text text-sm font-mono focus:outline-none focus:border-accent"
                />
                <button
                  onClick={handleConfirm2Fa}
                  className="px-4 py-2 rounded-lg bg-accent text-black font-bold text-xs hover:opacity-90"
                >
                  Verify & Enable
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active Sessions */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary border border-secondary/20">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-text">Active Devices & Sessions</h2>
                <p className="text-xs text-text-muted">Devices currently logged into your account.</p>
              </div>
            </div>

            <button
              onClick={handleLogoutAll}
              className="text-xs text-danger hover:underline font-semibold"
            >
              Log Out All Devices
            </button>
          </div>

          <div className="space-y-3">
            {sessions.map((sess) => (
              <div
                key={sess._id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-surface/60 border border-white/5"
              >
                <div className="flex items-center space-x-3">
                  <Monitor className="h-4 w-4 text-text-muted" />
                  <div>
                    <div className="text-xs font-bold text-text">{sess.userAgent || 'Chrome Browser'}</div>
                    <div className="text-[10px] text-text-muted font-mono">
                      IP: {sess.ipAddress} • Last active: {new Date(sess.lastActiveAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRevokeSession(sess._id)}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-danger/20 hover:text-danger text-xs text-text-muted font-semibold transition-all"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
