'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TypingEngineProps {
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
  const [typedText, setTypedText] = useState('');
  const [errors, setErrors] = useState<number[]>([]);
  const [totalInputs, setTotalInputs] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [isComposing, setIsComposing] = useState(false); // For Bangla IME composition
  const [isFinished, setIsFinished] = useState(false);

  // Live HUD telemetry
  const [netWpm, setNetWpm] = useState(0);
  const [rawWpm, setRawWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Reset state on passage change or when race resets
  useEffect(() => {
    if (!raceStarted) {
      setTypedText('');
      setErrors([]);
      setTotalInputs(0);
      setStartTime(null);
      setStreak(0);
      setIsFinished(false);
      setNetWpm(0);
      setRawWpm(0);
      setAccuracy(100);
    }
  }, [passage.id, raceStarted]);

  // Focus input when race starts
  useEffect(() => {
    if (raceStarted && !disabled) {
      inputRef.current?.focus();
      if (!startTime) {
        setStartTime(Date.now());
      }
    }
  }, [raceStarted, disabled, startTime]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!raceStarted || disabled || isFinished) return;

    const val = e.target.value;
    const now = Date.now();
    const effectiveStartTime = startTime || now;
    if (!startTime) setStartTime(now);

    const targetContent = passage.content;
    const currentLength = val.length;

    // Track total keystroke attempts
    const newTotalInputs = Math.max(totalInputs + 1, currentLength);
    setTotalInputs(newTotalInputs);

    // Evaluate accuracy and mistakes
    const newErrors: number[] = [];
    let correctCount = 0;

    for (let i = 0; i < currentLength; i++) {
      if (val[i] === targetContent[i]) {
        correctCount++;
      } else {
        newErrors.push(i);
      }
    }

    setTypedText(val);
    setErrors(newErrors);

    // Calculate Streak
    if (newErrors.length === 0 && currentLength > typedText.length) {
      setStreak(prev => prev + 1);
    } else if (newErrors.length > 0) {
      setStreak(0);
    }

    // Standard scoring formulas
    const elapsedMinutes = Math.max((now - effectiveStartTime) / 60000, 0.03);
    const calculatedRawWpm = Number(((newTotalInputs / 5) / elapsedMinutes).toFixed(1));
    const calculatedNetWpm = Math.max(0, Number(((correctCount / 5) / elapsedMinutes).toFixed(1)));
    const calculatedAccuracy = newTotalInputs > 0
      ? Number(((correctCount / newTotalInputs) * 100).toFixed(1))
      : 100;

    setRawWpm(calculatedRawWpm);
    setNetWpm(calculatedNetWpm);
    setAccuracy(calculatedAccuracy);

    const completed = val === targetContent;
    if (completed && !isFinished) {
      setIsFinished(true);
      const durationSeconds = Number(((now - effectiveStartTime) / 1000).toFixed(1));
      onComplete?.({
        rawWpm: calculatedRawWpm,
        netWpm: calculatedNetWpm,
        accuracy: calculatedAccuracy,
        durationSeconds,
      });
    }

    onProgress?.({
      textBuffer: val,
      typedIndex: currentLength,
      errorCount: newErrors.length,
      rawInputs: newTotalInputs,
      rawWpm: calculatedRawWpm,
      netWpm: calculatedNetWpm,
      accuracy: calculatedAccuracy,
      streak: newErrors.length === 0 ? streak + 1 : 0,
      isFinished: completed,
    });
  };

  // IME Handlers for Bangla Typing (Avro / Bijoy layout support)
  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="relative flex flex-col space-y-4 rounded-2xl border border-white/10 bg-surface/90 p-6 shadow-2xl backdrop-blur-xl transition-all"
    >
      {/* Telemetry HUD Bar */}
      <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-4 md:grid-cols-4">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
          <div className="font-mono text-2xl font-black text-primary text-glow-blue">{netWpm}</div>
          <div className="text-xs font-semibold tracking-wider text-text-muted uppercase">Net WPM</div>
        </div>

        <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 text-center">
          <div className="font-mono text-2xl font-black text-accent text-glow-cyan">{accuracy}%</div>
          <div className="text-xs font-semibold tracking-wider text-text-muted uppercase">Accuracy</div>
        </div>

        <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-3 text-center">
          <div className="font-mono text-2xl font-black text-secondary text-glow-purple">{streak}</div>
          <div className="text-xs font-semibold tracking-wider text-text-muted uppercase">Streak {streak >= 25 ? '⚡ NITRO' : ''}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
          <div className="font-mono text-2xl font-black text-text">{rawWpm}</div>
          <div className="text-xs font-semibold tracking-wider text-text-muted uppercase">Raw WPM</div>
        </div>
      </div>

      {/* Passage Display with Error Highlighting & Cursor */}
      <div className="min-h-[140px] rounded-xl bg-surface-dark/90 p-5 font-mono text-lg leading-relaxed select-none">
        {passage.content.split('').map((char, index) => {
          let charClass = 'text-text-dim'; // untyped
          const isCurrentChar = index === typedText.length;

          if (index < typedText.length) {
            if (typedText[index] === char) {
              charClass = 'text-emerald-400 font-semibold'; // correct
            } else {
              charClass = 'text-danger bg-danger/20 font-bold underline'; // error
            }
          }

          return (
            <span key={index} className="relative">
              {isCurrentChar && raceStarted && !isFinished && (
                <span className="typing-caret -mr-[2px]" />
              )}
              <span className={charClass}>{char}</span>
            </span>
          );
        })}
      </div>

      {/* Hidden/Transparent Native Input Capturing Keystrokes */}
      <input
        ref={inputRef}
        type="text"
        value={typedText}
        onChange={handleInputChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        disabled={!raceStarted || disabled || isFinished}
        className="absolute inset-0 h-full w-full cursor-default opacity-0"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
      />

      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>Language: <strong className="text-text">{passage.language === 'BN' ? 'বাঙলা (Bangla)' : 'English'}</strong></span>
        <span>{typedText.length} / {passage.content.length} characters</span>
        <span>{disabled || !raceStarted ? 'Waiting for race start...' : 'Type as fast and accurately as you can!'}</span>
      </div>
    </div>
  );
}
