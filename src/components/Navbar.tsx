'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCurrentUser, clearAuthSession, UserSession } from '../lib/api';
import {
  Trophy,
  Users,
  Flag,
  Zap,
  LogOut,
  Flame,
  LayoutDashboard,
  Shield,
  Menu,
  X,
  Bell,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    window.location.href = '/';
  };

  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN') || user?.roles?.includes('PLATFORM_MODERATOR');

  const navLinks = [
    { name: 'Practice', href: '/practice', icon: Zap },
    { name: 'Multiplayer', href: '/multiplayer', icon: Flame },
    { name: 'Competitions', href: '/competitions', icon: Trophy },
    { name: 'Leaderboard', href: '/leaderboard', icon: Flag },
    { name: 'Organizations', href: '/organizations', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
            <span className="font-display text-xl font-black italic text-white tracking-wider">K</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl font-black tracking-wider text-text">
              KEY<span className="text-accent text-glow-cyan">RUSH</span>
            </span>
            <span className="text-[9px] font-mono tracking-widest text-text-muted uppercase">Global Esports</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'border border-primary/30 bg-primary/10 text-primary shadow-sm shadow-primary/20'
                    : 'text-text-muted hover:bg-surface-light hover:text-text'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Account Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                href="/dashboard"
                className={`flex items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                  pathname.startsWith('/dashboard')
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-white/10 bg-surface text-text-muted hover:text-text hover:bg-surface-light'
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              {isSuperAdmin && (
                <Link
                  href="/admin"
                  className={`flex items-center space-x-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all ${
                    pathname.startsWith('/admin')
                      ? 'border-secondary bg-secondary/20 text-secondary'
                      : 'border-secondary/30 bg-secondary/10 text-secondary hover:bg-secondary/20'
                  }`}
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Admin</span>
                </Link>
              )}

              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-text">{user.username}</span>
                <span className="text-[10px] font-mono text-accent">RACER #{user.id.slice(-4)}</span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 rounded-lg border border-white/10 bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted hover:bg-danger/20 hover:text-danger hover:border-danger/30 transition-all"
                title="Log Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-text-muted hover:text-text transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90 transition-all"
              >
                Start Racing
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex items-center justify-center p-2 rounded-lg border border-white/10 bg-surface text-text-muted hover:text-text"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-white/10 bg-surface/95 px-4 pt-2 pb-4 space-y-1 backdrop-blur-xl">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive ? 'bg-primary/10 text-primary border border-primary/30' : 'text-text-muted hover:bg-surface-light'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          {user && (
            <>
              <Link
                href="/dashboard"
                className="flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium text-accent hover:bg-surface-light"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>My Dashboard</span>
              </Link>
              {isSuperAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium text-secondary hover:bg-surface-light"
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin Portal</span>
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </header>
  );
}
