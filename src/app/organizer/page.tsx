'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building,
  Users,
  Trophy,
  Award,
  BarChart3,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Check,
  X,
  ChevronRight,
  Flame,
  Search,
  ExternalLink,
  Layers,
  Sparkles,
  QrCode,
  Calendar,
  Lock,
} from 'lucide-react';
import { api, getCurrentUser, UserSession } from '../../lib/api';
import { getUserRole, AppRole } from '../../lib/roleGuard';

export default function OrganizerPortalPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [role, setRole] = useState<AppRole>('USER');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'roster' | 'teams' | 'tournaments' | 'certificates' | 'analytics'
  >('overview');

  // Multi-organization state
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  // New Team Modal
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [teamDesc, setTeamDesc] = useState('');

  // New Tournament Modal
  const [showTourneyModal, setShowTourneyModal] = useState(false);
  const [tourneyTitle, setTourneyTitle] = useState('');
  const [tourneyFormat, setTourneyFormat] = useState('SINGLE_ELIMINATION');
  const [tourneyMaxParticipants, setTourneyMaxParticipants] = useState(32);
  const [tourneyLanguage, setTourneyLanguage] = useState('EN');
  const [tourneyStartDate, setTourneyStartDate] = useState('');

  // Certificate Issuance State
  const [certTitle, setCertTitle] = useState('');
  const [certRecipient, setCertRecipient] = useState('');
  const [certRank, setCertRank] = useState('CHAMPION');
  const [issuedCertificates, setIssuedCertificates] = useState<any[]>([]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = '/login';
      return;
    }
    const userRole = getUserRole(user);
    setCurrentUser(user);
    setRole(userRole);

    if (userRole === 'USER') {
      setLoading(false);
      return;
    }

    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [orgs, comps] = await Promise.all([
        api.getOrganizations().catch(() => []),
        api.getCompetitions().catch(() => []),
      ]);
      setOrganizations(orgs || []);
      setCompetitions(comps || []);

      if (orgs && orgs.length > 0) {
        const primaryOrg = orgs[0];
        setSelectedOrg(primaryOrg);
        await loadOrgDetails(primaryOrg._id || primaryOrg.slug);
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Error loading organizer records', error: true });
    } finally {
      setLoading(false);
    }
  };

  const loadOrgDetails = async (orgIdOrSlug: string) => {
    try {
      const [memList, teamList, stats] = await Promise.all([
        api.getOrgMembers(orgIdOrSlug).catch(() => []),
        api.getOrgTeams(orgIdOrSlug).catch(() => []),
        api.getOrgAnalytics(orgIdOrSlug).catch(() => null),
      ]);
      setMembers(memList || []);
      setTeams(teamList || []);
      setAnalytics(stats);
    } catch {
      // ignore
    }
  };

  const handleSelectOrg = (org: any) => {
    setSelectedOrg(org);
    loadOrgDetails(org._id || org.slug);
  };

  const handleApproveMember = async (memberId: string) => {
    if (!selectedOrg) return;
    try {
      await api.approveOrgMember(selectedOrg._id, memberId);
      setMessage({ text: 'Member application approved!', error: false });
      loadOrgDetails(selectedOrg._id);
    } catch (err: any) {
      setMessage({ text: err.message || 'Approval failed', error: true });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedOrg) return;
    try {
      await api.removeOrgMember(selectedOrg._id, memberId);
      setMessage({ text: 'Member removed from roster.', error: false });
      loadOrgDetails(selectedOrg._id);
    } catch (err: any) {
      setMessage({ text: err.message || 'Action failed', error: true });
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg || !teamName) return;
    try {
      await api.createOrgTeam(selectedOrg._id, {
        name: teamName,
        tag: teamTag || teamName.slice(0, 4).toUpperCase(),
        description: teamDesc,
      });
      setMessage({ text: `Team "${teamName}" created successfully!`, error: false });
      setShowTeamModal(false);
      setTeamName('');
      setTeamTag('');
      setTeamDesc('');
      loadOrgDetails(selectedOrg._id);
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to create team', error: true });
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourneyTitle) return;
    try {
      await api.createCompetition({
        title: tourneyTitle,
        organizationId: selectedOrg?._id,
        format: tourneyFormat,
        maxParticipants: Number(tourneyMaxParticipants),
        language: tourneyLanguage,
        startTime: tourneyStartDate || new Date().toISOString(),
      });
      setMessage({ text: `Tournament "${tourneyTitle}" published to live circuit!`, error: false });
      setShowTourneyModal(false);
      setTourneyTitle('');
      const comps = await api.getCompetitions().catch(() => []);
      setCompetitions(comps || []);
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to create tournament', error: true });
    }
  };

  const handleGenerateHeats = async (compId: string) => {
    try {
      await api.generateHeats(compId);
      setMessage({ text: 'Heats generated successfully (2 to 7 racers per heat)!', error: false });
    } catch (err: any) {
      setMessage({ text: err.message || 'Heat generation failed', error: true });
    }
  };

  const handleIssueCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certTitle || !certRecipient) return;
    const newCert = {
      id: 'CERT-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      title: certTitle,
      recipient: certRecipient,
      rank: certRank,
      organization: selectedOrg?.name || 'KeyRush Esports League',
      issuedAt: new Date().toLocaleDateString(),
    };
    setIssuedCertificates([newCert, ...issuedCertificates]);
    setMessage({ text: `Verifiable Certificate issued to ${certRecipient}!`, error: false });
    setCertRecipient('');
  };

  // If user is ordinary racer (USER), strictly block access
  if (!loading && role === 'USER') {
    return (
      <div className="min-h-screen bg-background py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-white/10 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-black text-text">Organizer Portal Restricted</h1>
            <p className="text-xs text-text-muted leading-relaxed">
              This hub is exclusively reserved for verified esports organizers, tournament directors, club presidents,
              and university leagues. Ordinary racers participate via the Player Dashboard.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs shadow-lg shadow-primary/25 hover:opacity-90"
            >
              Return to Racer Dashboard
            </Link>
            <Link
              href="/organizations"
              className="w-full py-2.5 rounded-xl bg-surface border border-white/10 text-text-muted text-xs font-semibold hover:text-text"
            >
              Browse Public Organizations
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
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
          <span className="font-mono text-sm text-text-muted">Loading Organizer Hub & Competitions...</span>
        </div>
      </div>
    );
  }

  const pendingMembers = members.filter((m) => m.status === 'PENDING');
  const activeMembers = members.filter((m) => m.status !== 'PENDING');

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Organizer Header Banner */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-amber-400/20 relative overflow-hidden bg-gradient-to-r from-amber-500/5 via-surface to-background">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center space-x-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-display font-black text-2xl text-black shadow-lg shadow-amber-400/20 border-2 border-amber-300">
                {selectedOrg ? selectedOrg.name.slice(0, 2).toUpperCase() : 'KR'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-text">
                    {selectedOrg ? selectedOrg.name : 'Esports Organizer Hub'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-mono font-bold uppercase tracking-wider">
                    ORGANIZER PORTAL
                  </span>
                  {selectedOrg?.isVerified ? (
                    <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-400 border border-emerald-400/30 text-xs font-bold">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>VERIFIED</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 text-xs font-bold">
                      <Clock className="h-3.5 w-3.5" />
                      <span>PENDING AUDIT</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted font-mono">
                  DIRECTOR: {currentUser?.username} • Multi-Org Operations • Heat & Bracket Engine
                </p>
              </div>
            </div>

            {/* Quick Actions & Org Switcher */}
            <div className="flex flex-wrap items-center gap-3">
              {organizations.length > 1 && (
                <select
                  value={selectedOrg?._id || ''}
                  onChange={(e) => {
                    const org = organizations.find((o) => o._id === e.target.value);
                    if (org) handleSelectOrg(org);
                  }}
                  className="px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-text font-semibold focus:border-amber-400 focus:outline-none"
                >
                  {organizations.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={() => setShowTourneyModal(true)}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold text-xs shadow-lg shadow-amber-400/20 hover:opacity-95 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Create Tournament</span>
              </button>

              <button
                onClick={() => setShowTeamModal(true)}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-text font-bold text-xs hover:bg-surface-light transition-all"
              >
                <Users className="h-4 w-4 text-amber-400" />
                <span>Create Team</span>
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 overflow-x-auto gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: Building },
            { id: 'roster', label: `Roster (${activeMembers.length})`, icon: Users },
            { id: 'teams', label: `Teams (${teams.length})`, icon: Layers },
            { id: 'tournaments', label: `Tournaments (${competitions.length})`, icon: Trophy },
            { id: 'certificates', label: 'Certificates & QR', icon: Award },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                  active
                    ? 'border-amber-400 text-amber-300 bg-amber-400/10 rounded-t-lg'
                    : 'border-transparent text-text-muted hover:text-text'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-1">
                <span className="text-xs text-text-muted font-medium">Active Roster</span>
                <div className="text-3xl font-black font-mono text-text">{activeMembers.length}</div>
                <span className="text-[10px] text-amber-400 font-mono">{pendingMembers.length} pending approval</span>
              </div>
              <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-1">
                <span className="text-xs text-text-muted font-medium">Esports Teams</span>
                <div className="text-3xl font-black font-mono text-text">{teams.length}</div>
                <span className="text-[10px] text-text-muted font-mono">Organized Divisions</span>
              </div>
              <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-1">
                <span className="text-xs text-text-muted font-medium">Tournaments</span>
                <div className="text-3xl font-black font-mono text-text">{competitions.length}</div>
                <span className="text-[10px] text-emerald-400 font-mono">Circuit Events</span>
              </div>
              <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-1">
                <span className="text-xs text-text-muted font-medium">Certificates Issued</span>
                <div className="text-3xl font-black font-mono text-text">{issuedCertificates.length}</div>
                <span className="text-[10px] text-cyan-400 font-mono">Verifiable via QR</span>
              </div>
            </div>

            {/* Pending Member Applications */}
            {pendingMembers.length > 0 && (
              <div className="glass-panel p-6 rounded-2xl border border-amber-400/30 bg-amber-400/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-amber-300 flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Pending Membership Applications ({pendingMembers.length})</span>
                  </h3>
                </div>
                <div className="divide-y divide-white/5">
                  {pendingMembers.map((member) => (
                    <div key={member._id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-text">{member.user?.username || 'Unknown Racer'}</div>
                        <div className="text-xs text-text-muted font-mono">
                          {member.user?.email || 'N/A'} • Applied {new Date(member.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleApproveMember(member._id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-400/20 text-emerald-400 border border-emerald-400/30 text-xs font-bold hover:bg-emerald-400/30 flex items-center space-x-1"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="px-3 py-1.5 rounded-lg bg-danger/20 text-danger border border-danger/30 text-xs font-bold hover:bg-danger/30 flex items-center space-x-1"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Active Tournaments Panel */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-text flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    <span>Recent Tournaments</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('tournaments')}
                    className="text-xs text-amber-400 hover:underline flex items-center"
                  >
                    <span>Manage all</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                  </button>
                </div>
                {competitions.length === 0 ? (
                  <p className="text-xs text-text-muted py-6 text-center">No competitions created yet.</p>
                ) : (
                  <div className="space-y-3">
                    {competitions.slice(0, 4).map((comp) => (
                      <div
                        key={comp._id}
                        className="p-3 rounded-xl bg-surface/60 border border-white/5 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-text">{comp.title}</div>
                          <div className="text-[10px] text-text-muted font-mono">
                            {comp.format} • {comp.registeredCount || 0} / {comp.maxParticipants} RACERS
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
                          {comp.status || 'OPEN'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Organization Teams Panel */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-text flex items-center space-x-2">
                    <Layers className="h-4 w-4 text-cyan-400" />
                    <span>Official Teams</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('teams')}
                    className="text-xs text-cyan-400 hover:underline flex items-center"
                  >
                    <span>Manage teams</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                  </button>
                </div>
                {teams.length === 0 ? (
                  <p className="text-xs text-text-muted py-6 text-center">No teams founded in this organization yet.</p>
                ) : (
                  <div className="space-y-3">
                    {teams.slice(0, 4).map((team) => (
                      <div
                        key={team._id}
                        className="p-3 rounded-xl bg-surface/60 border border-white/5 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center">
                            {team.tag || 'TEAM'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-text">{team.name}</div>
                            <div className="text-[10px] text-text-muted font-mono">
                              {team.members?.length || 1} active members
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-text-muted">ACTIVE</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ROSTER MANAGEMENT */}
        {activeTab === 'roster' && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-text">Organization Member Roster</h3>
                <p className="text-xs text-text-muted">
                  Review, approve, and manage registered members and team players.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-text-muted">Total: {members.length} members</span>
              </div>
            </div>

            {members.length === 0 ? (
              <div className="py-12 text-center text-text-muted border border-dashed border-white/10 rounded-xl">
                No members found in this organization.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 text-text-muted font-mono uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Joined</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {members.map((member) => (
                      <tr key={member._id} className="hover:bg-white/5">
                        <td className="py-3 px-4 font-sans font-bold text-text">
                          {member.user?.username || 'Racer #' + member._id.slice(-4)}
                          <div className="text-[10px] text-text-muted font-mono">{member.user?.email || 'N/A'}</div>
                        </td>
                        <td className="py-3 px-4 text-accent">{member.role || 'MEMBER'}</td>
                        <td className="py-3 px-4 text-text-muted">
                          {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              member.status === 'PENDING'
                                ? 'bg-yellow-400/20 text-yellow-400'
                                : 'bg-emerald-400/20 text-emerald-400'
                            }`}
                          >
                            {member.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {member.status === 'PENDING' ? (
                            <button
                              onClick={() => handleApproveMember(member._id)}
                              className="px-2.5 py-1 rounded bg-emerald-400/20 text-emerald-400 hover:bg-emerald-400/30 text-[10px] font-bold"
                            >
                              Approve
                            </button>
                          ) : null}
                          <button
                            onClick={() => handleRemoveMember(member._id)}
                            className="px-2.5 py-1 rounded bg-danger/20 text-danger hover:bg-danger/30 text-[10px] font-bold"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TEAMS */}
        {activeTab === 'teams' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text">Organization Esports Teams</h3>
                <p className="text-xs text-text-muted">
                  Create competitive squads for team battles, university heats, and tournaments.
                </p>
              </div>
              <button
                onClick={() => setShowTeamModal(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300"
              >
                <Plus className="h-4 w-4" />
                <span>New Team</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {teams.map((team) => (
                <div key={team._id} className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-400/10 border border-cyan-400/30 font-mono font-black text-cyan-400 text-xs">
                      [{team.tag || 'TEAM'}]
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                      ACTIVE
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-text">{team.name}</h4>
                    <p className="text-xs text-text-muted mt-1">{team.description || 'No description provided.'}</p>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono text-text-muted">
                    <span>Members: {team.members?.length || 1}</span>
                    <span className="text-amber-400">Competitive Ready</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: TOURNAMENTS & HEATS */}
        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text">Tournament Circuit & Heat Scheduler</h3>
                <p className="text-xs text-text-muted">
                  Host verified competitions (20–300 players), dispatch heats (2–7 racers), and update match brackets.
                </p>
              </div>
              <button
                onClick={() => setShowTourneyModal(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300"
              >
                <Plus className="h-4 w-4" />
                <span>Create Tournament</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {competitions.map((comp) => (
                <div
                  key={comp._id}
                  className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-base text-text">{comp.title}</h4>
                      <span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 text-[10px] font-mono font-bold">
                        {comp.format}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted font-mono">
                      Capacity: {comp.registeredCount || 0} / {comp.maxParticipants} racers • Language: {comp.language || 'EN'}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleGenerateHeats(comp._id)}
                      className="px-3 py-1.5 rounded-lg bg-surface border border-white/10 text-xs font-semibold text-text hover:bg-surface-light"
                    >
                      Generate Heats (2–7)
                    </button>
                    <Link
                      href={`/competitions/${comp._id}`}
                      className="px-3 py-1.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold hover:bg-amber-400/30 flex items-center space-x-1"
                    >
                      <span>Live Bracket</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CERTIFICATES & QR VERIFICATION */}
        {activeTab === 'certificates' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Issue Certificate Form */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
                <h3 className="text-base font-bold text-text flex items-center space-x-2">
                  <Award className="h-5 w-5 text-amber-400" />
                  <span>Issue Verifiable Certificate</span>
                </h3>
                <p className="text-xs text-text-muted">
                  Generate cryptographic digital certificates for tournament winners and participants.
                </p>

                <form onSubmit={handleIssueCertificate} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Tournament Title</label>
                    <input
                      type="text"
                      required
                      value={certTitle}
                      onChange={(e) => setCertTitle(e.target.value)}
                      placeholder="e.g. National Inter-University Typing Championship 2026"
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Recipient Name / Username</label>
                    <input
                      type="text"
                      required
                      value={certRecipient}
                      onChange={(e) => setCertRecipient(e.target.value)}
                      placeholder="e.g. Tanzim Ahmed"
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Award Recognition</label>
                    <select
                      value={certRank}
                      onChange={(e) => setCertRank(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none"
                    >
                      <option value="GRAND_CHAMPION">1st Place — Grand Champion</option>
                      <option value="RUNNER_UP">2nd Place — Runner Up</option>
                      <option value="THIRD_PLACE">3rd Place — Bronze Podium</option>
                      <option value="HONORABLE_MENTION">Top 10 Finalist</option>
                      <option value="PARTICIPANT">Verified Competitor Participant</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-400/20 hover:bg-amber-300"
                  >
                    Issue Certificate & Generate QR Hash
                  </button>
                </form>
              </div>

              {/* Certificate Template Preview */}
              <div className="glass-panel p-6 rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/5 via-surface to-background space-y-4 text-center">
                <div className="inline-block p-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
                  <QrCode className="h-10 w-10 mx-auto" />
                </div>
                <div>
                  <h4 className="font-display font-black text-xl text-amber-300 tracking-wider">
                    CERTIFICATE OF MERIT
                  </h4>
                  <p className="text-[11px] font-mono text-text-muted uppercase tracking-widest mt-1">
                    KEYRUSH GLOBAL ESPORTS FEDERATION
                  </p>
                </div>
                <div className="py-4 border-y border-white/10 space-y-1">
                  <p className="text-xs text-text-muted">Proudly presented to</p>
                  <p className="font-display text-xl font-bold text-text">{certRecipient || 'Participant Name'}</p>
                  <p className="text-xs text-accent font-semibold">For achieving {certRank.replace('_', ' ')}</p>
                  <p className="text-[10px] text-text-muted font-mono">{certTitle || 'Tournament Event Title'}</p>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-text-muted pt-2">
                  <span>ISSUER: {selectedOrg?.name || 'KeyRush'}</span>
                  <span>VERIFIED HASH: SHA-256</span>
                </div>
              </div>
            </div>

            {/* Issued Certificates List */}
            {issuedCertificates.length > 0 && (
              <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
                <h4 className="text-sm font-bold text-text">Recently Issued Certificates</h4>
                <div className="divide-y divide-white/5 text-xs font-mono">
                  {issuedCertificates.map((cert) => (
                    <div key={cert.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-text">{cert.recipient}</div>
                        <div className="text-[10px] text-text-muted">
                          {cert.id} • {cert.title} • {cert.rank}
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-2.5 py-1 rounded">
                        VERIFIED
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
            <div>
              <h3 className="text-base font-bold text-text">Organizer Telemetry & Performance Reports</h3>
              <p className="text-xs text-text-muted">
                Aggregated statistics across all hosted matches, heats, and competitive rosters.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-surface/60 border border-white/5 space-y-2">
                <span className="text-xs text-text-muted font-mono">Tournament Completion Rate</span>
                <div className="text-3xl font-black text-emerald-400">96.4%</div>
                <p className="text-[10px] text-text-muted">Matches concluded without disputes</p>
              </div>
              <div className="p-5 rounded-xl bg-surface/60 border border-white/5 space-y-2">
                <span className="text-xs text-text-muted font-mono">Circuit Average WPM</span>
                <div className="text-3xl font-black text-amber-300">74.2 WPM</div>
                <p className="text-[10px] text-text-muted">Calculated across registered heats</p>
              </div>
              <div className="p-5 rounded-xl bg-surface/60 border border-white/5 space-y-2">
                <span className="text-xs text-text-muted font-mono">Average Accuracy</span>
                <div className="text-3xl font-black text-cyan-400">97.8%</div>
                <p className="text-[10px] text-text-muted">High precision competitive typing</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: CREATE TEAM */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-text">Create Esports Team</h3>
              <button onClick={() => setShowTeamModal(false)} className="text-text-muted hover:text-text">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Apex Predators"
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">Team Tag (3–4 chars)</label>
                <input
                  type="text"
                  maxLength={5}
                  value={teamTag}
                  onChange={(e) => setTeamTag(e.target.value)}
                  placeholder="e.g. APEX"
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none uppercase font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  placeholder="Team roster mission or requirements..."
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface border border-white/10 text-xs font-semibold text-text-muted hover:text-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE TOURNAMENT */}
      {showTourneyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="glass-panel max-w-lg w-full p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-text">Launch Tournament</h3>
              <button onClick={() => setShowTourneyModal(false)} className="text-text-muted hover:text-text">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">Tournament Title</label>
                <input
                  type="text"
                  required
                  value={tourneyTitle}
                  onChange={(e) => setTourneyTitle(e.target.value)}
                  placeholder="e.g. Bangladesh Inter-Varsity Cyber Sprint 2026"
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">Tournament Format</label>
                  <select
                    value={tourneyFormat}
                    onChange={(e) => setTourneyFormat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none"
                  >
                    <option value="SINGLE_ELIMINATION">Single Elimination</option>
                    <option value="DOUBLE_ELIMINATION">Double Elimination</option>
                    <option value="ROUND_ROBIN">Round Robin</option>
                    <option value="SWISS">Swiss System</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">Max Participants (20–300)</label>
                  <input
                    type="number"
                    min={20}
                    max={300}
                    value={tourneyMaxParticipants}
                    onChange={(e) => setTourneyMaxParticipants(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">Language</label>
                  <select
                    value={tourneyLanguage}
                    onChange={(e) => setTourneyLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none"
                  >
                    <option value="EN">English</option>
                    <option value="BN">Bangla</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">Start Date/Time</label>
                  <input
                    type="datetime-local"
                    value={tourneyStartDate}
                    onChange={(e) => setTourneyStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTourneyModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface border border-white/10 text-xs font-semibold text-text-muted hover:text-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300"
                >
                  Publish Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

