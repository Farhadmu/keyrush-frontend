'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  Users,
  Shield,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  GitBranch,
  Flame,
  UserCheck,
  GraduationCap,
  Building2,
  QrCode,
  ArrowRight,
  Play,
  X,
} from 'lucide-react';
import { api, getCurrentUser, UserSession } from '../../../lib/api';

export default function CompetitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [competition, setCompetition] = useState<any | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [heats, setHeats] = useState<any[]>([]);
  const [myRegistration, setMyRegistration] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'heats'>('overview');
  const [selectedRound, setSelectedRound] = useState<number>(1);

  // Student Esports Registration Form State
  const [regForm, setRegForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: 'BD',
    city: 'Dhaka',
    institutionName: '',
    department: '',
    studentId: '',
    registrationNumber: '',
    academicBatch: '2023-2027',
    currentSemester: '5th',
    graduationYear: 2027,
    preferredLanguage: 'EN',
    teamName: '',
    competitionExperience: 'INTERMEDIATE',
    agreeRules: false,
  });

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setRegForm((prev) => ({
        ...prev,
        fullName: user.username || '',
        email: user.email || '',
      }));
    }
    if (slug) {
      loadCompetitionData();
    }
  }, [slug]);

  const loadCompetitionData = async () => {
    setLoading(true);
    try {
      const comp = await api.getCompetition(slug);
      setCompetition(comp);

      if (comp?._id) {
        try {
          const [regs, heatData, myReg] = await Promise.all([
            api.getCompetitionRegistrations(comp._id),
            api.getHeats(comp._id),
            api.getMyRegistration(comp._id).catch(() => null),
          ]);
          setRegistrations(regs || []);
          setHeats(heatData || []);
          if (myReg?.registration) {
            setMyRegistration(myReg.registration);
          }
        } catch {
          // ignore sub-resource errors
        }
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Competition not found', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRegisterModal = () => {
    if (!currentUser) {
      router.push('/login?redirect=/competitions/' + slug);
      return;
    }
    // Prevent organizers and super admins from registering as players
    const roles = currentUser.roles || [];
    if (roles.includes('ORGANIZER') || roles.includes('SUPER_ADMIN')) {
      setMessage({
        text: 'Organizers and Administrators cannot participate in competitive gameplay. Please log in with a USER account.',
        error: true,
      });
      return;
    }
    setShowRegModal(true);
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competition) return;

    if (!regForm.agreeRules) {
      setMessage({ text: 'You must accept tournament regulations and fair play policy.', error: true });
      return;
    }

    if (!regForm.institutionName || !regForm.studentId) {
      setMessage({ text: 'University / Institution name and Student ID are required for student esports.', error: true });
      return;
    }

    setRegistering(true);
    setMessage(null);
    try {
      const res = await api.registerStudent(competition._id, regForm);
      setShowRegModal(false);
      setMessage({
        text: `Registration Successful! Assigned ID: ${res.registration?.registrationId || 'CONFIRMED'}. Verification pending.`,
        error: false,
      });
      loadCompetitionData();
    } catch (err: any) {
      setMessage({ text: err.message || 'Registration failed.', error: true });
    } finally {
      setRegistering(false);
    }
  };

  const handleCheckIn = async () => {
    if (!competition) return;
    setCheckingIn(true);
    setMessage(null);
    try {
      const res = await api.checkInParticipant(competition._id);
      setMessage({ text: res.message || 'Check-in confirmed! You are marked PRESENT for official heats.', error: false });
      loadCompetitionData();
    } catch (err: any) {
      setMessage({ text: err.message || 'Check-in failed.', error: true });
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-xs font-mono text-text-muted">Loading esports tournament details...</p>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-danger" />
        <h2 className="mt-4 font-display text-2xl font-bold text-text">Tournament Not Found</h2>
        <p className="mt-2 text-xs text-text-muted">
          The requested championship does not exist or may have been archived.
        </p>
        <Link
          href="/competitions"
          className="mt-6 inline-flex items-center space-x-2 rounded-xl bg-surface px-5 py-2.5 text-xs font-semibold text-text hover:bg-surface-light border border-white/10"
        >
          <span>Return to Competitions</span>
        </Link>
      </div>
    );
  }

  const isUserRegistered = !!myRegistration || registrations.some(
    (r) => r.userId === currentUser?.id || r.user?._id === currentUser?.id
  );
  const minRequired = competition.settings?.minParticipants || 20;
  const maxCapacity = competition.settings?.maxParticipants || 300;
  const currentCount = competition.currentParticipantCount || registrations.length;
  const fillPercentage = Math.min(100, Math.round((currentCount / maxCapacity) * 100));
  const hasMetMinimum = currentCount >= minRequired;

  const userRoles = currentUser?.roles || [];
  const isOrganizerOrAdmin = userRoles.includes('ORGANIZER') || userRoles.includes('SUPER_ADMIN');

  // Round filtering for heats
  const availableRounds = Array.from(new Set(heats.map((h) => h.roundNumber || 1))).sort((a, b) => a - b);
  const filteredHeats = heats.filter((h) => (h.roundNumber || 1) === selectedRound);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-text-muted">
        <Link href="/competitions" className="hover:text-primary transition-colors">
          Competitions
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-mono text-text">{competition.slug}</span>
      </nav>

      {/* Banner / Header Card */}
      <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-10 border border-white/10">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-primary/20 via-accent/10 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 relative z-10">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Trophy className="h-3 w-3" />
                <span>Inter-University Esports</span>
              </span>
              <span className="rounded-full border border-white/10 bg-surface px-3 py-1 font-mono text-xs text-accent">
                {competition.settings?.language || 'EN'}
              </span>
              <span
                className={`rounded-full px-3 py-1 font-mono text-xs font-semibold ${
                  competition.status === 'REGISTRATION_OPEN'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : competition.status === 'CHECK_IN_OPEN'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : competition.status === 'IN_PROGRESS'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'bg-white/10 text-text-muted border border-white/10'
                }`}
              >
                {competition.status}
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-text tracking-tight">
              {competition.title}
            </h1>
            <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
              {competition.description || 'National inter-university typing championship. Compete for institutional glory and digital credentials.'}
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-text-muted">
              <div className="flex items-center space-x-1.5 font-mono">
                <Calendar className="h-3.5 w-3.5 text-accent" />
                <span>Event Date: {new Date(competition.eventStart || competition.startTime || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1.5 font-mono">
                <Clock className="h-3.5 w-3.5 text-secondary" />
                <span>Format: {competition.settings?.tournamentFormat || 'SINGLE_ELIMINATION'}</span>
              </div>
              <div className="flex items-center space-x-1.5 font-mono">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span>Host: {competition.institution || 'KEYRUSH Esports Federation'}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            {isOrganizerOrAdmin ? (
              <Link
                href="/organizer"
                className="flex items-center justify-center space-x-2 rounded-2xl border border-primary/40 bg-primary/10 px-6 py-3.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all"
              >
                <Shield className="h-4 w-4" />
                <span>Organizer Control Center</span>
              </Link>
            ) : isUserRegistered ? (
              <div className="flex items-center justify-center space-x-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-3.5 text-xs font-bold text-emerald-400">
                <UserCheck className="h-4 w-4" />
                <span>Racer Enrolled</span>
              </div>
            ) : (
              <button
                onClick={handleOpenRegisterModal}
                disabled={registering || currentCount >= maxCapacity || (competition.status !== 'REGISTRATION_OPEN' && competition.status !== 'PUBLISHED')}
                className="flex items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-8 py-3.5 text-xs font-bold text-white shadow-xl shadow-primary/25 hover:opacity-95 disabled:opacity-40 transition-all"
              >
                <Flame className="h-4 w-4" />
                <span>Register for Tournament</span>
              </button>
            )}

            <Link
              href={`/tournaments/${competition.slug || competition._id}/bracket`}
              className="flex items-center justify-center space-x-2 rounded-2xl border border-white/15 bg-surface px-6 py-3.5 text-xs font-bold text-text hover:bg-surface-light hover:border-primary/40 transition-all"
            >
              <GitBranch className="h-4 w-4 text-accent" />
              <span>Bracket Progression</span>
            </Link>
          </div>
        </div>

        {/* Capacity Bar & Limits */}
        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-text-muted">Registration Capacity</span>
            <span className="text-text font-bold">
              {currentCount} / {maxCapacity} racers ({fillPercentage}%)
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-surface-dark overflow-hidden border border-white/5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                hasMetMinimum
                  ? 'bg-gradient-to-r from-emerald-500 to-accent'
                  : 'bg-gradient-to-r from-primary to-amber-500'
              }`}
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-text-dim">
            <span>Minimum to Start: {minRequired} racers {hasMetMinimum ? '✓ Met' : '⚠ Required'}</span>
            <span>Heat Sizing: Strictly 2–7 racers per heat</span>
          </div>
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
          {message.error ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* STUDENT REGISTRATION CONFIRMATION CARD (For Enrolled Players) */}
      {myRegistration && (
        <div className="glass-panel relative overflow-hidden rounded-3xl p-6 border border-primary/30 bg-primary/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Official Athlete Credential</div>
                <div className="font-mono text-lg font-extrabold text-text">{myRegistration.registrationId}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 font-mono text-xs font-bold ${
                  myRegistration.verificationStatus === 'VERIFIED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : myRegistration.verificationStatus === 'REJECTED'
                    ? 'bg-danger/20 text-danger border border-danger/40'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}
              >
                Status: {myRegistration.verificationStatus}
              </span>

              <span
                className={`rounded-full px-3 py-1 font-mono text-xs font-bold ${
                  myRegistration.checkInStatus === 'CHECKED_IN'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'bg-white/10 text-text-muted border border-white/10'
                }`}
              >
                Check-in: {myRegistration.checkInStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono pt-2 border-t border-white/5">
            <div>
              <span className="text-text-muted">Institution:</span>
              <div className="font-bold text-text truncate">{myRegistration.institutionName || 'University Racer'}</div>
            </div>
            <div>
              <span className="text-text-muted">Student ID:</span>
              <div className="font-bold text-text">{myRegistration.studentId || 'N/A'}</div>
            </div>
            <div>
              <span className="text-text-muted">Assigned Heat:</span>
              <div className="font-bold text-accent">
                {myRegistration.assignedHeat ? `Heat #${myRegistration.assignedHeat}` : 'Pending Seeding'}
              </div>
            </div>
            <div>
              <span className="text-text-muted">Language:</span>
              <div className="font-bold text-secondary">{myRegistration.preferredLanguage || 'EN'}</div>
            </div>
          </div>

          {/* Check-In CTA Button if Check-in is active and not yet checked in */}
          {myRegistration.checkInStatus !== 'CHECKED_IN' && (
            <div className="pt-2 flex items-center justify-between border-t border-white/5">
              <span className="text-xs text-text-muted">
                {competition.status === 'CHECK_IN_OPEN'
                  ? 'Official check-in is currently open! Confirm your presence.'
                  : 'Check-in opens prior to heat dispatch.'}
              </span>
              <button
                onClick={handleCheckIn}
                disabled={checkingIn || competition.status !== 'CHECK_IN_OPEN'}
                className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-cyan-500 to-primary px-5 py-2 text-xs font-bold text-white shadow-lg disabled:opacity-40"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{checkingIn ? 'Checking In...' : 'Check-In for Event'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/10 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors ${
            activeTab === 'overview'
              ? 'border-b-2 border-primary text-primary'
              : 'text-text-muted hover:text-text'
          }`}
        >
          Overview & Rules
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`pb-3 transition-colors ${
            activeTab === 'participants'
              ? 'border-b-2 border-primary text-primary'
              : 'text-text-muted hover:text-text'
          }`}
        >
          Confirmed Racers ({registrations.length})
        </button>
        <button
          onClick={() => setActiveTab('heats')}
          className={`pb-3 transition-colors ${
            activeTab === 'heats'
              ? 'border-b-2 border-primary text-primary'
              : 'text-text-muted hover:text-text'
          }`}
        >
          Qualifying Heats ({heats.length})
        </button>
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="glass-panel rounded-3xl p-6 space-y-4">
              <h3 className="font-display text-lg font-bold text-text">Tournament Regulations</h3>
              <ul className="space-y-2.5 text-xs text-text-muted leading-relaxed">
                <li className="flex items-start space-x-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Server-Authoritative Keystrokes:</strong> All typing input is verified against the official text buffer character-by-character on the backend. Client-submitted WPM or progress cannot be spoofed.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Balanced 2–7 Heat Partitioning:</strong> Competitors are partitioned into heats containing between 2 and 7 racers. No racer ever competes in isolation.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Institutional Fairness:</strong> Seeding distributes students from the same university across different qualifying heats to prevent early peer knockouts.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Cryptographic Credentials:</strong> All finishers receive SHA-256 verifiable digital certificates.</span>
                </li>
              </ul>
            </div>

            <div className="glass-panel rounded-3xl p-6">
              <h3 className="font-display text-lg font-bold text-text mb-4">Passage Specifications</h3>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="rounded-xl border border-white/5 bg-surface p-3">
                  <span className="text-text-muted">Language:</span>
                  <div className="font-bold text-text mt-1">{competition.settings?.language === 'BN' ? 'Bangla (IME Composition)' : 'English (Punctuation & Numbers)'}</div>
                </div>
                <div className="rounded-xl border border-white/5 bg-surface p-3">
                  <span className="text-text-muted">Race Duration:</span>
                  <div className="font-bold text-text mt-1">{competition.settings?.raceDurationSeconds || 60} seconds</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 space-y-4">
              <h4 className="font-display text-xs font-bold tracking-wider text-text uppercase">Tournament Metadata</h4>
              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-text-muted">Tournament ID:</span>
                  <span className="text-text truncate max-w-[120px]">{competition._id}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-text-muted">Min Racers:</span>
                  <span className="text-accent font-bold">{minRequired}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-text-muted">Max Capacity:</span>
                  <span className="text-secondary font-bold">{maxCapacity}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-text-muted">Heat Lane Cap:</span>
                  <span className="text-emerald-400 font-bold">2–7 racers</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/tournaments/${competition.slug || competition._id}/bracket`}
                  className="flex w-full items-center justify-center space-x-2 rounded-xl bg-surface px-4 py-2.5 text-xs font-semibold text-text hover:bg-surface-light border border-white/10"
                >
                  <span>View Bracket Progression</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Participants */}
      {activeTab === 'participants' && (
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-base font-bold text-text">
              Confirmed Competitors ({registrations.length})
            </h3>
            <span className="text-xs font-mono text-text-muted">
              Capacity: {registrations.length} / {maxCapacity}
            </span>
          </div>

          {registrations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {registrations.map((reg, idx) => (
                <div
                  key={reg._id || idx}
                  className="flex items-center space-x-3 rounded-2xl border border-white/5 bg-surface p-3.5 hover:border-white/15 transition-all"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-mono text-xs font-bold">
                    #{reg.seedNumber || idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-xs text-text">
                      {reg.fullName || reg.username || `Racer #${idx + 1}`}
                    </div>
                    <div className="text-[10px] font-mono text-text-muted truncate">
                      {reg.institutionName || 'University Racer'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-xs text-text-muted">
              No participants have registered yet. Be the first to claim Seed #1!
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Qualifying Heats */}
      {activeTab === 'heats' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-bold text-text">
                Tournament Heats & Live Dispatches
              </h3>
              <p className="text-xs text-text-muted">Each heat hosts strictly 2 to 7 racers in real-time WebGL synchronization.</p>
            </div>

            {/* Round Filter Tabs */}
            {availableRounds.length > 1 && (
              <div className="flex items-center space-x-2 bg-surface p-1 rounded-xl border border-white/10">
                {availableRounds.map((rnd) => (
                  <button
                    key={rnd}
                    onClick={() => setSelectedRound(rnd)}
                    className={`px-3 py-1 text-xs font-mono rounded-lg transition-all ${
                      selectedRound === rnd
                        ? 'bg-primary text-white font-bold'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    Round {rnd}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filteredHeats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHeats.map((heat) => {
                const isUserInThisHeat = heat.participants?.some(
                  (p: any) => p.userId?.toString() === currentUser?.id
                );
                return (
                  <div
                    key={heat._id || heat.heatNumber}
                    className={`glass-panel rounded-3xl p-5 border transition-all ${
                      isUserInThisHeat
                        ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/40'
                        : 'border-white/10 hover:border-accent/40'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-accent">
                            HEAT #{heat.heatNumber}
                          </span>
                          {isUserInThisHeat && (
                            <span className="rounded-full bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5">
                              YOUR HEAT
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-text-dim">{heat.roomId || 'Room Pending'}</div>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold ${
                          heat.status === 'RACING'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                            : heat.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-white/5 text-text-muted'
                        }`}
                      >
                        {heat.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {heat.participants?.map((p: any, idx: number) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs ${
                            p.userId?.toString() === currentUser?.id
                              ? 'bg-primary/20 text-primary border border-primary/30 font-bold'
                              : 'bg-surface text-text'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[10px] text-text-dim">L{idx + 1}</span>
                            <span className="truncate max-w-[120px]">{p.username || `Racer ${idx + 1}`}</span>
                          </div>
                          <div className="flex items-center space-x-2 font-mono text-[11px]">
                            {p.finishPosition > 0 && (
                              <span className="text-emerald-400 font-bold">P{p.finishPosition}</span>
                            )}
                            {p.netWpm > 0 && <span>{p.netWpm} WPM</span>}
                            {p.finishPosition === 0 && <span className="text-text-dim">Seed #{p.seedNumber || idx + 1}</span>}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Enter Race Room CTA if racing or ready */}
                    {isUserInThisHeat && (heat.status === 'RACING' || heat.status === 'READY') && (
                      <div className="mt-4 pt-3 border-t border-white/5">
                        <Link
                          href={`/multiplayer?room=${heat.roomId}`}
                          className="flex items-center justify-center space-x-2 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-accent py-2 text-xs font-bold text-white shadow-lg hover:opacity-95"
                        >
                          <Play className="h-3.5 w-3.5" />
                          <span>Enter Heat Race</span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-12 text-center text-xs text-text-muted border border-dashed border-white/10">
              Heats are generated automatically once confirmed participants reach at least 20 racers.
            </div>
          )}
        </div>
      )}

      {/* STUDENT REGISTRATION MODAL */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="glass-panel max-w-2xl w-full rounded-3xl p-6 sm:p-8 border border-white/15 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-text">Student Esports Registration</h3>
                  <p className="text-xs text-text-muted">Enter verified student credentials for official tournament seeding.</p>
                </div>
              </div>
              <button
                onClick={() => setShowRegModal(false)}
                className="rounded-xl p-2 text-text-muted hover:bg-white/10 hover:text-text transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRegistration} className="space-y-6">
              {/* Personal Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-accent font-mono">1. Personal Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-text-muted mb-1 block">Full Legal Name</label>
                    <input
                      type="text"
                      required
                      value={regForm.fullName}
                      onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                      placeholder="e.g. Farhadul Islam"
                      className="w-full rounded-xl bg-surface border border-white/10 px-3 py-2 text-text focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-text-muted mb-1 block">Academic Email</label>
                    <input
                      type="email"
                      required
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      placeholder="student@university.edu.bd"
                      className="w-full rounded-xl bg-surface border border-white/10 px-3 py-2 text-text focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-text-muted mb-1 block">Contact Phone</label>
                    <input
                      type="tel"
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      placeholder="+880 1700-000000"
                      className="w-full rounded-xl bg-surface border border-white/10 px-3 py-2 text-text focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-text-muted mb-1 block">City / Region</label>
                    <input
                      type="text"
                      value={regForm.city}
                      onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                      placeholder="Dhaka"
                      className="w-full rounded-xl bg-surface border border-white/10 px-3 py-2 text-text focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-secondary font-mono">2. Academic Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="text-text-muted mb-1 block">University / College Name *</label>
                    <input
                      type="text"
                      required
                      value={regForm.institutionName}
                      onChange={(e) => setRegForm({ ...regForm, institutionName: e.target.value })}
                      placeholder="e.g. Dhaka University / BUET / NSU"
                      className="w-full rounded-xl bg-surface border border-white/10 px-3 py-2 text-text focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-text-muted mb-1 block">Department / Major</label>
                    <input
                      type="text"
                      value={regForm.department}
                      onChange={(e) => setRegForm({ ...regForm, department: e.target.value })}
                      placeholder="Computer Science & Engineering"
                      className="w-full rounded-xl bg-surface border border-white/10 px-3 py-2 text-text focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-text-muted mb-1 block">Student ID Number *</label>
                    <input
                      type="text"
                      required
                      value={regForm.studentId}
                      onChange={(e) => setRegForm({ ...regForm, studentId: e.target.value })}
                      placeholder="e.g. 2022-CSE-042"
                      className="w-full rounded-xl bg-surface border border-white/10 px-3 py-2 text-text focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-text-muted mb-1 block">Academic Batch</label>
                    <input
                      type="text"
                      value={regForm.academicBatch}
                      onChange={(e) => setRegForm({ ...regForm, academicBatch: e.target.value })}
                      placeholder="2022-2026"
                      className="w-full rounded-xl bg-surface border border-white/10 px-3 py-2 text-text focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-text-muted mb-1 block">Expected Graduation Year</label>
                    <input
                      type="number"
                      value={regForm.graduationYear}
                      onChange={(e) => setRegForm({ ...regForm, graduationYear: parseInt(e.target.value, 10) || 2027 })}
                      className="w-full rounded-xl bg-surface border border-white/10 px-3 py-2 text-text focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Competition Preferences */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary font-mono">3. Competition Preferences</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-text-muted mb-1 block">Typing Language</label>
                    <select
                      value={regForm.preferredLanguage}
                      onChange={(e) => setRegForm({ ...regForm, preferredLanguage: e.target.value })}
                      className="w-full rounded-xl bg-surface border border-white/10 px-3 py-2 text-text focus:border-primary focus:outline-none"
                    >
                      <option value="EN">English (QWERTY)</option>
                      <option value="BN">Bangla (Bijoy / Avro Phonetic)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-text-muted mb-1 block">Esports Team / Club (Optional)</label>
                    <input
                      type="text"
                      value={regForm.teamName}
                      onChange={(e) => setRegForm({ ...regForm, teamName: e.target.value })}
                      placeholder="e.g. CyberVipers Esports"
                      className="w-full rounded-xl bg-surface border border-white/10 px-3 py-2 text-text focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Fair Play & Consent */}
              <div className="rounded-2xl border border-white/10 bg-surface/50 p-4 space-y-2 text-xs">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regForm.agreeRules}
                    onChange={(e) => setRegForm({ ...regForm, agreeRules: e.target.checked })}
                    className="mt-0.5 rounded border-white/20 bg-surface text-primary focus:ring-primary"
                  />
                  <span className="text-text-muted text-[11px] leading-relaxed">
                    I certify that all academic information provided is true and accurate. I agree to abide by official tournament regulations, submit to real-time server-authoritative keystroke verification, and accept anti-cheat decisions as final.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="rounded-xl bg-surface px-5 py-2.5 text-xs font-semibold text-text-muted hover:text-text border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering || !regForm.agreeRules}
                  className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-primary to-accent px-7 py-2.5 text-xs font-bold text-white shadow-lg disabled:opacity-40"
                >
                  <Flame className="h-4 w-4" />
                  <span>{registering ? 'Submitting Registration...' : 'Complete Esports Registration'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
