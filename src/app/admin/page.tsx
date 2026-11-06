'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Server,
  Database,
  Radio,
  Users,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  UserX,
  UserCheck,
  Edit,
  Sparkles,
  Lock,
  ChevronRight,
  Activity,
  Flame,
} from 'lucide-react';
import { api, getCurrentUser, UserSession } from '../../lib/api';

export default function AdminPortalPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  // Health state
  const [healthStatus, setHealthStatus] = useState({
    api: 'OPERATIONAL',
    database: 'CONNECTED (MongoDB Atlas)',
    redis: 'CONNECTED (Distributed Rooms)',
    webSockets: 'ACTIVE (Port 3001/4000)',
    activeRacers: 42,
    flaggedRaces: 0,
  });

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        limit: 50,
      });
      setUsers(data?.users || data || []);
    } catch (err: any) {
      // If endpoint requires admin role, we capture error
      setMessage({ text: err.message || 'Could not load administrative user directory.', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      await api.updateUserStatus(user._id || user.id, newStatus);
      setMessage({
        text: `User ${user.username} status updated to ${newStatus}.`,
        error: false,
      });
      loadUsers();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update user status.', error: true });
    }
  };

  const handleChangeRole = async (user: any, newRole: string) => {
    try {
      await api.updateUserRoles(user._id || user.id, [newRole]);
      setMessage({
        text: `User ${user.username} upgraded to ${newRole}.`,
        error: false,
      });
      loadUsers();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update user role.', error: true });
    }
  };

  // Check admin authorization
  const isAdmin =
    currentUser?.roles?.includes('SUPER_ADMIN') ||
    currentUser?.roles?.includes('PLATFORM_MODERATOR') ||
    currentUser?.roles?.includes('ORGANIZATION_ADMIN');

  if (!currentUser || !isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <Lock className="mx-auto h-12 w-12 text-secondary" />
        <h2 className="mt-4 font-display text-2xl font-bold text-text">Administrative Access Required</h2>
        <p className="mt-2 text-xs text-text-muted">
          Your current account role does not have permission to inspect system infrastructure or platform moderation tools.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center space-x-2 rounded-xl bg-surface px-5 py-2.5 text-xs font-semibold text-text hover:bg-surface-light border border-white/10"
        >
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">
            <Shield className="h-3.5 w-3.5" />
            <span>Root Operations & Fair-Play Moderation</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-text">
            Super Admin Control Center
          </h1>
          <p className="mt-1 text-xs text-text-muted">
            Platform health monitoring, scoped RBAC role assignments, and server anti-cheat oversight.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadUsers}
            className="rounded-xl border border-white/10 bg-surface px-4 py-2 text-xs font-mono text-text hover:bg-surface-light"
          >
            Refresh Logs
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold flex items-center space-x-2 ${
            message.error
              ? 'border border-danger/40 bg-danger/10 text-danger'
              : 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
          }`}
        >
          {message.error ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle className="h-4 w-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* SYSTEM INFRASTRUCTURE HEALTH CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-panel rounded-3xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-text-muted flex items-center space-x-1.5">
              <Server className="h-3.5 w-3.5 text-accent" />
              <span>NestJS Core Engine</span>
            </span>
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              HEALTHY
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-text">Fastify / Node 20</div>
          <div className="text-[10px] text-text-muted font-mono">Port: 3001 • Latency: 12ms</div>
        </div>

        <div className="glass-panel rounded-3xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-text-muted flex items-center space-x-1.5">
              <Database className="h-3.5 w-3.5 text-primary" />
              <span>MongoDB Persistence</span>
            </span>
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              CONNECTED
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-text">Mongoose 8 Cluster</div>
          <div className="text-[10px] text-text-muted font-mono">Indexes: Optimal • Strict Limits</div>
        </div>

        <div className="glass-panel rounded-3xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-text-muted flex items-center space-x-1.5">
              <Activity className="h-3.5 w-3.5 text-secondary" />
              <span>Redis Distributed Cache</span>
            </span>
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              ACTIVE
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-text">Distributed Locks</div>
          <div className="text-[10px] text-text-muted font-mono">Rooms: 2-7 Racers • Expiring TTL</div>
        </div>

        <div className="glass-panel rounded-3xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-text-muted flex items-center space-x-1.5">
              <Radio className="h-3.5 w-3.5 text-warning" />
              <span>Anti-Cheat Cadence Monitor</span>
            </span>
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              SHIELD ON
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-text">Zero Injections</div>
          <div className="text-[10px] text-text-muted font-mono">Server Passage Verification</div>
        </div>
      </div>

      {/* USER MANAGEMENT DIRECTORY */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h3 className="font-display text-lg font-bold text-text">Player Directory & RBAC Delegation</h3>
            <p className="text-xs text-text-muted">
              Promote tournament marshals, assign organization administrators, or suspend policy violators.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                placeholder="Search username or email..."
                className="rounded-xl border border-white/10 bg-surface pl-9 pr-4 py-2 text-xs text-text focus:border-primary focus:outline-none w-56"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
              }}
              className="rounded-xl border border-white/10 bg-surface px-3 py-2 text-xs font-mono text-text focus:border-primary focus:outline-none"
            >
              <option value="">All Roles</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              <option value="PLATFORM_MODERATOR">PLATFORM_MODERATOR</option>
              <option value="ORGANIZATION_ADMIN">ORGANIZATION_ADMIN</option>
              <option value="COMPETITION_ADMIN">COMPETITION_ADMIN</option>
              <option value="PLAYER">PLAYER</option>
            </select>

            <button
              onClick={loadUsers}
              className="rounded-xl bg-surface px-4 py-2 text-xs font-bold text-accent hover:bg-surface-light border border-white/10"
            >
              Filter
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-text-muted font-mono uppercase text-[10px]">
                <th className="pb-3">Player Dossier</th>
                <th className="pb-3">Email Address</th>
                <th className="pb-3">Active Roles</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => {
                const isSuspended = u.status === 'SUSPENDED' || u.status === 'BANNED';
                const currentRole = u.roles?.[0] || 'PLAYER';

                return (
                  <tr key={u._id || u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="font-bold text-text flex items-center space-x-2">
                        <span>{u.username}</span>
                        {u.isEmailVerified && (
                          <span title="Verified Email">
                            <CheckCircle className="h-3 w-3 text-emerald-400" />
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-text-dim">ID: {u._id?.slice(-8) || u.id}</div>
                    </td>

                    <td className="py-3.5 pr-4 font-mono text-text-muted">
                      {u.email}
                    </td>

                    <td className="py-3.5 pr-4">
                      <select
                        value={currentRole}
                        onChange={(e) => handleChangeRole(u, e.target.value)}
                        className="rounded-lg border border-white/10 bg-surface px-2 py-1 font-mono text-[11px] text-accent focus:outline-none"
                      >
                        <option value="PLAYER">PLAYER</option>
                        <option value="TEAM_CAPTAIN">TEAM_CAPTAIN</option>
                        <option value="ORGANIZATION_ADMIN">ORGANIZATION_ADMIN</option>
                        <option value="COMPETITION_ADMIN">COMPETITION_ADMIN</option>
                        <option value="PLATFORM_MODERATOR">PLATFORM_MODERATOR</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                    </td>

                    <td className="py-3.5 pr-4 font-mono">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isSuspended
                            ? 'bg-danger/20 text-danger border border-danger/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {u.status || 'ACTIVE'}
                      </span>
                    </td>

                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`inline-flex items-center space-x-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                          isSuspended
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-danger/15 text-danger hover:bg-danger/25'
                        }`}
                      >
                        {isSuspended ? (
                          <>
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Reactivate</span>
                          </>
                        ) : (
                          <>
                            <UserX className="h-3.5 w-3.5" />
                            <span>Suspend</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {users.length === 0 && !loading && (
            <div className="py-12 text-center text-xs text-text-muted">
              No racers found matching search criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
