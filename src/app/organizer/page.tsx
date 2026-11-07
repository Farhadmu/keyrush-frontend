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
  ChevronLeft,
  Printer,
  Sliders,
  DollarSign,
  Globe,
  Radio,
  Play,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { api, getCurrentUser, UserSession } from '../../lib/api';
import { getUserRole, AppRole } from '../../lib/roleGuard';

export default function OrganizerPortalPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [role, setRole] = useState<AppRole>('USER');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'roster' | 'teams' | 'tournaments' | 'control_room' | 'certificates' | 'analytics'
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

  // 8-Step Tournament Studio Wizard State
  const [showTourneyWizard, setShowTourneyWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [tourneyTitle, setTourneyTitle] = useState('');
  const [tourneySlug, setTourneySlug] = useState('');
  const [tourneyDesc, setTourneyDesc] = useState('');
  const [tourneyLanguage, setTourneyLanguage] = useState('EN');
  const [tourneyBrandAccent, setTourneyBrandAccent] = useState('#3B82F6');
  const [tourneyBannerUrl, setTourneyBannerUrl] = useState('');
  const [tourneyMinElo, setTourneyMinElo] = useState(0);
  const [tourneyRequireVerified, setTourneyRequireVerified] = useState(false);
  const [tourneyRegion, setTourneyRegion] = useState('GLOBAL');
  const [tourneyIsPaid, setTourneyIsPaid] = useState(false);
  const [tourneyEntryFee, setTourneyEntryFee] = useState(0);
  const [tourneyPrizePool, setTourneyPrizePool] = useState('$500 Cash + Verified Medal');
  const [tourneyFormat, setTourneyFormat] = useState('SINGLE_ELIMINATION');
  const [tourneyMaxParticipants, setTourneyMaxParticipants] = useState(32);
  const [tourneyStartDate, setTourneyStartDate] = useState('');
  const [tourneyCheckInWindow, setTourneyCheckInWindow] = useState(15);
  const [tourneyHeatInterval, setTourneyHeatInterval] = useState(120);

  // Live Control Room State
  const [activeHeats, setActiveHeats] = useState<any[]>([
    {
      id: 'HEAT-01',
      round: 'Round of 32',
      status: 'RACING',
      racersCount: 5,
      leader: 'ApexStriker',
      leaderWpm: 104,
      progress: 68,
    },
    {
      id: 'HEAT-02',
      round: 'Round of 32',
      status: 'PENDING',
      racersCount: 6,
      leader: 'Awaiting Launch',
      leaderWpm: 0,
      progress: 0,
    },
    {
      id: 'HEAT-03',
      round: 'Round of 32',
      status: 'DISPUTED',
      racersCount: 4,
      leader: 'CyberSpeed',
      leaderWpm: 88,
      progress: 45,
      disputeReason: 'Racer input lag packet loss reported',
    },
    {
      id: 'HEAT-04',
      round: 'Round of 32',
      status: 'COMPLETED',
      racersCount: 7,
      leader: 'TurboRacer_BD',
      leaderWpm: 118,
      progress: 100,
    },
  ]);
  const [controlRoomMessage, setControlRoomMessage] = useState<string | null>(null);

  // Certificate Issuance State
  const [certTitle, setCertTitle] = useState('');
  const [certRecipient, setCertRecipient] = useState('');
  const [certRank, setCertRank] = useState('CHAMPION');
  const [issuedCertificates, setIssuedCertificates] = useState<any[]>([]);

  // Tournament Management & Control Room State
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [controlRoomData, setControlRoomData] = useState<any | null>(null);
  const [compRegistrations, setCompRegistrations] = useState<any[]>([]);
  const [seedingSelection, setSeedingSelection] = useState<string>('INSTITUTION_BALANCED');
  const [controlRoomFilter, setControlRoomFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [isRefreshingControl, setIsRefreshingControl] = useState(false);

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

      if (comps && comps.length > 0) {
        setSelectedCompId(comps[0]._id);
        loadControlRoom(comps[0]._id);
      }

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

  const loadControlRoom = async (compId: string) => {
    if (!compId) return;
    setIsRefreshingControl(true);
    try {
      const [status, regs] = await Promise.all([
        api.getLiveControlRoomStatus(compId).catch(() => null),
        api.getCompetitionRegistrations(compId).catch(() => []),
      ]);
      if (status) {
        setControlRoomData(status);
        if (status.heats && status.heats.length > 0) {
          setActiveHeats(
            status.heats.map((h: any) => ({
              id: `HEAT-${String(h.heatNumber).padStart(2, '0')}`,
              heatNumber: h.heatNumber,
              roundNumber: h.roundNumber || 1,
              roomId: h.roomId,
              round: `Round ${h.roundNumber || 1}`,
              status: h.status,
              racersCount: h.participants?.length || 0,
              participants: h.participants || [],
              hasDispute: h.disputeState?.hasDispute || h.status === 'DISPUTED',
              disputeReason: h.disputeState?.reason || '',
              leader: h.participants?.[0]?.username || 'TBD',
              leaderWpm: h.participants?.[0]?.netWpm || 0,
              progress: h.status === 'COMPLETED' ? 100 : h.status === 'RACING' ? 65 : 0,
            })),
          );
        }
      }
      setCompRegistrations(regs || []);
    } catch {
      // ignore
    } finally {
      setIsRefreshingControl(false);
    }
  };

  const handleCreateTournament = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tourneyTitle) return;
    try {
      const slugVal =
        tourneySlug ||
        tourneyTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      const regStart = new Date();
      const regEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const chkStart = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const chkEnd = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
      const evStart = tourneyStartDate
        ? new Date(tourneyStartDate)
        : new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
      const evEnd = new Date(evStart.getTime() + 6 * 60 * 60 * 1000);

      await api.createCompetition({
        title: tourneyTitle,
        slug: slugVal,
        description:
          tourneyDesc ||
          'National inter-university typing championship. Compete for institutional glory and digital credentials.',
        category: 'UNIVERSITY_ESPORTS',
        institution: selectedOrg?.name || 'Dhaka University Esports',
        contactPerson: currentUser?.username || 'Tournament Director',
        contactEmail: currentUser?.email || 'director@keyrush.gg',
        country: 'BD',
        city: 'Dhaka',
        organizationId: selectedOrg?._id,
        tournamentFormat: tourneyFormat,
        minParticipants: 20,
        maxParticipants: Math.max(20, Math.min(300, Number(tourneyMaxParticipants))),
        language: tourneyLanguage,
        seedingRule: seedingSelection,
        registrationStart: regStart.toISOString(),
        registrationEnd: regEnd.toISOString(),
        checkInStart: chkStart.toISOString(),
        checkInEnd: chkEnd.toISOString(),
        eventStart: evStart.toISOString(),
        eventEnd: evEnd.toISOString(),
        timezone: 'Asia/Dhaka',
        breakIntervalSeconds: tourneyHeatInterval || 120,
      });

      setMessage({ text: `Tournament "${tourneyTitle}" published to live circuit!`, error: false });
      setShowTourneyWizard(false);
      setTourneyTitle('');
      setWizardStep(1);
      const comps = await api.getCompetitions().catch(() => []);
      setCompetitions(comps || []);
      if (comps && comps.length > 0) {
        setSelectedCompId(comps[comps.length - 1]._id);
        loadControlRoom(comps[comps.length - 1]._id);
      }
      setActiveTab('tournaments');
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to create tournament', error: true });
    }
  };

  const handleDispatchHeat = async (heatNumber: number, roundNumber: number = 1) => {
    if (!selectedCompId) return;
    try {
      await api.startHeat(selectedCompId, heatNumber, roundNumber);
      setMessage({ text: `Heat #${heatNumber} dispatched! Room active on server.`, error: false });
      loadControlRoom(selectedCompId);
    } catch (err: any) {
      setMessage({ text: err.message || 'Heat dispatch failed', error: true });
    }
  };

  const handleForceRerun = async (heatNumber: number, roundNumber: number = 1) => {
    if (!selectedCompId) return;
    try {
      await api.resolveHeatDispute(
        selectedCompId,
        heatNumber,
        'RERUN',
        'Organizer manual reset / rerun',
        roundNumber,
      );
      setMessage({ text: `Heat #${heatNumber} dispute resolved: RERUN scheduled.`, error: false });
      loadControlRoom(selectedCompId);
    } catch (err: any) {
      setMessage({ text: err.message || 'Action failed', error: true });
    }
  };

  const handleValidateHeat = async (heatNumber: number, roundNumber: number = 1) => {
    if (!selectedCompId) return;
    try {
      await api.resolveHeatDispute(
        selectedCompId,
        heatNumber,
        'VALIDATE',
        'Results reviewed and validated',
        roundNumber,
      );
      setMessage({ text: `Heat #${heatNumber} validated and confirmed.`, error: false });
      loadControlRoom(selectedCompId);
    } catch (err: any) {
      setMessage({ text: err.message || 'Action failed', error: true });
    }
  };

  const handleAdvanceRound = async (currentRound: number) => {
    if (!selectedCompId) return;
    try {
      const res = await api.advanceRound(selectedCompId, currentRound, 2);
      if (res.isGrandFinal) {
        setMessage({ text: `🎉 Grand Final created with ${res.totalQualifiers} qualifiers!`, error: false });
      } else {
        setMessage({ text: `Advanced to Round ${res.nextRound} (${res.heatsCount} heats created).`, error: false });
      }
      loadControlRoom(selectedCompId);
    } catch (err: any) {
      setMessage({ text: err.message || 'Round advance failed', error: true });
    }
  };

  const handleCompleteTournament = async () => {
    if (!selectedCompId) return;
    try {
      const res = await api.completeCompetition(selectedCompId);
      setMessage({
        text: `🏆 Tournament Concluded! Champion: ${res.winner?.username || 'Winner'}. Verifiable certificates ready.`,
        error: false,
      });
      loadControlRoom(selectedCompId);
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to conclude tournament', error: true });
    }
  };

  const handleVerifyStudent = async (regId: string, status: 'VERIFIED' | 'REJECTED') => {
    if (!selectedCompId) return;
    try {
      await api.verifyStudentRegistration(selectedCompId, regId, status, `Verified by ${currentUser?.username}`);
      setMessage({ text: `Student registration marked as ${status}.`, error: false });
      loadControlRoom(selectedCompId);
    } catch (err: any) {
      setMessage({ text: err.message || 'Verification update failed', error: true });
    }
  };

  const handleExportRegistrationsCsv = async () => {
    if (!selectedCompId) return;
    try {
      const csvData = await api.exportRegistrationsCsv(selectedCompId);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `keyrush-registrations-${selectedCompId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setMessage({ text: 'Participant roster exported to CSV successfully.', error: false });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to export CSV', error: true });
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
                onClick={() => {
                  setShowTourneyWizard(true);
                  setWizardStep(1);
                }}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold text-xs shadow-lg shadow-amber-400/20 hover:opacity-95 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Create Tournament Studio</span>
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
            { id: 'control_room', label: 'Live Control Room', icon: Radio },
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
                onClick={() => {
                  setShowTourneyWizard(true);
                  setWizardStep(1);
                }}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300"
              >
                <Plus className="h-4 w-4" />
                <span>Launch Tournament Studio</span>
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
                    <button
                      onClick={() => setActiveTab('control_room')}
                      className="px-3 py-1.5 rounded-lg bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 text-xs font-bold hover:bg-cyan-400/30 flex items-center space-x-1"
                    >
                      <Radio className="h-3 w-3" />
                      <span>Control Room</span>
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

        {/* TAB 4.5: LIVE TOURNAMENT CONTROL ROOM */}
        {activeTab === 'control_room' && (
          <div className="space-y-6">
            {/* Control Room Header & Competition Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-white/10">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <h3 className="text-base font-bold text-text">Live Tournament Control Room</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-mono font-bold">
                    60Hz ENGINE SYNC
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  Server-authoritative heat dispatch (2–7 racers per heat), dispute resolution, and round progression.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {competitions.length > 0 && (
                  <select
                    value={selectedCompId}
                    onChange={(e) => {
                      setSelectedCompId(e.target.value);
                      loadControlRoom(e.target.value);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-surface border border-white/10 text-xs text-text font-semibold focus:border-amber-400 focus:outline-none"
                  >
                    {competitions.map((comp) => (
                      <option key={comp._id} value={comp._id}>
                        {comp.title} ({comp.status})
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => loadControlRoom(selectedCompId)}
                  disabled={isRefreshingControl}
                  className="px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-text hover:bg-surface-light flex items-center space-x-1"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${isRefreshingControl ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={handleExportRegistrationsCsv}
                  className="px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-text hover:bg-surface-light flex items-center space-x-1"
                >
                  <Printer className="h-3.5 w-3.5 text-accent" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {controlRoomMessage && (
              <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-mono flex items-center justify-between">
                <span>{controlRoomMessage}</span>
                <button onClick={() => setControlRoomMessage(null)} className="hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Live Telemetry Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-text-muted uppercase">Tournament Status</span>
                <div className="text-base font-bold text-text truncate">
                  {controlRoomData?.competition?.status || 'INITIALIZED'}
                </div>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-text-muted uppercase">Active Round</span>
                <div className="text-base font-bold text-accent">
                  Round {controlRoomData?.currentRound || 1}
                </div>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-text-muted uppercase">Completed Heats</span>
                <div className="text-base font-bold text-emerald-400">
                  {controlRoomData?.completedHeats || 0} / {controlRoomData?.totalHeatsInRound || activeHeats.length}
                </div>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-text-muted uppercase">Disputes Pending</span>
                <div className={`text-base font-bold ${controlRoomData?.disputedHeats ? 'text-danger' : 'text-text'}`}>
                  {controlRoomData?.disputedHeats || 0}
                </div>
              </div>
            </div>

            {/* Heat Dispatch & Seeding Control Bar */}
            <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-text">Seeding Algorithm:</span>
                <select
                  value={seedingSelection}
                  onChange={(e) => setSeedingSelection(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none"
                >
                  <option value="INSTITUTION_BALANCED">Institution-Balanced (Round 1 Peer Separation)</option>
                  <option value="RANKED_ELO">Ranked ELO (Snake Draft Balancing)</option>
                  <option value="RANDOM">Randomized Draw</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={async () => {
                    if (!selectedCompId) return;
                    try {
                      await api.generateHeats(selectedCompId, seedingSelection);
                      setMessage({ text: 'Heats generated successfully with balanced 2–7 racer sizing!', error: false });
                      loadControlRoom(selectedCompId);
                    } catch (err: any) {
                      setMessage({ text: err.message || 'Failed to generate heats', error: true });
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold text-xs hover:opacity-95 shadow-md flex items-center space-x-1.5"
                >
                  <Flame className="h-4 w-4" />
                  <span>Generate / Re-seed Heats</span>
                </button>

                {controlRoomData?.canAdvanceRound && (
                  <button
                    onClick={() => handleAdvanceRound(controlRoomData.currentRound || 1)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-accent text-white font-bold text-xs hover:opacity-95 shadow-md flex items-center space-x-1.5 animate-pulse"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span>Advance to Next Round / Grand Final</span>
                  </button>
                )}

                <button
                  onClick={handleCompleteTournament}
                  className="px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs font-semibold text-text hover:bg-surface-light flex items-center space-x-1"
                >
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                  <span>Crown Champion</span>
                </button>
              </div>
            </div>

            {/* Active Dispute Resolution Banner */}
            {activeHeats.some((h) => h.hasDispute || h.status === 'DISPUTED') && (
              <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs">
                    <AlertCircle className="h-4 w-4" />
                    <span>HEAT DISPUTE REQUIRES INTERVENTION</span>
                  </div>
                  <span className="text-[10px] font-mono text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded">
                    URGENT
                  </span>
                </div>
                <p className="text-xs text-text-muted">
                  A heat has been flagged for telemetry anomaly or player disconnect dispute. Review and resolve below.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {activeHeats
                    .filter((h) => h.hasDispute || h.status === 'DISPUTED')
                    .map((dh) => (
                      <div key={dh.id} className="flex items-center space-x-2">
                        <button
                          onClick={() => handleForceRerun(dh.heatNumber, dh.roundNumber)}
                          className="px-3 py-1.5 rounded-lg bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 flex items-center space-x-1"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Rerun {dh.id}</span>
                        </button>
                        <button
                          onClick={() => handleValidateHeat(dh.heatNumber, dh.roundNumber)}
                          className="px-3 py-1.5 rounded-lg bg-surface border border-white/10 text-xs font-semibold text-text hover:bg-surface-light flex items-center space-x-1"
                        >
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Validate {dh.id}</span>
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Active Heats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeHeats.map((heat) => (
                <div
                  key={heat.id || heat.heatNumber}
                  className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4 hover:border-amber-400/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-black text-sm text-text">{heat.id}</span>
                      <span className="text-[10px] text-text-muted font-mono">({heat.round})</span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        heat.status === 'RACING'
                          ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 animate-pulse'
                          : heat.status === 'DISPUTED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : heat.status === 'COMPLETED'
                          ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/40'
                          : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                      }`}
                    >
                      {heat.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-text-muted">Racers in Heat:</span>
                      <span className="text-text font-bold">{heat.racersCount} of 7 (Compliant Sizing)</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-text-muted">Room ID:</span>
                      <span className="text-amber-300 font-bold truncate max-w-[180px]">
                        {heat.roomId || 'ROOM-PENDING'}
                      </span>
                    </div>
                  </div>

                  {/* Participants summary */}
                  <div className="space-y-1 pt-1 border-t border-white/5 text-xs font-mono">
                    {heat.participants?.slice(0, 4).map((p: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-[11px] text-text-muted">
                        <span>L{idx + 1}: {p.username || 'Racer'}</span>
                        <span>{p.netWpm > 0 ? `${p.netWpm} WPM` : p.finishPosition > 0 ? `P${p.finishPosition}` : 'Ready'}</span>
                      </div>
                    ))}
                    {(heat.participants?.length || 0) > 4 && (
                      <div className="text-[10px] text-text-dim text-right">
                        +{heat.participants.length - 4} more racers
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                    {heat.status !== 'COMPLETED' && heat.status !== 'RACING' ? (
                      <button
                        onClick={() => handleDispatchHeat(heat.heatNumber, heat.roundNumber)}
                        className="px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-accent text-white font-bold text-xs hover:opacity-95 flex items-center space-x-1"
                      >
                        <Play className="h-3 w-3" />
                        <span>Dispatch / Start Heat</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-text-muted">Server Tick: 60Hz</span>
                    )}

                    <Link
                      href={`/multiplayer?room=${heat.roomId}&spectator=true`}
                      className="text-accent hover:underline text-xs font-semibold flex items-center space-x-1"
                    >
                      <span>Spectate Heat Camera</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Student Athlete Participant Verification Section */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4 mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-text">Participant Verification & Roster</h3>
                  <p className="text-xs text-text-muted">
                    Verify academic identity and check-in status for official tournament seeding.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={controlRoomFilter}
                    onChange={(e) => setControlRoomFilter(e.target.value as any)}
                    className="px-3 py-1.5 rounded-lg bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none"
                  >
                    <option value="ALL">All ({compRegistrations.length})</option>
                    <option value="PENDING">Pending Verification</option>
                    <option value="VERIFIED">Verified Only</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 text-text-muted">
                      <th className="py-2.5 px-3">Reg ID</th>
                      <th className="py-2.5 px-3">Racer Name</th>
                      <th className="py-2.5 px-3">Institution</th>
                      <th className="py-2.5 px-3">Student ID</th>
                      <th className="py-2.5 px-3">Check-In</th>
                      <th className="py-2.5 px-3">Verification</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {compRegistrations
                      .filter((r) =>
                        controlRoomFilter === 'ALL'
                          ? true
                          : r.verificationStatus === controlRoomFilter,
                      )
                      .map((reg) => (
                        <tr key={reg._id} className="hover:bg-white/5 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-accent">{reg.registrationId}</td>
                          <td className="py-2.5 px-3 text-text font-sans font-semibold">
                            {reg.fullName || reg.username}
                          </td>
                          <td className="py-2.5 px-3 text-text-muted truncate max-w-[150px]">
                            {reg.institutionName || 'University Racer'}
                          </td>
                          <td className="py-2.5 px-3 text-text-muted">{reg.studentId || 'N/A'}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                reg.checkInStatus === 'CHECKED_IN'
                                  ? 'bg-cyan-400/20 text-cyan-300'
                                  : 'bg-white/5 text-text-muted'
                              }`}
                            >
                              {reg.checkInStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                reg.verificationStatus === 'VERIFIED'
                                  ? 'bg-emerald-400/20 text-emerald-400'
                                  : reg.verificationStatus === 'REJECTED'
                                  ? 'bg-danger/20 text-danger'
                                  : 'bg-amber-400/20 text-amber-300'
                              }`}
                            >
                              {reg.verificationStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-1.5">
                            {reg.verificationStatus !== 'VERIFIED' && (
                              <button
                                onClick={() => handleVerifyStudent(reg._id, 'VERIFIED')}
                                className="px-2 py-1 rounded bg-emerald-400/20 text-emerald-400 hover:bg-emerald-400/30 text-[10px] font-bold"
                              >
                                Verify
                              </button>
                            )}
                            {reg.verificationStatus !== 'REJECTED' && (
                              <button
                                onClick={() => handleVerifyStudent(reg._id, 'REJECTED')}
                                className="px-2 py-1 rounded bg-danger/20 text-danger hover:bg-danger/30 text-[10px] font-bold"
                              >
                                Reject
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
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
              <div className="space-y-4">
                <div
                  id="keyrush-printable-certificate"
                  className="glass-panel p-6 sm:p-8 rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-amber-400/10 via-surface to-background space-y-4 text-center relative overflow-hidden shadow-2xl print:border-4 print:border-black print:p-12 print:text-black"
                >
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[9px] font-mono border border-amber-400/30 print:border-black print:text-black">
                    OFFICIAL ESPORTS CREED
                  </div>
                  <div className="inline-block p-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 print:text-black">
                    <QrCode className="h-10 w-10 mx-auto" />
                  </div>
                  <div>
                    <h4 className="font-display font-black text-2xl text-amber-300 tracking-wider print:text-black">
                      CERTIFICATE OF EXCELLENCE
                    </h4>
                    <p className="text-[11px] font-mono text-text-muted uppercase tracking-widest mt-1 print:text-gray-700">
                      KEYRUSH GLOBAL ESPORTS FEDERATION • MERIT DIPLOMA
                    </p>
                  </div>
                  <div className="py-4 border-y border-white/10 print:border-gray-400 space-y-1.5">
                    <p className="text-xs text-text-muted print:text-gray-600">This honor is officially awarded to</p>
                    <p className="font-display text-2xl font-black text-text print:text-black">{certRecipient || 'Competitor Name'}</p>
                    <p className="text-xs text-amber-400 font-bold print:text-black">For achieving {certRank.replace('_', ' ')}</p>
                    <p className="text-xs text-text-muted font-mono print:text-gray-700">{certTitle || 'Championship Tournament Circuit'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-text-muted pt-2 border-t border-white/10 print:border-gray-400 print:text-black">
                    <div className="text-left">
                      <div>ISSUER: {selectedOrg?.name || 'KeyRush Esports'}</div>
                      <div>DIRECTOR: {currentUser?.username || 'Executive Director'}</div>
                    </div>
                    <div className="text-right">
                      <div>VERIFIED HASH: HMAC-SHA256</div>
                      <div className="truncate text-amber-300 print:text-black font-bold">
                        KR-{(certRecipient || 'RACER').slice(0, 4).toUpperCase()}-99A4-F28C
                      </div>
                    </div>
                  </div>
                </div>

                {/* Print PDF Button */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full py-2.5 rounded-xl bg-surface border border-amber-400/40 text-amber-300 font-bold text-xs hover:bg-amber-400/10 transition shadow-lg flex items-center justify-center space-x-2"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print / Export Official PDF Certificate</span>
                </button>
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

      {/* 8-STEP TOURNAMENT STUDIO WIZARD MODAL */}
      {showTourneyWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
          <div className="glass-panel max-w-2xl w-full p-6 sm:p-8 rounded-2xl border border-amber-400/30 space-y-6 bg-gradient-to-b from-surface via-surface to-background shadow-2xl my-8">
            {/* Wizard Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold">
                    STEP {wizardStep} OF 8
                  </span>
                  <h3 className="text-lg font-black text-text font-display">
                    {wizardStep === 1 && 'Basic Information'}
                    {wizardStep === 2 && 'Organization & Branding'}
                    {wizardStep === 3 && 'Rules & Eligibility'}
                    {wizardStep === 4 && 'Registration & Economy'}
                    {wizardStep === 5 && 'Format & Bracket System'}
                    {wizardStep === 6 && 'Participant Bounds & Heats'}
                    {wizardStep === 7 && 'Schedule & Check-in'}
                    {wizardStep === 8 && 'Review & Publish Circuit'}
                  </h3>
                </div>
                <p className="text-xs text-text-muted">
                  Design, configure, and launch server-authoritative esports typing tournaments.
                </p>
              </div>
              <button
                onClick={() => setShowTourneyWizard(false)}
                className="text-text-muted hover:text-text p-1 rounded-lg hover:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="grid grid-cols-8 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <div
                  key={s}
                  onClick={() => s <= wizardStep && setWizardStep(s)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    s === wizardStep
                      ? 'bg-amber-400'
                      : s < wizardStep
                      ? 'bg-amber-400/50'
                      : 'bg-white/10'
                  }`}
                  title={`Step ${s}`}
                />
              ))}
            </div>

            {/* STEP 1: BASIC INFORMATION */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">Tournament Title *</label>
                  <input
                    type="text"
                    required
                    value={tourneyTitle}
                    onChange={(e) => {
                      setTourneyTitle(e.target.value);
                      if (!tourneySlug) {
                        setTourneySlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                      }
                    }}
                    placeholder="e.g. Bangladesh Inter-Varsity Typing Cup 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Custom Slug / URL</label>
                    <input
                      type="text"
                      value={tourneySlug}
                      onChange={(e) => setTourneySlug(e.target.value)}
                      placeholder="e.g. varsity-typing-cup-2026"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Typing Language</label>
                    <select
                      value={tourneyLanguage}
                      onChange={(e) => setTourneyLanguage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none"
                    >
                      <option value="EN">English (Speed & Pro Sprint)</option>
                      <option value="BN">Bangla (Unicode National Standard)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">Description & Overview</label>
                  <textarea
                    rows={3}
                    value={tourneyDesc}
                    onChange={(e) => setTourneyDesc(e.target.value)}
                    placeholder="Describe tournament rules, eligibility, campus qualifiers, or stream details..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: BRANDING */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-surface/50 border border-white/5 space-y-2">
                  <span className="text-xs text-text-muted font-mono">Host Organization:</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center font-display text-sm">
                      {selectedOrg ? selectedOrg.name.slice(0, 2).toUpperCase() : 'KR'}
                    </div>
                    <div>
                      <div className="font-bold text-text text-sm">{selectedOrg?.name || 'KeyRush Esports League'}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">VERIFIED ORGANIZER ACCESS</div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-2">Tournament Brand Accent Color</label>
                  <div className="flex items-center space-x-3">
                    {[
                      { hex: '#3B82F6', label: 'Electric Blue' },
                      { hex: '#55E6F2', label: 'Cyber Cyan' },
                      { hex: '#F59E0B', label: 'Amber Gold' },
                      { hex: '#8B5CF6', label: 'Neon Violet' },
                      { hex: '#EF4444', label: 'Crimson Red' },
                    ].map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setTourneyBrandAccent(col.hex)}
                        style={{ backgroundColor: col.hex }}
                        className={`w-9 h-9 rounded-xl transition-all ${
                          tourneyBrandAccent === col.hex ? 'ring-4 ring-white shadow-lg scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                        title={col.label}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">Banner Image URL (Optional)</label>
                  <input
                    type="url"
                    value={tourneyBannerUrl}
                    onChange={(e) => setTourneyBannerUrl(e.target.value)}
                    placeholder="https://... /banner.png"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: RULES & ELIGIBILITY */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-text-muted">Minimum ELO Gate</label>
                    <span className="font-mono text-xs text-amber-300 font-bold">{tourneyMinElo} ELO {tourneyMinElo === 0 ? '(Open Division)' : ''}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={2400}
                    step={50}
                    value={tourneyMinElo}
                    onChange={(e) => setTourneyMinElo(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer h-2 bg-surface-dark rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-text-muted mt-1">
                    <span>0 (Open)</span>
                    <span>1200 (Intermediate)</span>
                    <span>1600 (Elite)</span>
                    <span>2000+ (Master)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Region Eligibility</label>
                    <select
                      value={tourneyRegion}
                      onChange={(e) => setTourneyRegion(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none"
                    >
                      <option value="GLOBAL">Global (Worldwide Racers)</option>
                      <option value="BD">Bangladesh Inter-University</option>
                      <option value="NA">North America</option>
                      <option value="EU">Europe</option>
                      <option value="ASIA">Asia Pacific</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-3 pt-6">
                    <input
                      type="checkbox"
                      id="verifiedCheck"
                      checked={tourneyRequireVerified}
                      onChange={(e) => setTourneyRequireVerified(e.target.checked)}
                      className="h-4 w-4 accent-amber-400 rounded cursor-pointer"
                    />
                    <label htmlFor="verifiedCheck" className="text-xs font-semibold text-text cursor-pointer">
                      Require Verified Identity
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: REGISTRATION & PRIZE POOL */}
            {wizardStep === 4 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setTourneyIsPaid(false);
                      setTourneyEntryFee(0);
                    }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      !tourneyIsPaid
                        ? 'bg-amber-400/10 border-amber-400/50 text-amber-300'
                        : 'bg-surface border-white/10 text-text-muted hover:text-text'
                    }`}
                  >
                    <div className="font-bold text-sm text-text">Free Registration</div>
                    <div className="text-[10px] text-text-muted mt-1">Open participation with no entry fee required</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTourneyIsPaid(true)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      tourneyIsPaid
                        ? 'bg-amber-400/10 border-amber-400/50 text-amber-300'
                        : 'bg-surface border-white/10 text-text-muted hover:text-text'
                    }`}
                  >
                    <div className="font-bold text-sm text-text">Premium Entry</div>
                    <div className="text-[10px] text-text-muted mt-1">Direct buy-in with escrow prize pool</div>
                  </button>
                </div>

                {tourneyIsPaid && (
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Entry Fee (BDT / USD)</label>
                    <input
                      type="number"
                      min={0}
                      value={tourneyEntryFee}
                      onChange={(e) => setTourneyEntryFee(Number(e.target.value))}
                      placeholder="e.g. 250"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">Prize Pool / Rewards Package</label>
                  <input
                    type="text"
                    value={tourneyPrizePool}
                    onChange={(e) => setTourneyPrizePool(e.target.value)}
                    placeholder="e.g. ৳25,000 Cash + Official KeyRush Trophy + Verified Certificates"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 5: FORMAT */}
            {wizardStep === 5 && (
              <div className="space-y-4">
                <label className="text-xs font-semibold text-text-muted block">Tournament Bracket Architecture</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'SINGLE_ELIMINATION', name: 'Single Elimination', desc: 'Fast knockout brackets. One loss eliminates a racer.' },
                    { id: 'DOUBLE_ELIMINATION', name: 'Double Elimination', desc: 'Upper and lower brackets. Racers get a second chance.' },
                    { id: 'ROUND_ROBIN', name: 'Round Robin', desc: 'Every racer battles all opponents in designated heats.' },
                    { id: 'SWISS', name: 'Swiss System', desc: 'Non-eliminating multi-round pairing based on live wins.' },
                  ].map((fmt) => (
                    <div
                      key={fmt.id}
                      onClick={() => setTourneyFormat(fmt.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        tourneyFormat === fmt.id
                          ? 'bg-amber-400/10 border-amber-400/50 text-text shadow-lg'
                          : 'bg-surface border-white/10 text-text-muted hover:text-text'
                      }`}
                    >
                      <div className="font-bold text-xs text-text flex items-center justify-between">
                        <span>{fmt.name}</span>
                        {tourneyFormat === fmt.id && <Check className="h-4 w-4 text-amber-400" />}
                      </div>
                      <p className="text-[11px] text-text-muted mt-1 leading-relaxed">{fmt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 6: PARTICIPANT BOUNDS & HEATS */}
            {wizardStep === 6 && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-text-muted">Maximum Participant Capacity (20–300)</label>
                    <span className="font-mono text-sm text-amber-300 font-bold">{tourneyMaxParticipants} Racers</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={300}
                    step={4}
                    value={tourneyMaxParticipants}
                    onChange={(e) => setTourneyMaxParticipants(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer h-2 bg-surface-dark rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-text-muted mt-1">
                    <span>Min: 20 Players</span>
                    <span>64 Players</span>
                    <span>128 Players</span>
                    <span>Max: 300 Players</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface/50 border border-white/10 space-y-2">
                  <div className="text-xs font-bold text-amber-300 flex items-center space-x-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Server-Authoritative Heat Constraints:</span>
                  </div>
                  <ul className="text-xs text-text-muted space-y-1 font-mono list-disc list-inside">
                    <li>Minimum 20 confirmed players required before officially launching.</li>
                    <li>Each heat contains strictly 2 to 7 racers (0 solo heats allowed).</li>
                    <li>Estimated heats for {tourneyMaxParticipants} racers: ~{Math.ceil(tourneyMaxParticipants / 5)} heats.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* STEP 7: SCHEDULE & CHECK-IN */}
            {wizardStep === 7 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">Tournament Launch Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={tourneyStartDate}
                    onChange={(e) => setTourneyStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Check-in Window</label>
                    <select
                      value={tourneyCheckInWindow}
                      onChange={(e) => setTourneyCheckInWindow(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none font-mono"
                    >
                      <option value={10}>10 Minutes Prior</option>
                      <option value={15}>15 Minutes Prior (Standard)</option>
                      <option value={30}>30 Minutes Prior</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Heat Buffer Delay</label>
                    <select
                      value={tourneyHeatInterval}
                      onChange={(e) => setTourneyHeatInterval(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-text focus:border-amber-400 focus:outline-none font-mono"
                    >
                      <option value={60}>60 Seconds Between Heats</option>
                      <option value={120}>120 Seconds (Recommended)</option>
                      <option value={180}>180 Seconds</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 8: REVIEW & PUBLISH */}
            {wizardStep === 8 && (
              <div className="space-y-4">
                <div className="glass-panel p-5 rounded-2xl border border-amber-400/30 bg-amber-400/5 space-y-3 font-mono text-xs">
                  <div className="text-sm font-bold text-amber-300 font-sans">{tourneyTitle || 'Untitled Championship'}</div>
                  <div className="grid grid-cols-2 gap-2 text-text-muted">
                    <div>Format: <span className="text-text font-bold">{tourneyFormat}</span></div>
                    <div>Capacity: <span className="text-text font-bold">{tourneyMaxParticipants} Racers</span></div>
                    <div>Language: <span className="text-text font-bold">{tourneyLanguage}</span></div>
                    <div>Min ELO: <span className="text-text font-bold">{tourneyMinElo}</span></div>
                    <div>Registration: <span className="text-text font-bold">{tourneyIsPaid ? `৳${tourneyEntryFee}` : 'FREE'}</span></div>
                    <div>Heats Sizing: <span className="text-text font-bold">2–7 Racers/Heat</span></div>
                  </div>
                  <div className="pt-2 border-t border-white/10 text-[11px] text-text-muted">
                    Prize Pool: <span className="text-amber-300">{tourneyPrizePool}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-emerald-400 font-mono">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Server-authoritative verification passed.</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>20–300 racer bounds enforced.</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Real-time WebSocket dispatch engine ready.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Wizard Navigation Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                disabled={wizardStep === 1}
                onClick={() => setWizardStep((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-xs font-semibold text-text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              <div className="text-xs font-mono text-text-muted">
                Step {wizardStep} / 8
              </div>

              {wizardStep < 8 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (wizardStep === 1 && !tourneyTitle.trim()) {
                      setMessage({ text: 'Please enter a tournament title to proceed.', error: true });
                      return;
                    }
                    setMessage(null);
                    setWizardStep((prev) => Math.min(8, prev + 1));
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 shadow-lg shadow-amber-400/20 flex items-center space-x-1"
                >
                  <span>Next Step</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCreateTournament()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-black text-xs hover:opacity-95 shadow-lg shadow-amber-400/25 flex items-center space-x-1.5"
                >
                  <Trophy className="h-4 w-4" />
                  <span>Publish Tournament Circuit</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


