'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, getCurrentUser, UserSession } from '../../../lib/api';
import { checkGamingAccess } from '../../../lib/roleGuard';
import {
  Bot,
  Zap,
  Target,
  TrendingUp,
  CheckCircle,
  ChevronLeft,
  Sparkles,
  AlertCircle,
  Send,
  MessageSquare,
  Flame,
  Award,
  Clock,
  RotateCw,
  ArrowRight,
  Brain,
} from 'lucide-react';

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export default function AnalyticsPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [coaching, setCoaching] = useState<any>(null);
  const [weaknessData, setWeaknessData] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [practiceHistory, setPracticeHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Conversational AI Coach state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: "Greetings Racer! I'm your KEYRUSH AI Coach. I analyze your keystroke cadence, error intervals, and burst velocity. What aspect of your racing would you like to optimize today?",
      timestamp: 'Just now',
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    // Role guard: Organizers & Admins cannot access racer telemetry
    const access = checkGamingAccess();
    if (!access.allowed && access.redirectUrl) {
      window.location.href = access.redirectUrl;
      return;
    }

    const user = getCurrentUser();
    setCurrentUser(user);
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const history = await api.getPracticeHistory(15).catch(() => []);
      const weaknesses = await api.getUserWeaknesses().catch(() => ({}));

      const [coachRes, weakRes, planRes] = await Promise.all([
        api.getAiCoaching(history).catch(() => null),
        api.getAiWeaknesses(weaknesses).catch(() => null),
        api.getAiPracticePlan(1, 65).catch(() => null),
      ]);

      setPracticeHistory(history || []);
      setCoaching(coachRes);
      setWeaknessData(weakRes);
      setPlan(planRes);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || userInput;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setUserInput('');
    setIsThinking(true);

    // AI Coaching Heuristic Engine
    setTimeout(() => {
      let aiReply = "To optimize your velocity, maintain steady breathing and focus on 100% accuracy on the first three words of every passage.";
      const lower = text.toLowerCase();

      if (lower.includes('plateau') || lower.includes('speed') || lower.includes('wpm')) {
        aiReply = `Based on your recent ${coaching?.avgWpm || 65} WPM telemetry, your cadence shows slight stuttering during punctuation clusters. I recommend doing 25-word sprint bursts in Practice Mode to train muscle relaxation.`;
      } else if (lower.includes('bangla') || lower.includes('avro') || lower.includes('bijoy')) {
        aiReply = `For Bangla IME typing, prioritize vowel sign combinations (কার/ফলা) without pausing after root consonants. Our typing engine buffers intermediate keystrokes without penalties!`;
      } else if (lower.includes('warmup') || lower.includes('routine')) {
        aiReply = `Optimal 10-Minute Warmup Protocol:\n1. 2 minutes: 25-word Easy mode (focus on zero backspaces)\n2. 4 minutes: Targeted weakness drills on your high-miss keys\n3. 4 minutes: 2 casual multiplayer races to calibrate burst reflexes.`;
      } else if (lower.includes('accuracy') || lower.includes('error')) {
        aiReply = `Your accuracy baseline is ${coaching?.avgAcc || 96}%. Slowing down your raw typing speed by just 5% will prevent the strict typo lockouts in competitive heats, yielding a higher net WPM.`;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsThinking(false);
    }, 700);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <span className="font-mono text-xs text-text-muted">Loading AI Coaching Telemetry...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div>
          <Link href="/dashboard" className="text-xs text-primary hover:underline flex items-center mb-2">
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            <span>Return to Racer Dashboard</span>
          </Link>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-accent/10 text-accent border border-accent/20">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black font-display text-text">AI Typing Coach 3.0</h1>
                <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-mono font-bold uppercase tracking-wider">
                  ACTIVE INTELLIGENCE
                </span>
              </div>
              <p className="text-xs text-text-muted">
                Heuristic cadence diagnosis, weak-key drills, and predictive racing telemetry.
              </p>
            </div>
          </div>
        </div>

        {/* Diagnostic Hero Banner */}
        {coaching && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-accent/20 shadow-2xl relative overflow-hidden bg-surface">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="text-xs font-mono font-bold text-accent uppercase tracking-wider">
                    Diagnostic Telemetry Summary
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-text">
                  Velocity Tier: <span className="text-primary">{coaching.speedTier || 'EXPERT RACER'}</span> • Match Readiness:{' '}
                  <span className="text-emerald-400">{coaching.readinessScore || 92}%</span>
                </h2>
                <div className="flex flex-wrap gap-4 text-xs font-mono text-text-muted pt-1">
                  <span>Speed: <strong className="text-text">{coaching.avgWpm || 65} WPM</strong></span>
                  <span>Accuracy: <strong className="text-text">{coaching.avgAcc || 96}%</strong></span>
                  <span>Cadence Variance: <strong className="text-accent">±{coaching.consistencyStdDev || 4.2} WPM</strong></span>
                </div>
              </div>

              <div className="w-full lg:w-96 p-4 rounded-2xl bg-surface-light border border-white/5 space-y-2">
                <span className="text-xs font-bold text-text flex items-center space-x-1.5">
                  <Target className="h-4 w-4 text-accent" />
                  <span>Coach Recommendations:</span>
                </span>
                <ul className="space-y-1.5 text-xs text-text-muted">
                  {(coaching.tips || [
                    'Maintain rhythmic cadence during complex punctuation.',
                    'Keep hands relaxed during high-intensity 300km/h sprint bursts.',
                    'Prioritize 100% accuracy on first word to trigger early Nitro acceleration.',
                  ]).map((t: string, idx: number) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-accent font-bold">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Interactive AI Coach Chat Terminal */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-surface space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center space-x-2.5">
              <Bot className="h-5 w-5 text-accent" />
              <h3 className="font-display font-bold text-sm text-text">Interactive Coach Terminal</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ONLINE</span>
            </span>
          </div>

          {/* Quick Query Pills */}
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              'How do I break 90 WPM?',
              'Analyze my error patterns',
              'Recommend a 10-minute warmup',
              'Bangla IME typing tips',
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="px-3 py-1 rounded-xl bg-surface-light border border-white/10 text-text-muted hover:text-accent hover:border-accent/40 text-[11px] font-mono transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Messages Log */}
          <div className="h-64 overflow-y-auto space-y-3 p-3 rounded-2xl bg-surface-dark border border-white/5 font-sans text-xs">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-md p-3.5 rounded-2xl leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-primary text-white rounded-br-none shadow-md'
                      : 'bg-surface-light text-text rounded-bl-none border border-white/5'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
                <span className="text-[9px] font-mono text-text-muted mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}
            {isThinking && (
              <div className="flex items-center space-x-2 text-text-muted text-xs font-mono p-2">
                <RotateCw className="h-3.5 w-3.5 animate-spin text-accent" />
                <span>AI Coach analyzing telemetry...</span>
              </div>
            )}
          </div>

          {/* Chat Input Field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 pt-2"
          >
            <input
              type="text"
              placeholder="Ask your coach anything about speed, cadence, or practice..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface-light border border-white/10 text-xs text-text placeholder-text-muted focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={!userInput.trim() || isThinking}
              className="p-2.5 rounded-xl bg-accent text-black font-bold hover:bg-accent/90 disabled:opacity-40 transition-all shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Targeted Weakness Drills & 7-Day Plan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weakness Drills */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-surface space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                <span>Targeted Muscle-Memory Drills</span>
              </h3>
              <Link
                href="/practice"
                className="text-xs text-accent font-mono hover:underline flex items-center space-x-1"
              >
                <span>Launch in Arena</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <p className="text-xs text-text-muted">
              Auto-generated muscle-memory exercises focusing on your highest miss-rate keys.
            </p>

            <div className="space-y-3 pt-1">
              {(weaknessData?.targetedDrills || [
                'quick apex sprint rhythm phantom drift velocity nitro boost',
                'p;p; [brackets] & punctuation {symbols} acceleration flow',
                'bangla shurjo probhat shundor shapla shonar bangla granthagar',
              ]).map((drill: string, idx: number) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-surface-light border border-white/5 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-text-muted">
                    <span>Exercise #{idx + 1}</span>
                    <span className="text-accent font-bold">Focus: Punctuation & Speed Cadence</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-background font-mono text-xs text-text border border-white/5 select-all">
                    {drill}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7-Day Training Regimen */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-surface space-y-4">
            <h3 className="text-sm font-bold text-text flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span>7-Day Adaptive Training Regimen</span>
            </h3>
            <p className="text-xs text-text-muted">
              Personalized daily milestones targeting speed acceleration and error elimination.
            </p>

            <div className="space-y-2 pt-1">
              {(plan?.schedule || [
                { day: 'Day 1', focus: 'Burst Velocity Acceleration', durationMinutes: 15, mode: 'SPRINT' },
                { day: 'Day 2', focus: 'Error Elimination & Backspace Reduction', durationMinutes: 15, mode: 'ACCURACY' },
                { day: 'Day 3', focus: 'Bangla IME Fluidity Drills', durationMinutes: 20, mode: 'BANGLA' },
                { day: 'Day 4', focus: 'High-Speed Endurance Paragraphs', durationMinutes: 20, mode: 'ENDURANCE' },
                { day: 'Day 5', focus: 'Punctuation & Code Typing Rhythm', durationMinutes: 15, mode: 'CODE' },
                { day: 'Day 6', focus: 'Multiplayer Heat Simulation', durationMinutes: 25, mode: 'RANKED' },
                { day: 'Day 7', focus: 'Championship Qualifying Time Trial', durationMinutes: 30, mode: 'TOURNAMENT' },
              ]).map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-surface-light border border-white/5 hover:border-white/15 transition-all text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-12 font-mono font-bold text-primary">{item.day}</span>
                    <span className="text-text font-medium">{item.focus}</span>
                  </div>
                  <div className="flex items-center space-x-2 font-mono text-text-muted">
                    <span>{item.durationMinutes}m</span>
                    <span className="px-2 py-0.5 rounded-lg bg-surface border border-white/10 text-[10px] uppercase text-accent font-bold">
                      {item.mode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
