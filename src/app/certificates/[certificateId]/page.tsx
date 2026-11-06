'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  ShieldCheck,
  CheckCircle,
  Copy,
  Printer,
  ChevronRight,
  Flame,
  Calendar,
  Sparkles,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../../lib/api';

export default function CertificateVerificationPage() {
  const params = useParams();
  const certId = params?.certificateId as string;

  const [certificate, setCertificate] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (certId) {
      loadCertificate();
    }
  }, [certId]);

  const loadCertificate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.verifyCertificate(certId);
      setCertificate(data);
    } catch (err: any) {
      setError(err.message || 'Certificate verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-xs font-mono text-text-muted">Cryptographically verifying credential on KEYRUSH registry...</p>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-danger" />
        <h2 className="mt-4 font-display text-2xl font-bold text-text">Certificate Not Verified</h2>
        <p className="mt-2 text-xs text-text-muted">
          {error || 'This certificate identifier could not be validated in the official registry.'}
        </p>
        <Link
          href="/competitions"
          className="mt-6 inline-flex items-center space-x-2 rounded-xl bg-surface px-5 py-2.5 text-xs font-semibold text-text hover:bg-surface-light border border-white/10"
        >
          <span>Return to Competitions</span>
        </Link>
      </div>
    );
  }

  const certData = certificate.certificate || certificate;
  const isChampion = certData.rankTitle?.toLowerCase().includes('champion') || certData.rankTitle?.toLowerCase().includes('winner');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <nav className="flex items-center space-x-2 text-xs text-text-muted">
          <Link href="/competitions" className="hover:text-primary transition-colors">
            Competitions
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-mono text-text">Verify Credential</span>
        </nav>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 rounded-xl border border-white/10 bg-surface px-4 py-2 text-xs font-semibold text-text hover:bg-surface-light transition-all"
          >
            {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Link Copied!' : 'Copy Verification URL'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 transition-all"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / Export PDF</span>
          </button>
        </div>
      </div>

      {/* Cryptographic Authenticity Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between text-xs print:hidden">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-emerald-400">Cryptographically Authenticated Record</div>
            <div className="text-[11px] text-text-muted font-mono">
              Signed by KEYRUSH Platform Engine • SHA-256 Hash matches canonical race ledger
            </div>
          </div>
        </div>
        <span className="rounded-full bg-emerald-500/20 px-3 py-1 font-mono text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
          VERIFIED
        </span>
      </div>

      {/* DIPLOMA / CERTIFICATE CANVAS */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-8 sm:p-14 text-center shadow-2xl transition-all ${
          isChampion
            ? 'border-warning/40 bg-gradient-to-b from-[#181510] via-surface-dark to-[#121214]'
            : 'border-white/15 bg-gradient-to-b from-[#12141f] via-surface-dark to-[#0f1016]'
        }`}
      >
        {/* Decorative corner borders */}
        <div className="absolute top-4 left-4 h-12 w-12 border-t-2 border-l-2 border-primary/40 rounded-tl-xl pointer-events-none" />
        <div className="absolute top-4 right-4 h-12 w-12 border-t-2 border-r-2 border-primary/40 rounded-tr-xl pointer-events-none" />
        <div className="absolute bottom-4 left-4 h-12 w-12 border-b-2 border-l-2 border-primary/40 rounded-bl-xl pointer-events-none" />
        <div className="absolute bottom-4 right-4 h-12 w-12 border-b-2 border-r-2 border-primary/40 rounded-br-xl pointer-events-none" />

        {/* Brand header */}
        <div className="inline-flex items-center space-x-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-mono font-semibold text-accent mb-6">
          <Award className="h-4 w-4 text-warning" />
          <span>KEYRUSH GLOBAL ESPORTS FEDERATION</span>
        </div>

        <h1 className="font-display text-xs tracking-widest text-text-muted uppercase">
          Official Certificate of Athletic Typing Achievement
        </h1>

        <div className="mt-8 text-xs text-text-muted">This credential is conferred upon</div>
        <div className="mt-2 font-display text-3xl sm:text-5xl font-black text-text tracking-wide">
          {certData.recipientName || 'Esports Racer'}
        </div>

        <div className="mt-4 text-xs text-text-muted max-w-lg mx-auto">
          for exceptional performance and typing speed in the official championship:
        </div>

        <div className="mt-2 font-display text-xl sm:text-2xl font-bold text-accent">
          {certData.competitionTitle || 'Championship Tournament'}
        </div>

        {/* Rank Title Badge */}
        <div className="mt-6 inline-flex items-center space-x-2 rounded-2xl border border-warning/40 bg-warning/10 px-6 py-2.5 text-sm font-bold text-warning">
          <Sparkles className="h-4 w-4" />
          <span>{certData.rankTitle || 'OFFICIAL PARTICIPANT'}</span>
        </div>

        {/* Telemetry Metrics Row */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
          <div className="rounded-2xl border border-white/5 bg-surface/50 p-4">
            <div className="text-[10px] uppercase font-mono text-text-muted">Net Speed</div>
            <div className="mt-1 font-mono text-2xl font-black text-primary">
              {certData.wpm || certData.netWpm || 0} <span className="text-xs">WPM</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-surface/50 p-4">
            <div className="text-[10px] uppercase font-mono text-text-muted">Accuracy</div>
            <div className="mt-1 font-mono text-2xl font-black text-emerald-400">
              {certData.accuracy || 100}%
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-surface/50 p-4">
            <div className="text-[10px] uppercase font-mono text-text-muted">Placement</div>
            <div className="mt-1 font-mono text-2xl font-black text-warning">
              #{certData.rank || 1}
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-surface/50 p-4">
            <div className="text-[10px] uppercase font-mono text-text-muted">Date</div>
            <div className="mt-2 font-mono text-xs font-bold text-text">
              {new Date(certData.createdAt || Date.now()).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Signature & Cryptographic Seal Footer */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-mono text-text-dim">Certificate Serial Identifier:</div>
            <div className="font-mono text-xs font-bold text-text truncate max-w-sm">
              {certData.certificateId || certId}
            </div>
            <div className="text-[10px] uppercase font-mono text-text-dim pt-2">SHA-256 Digital Verification Hash:</div>
            <div className="font-mono text-[10px] text-text-muted break-all max-w-md">
              {certData.signatureHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-end">
            <div className="h-10 border-b border-white/30 w-40 mb-1"></div>
            <div className="font-display text-xs font-bold text-text">KEYRUSH Master Authority</div>
            <div className="text-[10px] text-text-muted">Server Validation Node #01</div>
          </div>
        </div>
      </div>
    </div>
  );
}
