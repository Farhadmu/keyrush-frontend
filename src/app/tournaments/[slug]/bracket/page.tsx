'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  GitBranch,
  Crown,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Award,
  Sparkles,
  Edit2,
  X,
} from 'lucide-react';
import { api, getCurrentUser, UserSession } from '../../../../lib/api';

export default function TournamentBracketPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [competition, setCompetition] = useState<any | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  // Score edit modal state
  const [editingMatch, setEditingMatch] = useState<any | null>(null);
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  const [winnerId, setWinnerId] = useState<string>('');
  const [savingScore, setSavingScore] = useState(false);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    if (slug) {
      loadBracketData();
    }
  }, [slug]);

  const loadBracketData = async () => {
    setLoading(true);
    try {
      const comp = await api.getCompetition(slug);
      setCompetition(comp);

      if (comp?._id) {
        const bracketMatches = await api.getBracket(comp._id);
        setMatches(bracketMatches || []);
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to load tournament bracket', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBracket = async () => {
    if (!competition) return;
    setGenerating(true);
    setMessage(null);
    try {
      await api.generateBracket(competition._id);
      setMessage({ text: 'Tournament bracket generated successfully!', error: false });
      loadBracketData();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to generate bracket. Ensure minimum 20 participants.', error: true });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveScore = async () => {
    if (!editingMatch) return;
    setSavingScore(true);
    try {
      await api.updateMatchScore(editingMatch._id, {
        player1Score: Number(p1Score),
        player2Score: Number(p2Score),
        winnerUserId: winnerId,
      });
      setMessage({ text: 'Match result recorded!', error: false });
      setEditingMatch(null);
      loadBracketData();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to record score', error: true });
    } finally {
      setSavingScore(false);
    }
  };

  const handleIssueCertificates = async () => {
    if (!competition) return;
    try {
      const res = await api.issueCertificates(competition._id);
      setMessage({ text: res.message || 'Certificates successfully generated!', error: false });
    } catch (err: any) {
      setMessage({ text: err.message || 'Could not issue certificates', error: true });
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-xs font-mono text-text-muted">Loading bracket data...</p>
      </div>
    );
  }

  // Group matches by round
  const roundsMap = matches.reduce((acc: Record<number, any[]>, m) => {
    const round = m.round || 1;
    if (!acc[round]) acc[round] = [];
    acc[round].push(m);
    return acc;
  }, {});

  const roundNumbers = Object.keys(roundsMap)
    .map(Number)
    .sort((a, b) => a - b);

  const getRoundTitle = (round: number, totalRounds: number) => {
    if (round === totalRounds) return 'Grand Finals';
    if (round === totalRounds - 1) return 'Semifinals';
    if (round === totalRounds - 2) return 'Quarterfinals';
    return `Round ${round}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <nav className="flex items-center space-x-2 text-xs text-text-muted mb-2">
            <Link href="/competitions" className="hover:text-primary transition-colors">
              Competitions
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/competitions/${competition?.slug || slug}`} className="hover:text-primary transition-colors">
              {competition?.title || slug}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-mono text-text">Bracket</span>
          </nav>
          <div className="flex items-center space-x-3">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-text">
              Tournament Elimination Bracket
            </h1>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary">
              Single-Elimination
            </span>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            Server-authoritative tournament progression with real-time WPM verification.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {matches.length === 0 ? (
            <button
              onClick={handleGenerateBracket}
              disabled={generating}
              className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90 disabled:opacity-40"
            >
              <GitBranch className="h-4 w-4" />
              <span>{generating ? 'Seeding Racers...' : 'Generate Bracket'}</span>
            </button>
          ) : (
            <button
              onClick={handleIssueCertificates}
              className="flex items-center space-x-2 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-2.5 text-xs font-semibold text-secondary hover:bg-secondary/20 transition-all"
            >
              <Award className="h-4 w-4" />
              <span>Issue SHA-256 Certificates</span>
            </button>
          )}

          <button
            onClick={loadBracketData}
            className="flex items-center space-x-1.5 rounded-xl border border-white/10 bg-surface px-3 py-2.5 text-xs font-mono text-text hover:bg-surface-light"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
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
          {message.error ? <AlertCircle className="h-4 w-4 shrink-0" /> : <ShieldCheck className="h-4 w-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Bracket Canvas / Columns */}
      {roundNumbers.length > 0 ? (
        <div className="overflow-x-auto pb-8">
          <div className="flex items-start gap-8 min-w-[900px] pt-4">
            {roundNumbers.map((round) => {
              const roundMatches = roundsMap[round] || [];
              const roundTitle = getRoundTitle(round, roundNumbers.length);
              const isGrandFinal = round === roundNumbers.length;

              return (
                <div key={round} className="w-80 shrink-0 space-y-4">
                  {/* Round Header */}
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-surface-dark px-4 py-3">
                    <div className="flex items-center space-x-2">
                      {isGrandFinal ? (
                        <Crown className="h-4 w-4 text-warning" />
                      ) : (
                        <Trophy className="h-4 w-4 text-accent" />
                      )}
                      <span className="font-display text-sm font-bold text-text">{roundTitle}</span>
                    </div>
                    <span className="font-mono text-xs text-text-muted">
                      {roundMatches.length} {roundMatches.length === 1 ? 'Match' : 'Matches'}
                    </span>
                  </div>

                  {/* Matches List */}
                  <div className="space-y-6">
                    {roundMatches.map((m) => {
                      const isCompleted = m.status === 'COMPLETED';
                      const p1IsWinner = isCompleted && m.winnerId === m.player1?.id;
                      const p2IsWinner = isCompleted && m.winnerId === m.player2?.id;

                      return (
                        <div
                          key={m._id}
                          className={`relative glass-panel rounded-2xl p-4 border transition-all ${
                            isCompleted
                              ? 'border-emerald-500/30 bg-surface/90'
                              : 'border-white/10 bg-surface/60 hover:border-primary/40'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono text-text-dim border-b border-white/5 pb-2 mb-3">
                            <span>Match #{m.matchNumber}</span>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] uppercase font-bold ${
                                  isCompleted
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-white/5 text-text-muted'
                                }`}
                              >
                                {m.status}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingMatch(m);
                                  setP1Score(m.player1Score || 0);
                                  setP2Score(m.player2Score || 0);
                                  setWinnerId(m.winnerId || m.player1?.id || '');
                                }}
                                title="Edit Match Score"
                                className="text-text-muted hover:text-accent"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {/* Player 1 Slot */}
                          <div
                            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors ${
                              p1IsWinner
                                ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold'
                                : 'bg-surface-dark/70 text-text'
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <span className="font-mono text-[10px] text-text-dim">
                                #{m.player1?.seed || '1'}
                              </span>
                              <span className="truncate">{m.player1?.username || 'TBD'}</span>
                              {p1IsWinner && <Crown className="h-3 w-3 text-warning shrink-0" />}
                            </div>
                            <span className="font-mono text-xs font-bold pl-2">
                              {m.player1Score ? `${m.player1Score} WPM` : '-'}
                            </span>
                          </div>

                          <div className="h-2 flex items-center justify-center">
                            <span className="text-[9px] font-mono text-text-dim uppercase">VS</span>
                          </div>

                          {/* Player 2 Slot */}
                          <div
                            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors ${
                              p2IsWinner
                                ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold'
                                : 'bg-surface-dark/70 text-text'
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <span className="font-mono text-[10px] text-text-dim">
                                #{m.player2?.seed || '2'}
                              </span>
                              <span className="truncate">{m.player2?.username || 'TBD'}</span>
                              {p2IsWinner && <Crown className="h-3 w-3 text-warning shrink-0" />}
                            </div>
                            <span className="font-mono text-xs font-bold pl-2">
                              {m.player2Score ? `${m.player2Score} WPM` : '-'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-16 text-center border border-dashed border-white/10 space-y-4">
          <GitBranch className="mx-auto h-12 w-12 text-accent/50" />
          <h3 className="font-display text-xl font-bold text-text">No Tournament Bracket Generated</h3>
          <p className="text-xs text-text-muted max-w-md mx-auto">
            Once registration closes with at least 20 confirmed participants, click Generate Bracket to seed contestants and initialize the single-elimination tournament tree.
          </p>
          <button
            onClick={handleGenerateBracket}
            disabled={generating}
            className="mt-4 inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90 disabled:opacity-40"
          >
            <GitBranch className="h-4 w-4" />
            <span>{generating ? 'Seeding Racers...' : 'Generate Bracket'}</span>
          </button>
        </div>
      )}

      {/* SCORE RECORDING MODAL */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-primary/30 bg-surface-dark p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display text-base font-bold text-text">Record Match Result</h3>
              <button onClick={() => setEditingMatch(null)} className="text-text-muted hover:text-text">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-text-muted">
              Authoritative race scoring for Match #{editingMatch.matchNumber} (Round {editingMatch.round}).
            </p>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-text-muted block mb-1">
                  {editingMatch.player1?.username || 'Player 1'} WPM Score:
                </label>
                <input
                  type="number"
                  value={p1Score}
                  onChange={(e) => setP1Score(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-surface px-4 py-2 text-text font-bold focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-text-muted block mb-1">
                  {editingMatch.player2?.username || 'Player 2'} WPM Score:
                </label>
                <input
                  type="number"
                  value={p2Score}
                  onChange={(e) => setP2Score(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-surface px-4 py-2 text-text font-bold focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-text-muted block mb-1">Decided Winner:</label>
                <select
                  value={winnerId}
                  onChange={(e) => setWinnerId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-surface px-4 py-2 text-text font-bold focus:border-primary focus:outline-none"
                >
                  <option value="">Select Winner...</option>
                  {editingMatch.player1?.id && (
                    <option value={editingMatch.player1.id}>
                      {editingMatch.player1.username}
                    </option>
                  )}
                  {editingMatch.player2?.id && (
                    <option value={editingMatch.player2.id}>
                      {editingMatch.player2.username}
                    </option>
                  )}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setEditingMatch(null)}
                className="rounded-xl border border-white/10 bg-surface px-4 py-2 text-xs font-semibold text-text hover:bg-surface-light"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScore}
                disabled={savingScore || !winnerId}
                className="rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90 disabled:opacity-40"
              >
                {savingScore ? 'Saving...' : 'Save & Advance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
