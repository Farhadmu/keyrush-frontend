'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, getCurrentUser, UserSession } from '../../lib/api';
import { getRacingSocket } from '../../lib/socket';
import RacingCanvas, { RacerVisualState } from '../../game/RacingCanvas';
import TypingEngine from '../../features/typing/TypingEngine';
import { Users, Plus, Play, LogIn, Flame, Trophy, CheckCircle, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MultiplayerPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [raceStarted, setRaceStarted] = useState(false);
  const [podium, setPodium] = useState<any[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live visual racers in the room
  const [racers, setRacers] = useState<RacerVisualState[]>([]);

  // Create room modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState(7);
  const [newRoomLanguage, setNewRoomLanguage] = useState('EN');

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await api.getPublicRooms();
      setRooms(data || []);
    } catch (e) {
      // fallback
    }
  };

  // Socket setup when joining a room
  const joinRoom = (roomId: string) => {
    if (!currentUser) return;
    setErrorMsg(null);
    const socket = getRacingSocket();

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('race:join', { roomId, carId: 'car_cyber_phantom' });

    socket.off('race:joined');
    socket.off('race:playerJoined');
    socket.off('race:playerLeft');
    socket.off('race:readyUpdate');
    socket.off('race:countdown');
    socket.off('race:started');
    socket.off('race:progress');
    socket.off('race:finished');
    socket.off('race:error');

    socket.on('race:joined', (data: any) => {
      setActiveRoom(data);
      setIsReady(false);
      setCountdown(null);
      setRaceStarted(false);
      setPodium(null);

      const initialRacers: RacerVisualState[] = data.participants.map((p: any, idx: number) => ({
        userId: p.userId,
        username: p.username,
        carId: p.carId,
        progressPercent: 0,
        speed: 20,
        nitroActive: false,
        rankPosition: idx + 1,
        finished: false,
        isCurrentPlayer: p.userId === currentUser.id,
      }));
      setRacers(initialRacers);
    });

    socket.on('race:playerJoined', (data: any) => {
      setRacers(prev => [
        ...prev,
        {
          userId: data.participant.userId,
          username: data.participant.username,
          carId: data.participant.carId,
          progressPercent: 0,
          speed: 20,
          nitroActive: false,
          rankPosition: prev.length + 1,
          finished: false,
          isCurrentPlayer: false,
        },
      ]);
    });

    socket.on('race:playerLeft', (data: any) => {
      setRacers(prev => prev.filter(r => r.userId !== data.userId));
    });

    socket.on('race:readyUpdate', (data: any) => {
      // update ready marker
    });

    socket.on('race:countdown', (data: any) => {
      setCountdown(data.secondsRemaining);
    });

    socket.on('race:started', () => {
      setCountdown(null);
      setRaceStarted(true);
    });

    socket.on('race:progress', (data: any) => {
      setRacers(prev =>
        prev.map(r => {
          const match = data.positions.find((p: any) => p.userId === r.userId);
          if (!match) return r;
          return {
            ...r,
            progressPercent: match.progressPercent,
            speed: match.speed,
            nitroActive: match.nitroActive,
            rankPosition: match.rankPosition,
            finished: match.finished,
          };
        }),
      );
    });

    socket.on('race:finished', (data: any) => {
      setPodium(data.results);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    });

    socket.on('race:error', (err: any) => {
      setErrorMsg(err.message || 'Multiplayer error');
    });
  };

  const handleToggleReady = () => {
    if (!activeRoom) return;
    const socket = getRacingSocket();
    const nextReady = !isReady;
    setIsReady(nextReady);
    socket.emit('race:ready', { roomId: activeRoom.roomId, isReady: nextReady });
  };

  const handleTypingProgress = (data: any) => {
    if (!activeRoom || !raceStarted) return;
    const socket = getRacingSocket();
    socket.emit('race:typing', {
      roomId: activeRoom.roomId,
      typedIndex: data.typedIndex,
      errorCount: data.errorCount,
      rawInputCount: data.rawInputs,
    });
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const res = await api.createRoom({
        name: newRoomName || `${currentUser.username}'s Race`,
        maxPlayers: Number(newRoomCapacity),
        language: newRoomLanguage,
      });
      setShowCreateModal(false);
      joinRoom(res.roomId);
      loadRooms();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not create room');
    }
  };

  // If Guest, display registration prompt
  if (!currentUser) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="rounded-3xl border border-primary/30 bg-surface/80 p-10 shadow-2xl backdrop-blur-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <Flame className="h-8 w-8 text-glow-blue" />
          </div>

          <h2 className="mt-6 font-display text-3xl font-extrabold text-text">
            Multiplayer Authentication Required
          </h2>
          <p className="mt-3 text-sm text-text-muted leading-relaxed">
            According to official game rules, guest accounts cannot enter multiplayer race rooms. Please sign in or register your account to race live against 2 to 7 players.
          </p>

          <div className="mt-8 flex justify-center space-x-4">
            <Link
              href="/login"
              className="rounded-xl border border-white/10 bg-surface px-6 py-2.5 text-xs font-semibold text-text hover:bg-surface-light"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text flex items-center space-x-2">
            <span>Live Multiplayer Arena</span>
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 font-mono text-[10px] text-accent font-semibold">
              2–7 Racers
            </span>
          </h1>
          <p className="text-xs text-text-muted">Strict server-authoritative racing over WebSockets.</p>
        </div>

        {!activeRoom && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            <span>Create Race Room (2-7 Slots)</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-xs font-semibold text-danger">
          {errorMsg}
        </div>
      )}

      {/* ACTIVE ROOM VIEW */}
      {activeRoom ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-primary/20 bg-surface/80 p-4 backdrop-blur-xl">
            <div>
              <div className="text-xs font-mono text-accent">{activeRoom.roomId}</div>
              <h2 className="font-display text-lg font-bold text-text">{activeRoom.name}</h2>
              <div className="text-xs text-text-muted">
                {racers.length} / {activeRoom.maxPlayers} Racers Connected (Min: 2)
              </div>
            </div>

            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              {!raceStarted && (
                <button
                  onClick={handleToggleReady}
                  className={`flex items-center space-x-1.5 rounded-xl px-5 py-2 text-xs font-bold transition-all ${
                    isReady
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                      : 'border border-primary bg-primary/20 text-primary hover:bg-primary hover:text-white'
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{isReady ? 'READY!' : 'MARK READY'}</span>
                </button>
              )}

              <button
                onClick={() => { setActiveRoom(null); loadRooms(); }}
                className="rounded-xl border border-white/10 bg-surface px-4 py-2 text-xs font-semibold text-text-muted hover:text-danger hover:border-danger/30"
              >
                Leave Lobby
              </button>
            </div>
          </div>

          {/* Countdown Banner */}
          {countdown !== null && (
            <div className="rounded-2xl border border-accent/40 bg-surface-glass p-6 text-center shadow-2xl backdrop-blur-2xl animate-pulse">
              <div className="font-mono text-5xl font-black text-accent text-glow-cyan">
                {countdown}
              </div>
              <div className="mt-2 text-xs font-bold tracking-widest text-text uppercase">
                ALL PLAYERS READY — RACE STARTING!
              </div>
            </div>
          )}

          {/* 2.5D Multiplayer Canvas */}
          <RacingCanvas racers={racers} raceStarted={raceStarted} />

          {/* Typing Engine during Race */}
          {activeRoom.passage && (
            <TypingEngine
              passage={activeRoom.passage}
              raceStarted={raceStarted}
              onProgress={handleTypingProgress}
            />
          )}

          {/* Live Podium Results */}
          {podium && (
            <div className="rounded-2xl border border-primary/40 bg-surface-dark/95 p-8 text-center shadow-2xl backdrop-blur-2xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                <Trophy className="h-8 w-8 text-warning" />
              </div>

              <h2 className="mt-4 font-display text-2xl font-black text-text">🏁 RACE CONCLUDED!</h2>
              <div className="mx-auto mt-6 max-w-xl divide-y divide-white/5">
                {podium.map((p, idx) => (
                  <div key={p.userId} className="flex items-center justify-between py-3 text-xs">
                    <div className="flex items-center space-x-3">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full font-bold font-mono ${
                        idx === 0 ? 'bg-amber-400 text-black' : idx === 1 ? 'bg-slate-300 text-black' : 'bg-amber-600 text-white'
                      }`}>
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-text">{p.username}</span>
                    </div>
                    <div className="font-mono text-right">
                      <div className="font-bold text-accent">{p.netWpm} WPM</div>
                      <div className="text-[10px] text-text-muted">{p.accuracy}% Acc</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ROOM BROWSER & LOBBY LIST */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {rooms.length > 0 ? (
            rooms.map((room) => (
              <div key={room.roomId} className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-accent">
                    <span className="rounded-md bg-accent/10 px-2 py-0.5">{room.roomId}</span>
                    <span className="text-text-muted">{room.playerCount} / {room.maxPlayers} Racers</span>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-bold text-text">{room.name}</h3>
                  <div className="mt-2 text-xs text-text-muted">
                    Language: <strong className="text-text">{room.language}</strong> • Capacity: 2–{room.maxPlayers}
                  </div>
                </div>

                <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400">STATUS: {room.state}</span>
                  <button
                    onClick={() => joinRoom(room.roomId)}
                    disabled={room.playerCount >= room.maxPlayers || room.state === 'IN_PROGRESS'}
                    className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-40 transition-all"
                  >
                    {room.playerCount >= room.maxPlayers ? 'Room Full' : 'Enter Lobby'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 rounded-2xl border border-dashed border-white/10 p-12 text-center text-text-muted">
              No active rooms found. Click "Create Race Room" to host a 2–7 player race!
            </div>
          )}
        </div>
      )}

      {/* CREATE ROOM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-primary/30 bg-surface-dark p-6 shadow-2xl">
            <h3 className="font-display text-xl font-bold text-text">Create Multiplayer Room</h3>
            <p className="mt-1 text-xs text-text-muted">Choose your room parameters. Enforces 2 to 7 racers.</p>

            <form onSubmit={handleCreateRoom} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-text">Room Title</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  placeholder="e.g. Midnight Cyber Expressway"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-surface px-4 py-2 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text">Max Player Capacity (2 to 7)</label>
                <input
                  type="number"
                  min="2"
                  max="7"
                  value={newRoomCapacity}
                  onChange={e => setNewRoomCapacity(parseInt(e.target.value, 10))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-surface px-4 py-2 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text">Typing Language</label>
                <select
                  value={newRoomLanguage}
                  onChange={e => setNewRoomLanguage(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-surface px-4 py-2 text-sm text-text focus:border-primary focus:outline-none"
                >
                  <option value="EN">English</option>
                  <option value="BN">বাঙলা (Bangla)</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-white/10 bg-surface px-4 py-2 text-xs font-semibold text-text-muted hover:text-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white hover:bg-primary-hover shadow-lg shadow-primary/25"
                >
                  Launch Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
