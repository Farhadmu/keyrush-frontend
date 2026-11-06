'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ThreeArena from '../game/three/ThreeArena';
import { RacerVisualState } from '../game/RacingCanvas';
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
  Shield,
  Layers,
  Activity,
  CheckCircle2,
  Lock,
  ArrowRight,
  Eye,
} from 'lucide-react';

export default function HomePage() {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [liveViewMode, setLiveViewMode] = useState<'3d' | 'stats'>('3d');

  // Hero interactive 3D demonstration racers
  const [heroRacers, setHeroRacers] = useState<RacerVisualState[]>([
    {
      userId: 'p1',
      username: 'ApexPredator',
      carId: 'car_cyber_phantom',
      progressPercent: 68,
      speed: 88,
      nitroActive: true,
      rankPosition: 1,
      finished: false,
      isCurrentPlayer: true,
    },
    {
      userId: 'p2',
      username: 'VelocityQueen',
      carId: 'car_neon_viper',
      progressPercent: 59,
      speed: 76,
      nitroActive: false,
      rankPosition: 2,
      finished: false,
    },
    {
      userId: 'p3',
      username: 'DhakaDrifter',
      carId: 'car_crimson_fury',
      progressPercent: 49,
      speed: 68,
      nitroActive: false,
      rankPosition: 3,
      finished: false,
    },
    {
      userId: 'p4',
      username: 'AlgoByte',
      carId: 'car_titan_apex',
      progressPercent: 42,
      speed: 62,
      nitroActive: false,
      rankPosition: 4,
      finished: false,
    },
  ]);

  useEffect(() => {
    // Dynamic cinematic simulation for Hero showcase
    const interval = setInterval(() => {
      setHeroRacers((prev) =>
        prev.map((racer) => {
          let nextProgress = racer.progressPercent + (racer.speed / 100) * 0.35;
          if (nextProgress >= 100) nextProgress = 0;
          return {
            ...racer,
            progressPercent: nextProgress,
            nitroActive: nextProgress > 55 && nextProgress < 85,
          };
        }),
      );
    }, 100);

    // Fetch live datasets
    api.getCompetitions().then((data) => setCompetitions((data || []).slice(0, 3))).catch(() => {});
    api.getGlobalLeaderboard(5).then((data) => setLeaderboard(data || [])).catch(() => {});
    api.getOrganizations().then((data) => setOrganizations((data || []).slice(0, 4))).catch(() => {});

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col space-y-28 py-10">
      {/* 1. HERO SECTION */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-mono uppercase tracking-wider text-[11px]">KEYRUSH 3.0 • Global Esports Ecosystem</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-text leading-tight">
            Your Keystrokes.{' '}
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Authoritative Speed.
            </span>
          </h1>

          <p className="text-sm sm:text-base leading-relaxed text-text-muted font-normal max-w-2xl mx-auto">
            The world-class competitive typing arena. Race high-octane 3D hypercars synchronized with your exact words per minute, master Bangla and English IME composition, and qualify for verified university championships.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="group flex items-center space-x-2 rounded-xl bg-gradient-to-r from-primary to-accent px-7 py-3 text-xs sm:text-sm font-bold text-white shadow-xl shadow-primary/20 hover:opacity-95 transition-all"
            >
              <span>Enter Competition</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/competitions"
              className="flex items-center space-x-2 rounded-xl border border-white/10 bg-surface px-6 py-3 text-xs sm:text-sm font-semibold text-text hover:bg-surface-light transition-all backdrop-blur-md"
            >
              <Trophy className="h-4 w-4 text-warning" />
              <span>Championship Circuit</span>
            </Link>
          </div>
        </div>

        {/* 3D Interactive Hero Arena Preview */}
        <div className="mt-12 w-full glass-panel p-2.5 sm:p-4 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden bg-surface">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 mb-3 text-xs font-mono text-text-muted">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-text font-bold uppercase tracking-wider text-[11px]">Live 3D Arena Telemetry</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-accent font-bold">100% Server Authoritative</span>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-white/5">
            <ThreeArena racers={heroRacers} raceStarted={true} trackTheme="neon_city" />
          </div>
        </div>
      </section>

      {/* 2. PLATFORM TELEMETRY TICKER */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1 bg-surface">
            <span className="text-xs text-text-muted font-mono uppercase tracking-wider block">Multiplayer Limits</span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-accent">2 to 7</div>
            <span className="text-[11px] text-text-muted font-mono">Racers Per Room</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1 bg-surface">
            <span className="text-xs text-text-muted font-mono uppercase tracking-wider block">Tournament Bracket</span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">20 to 300</div>
            <span className="text-[11px] text-text-muted font-mono">Entrants Capacity</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1 bg-surface">
            <span className="text-xs text-text-muted font-mono uppercase tracking-wider block">Anti-Cheat Defense</span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">&gt; 220 WPM</div>
            <span className="text-[11px] text-text-muted font-mono">Velocity Gated</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1 bg-surface">
            <span className="text-xs text-text-muted font-mono uppercase tracking-wider block">Certificate Security</span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-purple-400">HMAC-SHA256</div>
            <span className="text-[11px] text-text-muted font-mono">Cryptographic QR</span>
          </div>
        </div>
      </section>

      {/* 3. THREE-ROLE ECOSYSTEM PILLARS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-black text-text">The Tri-Role Ecosystem</h2>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            Strict role-based isolation designed for competitive typists, institutional organizers, and global league admins.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: USER */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-primary/30 flex flex-col justify-between space-y-6 relative overflow-hidden bg-surface group hover:border-primary/60 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest">ROLE 01</span>
                <h3 className="font-display text-xl font-bold text-text mt-0.5">The Competitor (USER)</h3>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                The only role authorized to race. Participate in 3D solo practice, join 2–7 racer multiplayer rooms, customize vehicle liveries in the workshop, and climb the 7-tier ELO ladder from Bronze to Grandmaster.
              </p>
              <ul className="space-y-1.5 text-xs font-mono text-text-muted pt-2 border-t border-white/5">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  <span>3D Garage Showroom (PBR)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  <span>Season 1 Cyber Battle Pass</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  <span>AI Typing Coach & Heatmap</span>
                </li>
              </ul>
            </div>
            <Link
              href="/register"
              className="w-full py-2.5 rounded-xl bg-primary/20 text-primary border border-primary/30 font-bold text-xs text-center hover:bg-primary hover:text-white transition-all"
            >
              Join as Racer
            </Link>
          </div>

          {/* Pillar 2: ORGANIZER */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-amber-400/30 flex flex-col justify-between space-y-6 relative overflow-hidden bg-surface group hover:border-amber-400/60 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 flex items-center justify-center">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">ROLE 02</span>
                <h3 className="font-display text-xl font-bold text-text mt-0.5">The Host (ORGANIZER)</h3>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                University club leads and esports directors manage multiple organizations, approve racer rosters, host 20–300 participant championships, dispatch 2–7 racer heats, and issue verifiable digital certificates.
              </p>
              <ul className="space-y-1.5 text-xs font-mono text-text-muted pt-2 border-t border-white/5">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                  <span>8-Step Tournament Studio Wizard</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                  <span>Multi-Organization Switcher</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                  <span>HMAC-SHA256 Digital Certificates</span>
                </li>
              </ul>
            </div>
            <Link
              href="/login"
              className="w-full py-2.5 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold text-xs text-center hover:bg-amber-400 hover:text-black transition-all"
            >
              Organizer Portal
            </Link>
          </div>

          {/* Pillar 3: SUPER_ADMIN */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-secondary/30 flex flex-col justify-between space-y-6 relative overflow-hidden bg-surface group hover:border-secondary/60 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary flex items-center justify-center">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-secondary uppercase tracking-widest">ROLE 03</span>
                <h3 className="font-display text-xl font-bold text-text mt-0.5">The Overseer (SUPER_ADMIN)</h3>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Platform executives monitor real-time infrastructure telemetry (MongoDB Atlas & Redis cluster), audit organization verification queues, review anti-cheat velocity flags, and inspect platform security logs.
              </p>
              <ul className="space-y-1.5 text-xs font-mono text-text-muted pt-2 border-t border-white/5">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                  <span>Live Database & Redis Telemetry</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                  <span>AI Trust & Safety Case Reviewer</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                  <span>Immutable System Audit Trail</span>
                </li>
              </ul>
            </div>
            <Link
              href="/login"
              className="w-full py-2.5 rounded-xl bg-secondary/20 text-secondary border border-secondary/30 font-bold text-xs text-center hover:bg-secondary hover:text-white transition-all"
            >
              Admin Console
            </Link>
          </div>
        </div>
      </section>

      {/* 4. OFFICIAL CHAMPIONSHIPS SHOWCASE */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4 gap-2">
          <div>
            <h2 className="font-display text-2xl font-bold text-text">Official Championship Circuit</h2>
            <p className="text-xs text-text-muted">
              Live tournament brackets enforcing 20 to 300 participant bounds with atomic registration concurrency.
            </p>
          </div>
          <Link
            href="/competitions"
            className="text-xs font-semibold text-primary hover:text-accent flex items-center space-x-1"
          >
            <span>Explore all tournaments</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {competitions.length > 0 ? (
            competitions.map((comp) => (
              <div key={comp._id} className="glass-panel rounded-2xl p-6 flex flex-col justify-between bg-surface space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="rounded-md bg-accent/10 px-2 py-0.5 text-accent border border-accent/20">
                      {comp.settings?.language || 'EN'}
                    </span>
                    <span className="text-text-muted">
                      {comp.currentParticipantCount || 0} / {comp.settings?.maxParticipants || 300} Racers
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-bold text-text">{comp.title}</h3>
                  <p className="mt-2 text-xs text-text-muted line-clamp-2">{comp.description}</p>
                </div>

                <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">
                    ● {comp.status || 'REGISTRATION_OPEN'}
                  </span>
                  <Link
                    href="/competitions"
                    className="rounded-lg bg-primary/20 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 rounded-2xl border border-dashed border-white/10 p-8 text-center text-text-muted text-xs">
              Loading active championships...
            </div>
          )}
        </div>
      </section>

      {/* 5. GLOBAL LEADERBOARD & UNIVERSITY CLUBS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Leaderboard Table */}
          <div className="glass-panel rounded-2xl p-6 bg-surface space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-warning" />
                <h3 className="font-display text-lg font-bold text-text">Global Velocity Hall of Fame</h3>
              </div>
              <Link href="/leaderboard" className="text-xs font-semibold text-primary hover:underline">
                Full Standings
              </Link>
            </div>

            <div className="divide-y divide-white/5">
              {leaderboard.length > 0 ? (
                leaderboard.map((player) => (
                  <div key={player.rank} className="flex items-center justify-between py-3 text-xs">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-lg font-bold font-mono text-xs ${
                          player.rank === 1
                            ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                            : player.rank === 2
                            ? 'bg-slate-300 text-black'
                            : player.rank === 3
                            ? 'bg-amber-600 text-white'
                            : 'bg-surface-light text-text-muted'
                        }`}
                      >
                        #{player.rank}
                      </span>
                      <div>
                        <div className="font-bold text-text">{player.username}</div>
                        <div className="text-[10px] text-text-muted font-mono">
                          Level {player.level || 1} • {player.country || 'BD'}
                        </div>
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
          <div className="glass-panel rounded-2xl p-6 bg-surface flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center space-x-2 border-b border-white/10 pb-4">
                <Users className="h-5 w-5 text-secondary" />
                <h3 className="font-display text-lg font-bold text-text">Universities & Communities</h3>
              </div>
              <p className="mt-4 text-xs text-text-muted leading-relaxed">
                KEYRUSH powers institutional typing competitions for university computer clubs, software engineering departments, and national gaming associations with dedicated division management.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {organizations.map((org) => (
                  <div key={org._id} className="rounded-xl border border-white/5 bg-surface-light p-3">
                    <div className="font-semibold text-xs text-text truncate">{org.name}</div>
                    <div className="mt-1 text-[10px] text-text-muted font-mono">
                      {org.type} • {org.memberCount || 1} Racers
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <Link
                href="/organizations"
                className="block text-center rounded-xl border border-secondary/30 bg-secondary/10 py-2.5 text-xs font-bold text-secondary hover:bg-secondary hover:text-white transition-all"
              >
                Register Your University / Esports Club
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
