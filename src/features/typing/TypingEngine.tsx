'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

export interface TypingEngineProps {
  passage: {
    id: string;
    title: string;
    content: string;
    language: string;
  };
  raceStarted: boolean;
  disabled?: boolean;
  onProgress?: (data: {
    textBuffer: string;
    typedIndex: number;
    unbrokenCorrectChars: number;
    hasError: boolean;
    errorCount: number;
    rawInputs: number;
    rawWpm: number;
    netWpm: number;
    accuracy: number;
    streak: number;
    isFinished: boolean;
  }) => void;
  onComplete?: (results: {
    rawWpm: number;
    netWpm: number;
    accuracy: number;
    durationSeconds: number;
  }) => void;
}

export default function TypingEngine({
  passage,
  raceStarted,
  disabled = false,
  onProgress,
  onComplete,
}: TypingEngineProps) {
  // Parse words from passage content
  const words = useMemo(() => {
    return passage.content.trim().split(/\s+/).filter(Boolean);
  }, [passage.content]);

  // Word-by-word serial racing state (TypeRacer International Standard)
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [completedWords, setCompletedWords] = useState<string[]>([]);
  const [hasError, setHasError] = useState(false);
  const [firstErrorIndex, setFirstErrorIndex] = useState(-1);
  const [totalKeyInputs, setTotalKeyInputs] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [streak, setStreak] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [shake, setShake] = useState(false);

  // Live HUD metrics
  const [netWpm, setNetWpm] = useState(0);
  const [rawWpm, setRawWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Reset when race resets or passage changes
  useEffect(() => {
    if (!raceStarted) {
      setCurrentWordIndex(0);
      setCurrentInput('');
      setCompletedWords([]);
      setHasError(false);
      setFirstErrorIndex(-1);
      setTotalKeyInputs(0);
      setTotalErrors(0);
      setStreak(0);
      setStartTime(null);
      setIsFinished(false);
      setNetWpm(0);
      setRawWpm(0);
      setAccuracy(100);
      setShake(false);
    }
  }, [passage.id, raceStarted]);

  // Auto-focus input field on race start
  useEffect(() => {
    if (raceStarted && !disabled) {
      inputRef.current?.focus();
      if (!startTime) {
        setStartTime(Date.now());
      }
    }
  }, [raceStarted, disabled, startTime]);

  // Helper to calculate total unbroken correct characters across all words
  const calculateUnbrokenChars = (
    completed: string[],
    inputVal: string,
    target: string,
    err: boolean,
    errIdx: number,
  ) => {
    // Completed words characters + single space after each completed word
    const completedLength = completed.reduce((sum, w) => sum + w.length + 1, 0);
    // Correct prefix in current word
    let wordCorrect = 0;
    if (err) {
      wordCorrect = errIdx > 0 ? errIdx : 0;
    } else {
      wordCorrect = Math.min(inputVal.length, target.length);
    }
    return completedLength + wordCorrect;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!raceStarted || disabled || isFinished) return;

    const rawVal = e.target.value;
    const now = Date.now();
    const effectiveStartTime = startTime || now;
    if (!startTime) setStartTime(now);

    const targetWord = words[currentWordIndex] || '';
    const isLastWord = currentWordIndex === words.length - 1;

    // Track raw keystrokes
    const newTotalInputs = totalKeyInputs + 1;
    setTotalKeyInputs(newTotalInputs);

    // Check if user pressed SPACE to complete the current word
    if (rawVal.endsWith(' ')) {
      const typedWord = rawVal.slice(0, -1);

      if (typedWord === targetWord) {
        // --- WORD SUCCESSFULLY COMPLETED IN SERIAL ORDER ---
        const newCompleted = [...completedWords, targetWord];
        const nextIndex = currentWordIndex + 1;
        const newStreak = streak + 1;

        setCompletedWords(newCompleted);
        setCurrentWordIndex(nextIndex);
        setCurrentInput('');
        setHasError(false);
        setFirstErrorIndex(-1);
        setStreak(newStreak);

        const unbrokenChars = calculateUnbrokenChars(newCompleted, '', '', false, -1);
        const elapsedMinutes = Math.max((now - effectiveStartTime) / 60000, 0.03);
        const calcNetWpm = Math.max(0, Number(((unbrokenChars / 5) / elapsedMinutes).toFixed(1)));
        const calcRawWpm = Number(((newTotalInputs / 5) / elapsedMinutes).toFixed(1));
        const calcAcc = Number(((unbrokenChars / newTotalInputs) * 100).toFixed(1));

        setNetWpm(calcNetWpm);
        setRawWpm(calcRawWpm);
        setAccuracy(calcAcc);

        // Check if passage is complete
        const isDone = nextIndex >= words.length;
        if (isDone && !isFinished) {
          setIsFinished(true);
          const durationSeconds = Number(((now - effectiveStartTime) / 1000).toFixed(1));
          onComplete?.({
            rawWpm: calcRawWpm,
            netWpm: calcNetWpm,
            accuracy: calcAcc,
            durationSeconds,
          });
        }

        onProgress?.({
          textBuffer: newCompleted.join(' '),
          typedIndex: unbrokenChars,
          unbrokenCorrectChars: unbrokenChars,
          hasError: false,
          errorCount: totalErrors,
          rawInputs: newTotalInputs,
          rawWpm: calcRawWpm,
          netWpm: calcNetWpm,
          accuracy: calcAcc,
          streak: newStreak,
          isFinished: isDone,
        });

        return;
      } else {
        // --- SPACE PRESSED BUT WORD HAS TYPO / INCOMPLETE ---
        // STRICT INTERNATIONAL RULE: Cannot skip or advance on error! Space is blocked!
        setHasError(true);
        setShake(true);
        setTimeout(() => setShake(false), 300);
        setTotalErrors((prev) => prev + 1);
        setStreak(0);

        // Keep what was typed (minus space) so user can see and backspace
        setCurrentInput(typedWord);

        const unbrokenChars = calculateUnbrokenChars(completedWords, typedWord, targetWord, true, firstErrorIndex);
        const elapsedMinutes = Math.max((now - effectiveStartTime) / 60000, 0.03);
        const calcNetWpm = Math.max(0, Number(((unbrokenChars / 5) / elapsedMinutes).toFixed(1)));
        const calcRawWpm = Number(((newTotalInputs / 5) / elapsedMinutes).toFixed(1));
        const calcAcc = Number(((unbrokenChars / newTotalInputs) * 100).toFixed(1));

        setNetWpm(calcNetWpm);
        setRawWpm(calcRawWpm);
        setAccuracy(calcAcc);

        onProgress?.({
          textBuffer: completedWords.join(' ') + (completedWords.length > 0 ? ' ' : '') + typedWord,
          typedIndex: unbrokenChars,
          unbrokenCorrectChars: unbrokenChars,
          hasError: true, // Vehicle STOPS immediately!
          errorCount: totalErrors + 1,
          rawInputs: newTotalInputs,
          rawWpm: calcRawWpm,
          netWpm: calcNetWpm,
          accuracy: calcAcc,
          streak: 0,
          isFinished: false,
        });

        return;
      }
    }

    // --- REGULAR CHARACTER TYPING INSIDE CURRENT WORD ---
    // Prevent typing excessively beyond word length + 3
    if (rawVal.length > targetWord.length + 3) {
      return;
    }

    let errFound = false;
    let errIdx = -1;

    for (let i = 0; i < rawVal.length; i++) {
      if (i >= targetWord.length || rawVal[i] !== targetWord[i]) {
        errFound = true;
        errIdx = i;
        break;
      }
    }

    if (errFound && !hasError) {
      setShake(true);
      setTimeout(() => setShake(false), 300);
      setTotalErrors((prev) => prev + 1);
      setStreak(0);
    }

    setHasError(errFound);
    setFirstErrorIndex(errIdx);
    setCurrentInput(rawVal);

    // If this is the LAST word and it matches completely, finish automatically!
    if (isLastWord && rawVal === targetWord && !isFinished) {
      const newCompleted = [...completedWords, targetWord];
      setIsFinished(true);

      const unbrokenChars = passage.content.length;
      const elapsedMinutes = Math.max((now - effectiveStartTime) / 60000, 0.03);
      const calcNetWpm = Math.max(0, Number(((unbrokenChars / 5) / elapsedMinutes).toFixed(1)));
      const calcRawWpm = Number(((newTotalInputs / 5) / elapsedMinutes).toFixed(1));
      const calcAcc = Number(((unbrokenChars / newTotalInputs) * 100).toFixed(1));
      const durationSeconds = Number(((now - effectiveStartTime) / 1000).toFixed(1));

      setNetWpm(calcNetWpm);
      setRawWpm(calcRawWpm);
      setAccuracy(calcAcc);

      onComplete?.({
        rawWpm: calcRawWpm,
        netWpm: calcNetWpm,
        accuracy: calcAcc,
        durationSeconds,
      });

      onProgress?.({
        textBuffer: newCompleted.join(' '),
        typedIndex: unbrokenChars,
        unbrokenCorrectChars: unbrokenChars,
        hasError: false,
        errorCount: totalErrors,
        rawInputs: newTotalInputs,
        rawWpm: calcRawWpm,
        netWpm: calcNetWpm,
        accuracy: calcAcc,
        streak: streak + 1,
        isFinished: true,
      });

      return;
    }

    // Calculate live score
    const unbrokenChars = calculateUnbrokenChars(completedWords, rawVal, targetWord, errFound, errIdx);
    const elapsedMinutes = Math.max((now - effectiveStartTime) / 60000, 0.03);
    const calcNetWpm = Math.max(0, Number(((unbrokenChars / 5) / elapsedMinutes).toFixed(1)));
    const calcRawWpm = Number(((newTotalInputs / 5) / elapsedMinutes).toFixed(1));
    const calcAcc = Number(((unbrokenChars / newTotalInputs) * 100).toFixed(1));

    setNetWpm(calcNetWpm);
    setRawWpm(calcRawWpm);
    setAccuracy(calcAcc);

    onProgress?.({
      textBuffer: completedWords.join(' ') + (completedWords.length > 0 ? ' ' : '') + rawVal,
      typedIndex: unbrokenChars,
      unbrokenCorrectChars: unbrokenChars,
      hasError: errFound, // When true, vehicle stalls at 0 km/h!
      errorCount: totalErrors + (errFound ? 1 : 0),
      rawInputs: newTotalInputs,
      rawWpm: calcRawWpm,
      netWpm: calcNetWpm,
      accuracy: calcAcc,
      streak: errFound ? 0 : streak,
      isFinished: false,
    });
  };

  const currentTargetWord = words[currentWordIndex] || '';

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={`relative flex flex-col space-y-4 rounded-2xl border bg-surface/90 p-5 sm:p-6 shadow-2xl backdrop-blur-xl transition-all ${
        hasError ? 'border-danger/60 ring-2 ring-danger/20' : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* 1. Esports Telemetry HUD Bar */}
      <div className="grid grid-cols-2 gap-3 border-b border-white/5 pb-4 md:grid-cols-4">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
          <div className="font-mono text-2xl font-black text-primary text-glow-blue">{netWpm}</div>
          <div className="text-[11px] font-semibold tracking-wider text-text-muted uppercase">Net WPM</div>
        </div>

        <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 text-center">
          <div className="font-mono text-2xl font-black text-accent text-glow-cyan">{accuracy}%</div>
          <div className="text-[11px] font-semibold tracking-wider text-text-muted uppercase">Accuracy</div>
        </div>

        <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-3 text-center">
          <div className="font-mono text-2xl font-black text-secondary text-glow-purple">{streak}</div>
          <div className="text-[11px] font-semibold tracking-wider text-text-muted uppercase">
            Streak {streak >= 20 ? '⚡ NITRO' : ''}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
          <div className="font-mono text-2xl font-black text-white">
            {completedWords.length} / {words.length}
          </div>
          <div className="text-[11px] font-semibold tracking-wider text-text-muted uppercase">Words Done</div>
        </div>
      </div>

      {/* 2. Full Passage Display with Real-Time Word Highlighting & Error Tracking */}
      <div className="min-h-[140px] max-h-[220px] overflow-y-auto rounded-xl bg-surface-dark/95 p-4 sm:p-5 font-mono text-base sm:text-lg leading-relaxed select-none border border-white/5">
        <div className="flex flex-wrap gap-x-2 gap-y-1.5 items-center">
          {words.map((word, wIdx) => {
            if (wIdx < currentWordIndex) {
              // Word already completed correctly in serial order
              return (
                <span key={wIdx} className="text-emerald-400 font-semibold opacity-85">
                  {word}
                </span>
              );
            }

            if (wIdx === currentWordIndex) {
              // Active Word currently being typed by the player
              return (
                <span
                  key={wIdx}
                  className={`inline-flex items-center px-2 py-0.5 rounded-lg border font-bold transition-all shadow-md ${
                    shake ? 'animate-shake' : ''
                  } ${
                    hasError
                      ? 'bg-danger/25 border-danger text-danger shadow-danger/20 ring-2 ring-danger/40'
                      : 'bg-primary/25 border-primary text-white shadow-primary/20 ring-2 ring-primary/40'
                  }`}
                >
                  {word.split('').map((char, cIdx) => {
                    let charClass = 'text-white/80';
                    if (cIdx < currentInput.length) {
                      if (cIdx < (hasError ? firstErrorIndex : currentInput.length)) {
                        charClass = 'text-emerald-400 font-black';
                      } else {
                        charClass = 'text-danger font-black underline bg-danger/40 px-0.5 rounded';
                      }
                    }
                    return <span key={cIdx}>{char}</span>;
                  })}
                  {/* Show extra typed wrong characters if player over-typed */}
                  {currentInput.length > word.length && (
                    <span className="text-danger font-black underline bg-danger/50 px-0.5 rounded ml-0.5">
                      {currentInput.slice(word.length)}
                    </span>
                  )}
                </span>
              );
            }

            // Upcoming words
            return (
              <span key={wIdx} className="text-text-muted/60 font-medium">
                {word}
              </span>
            );
          })}
        </div>
      </div>

      {/* 3. TypeRacer Active Word Dedicated Input Box */}
      <div className="space-y-1.5">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={handleInputChange}
            disabled={!raceStarted || disabled || isFinished}
            placeholder={
              !raceStarted
                ? '🏁 Click "Start Race" above to launch vehicle and enable typing...'
                : isFinished
                ? '🏆 Race Completed! Review your final score below.'
                : hasError
                ? '⚠️ Typo in word! Press Backspace to fix before advancing!'
                : `Type "${currentTargetWord}" and press Space...`
            }
            className={`w-full rounded-xl border px-4 py-3 sm:py-3.5 text-base sm:text-lg font-mono font-bold transition-all outline-none ${
              hasError
                ? 'border-danger bg-danger/15 text-danger placeholder-danger/60 ring-2 ring-danger/40 animate-shake'
                : 'border-primary/50 bg-surface-dark text-white placeholder-text-muted/50 focus:border-accent focus:ring-2 focus:ring-accent/30'
            } ${!raceStarted || disabled || isFinished ? 'opacity-50 cursor-not-allowed' : ''}`}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
          />

          {hasError && raceStarted && !isFinished && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 px-2 py-1 rounded bg-danger/25 text-danger text-xs font-bold font-mono">
              <span>BACKSPACE TO FIX</span>
            </div>
          )}
        </div>

        {/* Dynamic Context Feedback Bar */}
        <div className="flex items-center justify-between text-xs text-text-muted pt-1">
          <span>
            Target Word:{' '}
            <strong className="text-accent font-mono">
              {currentTargetWord ? `"${currentTargetWord}"` : 'Done'}
            </strong>
          </span>
          <span className="font-mono">
            {hasError ? (
              <span className="text-danger font-bold">⛔ Vehicle Stalled (Typo Detected)</span>
            ) : raceStarted && !isFinished ? (
              <span className="text-emerald-400 font-bold">⚡ Press Space to advance car</span>
            ) : (
              <span>Language: {passage.language === 'BN' ? 'বাঙলা (Bangla)' : 'English'}</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
