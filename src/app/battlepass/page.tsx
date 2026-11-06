'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, getCurrentUser, UserSession } from '../../lib/api';
import {
  Sparkles,
  Lock,
  Check,
  Trophy,
  Flame,
  Zap,
  ShieldCheck,
  ArrowRight,
  Gift,
  Star,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BattlePassPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [passData, setPassData] = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [claimingTier, setClaimingTier] = useState<number | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    loadBattlePass();
  }, []);

  const loadBattlePass = async () => {
    try {
      setLoading(true);
      const res = await api.getBattlePass();
      if (res) {
        setPassData(res.pass);
        setTiers(res.tiers || []);
      }
    } catch (e) {
      console.error('Failed to load battle pass:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (level: number) => {
    try {
      setClaimingTier(level);
      const res = await api.claimBattlePassTier(level);
      setMessage(res.message);
      setPassData(res.pass);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      setTimeout(() => setMessage(null), 3500);
    } catch (e: any) {
      setMessage(`Failed: ${e.message}`);
      setTimeout(() => setMessage(null), 3500);
    } finally {
      setClaimingTier(null);
    }
  };

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      const res = await api.upgradeBattlePassSandbox('STRIPE_SANDBOX');
      setMessage('Upgraded to Season 1 PRO Pass!');
      setPassData(res.pass);
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      setMessage(`Upgrade failed: ${e.message}`);
      setTimeout(() => setMessage(null), 3500);
    } finally {
      setUpgrading(false);
    }
  };

  const isPro = passData?.tier === 'PRO';
  const currentLevel = passData?.currentLevel || 1;
  const claimedTiers = passData?.claimedTiers || [];

  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      {/* Top Banner Navigation */}
      <div className="border-b border-white/10 bg-surface/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="font-display font-black text-xl tracking-wider text-white flex items-center space-x-2">
              <span className="text-primary font-mono">&gt;</span>
              <span>KEYRUSH<span className="text-accent">2.0</span></span>
            </Link>
            <span className="text-white/20">/</span>
            <div className="flex items-center space-x-2 text-sm font-semibold text-white">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Season 1: Cyber Velocity Pass</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/garage"
              className="px-4 py-1.5 rounded-xl bg-surface border border-white/10 text-white text-xs font-bold hover:border-accent transition flex items-center space-x-1.5"
            >
              <span>3D Workshop</span>
            </Link>
            <Link
              href="/multiplayer"
              className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition flex items-center space-x-1.5"
            >
              <span>Race to Level Up</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Season Hero Showcase Card */}
        <div className="relative rounded-3xl border border-white/15 bg-gradient-to-br from-surface via-surface-dark to-background p-6 sm:p-10 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-mono font-bold uppercase">
                <Flame className="w-3.5 h-3.5" />
                <span>Season 1 Live • 50 Tiers of Rewards</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight">
                Cyber Velocity Pass
              </h1>
              <p className="text-sm text-text-muted leading-relaxed">
                Earn Season XP on every verified multiplayer heat. Unlock exclusive PBR paint jobs, spoilers, neon
                underglow kits, and the legendary <strong className="text-white">Vortex GT Esports Special Edition</strong> at Tier 50.
              </p>

              {/* Player Current Tier Progress */}
              <div className="pt-2 flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-surface-dark border border-white/10">
                  <span className="text-xs font-mono text-text-muted">Current Level:</span>
                  <span className="text-lg font-mono font-black text-accent">{currentLevel}</span>
                  <span className="text-xs font-mono text-text-dim">/ 50</span>
                </div>

                <div className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-surface-dark border border-white/10">
                  <span className="text-xs font-mono text-text-muted">Pass Tier:</span>
                  <span
                    className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                      isPro
                        ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    {isPro ? 'PRO PASS' : 'FREE TRACK'}
                  </span>
                </div>
              </div>
            </div>

            {/* Upgrade CTA / Status Banner */}
            <div className="rounded-2xl border border-white/10 bg-surface/90 p-6 flex flex-col items-center text-center space-y-4 shadow-xl min-w-[280px]">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black font-black shadow-lg shadow-amber-400/20">
                <Star className="w-7 h-7 fill-current" />
              </div>

              <div>
                <h3 className="font-display font-black text-lg text-white">
                  {isPro ? 'PRO PASS ACTIVE' : 'UPGRADE TO PRO'}
                </h3>
                <p className="text-xs text-text-muted mt-1 max-w-[220px]">
                  {isPro
                    ? 'All 50 Premium reward tiers unlocked as you level up.'
                    : 'Unlock both Free & Pro reward tracks + instant Electric Prototype access.'}
                </p>
              </div>

              {!isPro ? (
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-black font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/25 hover:opacity-95 transition"
                >
                  {upgrading ? 'Upgrading...' : 'Upgrade Now ($9.99)'}
                </button>
              ) : (
                <div className="w-full py-2.5 rounded-xl bg-success/20 border border-success/40 text-success text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5">
                  <Check className="w-4 h-4" />
                  <span>Pro Member</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        {message && (
          <div className="p-3 rounded-xl bg-surface border border-accent/40 text-accent text-xs font-semibold shadow-xl flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        {/* 50 Tiers Progression Ribbon */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-black text-white flex items-center space-x-2">
              <Gift className="w-5 h-5 text-accent" />
              <span>Season Reward Tiers</span>
            </h2>
            <div className="text-xs font-mono text-text-muted">
              Claimed: <span className="text-accent font-bold">{claimedTiers.length}</span> / 50
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {tiers.slice(0, 20).map((t) => {
              const isUnlocked = currentLevel >= t.level;
              const isClaimed = claimedTiers.includes(t.level);

              return (
                <div
                  key={t.level}
                  className={`rounded-2xl border p-4 flex flex-col justify-between space-y-3 transition relative overflow-hidden ${
                    isUnlocked
                      ? 'border-accent/40 bg-surface/90 shadow-md'
                      : 'border-white/5 bg-surface-dark/70 opacity-75'
                  }`}
                >
                  {/* Top Level Pill */}
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-mono font-black text-white px-2 py-0.5 rounded bg-white/10">
                      TIER {t.level}
                    </span>
                    {isClaimed ? (
                      <span className="flex items-center space-x-1 text-[10px] font-bold text-success">
                        <Check className="w-3 h-3" />
                        <span>CLAIMED</span>
                      </span>
                    ) : !isUnlocked ? (
                      <Lock className="w-3.5 h-3.5 text-text-dim" />
                    ) : null}
                  </div>

                  {/* Free Reward */}
                  <div className="p-2.5 rounded-xl bg-surface-dark border border-white/5">
                    <div className="text-[10px] font-mono uppercase text-text-muted">Free Reward</div>
                    <div className="text-xs font-bold text-white mt-0.5 truncate">{t.freeReward.name}</div>
                  </div>

                  {/* Pro Reward */}
                  <div className={`p-2.5 rounded-xl border ${
                    isPro ? 'bg-amber-400/10 border-amber-400/20' : 'bg-surface-dark border-white/5'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase">
                      <span className={isPro ? 'text-amber-400 font-bold' : 'text-text-muted'}>Pro Reward</span>
                      {!isPro && <Lock className="w-2.5 h-2.5 text-text-dim" />}
                    </div>
                    <div className={`text-xs font-bold mt-0.5 truncate ${isPro ? 'text-amber-300' : 'text-text-muted'}`}>
                      {t.proReward.name}
                    </div>
                  </div>

                  {/* Claim Button */}
                  {isUnlocked && !isClaimed ? (
                    <button
                      onClick={() => handleClaim(t.level)}
                      disabled={claimingTier === t.level}
                      className="w-full py-2 rounded-xl bg-accent text-black font-display font-black text-[11px] uppercase tracking-wider hover:opacity-90 transition shadow-md"
                    >
                      {claimingTier === t.level ? 'Claiming...' : 'Claim Reward'}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

