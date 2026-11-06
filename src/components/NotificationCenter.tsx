'use client';

import React, { useState } from 'react';
import {
  Bell,
  X,
  Trophy,
  Users,
  Shield,
  Zap,
  Check,
  Flame,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'tournament' | 'team' | 'system' | 'racing';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Season 1 Ranked Heat Available',
    message: 'Global Cyber Grand Prix 2026 has opened registrations. Secure your seed now!',
    category: 'tournament',
    timestamp: '10m ago',
    read: false,
    actionUrl: '/competitions',
  },
  {
    id: 'n2',
    title: 'Team Invitation Received',
    message: 'Dhaka University Esports invited you to join their competitive typing roster.',
    category: 'team',
    timestamp: '1h ago',
    read: false,
    actionUrl: '/organizations',
  },
  {
    id: 'n3',
    title: 'Anti-Cheat Telemetry Verified',
    message: 'Your recent 84 WPM race achieved 99.2% accuracy integrity score.',
    category: 'racing',
    timestamp: '3h ago',
    read: true,
  },
  {
    id: 'n4',
    title: 'System Architecture Release',
    message: 'KEYRUSH 3.0 Ultimate Global Esports Ecosystem initialized with canonical role separation.',
    category: 'system',
    timestamp: '1d ago',
    read: true,
  },
];

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread' | 'tournament'>('all');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
    );
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'tournament') return n.category === 'tournament';
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tournament':
        return <Trophy className="h-4 w-4 text-amber-400" />;
      case 'team':
        return <Users className="h-4 w-4 text-cyan-400" />;
      case 'racing':
        return <Flame className="h-4 w-4 text-primary" />;
      default:
        return <Shield className="h-4 w-4 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md glass-panel bg-surface border-l border-white/10 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display font-black text-base text-text">Notifications</h2>
                <p className="text-[11px] font-mono text-text-muted">
                  {unreadCount} unread system alert{unreadCount === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-light transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Filter Tabs */}
          <div className="px-6 py-2.5 border-b border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filter === 'all' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-text-muted hover:text-text'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filter === 'unread' ? 'bg-accent/20 text-accent border border-accent/30' : 'text-text-muted hover:text-text'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] text-accent hover:underline font-mono"
                >
                  Mark read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[11px] text-danger hover:underline font-mono"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="py-20 text-center text-xs text-text-muted space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto opacity-70" />
                <p>All caught up! No notifications right now.</p>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleRead(item.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    item.read
                      ? 'bg-surface-light/40 border-white/5 opacity-70 hover:opacity-100'
                      : 'bg-surface-light border-primary/30 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-surface border border-white/10 shrink-0 mt-0.5">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-text">{item.title}</h4>
                          {!item.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed">{item.message}</p>
                        <span className="text-[10px] font-mono text-text-muted block pt-1">
                          {item.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

