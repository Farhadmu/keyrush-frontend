'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, getCurrentUser, UserSession } from '../../lib/api';
import {
  Trophy,
  Flame,
  Zap,
  Target,
  Award,
  TrendingUp,
  Clock,
  Car,
  ChevronRight,
  Shield,
  Activity,
} from 'lucide-react';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [recentRaces, setRecentRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setCurrentUser(user);

    Promise.all([
      api.getMyDashboard().catch(() => null),
      api.getUserRaceHistory(5).catch(() => []),
    ]).then(([dash, races]) => {
      setDashboardData(dash);
      setRecentRaces(races || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="font-mono text-sm text-text-muted">Loading Telemetry & Stats...</span>
        </div>
      </div>
    );
  }

  const profile = dashboardData?.profile;
  const stats = profile?.stats || {
    totalRaces: 0,
    wins: 0,
    losses: 0,
    bestWpm: 0,
    averageWpm: 0,
    averageAccuracy: 0,
  };

  const winRate = stats.totalRaces > 0 ? Math.round((stats.wins / stats.totalRaces) * 100) : 0;
  const xpInCurrentLevel = (profile?.xp || 0) % 500;
  const xpPercent = Math.min(Math.round((xpInCurrentLevel / 500) * 100), 100);

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Profile Summary */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center space-x-5">
              <div className="relative">
                <img
                  src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt="Profile"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-accent shadow-lg shadow-accent/20"
                />
                <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-accent text-[10px] font-black text-black uppercase">
                  LVL {profile?.level || 1}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-text">
                    {profile?.displayName || currentUser?.username}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-bold uppercase tracking-wider">
                    {profile?.rank || 'ROOKIE'}
                  </span>
                </div>
                <p className="text-xs text-text-muted font-mono">
                  RACER ID #{currentUser?.id.slice(-6)} • {currentUser?.country || 'BD'} • Active Pilot
                </p>
                {/* XP Progress Bar */}
                <div className="pt-2 w-64 sm:w-80">
                  <div className="flex justify-between text-[10px] font-mono text-text-muted mb-1">
                    <span>XP Progress</span>
                    <span>{xpInCurrentLevel} / 500 XP</span>
                  </div>
                  <div className="h-2 w-full bg-surface-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/multiplayer"
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs shadow-lg shadow-primary/25 hover:opacity-90 transition-all"
              >
                <Flame className="h-4 w-4" />
                <span>Quick Race</span>
              </Link>
              <Link
                href="/practice"
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-text font-bold text-xs hover:bg-surface-light transition-all"
              >
                <Zap className="h-4 w-4 text-accent" />
                <span>Solo Practice</span>
              </Link>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium">Best Speed</span>
              <Zap className="h-4 w-4 text-yellow-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-text">
              {stats.bestWpm} <span className="text-xs font-sans text-text-muted">WPM</span>
            </div>
            <span className="text-[10px] text-accent font-mono">Personal Record</span>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium">Avg Accuracy</span>
              <Target className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-text">
              {stats.averageAccuracy}%
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">Precision Metric</span>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium">Win Rate</span>
              <Trophy className="h-4 w-4 text-accent" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-text">
              {winRate}%
            </div>
            <span className="text-[10px] text-text-muted font-mono">{stats.wins} W / {stats.losses} L</span>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium">Total Matches</span>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-text">
              {stats.totalRaces}
            </div>
            <span className="text-[10px] text-purple-400 font-mono">Ranked Battles</span>
          </div>
        </div>

        {/* Main Content: Recent Races & Garage */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Match History */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text flex items-center space-x-2">
                <Activity className="h-5 w-5 text-accent" />
                <span>Recent Match History</span>
              </h2>
              <Link href="/dashboard/history" className="text-xs text-primary hover:underline flex items-center">
                <span>View Full Log</span>
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </div>

            {recentRaces.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-xl space-y-3">
                <Flame className="h-8 w-8 text-text-muted mx-auto" />
                <p className="text-sm text-text-muted">No completed multiplayer matches recorded yet.</p>
                <Link
                  href="/multiplayer"
                  className="inline-block px-4 py-2 rounded-lg bg-primary/20 text-primary border border-primary/30 text-xs font-bold hover:bg-primary/30"
                >
                  Join Your First Race
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRaces.map((race) => {
                  const myParticipant = race.participants?.find((p: any) => p.userId === currentUser?.id);
                  const isWin = myParticipant?.rankPosition === 1;

                  return (
                    <div
                      key={race._id}
                      className="flex items-center justify-between p-4 rounded-xl bg-surface/60 border border-white/5 hover:border-white/15 transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold font-mono text-sm ${
                            isWin ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' : 'bg-surface-light text-text-muted'
                          }`}
                        >
                          #{myParticipant?.rankPosition || '-'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-text">{race.passageTitle || 'Cyber Circuit'}</div>
                          <div className="text-[11px] text-text-muted font-mono">
                            {new Date(race.createdAt).toLocaleDateString()} • {race.language}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-right font-mono">
                        <div>
                          <div className="text-sm font-bold text-accent">{myParticipant?.netWpm || 0} WPM</div>
                          <div className="text-[10px] text-text-muted">{myParticipant?.accuracy || 100}% ACC</div>
                        </div>
                        <Link
                          href={`/races/${race._id}`}
                          className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-xs text-text-muted"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Car Garage & Equipment */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text flex items-center space-x-2">
                <Car className="h-5 w-5 text-accent" />
                <span>Selected Vehicle</span>
              </h2>
              <Link href="/dashboard/profile" className="text-xs text-primary hover:underline">
                Change Car
              </Link>
            </div>

            <div className="p-4 rounded-xl bg-surface/60 border border-white/5 flex flex-col items-center text-center space-y-3">
              <img
                src="/assets/cars/car_cyber_phantom.svg"
                alt="Active Car"
                className="w-36 h-auto drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
              />
              <div>
                <div className="text-base font-black text-text">Cyber Phantom GT</div>
                <div className="text-xs text-accent font-mono">Hyper-EV Class • 360 KM/H</div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-2 pt-2">
              <Link
                href="/dashboard/analytics"
                className="flex items-center justify-between p-3 rounded-xl bg-surface hover:bg-surface-light border border-white/5 transition-all text-xs font-semibold text-text"
              >
                <span>AI Typing Coach & Telemetry</span>
                <ChevronRight className="h-4 w-4 text-text-muted" />
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center justify-between p-3 rounded-xl bg-surface hover:bg-surface-light border border-white/5 transition-all text-xs font-semibold text-text"
              >
                <span>Security & Two-Factor Auth</span>
                <ChevronRight className="h-4 w-4 text-text-muted" />
              </Link>
              <Link
                href="/dashboard/history"
                className="flex items-center justify-between p-3 rounded-xl bg-surface hover:bg-surface-light border border-white/5 transition-all text-xs font-semibold text-text"
              >
                <span>Practice Weakness Heatmap</span>
                <ChevronRight className="h-4 w-4 text-text-muted" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
