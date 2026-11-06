'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Zap,
  Flame,
  Car,
  Sparkles,
  Trophy,
  Users,
  Flag,
  Shield,
  LayoutDashboard,
  Award,
  Settings,
  X,
  ArrowRight,
  Command,
} from 'lucide-react';
import { getCurrentUser, UserSession } from '../lib/api';
import { getUserRole, AppRole } from '../lib/roleGuard';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const role: AppRole = getUserRole(user);

  const allItems = [
    // Gamer / User Actions & Routes
    {
      id: 'practice',
      title: 'Practice Arena (3D Solo Speed)',
      category: 'Gameplay',
      icon: Zap,
      href: '/practice',
      roles: ['USER'],
    },
    {
      id: 'multiplayer',
      title: 'Multiplayer Racing Circuit (2–7 Racers)',
      category: 'Gameplay',
      icon: Flame,
      href: '/multiplayer',
      roles: ['USER'],
    },
    {
      id: 'garage',
      title: '3D Vehicle Workshop & Customizer',
      category: 'Gameplay',
      icon: Car,
      href: '/garage',
      roles: ['USER'],
    },
    {
      id: 'battlepass',
      title: 'Season 1 Cyber Battle Pass',
      category: 'Rewards',
      icon: Sparkles,
      href: '/battlepass',
      roles: ['USER'],
    },
    {
      id: 'dashboard',
      title: 'Player Command Dashboard',
      category: 'Player',
      icon: LayoutDashboard,
      href: '/dashboard',
      roles: ['USER'],
    },
    {
      id: 'coach',
      title: 'AI Typing Coach & Telemetry Diagnostic',
      category: 'Player',
      icon: Sparkles,
      href: '/dashboard/analytics',
      roles: ['USER'],
    },
    // Organizer Routes
    {
      id: 'organizer-hub',
      title: 'Organizer Management Hub',
      category: 'Management',
      icon: LayoutDashboard,
      href: '/organizer',
      roles: ['ORGANIZER', 'SUPER_ADMIN'],
    },
    {
      id: 'tournaments',
      title: 'Esports Tournaments & Circuit',
      category: 'Esports',
      icon: Trophy,
      href: '/competitions',
      roles: ['USER', 'ORGANIZER', 'SUPER_ADMIN'],
    },
    {
      id: 'organizations',
      title: 'Organizations & Esports Clubs',
      category: 'Community',
      icon: Users,
      href: '/organizations',
      roles: ['USER', 'ORGANIZER', 'SUPER_ADMIN'],
    },
    {
      id: 'leaderboard',
      title: 'Global & Ranked Leaderboards',
      category: 'Standings',
      icon: Flag,
      href: '/leaderboard',
      roles: ['USER', 'ORGANIZER', 'SUPER_ADMIN'],
    },
    // Super Admin Routes
    {
      id: 'admin',
      title: 'Global Admin Console (Telemetry & Governance)',
      category: 'Governance',
      icon: Shield,
      href: '/admin',
      roles: ['SUPER_ADMIN'],
    },
  ];

  // Filter items matching user role
  const roleFilteredItems = allItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });

  // Filter items matching search query
  const filteredItems = roleFilteredItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()),
  );

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl glass-panel rounded-2xl border border-white/15 shadow-2xl shadow-primary/10 overflow-hidden bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          <Search className="h-5 w-5 text-accent shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command, route, or feature..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
              } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
                e.preventDefault();
                handleSelect(filteredItems[selectedIndex].href);
              }
            }}
            className="w-full bg-transparent text-sm text-text placeholder-text-muted focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-light transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-muted">
              No matching commands or routes found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.href)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-all ${
                    isSelected
                      ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm'
                      : 'text-text-muted hover:bg-surface-light hover:text-text'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected ? 'bg-primary/20 text-accent' : 'bg-surface-light text-text-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-text">{item.title}</div>
                      <div className="text-[10px] font-mono text-text-muted">{item.category}</div>
                    </div>
                  </div>
                  <ArrowRight
                    className={`h-3.5 w-3.5 transition-transform ${
                      isSelected ? 'translate-x-0.5 text-accent' : 'opacity-0'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Palette Footer */}
        <div className="px-4 py-2 bg-surface-dark/50 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-text-muted">
          <div className="flex items-center space-x-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <div className="flex items-center space-x-1">
            <Command className="h-3 w-3 text-accent" />
            <span>KEYRUSH 3.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

