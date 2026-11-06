'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import RacingCanvas, { RacerVisualState } from '../game/RacingCanvas';
import { api } from '../lib/api';
import {
  Zap,
  Trophy,
  Users,
  ShieldCheck,
  ChevronRight,
  Flame,
  Award,
  Globe,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);

  // Demo interactive racing cars for hero preview
  const [heroRacers, setHeroRacers] = useState<RacerVisualState[]>([
    {
      userId: 'p1',
      username: 'ApexPredator',
      carId: 'car_cyber_phantom',
      progressPercent: 78,
      speed: 310,
      nitroActive: true,
      rankPosition: 1,
      finished: false,
      isCurrentPlayer: true,
    },
    {
      userId: 'p2',
      username: 'VelocityQueen',
      carId: 'car_neon_viper',
      progressPercent: 69,
      speed: 280,
      nitroActive: false,
      rankPosition: 2,
      finished: false,
    },
    {
      userId: 'p3',
      username: 'DhakaDrifter',
      carId: 'car_crimson_fury',
      progressPercent: 54,
      speed: 245,
      nitroActive: false,
      rankPosition: 3,
      finished: false,
    },
    {
      userId: 'p4',
      username: 'CyberByte',
      carId: 'car_solaris_drift',
      progressPercent: 48,
      speed: 220,
      nitroActive: false,
      rankPosition: 4,
      finished: false,
    },
  ]);

  useEffect(() => {
    // Dynamic simulation in Hero demo
    const interval = setInterval(() => {
      setHeroRacers(prev =>
        prev.map(racer => {
          let nextProgress = racer.progressPercent + (racer.speed / 100) * 0.4;
          if (nextProgress >= 100) nextProgress = 0;
          return {
            ...racer,
            progressPercent: nextProgress,
            nitroActive: nextProgress > 60 && nextProgress < 85,
          };
        }),
      );
    }, 100);

    // Fetch live platform data
    api.getCompetitions().then(data => setCompetitions(data.slice(0, 3))).catch(() => {});
    api.getGlobalLeaderboard(5).then(data => setLeaderboard(data)).catch(() => {});
    api.getOrganizations().then(data => setOrganizations(data.slice(0, 4))).catch(() => {});

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col space-y-24 py-10">
      {/* 1. Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next-Gen Esports Typing Platform</span>
          </div>

          <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-text sm:text-6xl lg:text-7xl">
            Your Typing Speed.{' '}
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Your Racing Power.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
            Practice, compete, and race against players worldwide. Turn every keystroke into speed, chain error-free streaks to trigger Nitro, and lead your university to global victory.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="group flex items-center space-x-2 rounded-xl bg-gradient-to-r from-primary to-accent px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-primary/25 hover:opacity-95 transition-all"
            >
              <span>Start Racing</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/competitions"
              className="flex items-center space-x-2 rounded-xl border border-white/10 bg-surface/80 px-7 py-3.5 text-sm font-semibold text-text hover:bg-surface-light transition-all backdrop-blur-md"
            >
              <Trophy className="h-4 w-4 text-warning" />
              <span>Explore Competitions</span>
            </Link>
          </div>
        </div>

        {/* Hero Interactive Racing Preview */}
        <div className="mt-14 w-full">
          <RacingCanvas racers={heroRacers} raceStarted={true} />
        </div>
      </section>

      {/* 2. Platform Core Pillars */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-panel rounded-2xl p-6 transition-all hover:border-primary/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Flame className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-text">2–7 Player Multiplayer</h3>
            <p className="mt-2 text-xs leading-relaxed text-text-muted">
              Server-authoritative physics engine. Authenticated accounts only, zero guest pollution, zero client-trust scoring.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 transition-all hover:border-accent/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Trophy className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-text">20–300 Player Events</h3>
            <p className="mt-2 text-xs leading-relaxed text-text-muted">
              Automated Heat Scheduler partitions large-scale tournaments into balanced qualifying heats without overloading rooms.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 transition-all hover:border-secondary/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-text">English & Bangla IME</h3>
            <p className="mt-2 text-xs leading-relaxed text-text-muted">
              Deep Unicode composition event integration for Avro & Bijoy typing without penalty on intermediate keystrokes.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 transition-all hover:border-emerald-500/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-text">Anti-Cheat Biometrics</h3>
            <p className="mt-2 text-xs leading-relaxed text-text-muted">
              Server-side cadence variance check and speed sanity verification safeguard fair competition and verifiable certificates.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Upcoming Official Championships */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-text">Official Championships</h2>
            <p className="text-xs text-text-muted">Events enforce 20 to 300 participant brackets with balanced 2–7 racer heats.</p>
          </div>
          <Link href="/competitions" className="mt-2 sm:mt-0 text-xs font-semibold text-primary hover:text-accent flex items-center space-x-1">
            <span>View All Competitions</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {competitions.length > 0 ? (
            competitions.map((comp) => (
              <div key={comp._id} className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-accent">
                    <span className="rounded-md bg-accent/10 px-2 py-0.5">{comp.settings?.language || 'EN'}</span>
                    <span className="text-text-muted">{comp.currentParticipantCount || 0} / {comp.settings?.maxParticipants || 300} Racers</span>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-bold text-text">{comp.title}</h3>
                  <p className="mt-2 text-xs text-text-muted line-clamp-2">{comp.description}</p>
                </div>

                <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400">STATUS: {comp.status}</span>
                  <Link
                    href={`/competitions`}
                    className="rounded-lg bg-primary/20 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 rounded-2xl border border-dashed border-white/10 p-8 text-center text-text-muted">
              Loading active championships...
            </div>
          )}
        </div>
      </section>

      {/* 4. Global Leaderboard Preview */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Leaderboard Table */}
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-warning" />
                <h3 className="font-display text-lg font-bold text-text">Global Velocity Hall of Fame</h3>
              </div>
              <Link href="/leaderboard" className="text-xs font-semibold text-primary hover:underline">
                Full Standings
              </Link>
            </div>

            <div className="mt-4 divide-y divide-white/5">
              {leaderboard.length > 0 ? (
                leaderboard.map((player) => (
                  <div key={player.rank} className="flex items-center justify-between py-3 text-xs">
                    <div className="flex items-center space-x-3">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full font-bold font-mono ${
                        player.rank === 1 ? 'bg-amber-400 text-black' : player.rank === 2 ? 'bg-slate-300 text-black' : player.rank === 3 ? 'bg-amber-600 text-white' : 'text-text-muted'
                      }`}>
                        {player.rank}
                      </span>
                      <div>
                        <div className="font-bold text-text">{player.username}</div>
                        <div className="text-[10px] text-text-dim">Level {player.level || 1} • {player.country || 'BD'}</div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-accent">{player.bestWpm} WPM</div>
                      <div className="text-[10px] text-text-muted">{player.accuracy}% Acc</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-text-muted">
                  No verified race results yet. Complete your first practice or multiplayer race!
                </div>
              )}
            </div>
          </div>

          {/* Academic & University Partner Highlight */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 border-b border-white/10 pb-4">
                <Users className="h-5 w-5 text-secondary" />
                <h3 className="font-display text-lg font-bold text-text">Universities & Communities</h3>
              </div>
              <p className="mt-4 text-xs text-text-muted leading-relaxed">
                KEYRUSH powers institutional typing competitions for computer science clubs, software engineering departments, and gaming societies with multi-tenant dashboards and verifiable certificates.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {organizations.map((org) => (
                  <div key={org._id} className="rounded-xl border border-white/5 bg-surface/50 p-3">
                    <div className="font-semibold text-xs text-text truncate">{org.name}</div>
                    <div className="mt-1 text-[10px] text-text-muted">{org.type} • {org.memberCount} Racers</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5">
              <Link
                href="/organizations"
                className="block text-center rounded-xl border border-secondary/30 bg-secondary/10 py-2.5 text-xs font-bold text-secondary hover:bg-secondary hover:text-white transition-all"
              >
                Register Your University / Club
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
