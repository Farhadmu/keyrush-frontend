'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import ThreeArena from '../../game/three/ThreeArena';
import { RacerVisualState } from '../../game/RacingCanvas';
import TypingEngine from '../../features/typing/TypingEngine';
import { api, getCurrentUser } from '../../lib/api';
import {
  RefreshCw,
  Play,
  Trophy,
  Sparkles,
  Award,
  Users,
  FileText,
  Lock,
  RotateCcw,
  Zap,
  Gauge,
  Flag,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Pre-defined vehicle classes for visual variety
const VEHICLE_CLASSES = [
  'car_cyber_phantom',
  'car_neon_viper',
  'car_solaris_drift',
  'car_crimson_fury',
  'car_titan_apex',
  'car_apex_valkyrie',
  'car_vortex_gt',
];

// Curated Esports Bot Names for large grids up to 100 players
const BOT_NAME_PREFIXES = [
  'Byte', 'Turbo', 'Algo', 'Neon', 'Apex', 'Cyber', 'Sonic', 'Quantum', 'Pixel', 'Hyper',
  'Shift', 'Velocity', 'Zero', 'Overclock', 'Grid', 'Chrono', 'Laser', 'Omega', 'Vortex', 'Phantom',
];
const BOT_NAME_SUFFIXES = [
  'Racer', 'Bot', 'Typist', 'Drifter', 'Ghost', 'Knight', 'Striker', 'Pilot', 'Runner', 'Demon',
  'Speed', 'Blaster', 'Driver', 'Pro', 'Ace', 'Master', 'Champion', 'Prime', 'Surge', 'Viper',
];

function generateBotRoster(count: number, playerUsername: string, playerCarId: string): (RacerVisualState & { targetWpm: number })[] {
  const list: (RacerVisualState & { targetWpm: number })[] = [
    {
      userId: 'player_me',
      username: playerUsername || 'You',
      carId: playerCarId || 'car_cyber_phantom',
      progressPercent: 0,
      speed: 20,
      nitroActive: false,
      rankPosition: 1,
      finished: false,
      isCurrentPlayer: true,
      targetWpm: 0,
    },
  ];

  for (let i = 1; i < count; i++) {
    const pIndex = (i * 7 + 3) % BOT_NAME_PREFIXES.length;
    const sIndex = (i * 11 + 5) % BOT_NAME_SUFFIXES.length;
    const botName = `${BOT_NAME_PREFIXES[pIndex]}${BOT_NAME_SUFFIXES[sIndex]} #${i} [AI]`;
    const carId = VEHICLE_CLASSES[i % VEHICLE_CLASSES.length];

    // Calibrated speed distribution matching esports percentiles:
    // Top 5% bots: 90 - 115 WPM
    // Next 25% bots: 70 - 90 WPM
    // Next 40% bots: 55 - 70 WPM
    // Remaining bots: 38 - 55 WPM
    let targetWpm: number;
    if (i <= Math.max(1, Math.round(count * 0.05))) {
      targetWpm = 90 + Math.floor(Math.random() * 25);
    } else if (i <= Math.max(2, Math.round(count * 0.3))) {
      targetWpm = 70 + Math.floor(Math.random() * 20);
    } else if (i <= Math.max(3, Math.round(count * 0.7))) {
      targetWpm = 55 + Math.floor(Math.random() * 15);
    } else {
      targetWpm = 38 + Math.floor(Math.random() * 17);
    }

    list.push({
      userId: `bot_${i}`,
      username: botName,
      carId,
      progressPercent: 0,
      speed: 20,
      nitroActive: false,
      rankPosition: i + 1,
      finished: false,
      targetWpm,
    });
  }

  return list;
}

export default function PracticePage() {
  const [language, setLanguage] = useState<'EN' | 'BN'>('EN');
  const [difficulty, setDifficulty] = useState<string>('MEDIUM');
  const [targetWordCount, setTargetWordCount] = useState<number>(50);
  const [customWordsInput, setCustomWordsInput] = useState<string>('50');
  const [showCustomWords, setShowCustomWords] = useState<boolean>(false);

  // Racers / Grid count configuration (from 4 up to 100 cars)
  const [gridSize, setGridSize] = useState<number>(4);
  const [customGridInput, setCustomGridInput] = useState<string>('4');
  const [showCustomGrid, setShowCustomGrid] = useState<boolean>(false);

  // User session
  const [playerName, setPlayerName] = useState<string>('You');
  const [playerCar, setPlayerCar] = useState<string>('car_cyber_phantom');

  const [passage, setPassage] = useState<{ id: string; title: string; content: string; language: string; wordCount?: number }>({
    id: 'default',
    title: 'Neon Velocity Circuit (50 Words)',
    content: 'The cybernetic engines hum with electric potential as racers assemble on the neon track. Every keystroke fires high-voltage current through the transmission, propelling each vehicle with fierce acceleration toward the holographic finish arch.',
    language: 'EN',
    wordCount: 50,
  });

  const [raceStarted, setRaceStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [isLoadingPassage, setIsLoadingPassage] = useState(false);

  // Dynamic Racers State
  const [racers, setRacers] = useState<(RacerVisualState & { targetWpm: number })[]>(() =>
    generateBotRoster(4, 'You', 'car_cyber_phantom'),
  );

  // Load user session on mount
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setPlayerName(user.username);
      setRacers((prev) =>
        prev.map((r) => (r.isCurrentPlayer ? { ...r, username: user.username } : r)),
      );
    }
  }, []);

  // Sync roster when gridSize changes (only when idle)
  useEffect(() => {
    if (!raceStarted && countdown === null) {
      setRacers(generateBotRoster(gridSize, playerName, playerCar));
    }
  }, [gridSize, playerName, playerCar]);

  // Load new passage with custom word count
  const loadPassage = async (lang: string = language, diff: string = difficulty, words: number = targetWordCount) => {
    if (raceStarted || countdown !== null) return; // Refresh locked during race

    setIsLoadingPassage(true);
    try {
      const data = await api.getRandomPassage(lang, diff, words);
      if (data && data.content) {
        setPassage({
          id: (data as any)._id || 'p_' + Date.now(),
          title: data.title || `${words} Words Circuit`,
          content: data.content,
          language: data.language || lang,
          wordCount: data.wordCount || data.content.trim().split(/\s+/).length,
        });
      }
    } catch {
      // Local fallback generator if network or backend delayed
      const fallbackTitle = lang === 'BN' ? `রূপসী বাঙলা সার্কিট (${words} Words)` : `Neon Velocity Circuit (${words} Words)`;
      setPassage({
        id: 'p_local_' + Date.now(),
        title: fallbackTitle,
        content: generateLocalPassage(lang, words),
        language: lang,
        wordCount: words,
      });
    } finally {
      setIsLoadingPassage(false);
      resetRace();
    }
  };

  const generateLocalPassage = (lang: string, targetWords: number): string => {
    const isBn = lang.toUpperCase() === 'BN';
    const enSentences = [
      'The cybernetic racing machines lined up along the starting grid with engines roaring.',
      'Neon light reflected across the polished carbon fiber chassis of the high-speed vehicles.',
      'Every keystroke transmitted electric impulse signals directly into the hyper-drive transmission.',
      'Mastering keystroke rhythm and timing separates casual drivers from elite esports champions.',
      'The digital track curved sharply through towering skyscrapers glowing under the midnight sky.',
      'Nitro boosters ignited with a blast of plasma, propelling the racer past the competition.',
      'Precision accuracy is the ultimate weapon on this circuit where split seconds dictate victory.',
      'Advanced telemetry showed peak acceleration as the vehicle crossed the hundred mile threshold.',
      'Crowds of spectators cheered from the holographic grandstands overlooking the finish arch.',
      'The checkered flag waved in triumph as the champion racer sealed another legendary lap record.',
    ];
    const bnSentences = [
      'পদ্মা মেঘনা যমুনা ও সুরমা নদীর কলতানে মুখরিত আমাদের এই রূপসী সোনার বাংলাদেশ।',
      'সবুজ শ্যামল প্রান্তর আর সোনালী ধানের শীষে দখিনা বাতাসের মিষ্টি পরশ ছড়িয়ে পড়ে।',
      'ডিজিটাল যুগে তরুণ প্রজন্মের মেধা ও উদ্ভাবনী শক্তি দেশকে বিশ্বমঞ্চে অনন্য উচ্চতায় পৌঁছে দিচ্ছে।',
      'দ্রুত ও নির্ভুল টাইピング দক্ষতা আজকের আধুনিক তথ্যপ্রযুক্তির যুগে এক অপরিহার্য শক্তি।',
      'সাইবার স্পিডওয়েতে প্রতিটি নির্ভুল অক্ষরের ছোঁয়ায় গাড়ির গতি বিদ্যুৎ বেগে বৃদ্ধি পেতে থাকে।',
      'পরিশ্রম, একাগ্রতা এবং নিয়মিত অনুশীলনই একজন সাধারণ প্রতিযোগী থেকে গ্র্যান্ডমাস্টার করে তোলে।',
      'ঐতিহাসিক ভাষা আন্দোলনের রক্তস্নাত চেতনা আমাদের মাতৃভাষাকে বিশ্বদরবারে গৌরবান্বিত করেছে।',
      'গতির লড়াইয়ে বিজয়ী হতে হলে ক্ষিপ্রতার সাথে সাথে নিখুঁত মনোযোগ বজায় রাখা আবশ্যক।',
    ];
    const pool = isBn ? bnSentences : enSentences;
    let assembled = '';
    let count = 0;
    let idx = 0;
    while (count < targetWords) {
      const sentence = pool[idx % pool.length];
      assembled = assembled ? `${assembled} ${sentence}` : sentence;
      count = assembled.trim().split(/\s+/).length;
      idx++;
      if (count >= targetWords) break;
    }
    return assembled.trim().split(/\s+/).slice(0, Math.max(10, targetWords)).join(' ');
  };

  // Reset race to starting grid
  const resetRace = () => {
    setRaceStarted(false);
    setCountdown(null);
    setResults(null);
    setRacers((prev) =>
      prev.map((r, i) => ({
        ...r,
        progressPercent: 0,
        speed: 20,
        nitroActive: false,
        rankPosition: i + 1,
        finished: false,
      })),
    );
  };

  // Countdown Rev sequence
  const startRaceCountdown = () => {
    if (raceStarted || countdown !== null) return;
    resetRace();
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
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
  // Bots move strictly when raceStarted is true, scaled by targetWpm and passage length
  useEffect(() => {
    if (!raceStarted || results) return;

    const passageLength = Math.max(50, passage.content.length);
    const intervalMs = 100;
    const intervalSec = intervalMs / 1000;

    const botInterval = setInterval(() => {
      setRacers((prev) => {
        const updated = prev.map((r) => {
          if (r.isCurrentPlayer || r.finished) return r;

          // Standard typing math: 5 chars = 1 word
          // WPM * 5 / 60 = characters typed per second
          // Small human jitter (+/- 10%)
          const jitter = (Math.random() - 0.5) * 0.2;
          const currentWpm = Math.max(25, r.targetWpm * (1 + jitter));
          const charsPerSec = (currentWpm * 5) / 60;
          const charsThisTick = charsPerSec * intervalSec;
          const advancePercent = (charsThisTick / passageLength) * 100;

          const newProgress = Math.min(100, r.progressPercent + advancePercent);
          const finished = newProgress >= 100;
          const nitroActive = newProgress > 35 && newProgress < 65 && r.targetWpm >= 75;
          const speed = Math.round(20 + currentWpm * 2.6 * (nitroActive ? 1.25 : 1.0));

          return {
            ...r,
            progressPercent: newProgress,
            speed,
            nitroActive,
            finished,
          };
        });

        // Authoritatively recalculate rank positions by progress descending
        const sorted = [...updated].sort((a, b) => b.progressPercent - a.progressPercent);
        sorted.forEach((r, idx) => {
          const match = updated.find((x) => x.userId === r.userId);
          if (match) match.rankPosition = idx + 1;
        });

        return updated;
      });
    }, intervalMs);

    return () => clearInterval(botInterval);
  }, [raceStarted, results, passage.content.length]);

  // Player typing progress handler
  const handleTypingProgress = (data: any) => {
    setRacers((prev) => {
      const updated = prev.map((r) => {
        if (!r.isCurrentPlayer) return r;
        const nitroActive = data.streak >= 20;
        const speed = Math.round(20 + data.netWpm * 2.8 * (nitroActive ? 1.25 : 1.0));
        const progressPercent = Math.min((data.typedIndex / passage.content.length) * 100, 100);

        return {
          ...r,
          progressPercent,
          speed,
          nitroActive,
          finished: data.isFinished,
        };
      });

      // Recalculate rank positions in real time
      const sorted = [...updated].sort((a, b) => b.progressPercent - a.progressPercent);
      sorted.forEach((r, idx) => {
        const match = updated.find((x) => x.userId === r.userId);
        if (match) match.rankPosition = idx + 1;
      });

      return updated;
    });
  };

  // Player completes race
  const handleTypingComplete = (finalMetrics: any) => {
    const playerRank = racers.find((r) => r.isCurrentPlayer)?.rankPosition || 1;
    setResults({
      ...finalMetrics,
      rank: playerRank,
      totalRacers: racers.length,
      won: playerRank === 1,
    });

    if (playerRank === 1) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  // Is the race currently locked (active or in countdown)
  const isRaceLocked = raceStarted || countdown !== null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header & Esports Controls Bar */}
      <div className="rounded-2xl border border-white/10 bg-surface/90 p-5 shadow-2xl backdrop-blur-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h1 className="font-display text-2xl font-black text-white flex items-center space-x-2.5">
              <Zap className="h-6 w-6 text-accent animate-pulse" />
              <span>KEYRUSH Esports Practice Arena</span>
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Calibrated multi-car starting grid. Cars move on race start, fueled by typing speed and accuracy.
            </p>
          </div>

          {/* Active Race Status / Action Button */}
          <div className="flex items-center space-x-3">
            {isRaceLocked && (
              <button
                onClick={resetRace}
                className="flex items-center space-x-1.5 rounded-xl border border-danger/40 bg-danger/10 px-4 py-2 text-xs font-bold text-danger hover:bg-danger/20 transition"
                title="Abort current race and return to starting grid"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Abort / Reset</span>
              </button>
            )}

            {!raceStarted && countdown === null ? (
              <button
                onClick={startRaceCountdown}
                className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-primary via-accent to-primary bg-size-200 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-primary/30 hover:opacity-90 transition animate-gradient"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Start Race</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-accent/20 border border-accent/40 text-accent font-mono text-xs font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span>RACE IN PROGRESS</span>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Row: Grid Size, Word Count, Language, Refresh Button */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* 1. Grid Size (Number of Cars: 4, 8, 20, 50, 100) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-text flex items-center space-x-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>Starting Grid (Cars)</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-accent">
                {gridSize} Cars {gridSize === 100 && '🔥 100-Car Royale'}
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              {[4, 8, 20, 50, 100].map((count) => (
                <button
                  key={count}
                  disabled={isRaceLocked}
                  onClick={() => {
                    setGridSize(count);
                    setShowCustomGrid(false);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition border ${
                    gridSize === count && !showCustomGrid
                      ? 'bg-primary border-primary text-white shadow-md shadow-primary/30'
                      : 'bg-surface-dark border-white/10 text-text-muted hover:border-white/20 hover:text-white'
                  } ${isRaceLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {count}
                </button>
              ))}

              <button
                disabled={isRaceLocked}
                onClick={() => setShowCustomGrid(!showCustomGrid)}
                className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition ${
                  showCustomGrid
                    ? 'bg-accent/20 border-accent text-accent'
                    : 'bg-surface-dark border-white/10 text-text-muted hover:text-white'
                } ${isRaceLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Custom Car Count (1-100)"
              >
                #
              </button>
            </div>

            {showCustomGrid && !isRaceLocked && (
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={customGridInput}
                  onChange={(e) => setCustomGridInput(e.target.value)}
                  className="w-20 rounded-lg bg-surface-dark border border-white/10 px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-primary"
                />
                <button
                  onClick={() => {
                    const parsed = parseInt(customGridInput, 10);
                    if (parsed >= 2 && parsed <= 100) {
                      setGridSize(parsed);
                    }
                  }}
                  className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-hover"
                >
                  Set Cars
                </button>
              </div>
            )}
          </div>

          {/* 2. Word Count Customization (25, 50, 100, 200, 300 words) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-text flex items-center space-x-1.5">
                <FileText className="h-3.5 w-3.5 text-accent" />
                <span>Passage Length</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-emerald-400">
                ~{targetWordCount} Words
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              {[25, 50, 100, 200, 300].map((words) => (
                <button
                  key={words}
                  disabled={isRaceLocked}
                  onClick={() => {
                    setTargetWordCount(words);
                    setShowCustomWords(false);
                    loadPassage(language, difficulty, words);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition border ${
                    targetWordCount === words && !showCustomWords
                      ? 'bg-accent/20 border-accent text-accent shadow-md shadow-accent/20'
                      : 'bg-surface-dark border-white/10 text-text-muted hover:border-white/20 hover:text-white'
                  } ${isRaceLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {words}w
                </button>
              ))}

              <button
                disabled={isRaceLocked}
                onClick={() => setShowCustomWords(!showCustomWords)}
                className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition ${
                  showCustomWords
                    ? 'bg-accent/20 border-accent text-accent'
                    : 'bg-surface-dark border-white/10 text-text-muted hover:text-white'
                } ${isRaceLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Custom Word Count"
              >
                ...
              </button>
            </div>

            {showCustomWords && !isRaceLocked && (
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="number"
                  min="15"
                  max="400"
                  value={customWordsInput}
                  onChange={(e) => setCustomWordsInput(e.target.value)}
                  className="w-20 rounded-lg bg-surface-dark border border-white/10 px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-accent"
                />
                <button
                  onClick={() => {
                    const parsed = parseInt(customWordsInput, 10);
                    if (parsed >= 15 && parsed <= 400) {
                      setTargetWordCount(parsed);
                      loadPassage(language, difficulty, parsed);
                    }
                  }}
                  className="px-3 py-1 rounded-lg bg-accent text-white text-xs font-bold hover:bg-accent-hover"
                >
                  Apply Words
                </button>
              </div>
            )}
          </div>

          {/* 3. Language & Protected Refresh Button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-text">Language & Text Control</span>
              {isRaceLocked && (
                <span className="flex items-center space-x-1 text-[11px] font-bold text-warning font-mono">
                  <Lock className="h-3 w-3" />
                  <span>Locked in race</span>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Language Selector */}
              <div className="flex rounded-lg border border-white/10 bg-surface-dark p-0.5 text-xs font-semibold shrink-0">
                <button
                  disabled={isRaceLocked}
                  onClick={() => {
                    setLanguage('EN');
                    loadPassage('EN', difficulty, targetWordCount);
                  }}
                  className={`rounded-md px-2.5 py-1 transition-all ${
                    language === 'EN' ? 'bg-primary text-white font-bold' : 'text-text-muted hover:text-text'
                  } ${isRaceLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  EN
                </button>
                <button
                  disabled={isRaceLocked}
                  onClick={() => {
                    setLanguage('BN');
                    loadPassage('BN', difficulty, targetWordCount);
                  }}
                  className={`rounded-md px-2.5 py-1 transition-all ${
                    language === 'BN' ? 'bg-primary text-white font-bold' : 'text-text-muted hover:text-text'
                  } ${isRaceLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  বাঙলা
                </button>
              </div>

              {/* Refresh Passage Button - Protected and Disabled during active race */}
              <button
                disabled={isRaceLocked || isLoadingPassage}
                onClick={() => loadPassage(language, difficulty, targetWordCount)}
                className={`flex-1 flex items-center justify-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                  isRaceLocked
                    ? 'border-white/5 bg-surface-dark/50 text-text-dim cursor-not-allowed'
                    : 'border-white/10 bg-surface-dark text-text hover:bg-surface-light hover:border-white/20'
                }`}
                title={isRaceLocked ? 'Passage cannot be refreshed while racing' : 'Load new passage'}
              >
                {isRaceLocked ? (
                  <>
                    <Lock className="h-3.5 w-3.5 text-warning shrink-0" />
                    <span className="truncate">Locked During Race</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className={`h-3.5 w-3.5 text-accent shrink-0 ${isLoadingPassage ? 'animate-spin' : ''}`} />
                    <span>New Passage</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="rounded-2xl border border-accent/40 bg-surface-glass p-8 text-center shadow-2xl backdrop-blur-2xl animate-in zoom-in-95">
          <div className="font-mono text-6xl font-black text-accent text-glow-cyan animate-pulse">
            {countdown}
          </div>
          <div className="mt-3 text-sm font-black tracking-widest text-white uppercase">
            REV YOUR ENGINES — PREPARE FOR GREEN FLAG!
          </div>
          <div className="mt-1 text-xs text-text-muted font-mono">
            {gridSize} Cars on starting grid. Typing speed directly accelerates your car!
          </div>
        </div>
      )}

      {/* Flagship 3D WebGL Esports Arena (Renders up to 100 Cars on Multi-row Starting Grid) */}
      <ThreeArena
        racers={racers}
        trackLength={Math.max(240, Math.min(450, targetWordCount * 2.5))}
        raceStarted={raceStarted}
      />

      {/* Authoritative Typing Engine */}
      <TypingEngine
        passage={passage}
        raceStarted={raceStarted}
        onProgress={handleTypingProgress}
        onComplete={handleTypingComplete}
      />

      {/* Results Celebration Modal */}
      {results && (
        <div className="rounded-2xl border border-primary/40 bg-surface-dark/95 p-8 text-center shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <Trophy className="h-8 w-8 text-warning" />
          </div>

          <h2 className="mt-4 font-display text-2xl font-black text-white">
            {results.won
              ? `🏆 1ST PLACE CHAMPION! (Beat ${results.totalRacers - 1} Racers)`
              : `FINISHED POSITION: #${results.rank} OF ${results.totalRacers} CARS`}
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            Completed {passage.wordCount || targetWordCount} words in {results.durationSeconds} seconds.
          </p>

          <div className="mx-auto mt-6 grid max-w-lg grid-cols-4 gap-3">
            <div className="rounded-xl border border-white/5 bg-surface p-3">
              <div className="font-mono text-2xl font-black text-accent">{results.netWpm}</div>
              <div className="text-[10px] uppercase font-bold text-text-muted">Net WPM</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-surface p-3">
              <div className="font-mono text-2xl font-black text-emerald-400">{results.accuracy}%</div>
              <div className="text-[10px] uppercase font-bold text-text-muted">Accuracy</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-surface p-3">
              <div className="font-mono text-2xl font-black text-white">{results.rank} / {results.totalRacers}</div>
              <div className="text-[10px] uppercase font-bold text-text-muted">Rank</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-surface p-3">
              <div className="font-mono text-2xl font-black text-secondary">
                +{Math.round(results.netWpm * 1.5 + (results.won ? 150 : 30))}
              </div>
              <div className="text-[10px] uppercase font-bold text-text-muted">XP Gained</div>
            </div>
          </div>

          {/* Top 5 Finishers Mini-Leaderboard */}
          <div className="mx-auto mt-6 max-w-lg rounded-xl border border-white/10 bg-surface/50 p-3 text-left">
            <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
              Official Race Leaderboard:
            </div>
            <div className="space-y-1 font-mono text-xs">
              {[...racers]
                .sort((a, b) => (a.rankPosition || 999) - (b.rankPosition || 999))
                .slice(0, 5)
                .map((r) => (
                  <div
                    key={r.userId}
                    className={`flex items-center justify-between px-2.5 py-1 rounded-lg ${
                      r.isCurrentPlayer ? 'bg-primary/20 text-white font-bold border border-primary/40' : 'text-text-muted'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-accent font-bold">#{r.rankPosition}</span>
                      <span>{r.username}</span>
                    </div>
                    <span>{Math.round(r.speed)} km/h</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={startRaceCountdown}
              className="rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90 transition"
            >
              Race Again
            </button>
            <button
              onClick={() => loadPassage(language, difficulty, targetWordCount)}
              className="rounded-xl border border-white/10 bg-surface px-6 py-2.5 text-xs font-semibold text-text hover:bg-surface-light transition"
            >
              Next Track (New Text)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
