import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-surface-dark py-12 text-text-muted">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white">
                K
              </div>
              <span className="font-display text-lg font-bold text-text">KEYRUSH</span>
            </div>
            <p className="text-xs leading-relaxed text-text-dim">
              The premier global multiplayer typing esports platform. Compete in live 2–7 player races, participate in 20–300 participant institutional championships, and master keyboard velocity.
            </p>
          </div>

          <div>
            <h4 className="font-display text-xs font-bold tracking-wider text-text uppercase">Gameplay</h4>
            <ul className="mt-4 space-y-2 text-xs">
              <li><Link href="/practice" className="hover:text-accent transition-colors">Solo Practice with AI</Link></li>
              <li><Link href="/multiplayer" className="hover:text-accent transition-colors">Multiplayer Rooms (2-7)</Link></li>
              <li><Link href="/competitions" className="hover:text-accent transition-colors">Official Championships</Link></li>
              <li><Link href="/leaderboard" className="hover:text-accent transition-colors">World Leaderboards</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-xs font-bold tracking-wider text-text uppercase">Institutions</h4>
            <ul className="mt-4 space-y-2 text-xs">
              <li><Link href="/organizations" className="hover:text-accent transition-colors">University Directory</Link></li>
              <li><Link href="/competitions" className="hover:text-accent transition-colors">Automated Heat Scheduler</Link></li>
              <li><Link href="/about" className="hover:text-accent transition-colors">Verifiable Certificates</Link></li>
              <li><Link href="/rules" className="hover:text-accent transition-colors">Rulebook & Anti-Cheat</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-xs font-bold tracking-wider text-text uppercase">Status & Rules</h4>
            <ul className="mt-4 space-y-2 text-xs">
              <li><span className="inline-flex items-center text-emerald-400">● 2–7 Player Multiplayer Gateways Online</span></li>
              <li><span className="inline-flex items-center text-accent">● 20–300 Heat Engine Active</span></li>
              <li><span className="text-text-dim">Dual Language (EN & BN IME) Supported</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/5 pt-8 text-center text-xs text-text-dim">
          &copy; {new Date().getFullYear()} KEYRUSH Esports Platform. Type Fast. Race Smart. Compete Worldwide.
        </div>
      </div>
    </footer>
  );
}
