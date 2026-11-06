'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Trophy, Award, Flame, Globe, Filter } from 'lucide-react';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [category, setCategory] = useState<'GLOBAL' | 'BD'>('GLOBAL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [category]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await api.getGlobalLeaderboard(50);
      setLeaderboard(data || []);
    } catch (e) {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Trophy className="h-3.5 w-3.5 text-warning" />
            <span>Server-Verified Competitive Rankings</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-text">
            Global Velocity Leaderboard
          </h1>
          <p className="mt-1 text-xs text-text-muted">
            Official rankings calculated exclusively from server-verified multiplayer races and championship heats.
          </p>
        </div>

        {/* Category Toggles */}
        <div className="flex rounded-xl border border-white/10 bg-surface p-1 text-xs font-semibold">
          <button
            onClick={() => setCategory('GLOBAL')}
            className={`rounded-lg px-4 py-1.5 transition-all ${
              category === 'GLOBAL' ? 'bg-primary text-white shadow-md shadow-primary/25' : 'text-text-muted hover:text-text'
            }`}
          >
            Worldwide
          </button>
          <button
            onClick={() => setCategory('BD')}
            className={`rounded-lg px-4 py-1.5 transition-all ${
              category === 'BD' ? 'bg-primary text-white shadow-md shadow-primary/25' : 'text-text-muted hover:text-text'
            }`}
          >
            Bangladesh 🇧🇩
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="glass-panel overflow-hidden rounded-3xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-surface-dark/90 font-mono text-[11px] text-text-muted uppercase">
              <tr>
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Racer</th>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4 text-right">Best WPM</th>
                <th className="px-6 py-4 text-right">Avg WPM</th>
                <th className="px-6 py-4 text-right">Accuracy</th>
                <th className="px-6 py-4 text-right">Wins</th>
                <th className="px-6 py-4 text-right">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leaderboard.length > 0 ? (
                leaderboard.map((player) => (
                  <tr key={player.rank} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono font-bold">
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${
                        player.rank === 1 ? 'bg-amber-400 text-black font-extrabold shadow-lg shadow-amber-400/20' : player.rank === 2 ? 'bg-slate-300 text-black font-extrabold' : player.rank === 3 ? 'bg-amber-600 text-white font-extrabold' : 'text-text-muted'
                      }`}>
                        #{player.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-text">
                      <div className="flex items-center space-x-2">
                        <span>{player.username}</span>
                        <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[9px] font-mono text-accent">
                          LVL {player.level || 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-muted font-mono">{player.country || 'BD'}</td>
                    <td className="px-6 py-4 text-right font-mono text-sm font-bold text-accent text-glow-cyan">
                      {player.bestWpm}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-text-muted">{player.averageWpm}</td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-400 font-semibold">{player.accuracy}%</td>
                    <td className="px-6 py-4 text-right font-mono text-text">{player.wins}</td>
                    <td className="px-6 py-4 text-right font-mono font-semibold text-secondary">
                      {player.winRate}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-text-muted">
                    No verified race results yet. Enter a race to claim the #1 spot!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
