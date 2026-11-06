'use client';

import React, { useState, useEffect } from 'react';
import { api, getCurrentUser, UserSession } from '../../lib/api';
import { Trophy, Users, Shield, Sparkles, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';

export default function CompetitionsPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedComp, setSelectedComp] = useState<any | null>(null);
  const [heats, setHeats] = useState<any[]>([]);
  const [regMessage, setRegMessage] = useState<{ text: string; error: boolean } | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    loadCompetitions();
  }, []);

  const loadCompetitions = async () => {
    try {
      const data = await api.getCompetitions();
      setCompetitions(data || []);
      if (data && data.length > 0) {
        setSelectedComp(data[0]);
        loadHeats(data[0]._id);
      }
    } catch (e) {
      // fallback
    }
  };

  const loadHeats = async (compId: string) => {
    try {
      const heatData = await api.getHeats(compId);
      setHeats(heatData || []);
    } catch (e) {
      setHeats([]);
    }
  };

  const handleRegister = async (compId: string) => {
    setRegMessage(null);
    if (!currentUser) {
      setRegMessage({
        text: 'You must be registered and logged in to enter official competitions. Guests cannot register.',
        error: true,
      });
      return;
    }

    try {
      const res = await api.registerCompetition(compId);
      setRegMessage({
        text: `Registration confirmed! Your tournament seed number is #${res.registration?.seedNumber || 1}.`,
        error: false,
      });
      loadCompetitions();
    } catch (err: any) {
      setRegMessage({
        text: err.message || 'Registration failed.',
        error: true,
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="inline-flex items-center space-x-2 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
          <Trophy className="h-3.5 w-3.5" />
          <span>Official Esports Tournaments (20 to 300 Racers)</span>
        </div>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-text">
          Championships & Automated Heat Engine
        </h1>
        <p className="mt-2 text-xs text-text-muted max-w-2xl">
          Competitions partition registered participants into balanced 2–7 racer qualifying heats. The top racers advance to Semifinals and Grand Finals.
        </p>
      </div>

      {regMessage && (
        <div className={`rounded-xl p-4 text-xs font-semibold flex items-center space-x-2 ${
          regMessage.error
            ? 'border border-danger/40 bg-danger/10 text-danger'
            : 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
        }`}>
          {regMessage.error ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{regMessage.text}</span>
        </div>
      )}

      {/* Main Grid: Competition List & Selected Competition Detail */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Competitions Sidebar */}
        <div className="space-y-4">
          <h3 className="font-display text-sm font-bold tracking-wider text-text uppercase">
            All Competitions
          </h3>
          <div className="space-y-3">
            {competitions.map((comp) => {
              const isSelected = selectedComp?._id === comp._id;
              return (
                <div
                  key={comp._id}
                  onClick={() => { setSelectedComp(comp); loadHeats(comp._id); setRegMessage(null); }}
                  className={`cursor-pointer rounded-2xl p-5 transition-all ${
                    isSelected
                      ? 'border border-primary bg-primary/10 shadow-lg shadow-primary/20'
                      : 'border border-white/10 bg-surface/70 hover:bg-surface-light'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="rounded bg-white/5 px-2 py-0.5 text-accent">{comp.settings?.language || 'EN'}</span>
                    <span className="text-text-muted">{comp.currentParticipantCount || 0} / {comp.settings?.maxParticipants || 300}</span>
                  </div>
                  <h4 className="mt-2 font-display text-base font-bold text-text">{comp.title}</h4>
                  <p className="mt-1 text-xs text-text-muted line-clamp-2">{comp.description}</p>
                  <div className="mt-4 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-emerald-400">{comp.status}</span>
                    <span className="text-text-dim">Format: {comp.settings?.tournamentFormat || 'ELIMINATION'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Competition Overview & Heats View */}
        {selectedComp && (
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel rounded-3xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <div className="text-xs font-mono text-accent">SLUG: {selectedComp.slug}</div>
                  <h2 className="mt-1 font-display text-2xl font-bold text-text">{selectedComp.title}</h2>
                  <p className="mt-2 text-xs text-text-muted max-w-xl leading-relaxed">{selectedComp.description}</p>
                </div>

                <button
                  onClick={() => handleRegister(selectedComp._id)}
                  disabled={selectedComp.currentParticipantCount >= (selectedComp.settings?.maxParticipants || 300)}
                  className="rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 disabled:opacity-40 transition-all shrink-0"
                >
                  Register for Event
                </button>
              </div>

              {/* Event Limit Enforcement Metrics */}
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-white/5 bg-surface-dark p-3 text-center">
                  <div className="font-mono text-xl font-bold text-text">
                    {selectedComp.currentParticipantCount || 0}
                  </div>
                  <div className="text-[10px] uppercase text-text-muted">Registered</div>
                </div>

                <div className="rounded-xl border border-white/5 bg-surface-dark p-3 text-center">
                  <div className="font-mono text-xl font-bold text-accent">
                    {selectedComp.settings?.minParticipants || 20}
                  </div>
                  <div className="text-[10px] uppercase text-text-muted">Min Participants</div>
                </div>

                <div className="rounded-xl border border-white/5 bg-surface-dark p-3 text-center">
                  <div className="font-mono text-xl font-bold text-secondary">
                    {selectedComp.settings?.maxParticipants || 300}
                  </div>
                  <div className="text-[10px] uppercase text-text-muted">Max Capacity</div>
                </div>

                <div className="rounded-xl border border-white/5 bg-surface-dark p-3 text-center">
                  <div className="font-mono text-xl font-bold text-emerald-400">
                    2–7
                  </div>
                  <div className="text-[10px] uppercase text-text-muted">Heat Size</div>
                </div>
              </div>

              {/* Automated Heat Scheduler View */}
              <div className="mt-8">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="font-display text-base font-bold text-text flex items-center space-x-2">
                    <Users className="h-4 w-4 text-accent" />
                    <span>Automated Qualifying Heats</span>
                  </h3>
                  <span className="text-xs text-text-muted font-mono">
                    {heats.length > 0 ? `${heats.length} Heats Generated` : 'Pending Heat Generation'}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {heats.length > 0 ? (
                    heats.map((heat) => (
                      <div key={heat._id || heat.heatNumber} className="rounded-xl border border-white/10 bg-surface p-4">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="font-bold text-accent">HEAT #{heat.heatNumber}</span>
                          <span className="text-text-muted">{heat.participants?.length || 0} Racers</span>
                        </div>

                        <div className="mt-3 space-y-1.5">
                          {heat.participants?.map((p: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                              <span className="text-text">{p.username}</span>
                              <span className="text-[10px] font-mono text-text-muted">Lane {idx + 1}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs text-text-muted">
                      Heats will be automatically generated once confirmed participants reach at least 20 racers.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
