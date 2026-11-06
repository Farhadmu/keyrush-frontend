'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building,
  ShieldCheck,
  Users,
  Trophy,
  Globe,
  ExternalLink,
  ChevronRight,
  UserPlus,
  Flame,
  CheckCircle2,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { api, getCurrentUser, UserSession } from '../../../lib/api';

export default function OrganizationDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [organization, setOrganization] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'teams' | 'competitions'>('members');

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    if (slug) {
      loadOrgData();
    }
  }, [slug]);

  const loadOrgData = async () => {
    setLoading(true);
    try {
      const org = await api.getOrganization(slug);
      setOrganization(org);

      if (org?._id || org?.slug) {
        const id = org._id || org.slug;
        const [memList, teamList, compList] = await Promise.all([
          api.getOrgMembers(id).catch(() => []),
          api.getOrgTeams(id).catch(() => []),
          api.getCompetitions(org._id).catch(() => []),
        ]);
        setMembers(memList || []);
        setTeams(teamList || []);
        setCompetitions(compList || []);
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Organization not found', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async () => {
    if (!currentUser) {
      setMessage({ text: 'You must be logged in to apply for organization membership.', error: true });
      return;
    }
    if (!organization) return;

    setJoining(true);
    setMessage(null);
    try {
      await api.requestJoinOrg(organization._id);
      setMessage({ text: 'Membership request submitted! Awaiting administrator approval.', error: false });
    } catch (err: any) {
      setMessage({ text: err.message || 'Could not send join request', error: true });
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-xs font-mono text-text-muted">Loading organization hub...</p>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <Building className="mx-auto h-12 w-12 text-secondary" />
        <h2 className="mt-4 font-display text-2xl font-bold text-text">Organization Not Found</h2>
        <p className="mt-2 text-xs text-text-muted">The organization could not be located in the registry.</p>
        <Link
          href="/organizations"
          className="mt-6 inline-flex items-center space-x-2 rounded-xl bg-surface px-5 py-2.5 text-xs font-semibold text-text hover:bg-surface-light border border-white/10"
        >
          <span>Return to Directory</span>
        </Link>
      </div>
    );
  }

  const isOwnerOrAdmin =
    organization.ownerId === currentUser?.id ||
    currentUser?.roles?.includes('SUPER_ADMIN') ||
    currentUser?.roles?.includes('ORGANIZATION_ADMIN');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-text-muted">
        <Link href="/organizations" className="hover:text-primary transition-colors">
          Organizations
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-mono text-text">{organization.name}</span>
      </nav>

      {/* Header Profile Panel */}
      <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-10 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-black text-2xl border border-primary/30">
              {organization.name.slice(0, 2).toUpperCase()}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-text">
                  {organization.name}
                </h1>
                {organization.isVerified && (
                  <span className="flex items-center space-x-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Verified Institution</span>
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                <span className="font-mono text-accent">{organization.type || 'UNIVERSITY'}</span>
                <span>•</span>
                <span className="font-mono">Country: {organization.country || 'BD'}</span>
                {organization.website && (
                  <>
                    <span>•</span>
                    <a
                      href={organization.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-primary hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span>{organization.website}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </>
                )}
              </div>

              <p className="mt-3 text-xs text-text-muted max-w-2xl leading-relaxed">
                {organization.description || 'Dedicated academic and competitive typing esports club on KEYRUSH.'}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center space-x-3 shrink-0">
            {isOwnerOrAdmin && (
              <Link
                href="/organization/dashboard"
                className="flex items-center space-x-2 rounded-2xl border border-secondary/40 bg-secondary/10 px-5 py-3 text-xs font-bold text-secondary hover:bg-secondary/20 transition-all"
              >
                <Settings className="h-4 w-4" />
                <span>Admin Hub</span>
              </Link>
            )}

            <button
              onClick={handleJoinRequest}
              disabled={joining}
              className="flex items-center space-x-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 disabled:opacity-40 transition-all"
            >
              <UserPlus className="h-4 w-4" />
              <span>{joining ? 'Submitting...' : 'Apply to Join'}</span>
            </button>
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 border-t border-white/10 pt-6">
          <div className="rounded-2xl border border-white/5 bg-surface-dark p-3.5 text-center">
            <div className="font-mono text-xl font-bold text-text">
              {organization.memberCount || members.length || 1}
            </div>
            <div className="text-[10px] uppercase font-mono text-text-muted">Registered Members</div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-surface-dark p-3.5 text-center">
            <div className="font-mono text-xl font-bold text-accent">
              {teams.length}
            </div>
            <div className="text-[10px] uppercase font-mono text-text-muted">Competitive Teams</div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-surface-dark p-3.5 text-center">
            <div className="font-mono text-xl font-bold text-secondary">
              {competitions.length}
            </div>
            <div className="text-[10px] uppercase font-mono text-text-muted">Championships</div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-surface-dark p-3.5 text-center">
            <div className="font-mono text-xl font-bold text-emerald-400">
              BD #{organization.countryRank || 1}
            </div>
            <div className="text-[10px] uppercase font-mono text-text-muted">National Standing</div>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold flex items-center space-x-2 ${
            message.error
              ? 'border border-danger/40 bg-danger/10 text-danger'
              : 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
          }`}
        >
          {message.error ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/10 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 transition-colors ${
            activeTab === 'members'
              ? 'border-b-2 border-primary text-primary'
              : 'text-text-muted hover:text-text'
          }`}
        >
          Roster Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`pb-3 transition-colors ${
            activeTab === 'teams'
              ? 'border-b-2 border-primary text-primary'
              : 'text-text-muted hover:text-text'
          }`}
        >
          Teams & Divisions ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab('competitions')}
          className={`pb-3 transition-colors ${
            activeTab === 'competitions'
              ? 'border-b-2 border-primary text-primary'
              : 'text-text-muted hover:text-text'
          }`}
        >
          Hosted Tournaments ({competitions.length})
        </button>
      </div>

      {/* TAB CONTENT: Members */}
      {activeTab === 'members' && (
        <div className="glass-panel rounded-3xl p-6">
          <h3 className="font-display text-base font-bold text-text mb-4">Official Roster</h3>
          {members.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {members.map((m, idx) => (
                <div
                  key={m._id || idx}
                  className="flex items-center space-x-3 rounded-2xl border border-white/5 bg-surface p-3.5 hover:border-white/15 transition-all"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                    {(m.username || m.user?.username || 'R')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/players/${m.username || m.user?.username}`}
                      className="truncate font-semibold text-xs text-text hover:text-primary transition-colors block"
                    >
                      {m.username || m.user?.username || `Racer #${idx + 1}`}
                    </Link>
                    <div className="text-[10px] font-mono text-text-muted">
                      Role: <span className="text-accent">{m.role || 'RACER'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-xs text-text-muted">
              No members verified yet.
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Teams */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.length > 0 ? (
            teams.map((t) => (
              <div key={t._id} className="glass-panel rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="font-display text-lg font-bold text-text">{t.name}</h4>
                  <span className="font-mono text-xs text-text-muted">
                    {t.members?.length || 0} Members
                  </span>
                </div>
                <p className="text-xs text-text-muted">{t.description || 'Competitive division squad'}</p>
                <div className="text-xs font-mono text-accent">
                  Captain: {t.captain?.username || 'Assigned'}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 glass-panel rounded-3xl p-12 text-center text-xs text-text-muted border border-dashed border-white/10">
              No competitive teams created yet. Organization managers can create division squads from the Admin Hub.
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Competitions */}
      {activeTab === 'competitions' && (
        <div className="space-y-4">
          {competitions.length > 0 ? (
            competitions.map((comp) => (
              <div
                key={comp._id}
                className="glass-panel rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <h4 className="font-display text-lg font-bold text-text">{comp.title}</h4>
                  <p className="text-xs text-text-muted mt-1">{comp.description}</p>
                </div>
                <Link
                  href={`/competitions/${comp.slug || comp._id}`}
                  className="rounded-xl bg-surface px-4 py-2 text-xs font-bold text-text hover:bg-surface-light border border-white/10 shrink-0 text-center"
                >
                  View Tournament
                </Link>
              </div>
            ))
          ) : (
            <div className="glass-panel rounded-3xl p-12 text-center text-xs text-text-muted border border-dashed border-white/10">
              This organization has not scheduled any exclusive championships yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
