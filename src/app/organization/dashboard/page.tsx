'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building,
  Users,
  ShieldCheck,
  Check,
  X,
  Plus,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { api, getCurrentUser, UserSession } from '../../../lib/api';

export default function OrganizationDashboardPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  // New team modal state
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    loadMyOrganizations();
  }, []);

  const loadMyOrganizations = async () => {
    setLoading(true);
    try {
      const orgs = await api.getOrganizations();
      setOrganizations(orgs || []);
      if (orgs && orgs.length > 0) {
        setSelectedOrg(orgs[0]);
        loadOrgDetails(orgs[0]._id || orgs[0].slug);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadOrgDetails = async (id: string) => {
    try {
      const [allMembers, teamList] = await Promise.all([
        api.getOrgMembers(id).catch(() => []),
        api.getOrgTeams(id).catch(() => []),
      ]);
      // Filter pending requests
      const pending = (allMembers || []).filter((m: any) => m.status === 'PENDING');
      setPendingMembers(pending);
      setTeams(teamList || []);
    } catch {
      // ignore
    }
  };

  const handleApproveMember = async (memberId: string) => {
    if (!selectedOrg) return;
    try {
      await api.approveOrgMember(selectedOrg._id, memberId);
      setMessage({ text: 'Member approved and added to active roster!', error: false });
      loadOrgDetails(selectedOrg._id);
    } catch (err: any) {
      setMessage({ text: err.message || 'Approval failed', error: true });
    }
  };

  const handleRejectMember = async (memberId: string) => {
    if (!selectedOrg) return;
    try {
      await api.removeOrgMember(selectedOrg._id, memberId);
      setMessage({ text: 'Application rejected.', error: false });
      loadOrgDetails(selectedOrg._id);
    } catch (err: any) {
      setMessage({ text: err.message || 'Action failed', error: true });
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg || !teamName) return;
    setCreatingTeam(true);
    try {
      await api.createOrgTeam(selectedOrg._id, {
        name: teamName,
        description: teamDesc,
      });
      setMessage({ text: `Team "${teamName}" created successfully!`, error: false });
      setShowTeamModal(false);
      setTeamName('');
      setTeamDesc('');
      loadOrgDetails(selectedOrg._id);
    } catch (err: any) {
      setMessage({ text: err.message || 'Could not create team', error: true });
    } finally {
      setCreatingTeam(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center space-x-2 text-xs text-text-muted mb-2">
            <Link href="/organizations" className="hover:text-primary transition-colors">
              Organizations
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-mono text-text">Management Console</span>
          </nav>
          <h1 className="font-display text-3xl font-extrabold text-text">
            Organization Management Hub
          </h1>
          <p className="mt-1 text-xs text-text-muted">
            Review incoming roster applications, organize collegiate squads, and manage team captains.
          </p>
        </div>

        {selectedOrg && (
          <button
            onClick={() => setShowTeamModal(true)}
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90 transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create Squad / Division</span>
          </button>
        )}
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

      {/* Main Grid: Org selector & Management Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Organization list */}
        <div className="space-y-4">
          <h3 className="font-display text-sm font-bold tracking-wider text-text uppercase">
            Select Organization
          </h3>
          <div className="space-y-3">
            {organizations.map((org) => {
              const isSelected = selectedOrg?._id === org._id;
              return (
                <div
                  key={org._id}
                  onClick={() => {
                    setSelectedOrg(org);
                    loadOrgDetails(org._id || org.slug);
                  }}
                  className={`cursor-pointer rounded-2xl p-5 border transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                      : 'border-white/10 bg-surface/70 hover:bg-surface-light'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-accent">{org.type}</span>
                    <span className="text-text-muted">{org.country || 'BD'}</span>
                  </div>
                  <h4 className="mt-2 font-display text-base font-bold text-text">{org.name}</h4>
                  <div className="mt-3 flex items-center justify-between text-xs font-mono text-text-muted">
                    <span>{org.memberCount || 1} Members</span>
                    {org.isVerified && <span className="text-emerald-400">Verified</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Action Sections */}
        <div className="lg:col-span-2 space-y-6">
          {selectedOrg ? (
            <>
              {/* Pending Approvals Card */}
              <div className="glass-panel rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-accent" />
                    <h3 className="font-display text-base font-bold text-text">
                      Pending Membership Requests ({pendingMembers.length})
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-text-muted">Requires Admin Approval</span>
                </div>

                {pendingMembers.length > 0 ? (
                  <div className="space-y-3">
                    {pendingMembers.map((m) => (
                      <div
                        key={m._id}
                        className="flex items-center justify-between rounded-2xl border border-white/5 bg-surface p-4"
                      >
                        <div>
                          <div className="font-bold text-xs text-text">{m.username || m.user?.username}</div>
                          <div className="text-[10px] font-mono text-text-muted">Applied: Recently</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleApproveMember(m._id)}
                            className="flex items-center space-x-1 rounded-xl bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleRejectMember(m._id)}
                            className="flex items-center space-x-1 rounded-xl bg-danger/20 px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/30 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs text-text-muted">
                    No pending join applications at this time.
                  </div>
                )}
              </div>

              {/* Roster Squads & Divisions */}
              <div className="glass-panel rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="font-display text-base font-bold text-text">
                    Active Squads & Divisions ({teams.length})
                  </h3>
                  <button
                    onClick={() => setShowTeamModal(true)}
                    className="text-xs font-bold text-accent hover:underline flex items-center space-x-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Squad</span>
                  </button>
                </div>

                {teams.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {teams.map((t) => (
                      <div key={t._id} className="rounded-2xl border border-white/5 bg-surface p-4 space-y-2">
                        <div className="font-bold text-xs text-text">{t.name}</div>
                        <p className="text-[11px] text-text-muted">{t.description || 'Division Squad'}</p>
                        <div className="text-[10px] font-mono text-accent pt-2 border-t border-white/5">
                          {t.members?.length || 0} Registered Members
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs text-text-muted">
                    No competitive division squads created. Create a squad to organize inter-university team scrims.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="glass-panel rounded-3xl p-16 text-center text-xs text-text-muted">
              Select or register an organization to manage rosters.
            </div>
          )}
        </div>
      </div>

      {/* CREATE SQUAD MODAL */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-primary/30 bg-surface-dark p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display text-base font-bold text-text">Create Division Squad</h3>
              <button onClick={() => setShowTeamModal(false)} className="text-text-muted hover:text-text">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
              <div>
                <label className="text-text block mb-1 font-semibold">Squad / Team Name</label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Varsity Alpha, Speed Runners"
                  className="w-full rounded-xl border border-white/10 bg-surface px-4 py-2 text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-text block mb-1 font-semibold">Description</label>
                <textarea
                  rows={3}
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  placeholder="Optional squad objective or roster notes"
                  className="w-full rounded-xl border border-white/10 bg-surface px-4 py-2 text-text focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="rounded-xl border border-white/10 bg-surface px-4 py-2 font-semibold text-text hover:bg-surface-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTeam || !teamName}
                  className="rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2 font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90 disabled:opacity-40"
                >
                  {creatingTeam ? 'Creating...' : 'Create Squad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
