'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, getCurrentUser } from '../../../lib/api';
import { Activity, Flame, Zap, ChevronLeft, Calendar, Award } from 'lucide-react';

export default function HistoryPage() {
  const [tab, setTab] = useState<'multiplayer' | 'practice'>('multiplayer');
  const [races, setRaces] = useState<any[]>([]);
  const [practices, setPractices] = useState<any[]>([]);
  const [weaknesses, setWeaknesses] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cur = getCurrentUser();
    if (!cur) {
      window.location.href = '/login';
      return;
    }

    Promise.all([
      api.getUserRaceHistory(50).catch(() => []),
      api.getPracticeHistory(50).catch(() => []),
      api.getUserWeaknesses().catch(() => ({})),
    ]).then(([raceList, practiceList, weakMap]) => {
      setRaces(raceList || []);
      setPractices(practiceList || []);
      setWeaknesses(weakMap || {});
      setLoading(false);
    });
  }, []);

  const curUser = getCurrentUser();

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-xs text-primary hover:underline flex items-center mb-1">
              <ChevronLeft className="h-3 w-3 mr-1" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl font-black font-display text-text">Session Telemetry & History</h1>
          </div>

          <div className="flex bg-surface p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setTab('multiplayer')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'multiplayer' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text'
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>Multiplayer ({races.length})</span>
            </button>
            <button
              onClick={() => setTab('practice')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'practice' ? 'bg-accent text-black shadow-md' : 'text-text-muted hover:text-text'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Practice ({practices.length})</span>
            </button>
          </div>
        </div>

        {/* Weakness Summary Bar */}
        {Object.keys(weaknesses).length > 0 && (
          <div className="glass-panel p-4 rounded-xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-text">Top Weakness Keys:</span>
              <div className="flex items-center space-x-1.5">
                {Object.entries(weaknesses)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([key, count]) => (
                    <span
                      key={key}
                      className="px-2 py-0.5 rounded bg-danger/20 text-danger border border-danger/30 text-xs font-mono font-bold"
                    >
                      {key.toUpperCase()} ({count})
                    </span>
                  ))}
              </div>
            </div>
            <Link href="/dashboard/analytics" className="text-xs text-accent hover:underline">
              AI Analysis & Drills →
            </Link>
          </div>
        )}

        {/* History Table */}
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          {tab === 'multiplayer' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-surface/80 border-b border-white/10 text-text-muted uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Rank</th>
                    <th className="p-4 font-sans">Passage Title</th>
                    <th className="p-4">Net WPM</th>
                    <th className="p-4">Accuracy</th>
                    <th className="p-4">Language</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {races.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-text-muted">
                        No multiplayer match records found.
                      </td>
                    </tr>
                  ) : (
                    races.map((r) => {
                      const p = r.participants?.find((part: any) => part.userId === curUser?.id);
                      return (
                        <tr key={r._id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-bold text-text">
                            <span className={p?.rankPosition === 1 ? 'text-yellow-400 font-bold' : ''}>
                              #{p?.rankPosition || '-'}
                            </span>
                          </td>
                          <td className="p-4 font-sans font-bold text-text">{r.passageTitle}</td>
                          <td className="p-4 text-accent font-bold">{p?.netWpm || 0} WPM</td>
                          <td className="p-4 text-emerald-400">{p?.accuracy || 100}%</td>
                          <td className="p-4 text-text-muted">{r.language}</td>
                          <td className="p-4 text-text-muted">{new Date(r.createdAt).toLocaleString()}</td>
                          <td className="p-4 text-right">
                            <Link
                              href={`/races/${r._id}`}
                              className="px-2.5 py-1 rounded bg-primary/20 text-primary border border-primary/30 text-[11px] font-sans hover:bg-primary/30"
                            >
                              Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-surface/80 border-b border-white/10 text-text-muted uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Mode</th>
                    <th className="p-4">Net WPM</th>
                    <th className="p-4">Raw WPM</th>
                    <th className="p-4">Accuracy</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Language</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {practices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-text-muted">
                        No solo practice records found.
                      </td>
                    </tr>
                  ) : (
                    practices.map((pr) => (
                      <tr key={pr._id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-bold text-primary uppercase">{pr.mode}</td>
                        <td className="p-4 font-bold text-accent">{pr.netWpm} WPM</td>
                        <td className="p-4 text-text-muted">{pr.rawWpm} WPM</td>
                        <td className="p-4 text-emerald-400">{pr.accuracy}%</td>
                        <td className="p-4 text-text-muted">{pr.durationSeconds}s</td>
                        <td className="p-4 text-text-muted">{pr.language}</td>
                        <td className="p-4 text-text-muted">{new Date(pr.createdAt).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
