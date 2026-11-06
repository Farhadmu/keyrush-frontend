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
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'heats'>('overview');

  useEffect(() => {
    setCurrentUser(getCurrentUser());
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
          const [regs, heatData] = await Promise.all([
            api.getCompetitionRegistrations(comp._id),
            api.getHeats(comp._id),
          ]);
          setRegistrations(regs || []);
          setHeats(heatData || []);
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

  const handleRegister = async () => {
    if (!currentUser) {
      setMessage({ text: 'You must be logged in to register for competitions.', error: true });
      return;
    }
    if (!competition) return;

    setRegistering(true);
    setMessage(null);
    try {
      const res = await api.registerCompetition(competition._id);
      setMessage({
        text: `Successfully registered! Your tournament seed is #${res.registration?.seedNumber || registrations.length + 1}.`,
        error: false,
      });
      loadCompetitionData();
    } catch (err: any) {
      setMessage({ text: err.message || 'Registration failed.', error: true });
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-xs font-mono text-text-muted">Loading tournament details...</p>
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

  const isUserRegistered = registrations.some(
    (r) => r.userId === currentUser?.id || r.user?._id === currentUser?.id
  );
  const minRequired = competition.settings?.minParticipants || 20;
  const maxCapacity = competition.settings?.maxParticipants || 300;
  const currentCount = competition.currentParticipantCount || registrations.length;
  const fillPercentage = Math.min(100, Math.round((currentCount / maxCapacity) * 100));
  const hasMetMinimum = currentCount >= minRequired;

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
                <span>Official Championship</span>
              </span>
              <span className="rounded-full border border-white/10 bg-surface px-3 py-1 font-mono text-xs text-accent">
                {competition.settings?.language || 'EN'}
              </span>
              <span
                className={`rounded-full px-3 py-1 font-mono text-xs font-semibold ${
                  competition.status === 'REGISTRATION_OPEN'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
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
              {competition.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-text-muted">
              <div className="flex items-center space-x-1.5 font-mono">
                <Calendar className="h-3.5 w-3.5 text-accent" />
                <span>Starts: {new Date(competition.startTime || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1.5 font-mono">
                <Clock className="h-3.5 w-3.5 text-secondary" />
                <span>Format: {competition.settings?.tournamentFormat || 'SINGLE_ELIMINATION'}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            {isUserRegistered ? (
              <div className="flex items-center justify-center space-x-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-3.5 text-xs font-bold text-emerald-400">
                <UserCheck className="h-4 w-4" />
                <span>Registered (Confirmed)</span>
              </div>
            ) : (
              <button
                onClick={handleRegister}
                disabled={registering || currentCount >= maxCapacity || competition.status !== 'REGISTRATION_OPEN'}
                className="flex items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-8 py-3.5 text-xs font-bold text-white shadow-xl shadow-primary/25 hover:opacity-95 disabled:opacity-40 transition-all"
              >
                <Flame className="h-4 w-4" />
                <span>{registering ? 'Reserving Slot...' : 'Register for Tournament'}</span>
              </button>
            )}

            <Link
              href={`/tournaments/${competition.slug || competition._id}/bracket`}
              className="flex items-center justify-center space-x-2 rounded-2xl border border-white/15 bg-surface px-6 py-3.5 text-xs font-bold text-text hover:bg-surface-light hover:border-primary/40 transition-all"
            >
              <GitBranch className="h-4 w-4 text-accent" />
              <span>Interactive Tournament Bracket</span>
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
            <span>Maximum Capacity: {maxCapacity} racers (Strict Limit)</span>
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
                  <span><strong>Server-Authoritative Anti-Cheat:</strong> All keystroke timestamps and cadences are validated server-side. Impossible speeds or synthetic script injection trigger immediate disqualification.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Heat Partitioning:</strong> Racers are seeded and distributed across 2–7 racer heats. No solitary heats are permitted.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Minimum Threshold:</strong> Tournaments require at least 20 confirmed racers to begin bracket execution.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Verifiable Credentials:</strong> Top finishers and participants receive cryptographically signed SHA-256 certificates verifiable on-chain/via public verification URLs.</span>
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
                  <span className="text-text-muted">Target Duration:</span>
                  <div className="font-bold text-text mt-1">{competition.settings?.passageLength || 60} seconds</div>
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
              Registered Participants ({registrations.length})
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
                      {reg.user?.username || reg.username || `Racer #${idx + 1}`}
                    </div>
                    <div className="text-[10px] font-mono text-text-muted">
                      Confirmed • {reg.status || 'CONFIRMED'}
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
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-text">
              Automated 2–7 Racer Qualifying Heats
            </h3>
            <span className="text-xs font-mono text-text-muted">
              {heats.length > 0 ? `${heats.length} Heats Generated` : 'Pending Generation'}
            </span>
          </div>

          {heats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {heats.map((heat) => (
                <div
                  key={heat._id || heat.heatNumber}
                  className="glass-panel rounded-3xl p-5 border border-white/10 hover:border-accent/40 transition-all"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="font-mono text-xs font-bold text-accent">
                      HEAT #{heat.heatNumber}
                    </span>
                    <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-mono text-text-muted">
                      {heat.participants?.length || 0} Racers (Cap: 7)
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {heat.participants?.map((p: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] text-text-dim">L{idx + 1}</span>
                          <span className="font-semibold text-text">{p.username || p.user?.username || `Racer ${idx + 1}`}</span>
                        </div>
                        <span className="font-mono text-[10px] text-accent">Seed #{p.seedNumber || idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-12 text-center text-xs text-text-muted border border-dashed border-white/10">
              Heats are generated automatically once confirmed participants reach at least 20 racers.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

