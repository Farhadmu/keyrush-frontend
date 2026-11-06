'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  Flame,
  Award,
  Zap,
  Globe,
  Calendar,
  Shield,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Car,
} from 'lucide-react';
import { api } from '../../../lib/api';

export default function PlayerProfilePage() {
  const params = useParams();
  const username = params?.username as string;

  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProfile(username);
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Player profile not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-xs font-mono text-text-muted">Loading player dossier...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-secondary" />
        <h2 className="mt-4 font-display text-2xl font-bold text-text">Player Not Found</h2>
        <p className="mt-2 text-xs text-text-muted">
          No racer with the handle &quot;{username}&quot; is active on the KEYRUSH roster.
        </p>
        <Link
          href="/leaderboard"
          className="mt-6 inline-flex items-center space-x-2 rounded-xl bg-surface px-5 py-2.5 text-xs font-semibold text-text hover:bg-surface-light border border-white/10"
        >
          <span>View Global Leaderboard</span>
        </Link>
      </div>
    );
  }

  const user = profile.user || profile;
  const stats = profile.stats || {};
  const car = profile.car || { id: user.selectedCar || 'vulcan-gt', name: 'Vulcan GT', tier: 'PRO' };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-text-muted">
        <Link href="/leaderboard" className="hover:text-primary transition-colors">
          Leaderboards
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-mono text-text">Player: {user.username}</span>
      </nav>

      {/* Profile Header Hero */}
      <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-10 border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-primary to-accent font-display text-3xl font-black text-white shadow-xl shadow-primary/20">
                {user.username?.[0]?.toUpperCase() || 'R'}
              </div>
              <div className="absolute -bottom-2 -right-2 rounded-full border-2 border-surface-dark bg-warning px-2 py-0.5 font-mono text-[9px] font-black text-black">
                LVL {user.level || 1}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-black text-text">
                  {user.displayName || user.username}
                </h1>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary">
                  {user.tier || 'PRO_RACER'}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                <span className="font-mono">@{user.username}</span>
                <span>•</span>
                <span className="font-mono">ID: {user._id?.slice(-8) || 'KEYRUSH'}</span>
                <span>•</span>
                <span className="font-mono">{user.country || 'BD'}</span>
                {user.university && (
                  <>
                    <span>•</span>
                    <span className="text-text">{user.university}</span>
                  </>
                )}
              </div>

              <p className="mt-3 text-xs text-text-muted max-w-xl leading-relaxed">
                {user.bio || 'Competitive typing esports racer on the KEYRUSH circuit.'}
              </p>
            </div>
          </div>

          {/* Quick Rank Callout */}
          <div className="rounded-2xl border border-white/10 bg-surface-dark/70 p-4 text-center shrink-0 min-w-[140px]">
            <div className="text-[10px] font-mono uppercase text-text-muted">Global Ranking</div>
            <div className="mt-1 font-mono text-3xl font-black text-accent">
              #{stats.globalRank || user.rank || 1}
            </div>
            <div className="mt-1 text-[10px] font-mono text-emerald-400">
              National #{stats.countryRank || 1}
            </div>
          </div>
        </div>

        {/* Primary KPI Stats Cards */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 border-t border-white/10 pt-6">
          <div className="rounded-2xl border border-white/5 bg-surface-dark p-4 text-center">
            <div className="text-[10px] uppercase font-mono text-text-muted">Record Speed</div>
            <div className="mt-1 font-mono text-2xl font-black text-primary">
              {stats.bestWpm || user.bestWpm || 0} <span className="text-xs">WPM</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-surface-dark p-4 text-center">
            <div className="text-[10px] uppercase font-mono text-text-muted">Average Speed</div>
            <div className="mt-1 font-mono text-2xl font-black text-secondary">
              {stats.avgWpm || Math.round(user.averageWpm || 0)} <span className="text-xs">WPM</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-surface-dark p-4 text-center">
            <div className="text-[10px] uppercase font-mono text-text-muted">Accuracy</div>
            <div className="mt-1 font-mono text-2xl font-black text-emerald-400">
              {stats.avgAccuracy || user.accuracy || 98}%
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-surface-dark p-4 text-center">
            <div className="text-[10px] uppercase font-mono text-text-muted">Races Won / Total</div>
            <div className="mt-1 font-mono text-2xl font-black text-text">
              {stats.wins || user.racesWon || 0} / {stats.totalRaces || user.racesCompleted || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Vehicle Showcase */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-2">
            <Car className="h-4 w-4 text-accent" />
            <h3 className="font-display text-base font-bold text-text">Equipped Circuit Vehicle</h3>
          </div>
          <span className="font-mono text-xs text-text-muted">Chassis: {car.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-dark border border-white/5">
            <div className="h-24 w-44 flex items-center justify-center">
              <img
                src={`/assets/cars/${user.selectedCar || 'car-red'}.svg`}
                alt="Selected Car"
                className="max-h-full max-w-full drop-shadow-[0_10px_20px_rgba(255,0,85,0.3)]"
                onError={(e) => {
                  // fallback icon if asset missing
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="mt-3 font-display text-sm font-bold text-text">{car.name}</div>
            <div className="text-[10px] font-mono text-accent uppercase">{car.tier || 'PRO TIER'}</div>
          </div>

          <div className="md:col-span-2 space-y-3 font-mono text-xs">
            <div>
              <div className="flex justify-between text-text-muted mb-1">
                <span>Top Speed Velocity</span>
                <span className="text-text font-bold">96%</span>
              </div>
              <div className="h-2 rounded-full bg-surface-dark overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: '96%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-text-muted mb-1">
                <span>Nitro Boost Response</span>
                <span className="text-text font-bold">92%</span>
              </div>
              <div className="h-2 rounded-full bg-surface-dark overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-secondary to-accent" style={{ width: '92%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-text-muted mb-1">
                <span>Aerodynamic Keystroke Cadence</span>
                <span className="text-text font-bold">98%</span>
              </div>
              <div className="h-2 rounded-full bg-surface-dark overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-accent" style={{ width: '98%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

