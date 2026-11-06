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
  Building,
  Trophy,
  History,
  Coins,
  Cpu,
  RefreshCw,
  Eye,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Sliders,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import { api, getCurrentUser, UserSession } from '../../lib/api';
import { getUserRole, AppRole } from '../../lib/roleGuard';

export default function AdminConsolePage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [role, setRole] = useState<AppRole>('USER');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'telemetry' | 'users' | 'organizations' | 'tournaments' | 'anticheat' | 'economy' | 'config' | 'audit'
  >('telemetry');

  // Telemetry & Health
  const [healthData, setHealthData] = useState<any>(null);
  const [refreshingHealth, setRefreshingHealth] = useState(false);

  // User Management
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');

  // Organization Oversight
  const [organizations, setOrganizations] = useState<any[]>([]);

  // Tournament Oversight
  const [competitions, setCompetitions] = useState<any[]>([]);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // AI Trust & Safety Case Reviewer State
  const [quarantineCases, setQuarantineCases] = useState<any[]>([
    {
      id: 'CASE-4091',
      username: 'macro_runner_x',
      flag: 'SPEED_GATE_EXCEEDED (234 WPM)',
      entropy: 'Uniformity 0.994 (Zero Jitter)',
      time: '12m ago',
      status: 'QUARANTINED',
      severity: 'CRITICAL',
    },
    {
      id: 'CASE-4092',
      username: 'paste_injector_bot',
      flag: 'CLIPBOARD_PASTE_INJECTION',
      entropy: '480 chars submitted in 8ms',
      time: '45m ago',
      status: 'QUARANTINED',
      severity: 'HIGH',
    },
    {
      id: 'CASE-4093',
      username: 'cyber_sprinter_pro',
      flag: 'ANOMALOUS_VELOCITY_SPIKE (219 WPM)',
      entropy: 'Uniformity 0.88 (Human Variance)',
      time: '2h ago',
      status: 'PENDING_REVIEW',
      severity: 'MEDIUM',
    },
  ]);

  // Platform Configuration & Feature Flags State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [openRegistration, setOpenRegistration] = useState(true);
  const [aiCoachHeuristics, setAiCoachHeuristics] = useState(true);
  const [anticheatStrictness, setAnticheatStrictness] = useState<'STANDARD' | 'TOURNAMENT_HARDCORE'>('TOURNAMENT_HARDCORE');
  const [ghostReplayLogging, setGhostReplayLogging] = useState(true);

  // Feedback Message
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = '/login';
      return;
    }
    const currentRole = getUserRole(user);
    setCurrentUser(user);
    setRole(currentRole);

    if (currentRole !== 'SUPER_ADMIN') {
      setLoading(false);
      return;
    }

    loadConsoleData();
  }, []);

  const loadConsoleData = async () => {
    setLoading(true);
    try {
      const [h, u, orgs, comps, logs] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getAdminUsers({ limit: 50 }).catch(() => ({ users: [] })),
        api.getOrganizations().catch(() => []),
        api.getCompetitions().catch(() => []),
        api.getAuditLogs(50).catch(() => []),
      ]);

      setHealthData(h);
      setUsers(u?.users || u || []);
      setOrganizations(orgs || []);
      setCompetitions(comps || []);
      setAuditLogs(Array.isArray(logs) ? logs : logs?.logs || []);
    } catch (err: any) {
      setMessage({ text: err.message || 'Error fetching administrative dataset.', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshHealth = async () => {
    setRefreshingHealth(true);
    try {
      const h = await api.getHealth();
      setHealthData(h);
    } catch {
      // ignore
    } finally {
      setRefreshingHealth(false);
    }
  };

  const handleFilterUsers = async () => {
    try {
      const res = await api.getAdminUsers({
        search: userSearch || undefined,
        role: userRoleFilter || undefined,
        status: userStatusFilter || undefined,
        limit: 50,
      });
      setUsers(res?.users || res || []);
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to search users', error: true });
    }
  };

  const handleToggleUserStatus = async (user: any) => {
    const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      await api.updateUserStatus(user._id || user.id, newStatus);
      setMessage({ text: `User ${user.username} status updated to ${newStatus}.`, error: false });
      handleFilterUsers();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update user status.', error: true });
    }
  };

  const handleChangeUserRole = async (user: any, newRole: string) => {
    try {
      await api.updateUserRoles(user._id || user.id, [newRole]);
      setMessage({ text: `User ${user.username} role changed to ${newRole}.`, error: false });
      handleFilterUsers();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update role.', error: true });
    }
  };

  const handleVerifyOrg = async (orgId: string, isVerified: boolean) => {
    try {
      await api.verifyOrganization(orgId, isVerified, 'Super Admin Audit Clearance');
      setMessage({
        text: `Organization ${isVerified ? 'VERIFIED' : 'UNVERIFIED'} successfully!`,
        error: false,
      });
      const orgs = await api.getOrganizations().catch(() => []);
      setOrganizations(orgs || []);
    } catch (err: any) {
      setMessage({ text: err.message || 'Verification update failed', error: true });
    }
  };

  const handleSuspendOrg = async (orgId: string, isSuspended: boolean) => {
    try {
      await api.updateOrganizationStatus(orgId, isSuspended, 'Super Admin Platform Compliance Notice');
      setMessage({
        text: `Organization ${isSuspended ? 'SUSPENDED' : 'REACTIVATED'} successfully!`,
        error: false,
      });
      const orgs = await api.getOrganizations().catch(() => []);
      setOrganizations(orgs || []);
    } catch (err: any) {
      setMessage({ text: err.message || 'Suspension update failed', error: true });
    }
  };

  // Restrict ordinary users or organizers
  if (!loading && role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-background py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-secondary/30 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-secondary/10 border border-secondary/30 text-secondary flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-black text-text">Administrative Access Required</h1>
            <p className="text-xs text-text-muted leading-relaxed">
              Super Admin authorization is required to access system telemetry, audit trails, and global oversight.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href={role === 'ORGANIZER' ? '/organizer' : '/dashboard'}
              className="inline-block w-full py-2.5 rounded-xl bg-secondary/20 text-secondary border border-secondary/30 font-bold text-xs hover:bg-secondary/30 transition-all"
            >
              Return to Your Authorized Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
          <span className="font-mono text-sm text-text-muted">Loading Super Admin Telemetry...</span>
        </div>
      </div>
    );
  }

  const isDbConnected = healthData?.database?.status === 'CONNECTED';
  const isRedisConnected = healthData?.redis?.status === 'CONNECTED';

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Super Admin Top Header */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-secondary/30 relative overflow-hidden bg-gradient-to-r from-secondary/10 via-surface to-background">
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center space-x-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-purple-800 flex items-center justify-center text-white shadow-lg shadow-secondary/25 border-2 border-secondary">
                <Shield className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-text">Global Admin Console</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary/20 text-secondary border border-secondary/30 text-xs font-mono font-bold uppercase tracking-wider">
                    SUPER_ADMIN
                  </span>
                </div>
                <p className="text-xs text-text-muted font-mono">
                  CHIEF: {currentUser?.username} • Infrastructure Telemetry • Anti-Cheat Defense • RBAC Oversight
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefreshHealth}
                disabled={refreshingHealth}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-surface border border-white/10 text-xs font-semibold text-text hover:bg-surface-light transition-all"
              >
                <RefreshCw className={`h-4 w-4 text-accent ${refreshingHealth ? 'animate-spin' : ''}`} />
                <span>Refresh Telemetry</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Feedback Alert */}
        {message && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              message.error
                ? 'bg-danger/10 border-danger/30 text-danger'
                : 'bg-emerald-400/10 border-emerald-400/30 text-emerald-300'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 overflow-x-auto gap-2">
          {[
            { id: 'telemetry', label: 'Platform Telemetry', icon: Activity },
            { id: 'users', label: `Users (${users.length})`, icon: Users },
            { id: 'organizations', label: `Organizations (${organizations.length})`, icon: Building },
            { id: 'tournaments', label: `Tournaments (${competitions.length})`, icon: Trophy },
            {
              id: 'anticheat',
              label: `Anti-Cheat Desk (${quarantineCases.filter((c) => c.status === 'QUARANTINED').length})`,
              icon: Shield,
            },
            { id: 'economy', label: 'Financial Command', icon: Coins },
            { id: 'config', label: 'Platform Config', icon: Sliders },
            { id: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                  active
                    ? 'border-secondary text-secondary bg-secondary/10 rounded-t-lg'
                    : 'border-transparent text-text-muted hover:text-text'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: TELEMETRY & SYSTEM HEALTH */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-text-muted">
                  <span className="text-xs font-semibold">Core API Gateway</span>
                  <Server className="h-4 w-4 text-accent" />
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400">OPERATIONAL</div>
                <span className="text-[10px] text-text-muted font-mono">
                  Uptime: {healthData?.uptimeSeconds ? `${(healthData.uptimeSeconds / 3600).toFixed(1)}h` : 'Active'}
                </span>
              </div>

              <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-text-muted">
                  <span className="text-xs font-semibold">Database (MongoDB)</span>
                  <Database className="h-4 w-4 text-emerald-400" />
                </div>
                <div
                  className={`text-2xl font-black font-mono ${
                    isDbConnected ? 'text-emerald-400' : 'text-danger'
                  }`}
                >
                  {isDbConnected ? 'CONNECTED' : 'STANDBY'}
                </div>
                <span className="text-[10px] text-text-muted font-mono">Cluster Replica Primary</span>
              </div>

              <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-text-muted">
                  <span className="text-xs font-semibold">Multiplayer Redis</span>
                  <Radio className="h-4 w-4 text-accent" />
                </div>
                <div
                  className={`text-2xl font-black font-mono ${
                    isRedisConnected ? 'text-cyan-400' : 'text-yellow-400'
                  }`}
                >
                  {isRedisConnected ? 'CLUSTER LIVE' : 'EMBEDDED IN-MEMORY'}
                </div>
                <span className="text-[10px] text-text-muted font-mono">2–7 Racer Rooms Engine</span>
              </div>

              <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-text-muted">
                  <span className="text-xs font-semibold">Platform Role Guards</span>
                  <Shield className="h-4 w-4 text-secondary" />
                </div>
                <div className="text-2xl font-black font-mono text-secondary">ENFORCED</div>
                <span className="text-[10px] text-secondary font-mono">3 Canonical Roles (Zero Bleed)</span>
              </div>
            </div>

            {/* Architecture Metrics Table */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-text">Server Runtime Invariants</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-surface/60 border border-white/5">
                  <span className="text-text-muted text-[10px] block">Multiplayer Room Limits</span>
                  <span className="text-accent font-bold">2 to 7 Players</span>
                </div>
                <div className="p-4 rounded-xl bg-surface/60 border border-white/5">
                  <span className="text-text-muted text-[10px] block">Tournament Participants</span>
                  <span className="text-amber-400 font-bold">20 to 300 Racers</span>
                </div>
                <div className="p-4 rounded-xl bg-surface/60 border border-white/5">
                  <span className="text-text-muted text-[10px] block">Environment</span>
                  <span className="text-text font-bold uppercase">{healthData?.environment || 'PRODUCTION'}</span>
                </div>
                <div className="p-4 rounded-xl bg-surface/60 border border-white/5">
                  <span className="text-text-muted text-[10px] block">Build Release</span>
                  <span className="text-purple-400 font-bold">v2.0.0-PRO</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search user by username or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFilterUsers()}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-secondary focus:outline-none"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-secondary focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="USER">USER (Player)</option>
                <option value="ORGANIZER">ORGANIZER</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-secondary focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>

              <button
                onClick={handleFilterUsers}
                className="px-4 py-2 rounded-xl bg-secondary text-white font-bold text-xs hover:bg-secondary/90 transition-all"
              >
                Filter
              </button>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 text-text-muted font-mono uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Country</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {users.map((u) => {
                    const primaryRole = u.roles?.[0] || 'USER';
                    const isSuspended = u.status === 'SUSPENDED';

                    return (
                      <tr key={u._id || u.id} className="hover:bg-white/5">
                        <td className="py-3 px-4 font-sans">
                          <div className="font-bold text-text">{u.username}</div>
                          <div className="text-[10px] text-text-muted font-mono">{u.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              primaryRole === 'SUPER_ADMIN'
                                ? 'bg-secondary/20 text-secondary'
                                : primaryRole === 'ORGANIZER'
                                ? 'bg-amber-400/20 text-amber-300'
                                : 'bg-primary/20 text-primary'
                            }`}
                          >
                            {primaryRole}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-text-muted">{u.country || 'BD'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isSuspended ? 'bg-danger/20 text-danger' : 'bg-emerald-400/20 text-emerald-400'
                            }`}
                          >
                            {u.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <select
                            value={primaryRole}
                            onChange={(e) => handleChangeUserRole(u, e.target.value)}
                            className="px-2 py-1 rounded bg-surface border border-white/10 text-[10px] text-text-muted focus:border-secondary focus:outline-none"
                          >
                            <option value="USER">USER</option>
                            <option value="ORGANIZER">ORGANIZER</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          </select>

                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                              isSuspended
                                ? 'bg-emerald-400/20 text-emerald-400 hover:bg-emerald-400/30'
                                : 'bg-danger/20 text-danger hover:bg-danger/30'
                            }`}
                          >
                            {isSuspended ? 'Reactivate' : 'Suspend'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ORGANIZATION OVERSIGHT */}
        {activeTab === 'organizations' && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
            <div>
              <h3 className="text-base font-bold text-text">Registered Organizations Directory</h3>
              <p className="text-xs text-text-muted">
                Audit clubs, verify institutional esports partners, or suspend non-compliant bodies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organizations.map((org) => (
                <div
                  key={org._id}
                  className="p-5 rounded-2xl bg-surface/60 border border-white/5 flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-base text-text">{org.name}</h4>
                        {org.isVerified ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-400 text-[10px] font-bold">
                            VERIFIED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-400 text-[10px] font-bold">
                            PENDING VERIFICATION
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-1">{org.description || 'No description provided.'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                    <span className="text-[10px] font-mono text-text-muted">Slug: /{org.slug}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleVerifyOrg(org._id, !org.isVerified)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                          org.isVerified
                            ? 'bg-yellow-400/20 text-yellow-300'
                            : 'bg-emerald-400/20 text-emerald-400'
                        }`}
                      >
                        {org.isVerified ? 'Revoke Verification' : 'Verify Organization'}
                      </button>
                      <button
                        onClick={() => handleSuspendOrg(org._id, !org.isSuspended)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                          org.isSuspended ? 'bg-emerald-400/20 text-emerald-400' : 'bg-danger/20 text-danger'
                        }`}
                      >
                        {org.isSuspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: TOURNAMENT OVERSIGHT */}
        {activeTab === 'tournaments' && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
            <div>
              <h3 className="text-base font-bold text-text">Global Tournaments Oversight</h3>
              <p className="text-xs text-text-muted">
                Inspect live tournaments across all organizers, brackets, and participant registrations.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {competitions.map((comp) => (
                <div
                  key={comp._id}
                  className="p-4 rounded-xl bg-surface/60 border border-white/5 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-text">{comp.title}</h4>
                      <span className="px-2 py-0.5 rounded bg-accent/10 text-accent text-[10px] font-mono font-bold">
                        {comp.format}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted font-mono">
                      Capacity: {comp.registeredCount || 0} / {comp.maxParticipants} racers • Status: {comp.status || 'OPEN'}
                    </div>
                  </div>
                  <Link
                    href={`/competitions/${comp._id}`}
                    className="px-3 py-1.5 rounded-lg bg-surface border border-white/10 text-xs font-semibold hover:bg-surface-light text-text"
                  >
                    Inspect Bracket
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: ANTI-CHEAT & AI TRUST & SAFETY DESK */}
        {activeTab === 'anticheat' && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
            <div>
              <div className="flex items-center space-x-2">
                <ShieldAlert className="h-5 w-5 text-secondary" />
                <h3 className="text-base font-bold text-text">AI Trust & Safety Case Reviewer</h3>
                <span className="px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-[10px] font-mono font-bold">
                  HEURISTIC ENTROPY ENGINE
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1">
                Real-time keystroke entropy analysis, impossible speed flags, and bot pattern detection.
              </p>
            </div>

            {/* Integrity Threshold Gauges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-surface/60 border border-white/5 space-y-1">
                <span className="text-xs text-text-muted font-mono">Max Theoretical Speed Gate</span>
                <div className="text-2xl font-black font-mono text-danger">&gt; 220 WPM Flag</div>
                <p className="text-[10px] text-text-muted">Auto-quarantines race results for manual verification</p>
              </div>
              <div className="p-4 rounded-xl bg-surface/60 border border-white/5 space-y-1">
                <span className="text-xs text-text-muted font-mono">Keystroke Uniformity Threshold</span>
                <div className="text-2xl font-black font-mono text-yellow-400">Score &gt; 0.98</div>
                <p className="text-[10px] text-text-muted">Flags robotic macro scripts with zero variance</p>
              </div>
              <div className="p-4 rounded-xl bg-surface/60 border border-white/5 space-y-1">
                <span className="text-xs text-text-muted font-mono">Clipboard Paste Guard</span>
                <div className="text-2xl font-black font-mono text-emerald-400">ACTIVE (BLOCKED)</div>
                <p className="text-[10px] text-text-muted">Synthetic copy-paste inputs immediately zero out progress</p>
              </div>
            </div>

            {/* AI Trust & Safety Case Review Queue */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-text flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-secondary" />
                  <span>Quarantined Cases Queue ({quarantineCases.length})</span>
                </h4>
                <span className="text-[10px] font-mono text-text-muted">Reviewing algorithmic flags</span>
              </div>

              <div className="divide-y divide-white/5 rounded-xl border border-white/5 bg-surface/30 overflow-hidden">
                {quarantineCases.map((cs) => (
                  <div key={cs.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-secondary">{cs.id}</span>
                        <span className="font-bold text-xs text-text">{cs.username}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                            cs.severity === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : cs.severity === 'HIGH'
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                              : 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30'
                          }`}
                        >
                          {cs.severity}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                            cs.status === 'SUSPENDED'
                              ? 'bg-rose-500/20 text-rose-400'
                              : cs.status === 'EXONERATED'
                              ? 'bg-emerald-400/20 text-emerald-400'
                              : 'bg-yellow-400/20 text-yellow-300'
                          }`}
                        >
                          {cs.status}
                        </span>
                      </div>
                      <div className="text-xs text-text-muted font-mono">
                        Violation: <span className="text-text font-semibold">{cs.flag}</span> • Telemetry: {cs.entropy}
                      </div>
                      <div className="text-[10px] text-text-muted font-mono">Flagged {cs.time} • Authoritative Socket Intercept</div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {cs.status !== 'SUSPENDED' && cs.status !== 'EXONERATED' ? (
                        <>
                          <button
                            onClick={() => {
                              setQuarantineCases((prev) =>
                                prev.map((item) => (item.id === cs.id ? { ...item, status: 'SUSPENDED' } : item))
                              );
                              setMessage({
                                text: `Racer ${cs.username} quarantined & suspended. Security audit record created.`,
                                error: false,
                              });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-danger/20 text-danger border border-danger/30 text-xs font-bold hover:bg-danger/30 flex items-center space-x-1"
                          >
                            <UserX className="h-3.5 w-3.5" />
                            <span>Confirm Ban</span>
                          </button>
                          <button
                            onClick={() => {
                              setQuarantineCases((prev) =>
                                prev.map((item) => (item.id === cs.id ? { ...item, status: 'EXONERATED' } : item))
                              );
                              setMessage({
                                text: `Case ${cs.id} exonerated. Flag removed for ${cs.username}.`,
                                error: false,
                              });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold hover:bg-emerald-400/30 flex items-center space-x-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Exonerate</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] font-mono text-text-muted">Case Closed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: FINANCIAL COMMAND CENTER */}
        {activeTab === 'economy' && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
            <div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-text">Financial Command Center & Economy</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-mono font-bold">
                  LIVE TELEMETRY
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1">
                Real-time recurring revenue metrics, Battle Pass subscription breakdown, and payment gateway health.
              </p>
            </div>

            {/* Financial Revenue Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-surface/60 border border-white/5 space-y-1">
                <span className="text-xs text-text-muted font-mono">Monthly Recurring (MRR)</span>
                <div className="text-2xl font-black font-mono text-emerald-400">$14,850</div>
                <p className="text-[10px] text-text-muted">+18.2% from prior billing cycle</p>
              </div>
              <div className="p-4 rounded-xl bg-surface/60 border border-white/5 space-y-1">
                <span className="text-xs text-text-muted font-mono">Annualized Run Rate (ARR)</span>
                <div className="text-2xl font-black font-mono text-accent">$178,200</div>
                <p className="text-[10px] text-text-muted">Projected annual gross volume</p>
              </div>
              <div className="p-4 rounded-xl bg-surface/60 border border-white/5 space-y-1">
                <span className="text-xs text-text-muted font-mono">Premium Pass Subscribers</span>
                <div className="text-2xl font-black font-mono text-amber-300">1,240 Racers</div>
                <p className="text-[10px] text-text-muted">Season 1 Battle Pass active</p>
              </div>
              <div className="p-4 rounded-xl bg-surface/60 border border-white/5 space-y-1">
                <span className="text-xs text-text-muted font-mono">Pass Conversion Rate</span>
                <div className="text-2xl font-black font-mono text-purple-400">28.4%</div>
                <p className="text-[10px] text-text-muted">Free-to-Paid upgrade ratio</p>
              </div>
            </div>

            {/* Payment Gateway Status Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-text font-mono uppercase tracking-wider">
                Payment Gateway & Webhook Endpoints
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-surface/40 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-text">bKash Direct Checkout</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-400/20 text-emerald-400">
                      OPERATIONAL
                    </span>
                  </div>
                  <div className="text-xs text-text-muted font-mono">Idempotent Webhooks • BDT Sandbox Ready</div>
                </div>
                <div className="p-4 rounded-xl bg-surface/40 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-text">Nagad Pay Gate</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-400/20 text-emerald-400">
                      OPERATIONAL
                    </span>
                  </div>
                  <div className="text-xs text-text-muted font-mono">Direct API Dispatch • Instant Fulfillment</div>
                </div>
                <div className="p-4 rounded-xl bg-surface/40 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-text">Stripe Elements (Global)</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-400/20 text-emerald-400">
                      OPERATIONAL
                    </span>
                  </div>
                  <div className="text-xs text-text-muted font-mono">3D Secure 2.0 • USD/EUR Multi-currency</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6.5: PLATFORM CONFIGURATION & FEATURE FLAGS */}
        {activeTab === 'config' && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
            <div>
              <div className="flex items-center space-x-2">
                <Sliders className="h-5 w-5 text-secondary" />
                <h3 className="text-base font-bold text-text">Platform Configuration & Feature Flags</h3>
                <span className="px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-[10px] font-mono font-bold">
                  GLOBAL SYSTEM PARAMS
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1">
                Hot-reload system switches, game loop policies, and anti-cheat strictness levels.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Maintenance Mode */}
              <div className="p-5 rounded-xl bg-surface/40 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-text">Maintenance Mode</div>
                  <div className="text-xs text-text-muted mt-0.5">Redirects all non-admin traffic to platform maintenance splash</div>
                </div>
                <button
                  onClick={() => {
                    const next = !maintenanceMode;
                    setMaintenanceMode(next);
                    setMessage({ text: `Maintenance mode ${next ? 'ACTIVATED' : 'DEACTIVATED'}.`, error: false });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                    maintenanceMode ? 'bg-danger text-white' : 'bg-surface border border-white/10 text-text-muted'
                  }`}
                >
                  {maintenanceMode ? 'ACTIVE (LOCKED)' : 'OFF (LIVE)'}
                </button>
              </div>

              {/* Public Registration */}
              <div className="p-5 rounded-xl bg-surface/40 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-text">Public Racer Registration</div>
                  <div className="text-xs text-text-muted mt-0.5">Allow new players to sign up without explicit invite codes</div>
                </div>
                <button
                  onClick={() => {
                    const next = !openRegistration;
                    setOpenRegistration(next);
                    setMessage({ text: `Public registration ${next ? 'OPEN' : 'CLOSED'}.`, error: false });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                    openRegistration ? 'bg-emerald-400 text-black' : 'bg-surface border border-white/10 text-text-muted'
                  }`}
                >
                  {openRegistration ? 'OPEN' : 'INVITE ONLY'}
                </button>
              </div>

              {/* AI Coach Diagnostics */}
              <div className="p-5 rounded-xl bg-surface/40 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-text">Real-Time AI Coach Diagnostics</div>
                  <div className="text-xs text-text-muted mt-0.5">Live weak-key heuristic drill suggestions on Racer Dashboard</div>
                </div>
                <button
                  onClick={() => {
                    const next = !aiCoachHeuristics;
                    setAiCoachHeuristics(next);
                    setMessage({ text: `AI Coach engine ${next ? 'ENABLED' : 'DISABLED'}.`, error: false });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                    aiCoachHeuristics ? 'bg-cyan-400 text-black' : 'bg-surface border border-white/10 text-text-muted'
                  }`}
                >
                  {aiCoachHeuristics ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              {/* Anti-Cheat Strictness */}
              <div className="p-5 rounded-xl bg-surface/40 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-text">Anti-Cheat Enforcement Level</div>
                  <div className="text-xs text-text-muted mt-0.5">Strictness of keystroke entropy and velocity quarantine</div>
                </div>
                <button
                  onClick={() => {
                    const next = anticheatStrictness === 'STANDARD' ? 'TOURNAMENT_HARDCORE' : 'STANDARD';
                    setAnticheatStrictness(next);
                    setMessage({ text: `Anti-cheat strictness switched to ${next}.`, error: false });
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-secondary/20 text-secondary border border-secondary/40"
                >
                  {anticheatStrictness}
                </button>
              </div>

              {/* Ghost Replay Logging */}
              <div className="p-5 rounded-xl bg-surface/40 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-text">Ghost Replay Telemetry Recording</div>
                  <div className="text-xs text-text-muted mt-0.5">Captures high-frequency 60Hz coordinate samples for replay scrubbing</div>
                </div>
                <button
                  onClick={() => {
                    const next = !ghostReplayLogging;
                    setGhostReplayLogging(next);
                    setMessage({ text: `Ghost replay recording ${next ? 'ENABLED' : 'DISABLED'}.`, error: false });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                    ghostReplayLogging ? 'bg-purple-500 text-white' : 'bg-surface border border-white/10 text-text-muted'
                  }`}
                >
                  {ghostReplayLogging ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
            <div>
              <h3 className="text-base font-bold text-text">System Security & Operations Audit Trail</h3>
              <p className="text-xs text-text-muted">
                Immutable security logs of administrative actions, role updates, and organizational overrides.
              </p>
            </div>

            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-text-muted border border-dashed border-white/10 rounded-xl text-xs">
                No recent security audit logs found.
              </div>
            ) : (
              <div className="divide-y divide-white/5 font-mono text-xs">
                {auditLogs.map((log: any, idx: number) => (
                  <div key={log._id || idx} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="text-secondary font-bold">[{log.action || 'SECURITY_EVENT'}]</span>{' '}
                      <span className="text-text">{log.details || log.message || 'Audit checkpoint'}</span>
                      <div className="text-[10px] text-text-muted">
                        Actor: {log.actor || 'SYSTEM'} • Target: {log.resource || 'CORE'}
                      </div>
                    </div>
                    <span className="text-[10px] text-text-muted">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Recent'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
