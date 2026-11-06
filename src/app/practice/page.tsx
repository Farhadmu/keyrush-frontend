'use client';

import React, { useState, useEffect, useRef } from 'react';
import RacingCanvas, { RacerVisualState } from '../../game/RacingCanvas';
import TypingEngine from '../../features/typing/TypingEngine';
import { api, getCurrentUser } from '../../lib/api';
import { RefreshCw, Play, Trophy, Sparkles, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PracticePage() {
  const [language, setLanguage] = useState<'EN' | 'BN'>('EN');
  const [difficulty, setDifficulty] = useState<string>('MEDIUM');
  const [passage, setPassage] = useState<{ id: string; title: string; content: string; language: string }>({
    id: 'default',
    title: 'Loading...',
    content: 'The cybernetic engines hum with electric potential as racers assemble on the neon track.',
    language: 'EN',
  });

  const [raceStarted, setRaceStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [results, setResults] = useState<any | null>(null);

  // Racers state (Player + 3 Bots)
  const [racers, setRacers] = useState<RacerVisualState[]>([
    {
      userId: 'player_me',
      username: 'You',
      carId: 'car_cyber_phantom',
      progressPercent: 0,
      speed: 20,
      nitroActive: false,
      rankPosition: 1,
      finished: false,
      isCurrentPlayer: true,
    },
    {
      userId: 'bot_1',
      username: 'ByteRacer [AI]',
      carId: 'car_neon_viper',
      progressPercent: 0,
      speed: 20,
      nitroActive: false,
      rankPosition: 2,
      finished: false,
    },
    {
      userId: 'bot_2',
      username: 'TurboBot [AI]',
      carId: 'car_solaris_drift',
      progressPercent: 0,
      speed: 20,
      nitroActive: false,
      rankPosition: 3,
      finished: false,
    },
    {
      userId: 'bot_3',
      username: 'AlgoRacer [AI]',
      carId: 'car_crimson_fury',
      progressPercent: 0,
      speed: 20,
      nitroActive: false,
      rankPosition: 4,
      finished: false,
    },
  ]);

  // Load new passage
  const loadPassage = async (lang: string = language, diff: string = difficulty) => {
    try {
      const data = await api.getRandomPassage(lang, diff);
      if (data) {
        setPassage({
          id: (data as any)._id || 'p_' + Date.now(),
          title: data.title,
          content: data.content,
          language: data.language,
        });
      }
    } catch (e) {
      // fallback
    }
    resetRace();
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setRacers(prev => prev.map(r => r.isCurrentPlayer ? { ...r, username: user.username } : r));
    }
    loadPassage();
  }, []);

  const resetRace = () => {
    setRaceStarted(false);
    setCountdown(null);
    setResults(null);
    setRacers(prev =>
      prev.map(r => ({
        ...r,
        progressPercent: 0,
        speed: 20,
        nitroActive: false,
        rankPosition: 0,
        finished: false,
      })),
    );
  };

  const startRaceCountdown = () => {
    resetRace();
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setRaceStarted(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Bot simulation loop during active race
  useEffect(() => {
    if (!raceStarted || results) return;

    const botInterval = setInterval(() => {
      setRacers(prev => {
        const passageLength = passage.content.length;
        const updated = prev.map(r => {
          if (r.isCurrentPlayer || r.finished) return r;

          // Bots move at simulated target speed (~55-75 WPM)
          const botSpeed = 180 + Math.random() * 80;
          const advance = (botSpeed / 100) * 0.25;
          const newProgress = Math.min(r.progressPercent + advance, 100);
          const finished = newProgress >= 100;

          return {
            ...r,
            progressPercent: newProgress,
            speed: botSpeed,
            nitroActive: newProgress > 40 && newProgress < 65,
            finished,
          };
        });

        // Recalculate rank positions
        const sorted = [...updated].sort((a, b) => b.progressPercent - a.progressPercent);
        sorted.forEach((r, idx) => {
          const match = updated.find(x => x.userId === r.userId);
          if (match) match.rankPosition = idx + 1;
        });

        return updated;
      });
    }, 100);

    return () => clearInterval(botInterval);
  }, [raceStarted, results, passage.content.length]);

  const handleTypingProgress = (data: any) => {
    setRacers(prev =>
      prev.map(r => {
        if (!r.isCurrentPlayer) return r;
        const nitroActive = data.streak >= 25;
        const speed = Math.round(20 + data.netWpm * 2.8 * (nitroActive ? 1.25 : 1.0));
        const progressPercent = Math.min((data.typedIndex / passage.content.length) * 100, 100);

        return {
          ...r,
          progressPercent,
          speed,
          nitroActive,
          finished: data.isFinished,
        };
      }),
    );
  };

  const handleTypingComplete = (finalMetrics: any) => {
    const playerRank = racers.find(r => r.isCurrentPlayer)?.rankPosition || 1;
    setResults({
      ...finalMetrics,
      rank: playerRank,
      won: playerRank === 1,
    });

    if (playerRank === 1) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text flex items-center space-x-2">
            <span>Practice Arena & AI Heat</span>
          </h1>
          <p className="text-xs text-text-muted">Race against calibrated AI racers. Sharpen your speed and streak control.</p>
        </div>

        {/* Controls: Language, Difficulty, New Text, Start */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Language Selection */}
          <div className="flex rounded-lg border border-white/10 bg-surface p-1 text-xs font-semibold">
            <button
              onClick={() => { setLanguage('EN'); loadPassage('EN', difficulty); }}
              className={`rounded px-3 py-1 transition-all ${language === 'EN' ? 'bg-primary text-white' : 'text-text-muted hover:text-text'}`}
            >
              English
            </button>
            <button
              onClick={() => { setLanguage('BN'); loadPassage('BN', difficulty); }}
              className={`rounded px-3 py-1 transition-all ${language === 'BN' ? 'bg-primary text-white' : 'text-text-muted hover:text-text'}`}
            >
              বাঙলা (Bangla)
            </button>
          </div>

          <button
            onClick={() => loadPassage(language, difficulty)}
            className="flex items-center space-x-1 rounded-lg border border-white/10 bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted hover:bg-surface-light hover:text-text"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>New Passage</span>
          </button>

          {!raceStarted && (
            <button
              onClick={startRaceCountdown}
              className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-primary to-accent px-5 py-1.5 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Start Race</span>
            </button>
          )}
        </div>
      </div>

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="rounded-2xl border border-accent/40 bg-surface-glass p-6 text-center shadow-2xl backdrop-blur-2xl">
          <div className="font-mono text-5xl font-black text-accent text-glow-cyan animate-pulse">
            {countdown}
          </div>
          <div className="mt-2 text-xs font-bold tracking-widest text-text uppercase">
            REV YOUR ENGINES!
          </div>
        </div>
      )}

      {/* 2.5D Racing Canvas visualizer */}
      <RacingCanvas racers={racers} raceStarted={raceStarted} />

      {/* Typing Engine */}
      <TypingEngine
        passage={passage}
        raceStarted={raceStarted}
        onProgress={handleTypingProgress}
        onComplete={handleTypingComplete}
      />

      {/* Results Celebration Modal */}
      {results && (
        <div className="rounded-2xl border border-primary/40 bg-surface-dark/95 p-8 text-center shadow-2xl backdrop-blur-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <Trophy className="h-8 w-8 text-warning" />
          </div>

          <h2 className="mt-4 font-display text-2xl font-black text-text">
            {results.won ? '🏆 1ST PLACE VICTORY!' : `FINISHED POSITION: #${results.rank}`}
          </h2>
          <p className="mt-1 text-xs text-text-muted">Race completed in {results.durationSeconds} seconds.</p>

          <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/5 bg-surface p-3">
              <div className="font-mono text-2xl font-bold text-accent">{results.netWpm}</div>
              <div className="text-[10px] uppercase text-text-muted">Net WPM</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-surface p-3">
              <div className="font-mono text-2xl font-bold text-emerald-400">{results.accuracy}%</div>
              <div className="text-[10px] uppercase text-text-muted">Accuracy</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-surface p-3">
              <div className="font-mono text-2xl font-bold text-secondary">+{Math.round(results.netWpm * 1.5 + (results.won ? 100 : 20))}</div>
              <div className="text-[10px] uppercase text-text-muted">XP Gained</div>
            </div>
          </div>

          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={startRaceCountdown}
              className="rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90"
            >
              Race Again
            </button>
            <button
              onClick={() => loadPassage(language, difficulty)}
              className="rounded-xl border border-white/10 bg-surface px-6 py-2.5 text-xs font-semibold text-text hover:bg-surface-light"
            >
              Next Track
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
