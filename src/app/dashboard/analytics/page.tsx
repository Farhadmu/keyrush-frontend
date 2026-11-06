'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, getCurrentUser } from '../../../lib/api';
import { Bot, Zap, Target, TrendingUp, CheckCircle, ChevronLeft, Sparkles, AlertCircle } from 'lucide-react';

export default function AnalyticsPage() {
  const [coaching, setCoaching] = useState<any>(null);
  const [weaknessData, setWeaknessData] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const history = await api.getPracticeHistory(15).catch(() => []);
      const weaknesses = await api.getUserWeaknesses().catch(() => ({}));

      const [coachRes, weakRes, planRes] = await Promise.all([
        api.getAiCoaching(history).catch(() => null),
        api.getAiWeaknesses(weaknesses).catch(() => null),
        api.getAiPracticePlan(1, 65).catch(() => null),
      ]);

      setCoaching(coachRes);
      setWeaknessData(weakRes);
      setPlan(planRes);
    } catch (e) {}
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <Link href="/dashboard" className="text-xs text-primary hover:underline flex items-center mb-1">
            <ChevronLeft className="h-3 w-3 mr-1" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-accent/10 text-accent border border-accent/20">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-display text-text">AI Typing Coach & Telemetry Analytics</h1>
              <p className="text-xs text-text-muted">Heuristic telemetry intelligence, error pattern diagnosis, and training regimens.</p>
            </div>
          </div>
        </div>

        {/* AI Coach Summary Card */}
        {coaching && (
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-accent/30 shadow-xl shadow-accent/5 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="text-xs font-bold font-mono text-accent uppercase tracking-wider">Coach Diagnostic</span>
                </div>
                <h2 className="text-xl font-bold text-text">
                  Tier: <span className="text-primary">{coaching.speedTier}</span> • Readiness Rating: <span className="text-emerald-400">{coaching.readinessScore}%</span>
                </h2>
                <div className="flex flex-wrap gap-4 text-xs font-mono text-text-muted pt-1">
                  <span>Speed: <strong className="text-text">{coaching.avgWpm} WPM</strong></span>
                  <span>Accuracy: <strong className="text-text">{coaching.avgAcc}%</strong></span>
                  <span>Consistency Deviation: <strong className="text-text">±{coaching.consistencyStdDev} WPM</strong></span>
                </div>
              </div>

              <div className="w-full md:w-auto p-4 rounded-xl bg-surface/80 border border-white/10 space-y-2 max-w-md">
                <span className="text-xs font-bold text-text flex items-center space-x-1.5">
                  <Target className="h-4 w-4 text-accent" />
                  <span>Key Optimization Tips:</span>
                </span>
                <ul className="space-y-1 text-xs text-text-muted">
                  {coaching.tips?.map((t: string, idx: number) => (
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

        {/* Weakness Drills & Training Plan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Targeted Key Drills */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-text flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <span>Targeted Weakness Drills</span>
            </h3>
            <p className="text-xs text-text-muted">
              Auto-generated muscle-memory exercises focusing on your highest miss-rate keys.
            </p>

            <div className="space-y-3 pt-2">
              {weaknessData?.targetedDrills?.map((drill: string, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-surface/60 border border-white/5 space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-text-muted">
                    <span>Exercise #{idx + 1}</span>
                    <span className="text-accent font-bold">Focus: Punctuation & Cadence</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background font-mono text-sm text-text border border-white/5 select-all">
                    {drill}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7-Day Structured Practice Regimen */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-text flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <span>7-Day Adaptive Training Regimen</span>
            </h3>
            <p className="text-xs text-text-muted">
              Personalized daily milestones targeting speed acceleration and error elimination.
            </p>

            <div className="space-y-2 pt-2">
              {plan?.schedule?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface/50 border border-white/5 hover:border-white/15 transition-all text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-12 font-mono font-bold text-primary">{item.day}</span>
                    <span className="text-text font-medium">{item.focus}</span>
                  </div>
                  <div className="flex items-center space-x-2 font-mono text-text-muted">
                    <span>{item.durationMinutes}m</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] uppercase text-accent font-bold">
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

