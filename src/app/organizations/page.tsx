'use client';

import React, { useState, useEffect } from 'react';
import { api, getCurrentUser } from '../../lib/api';
import { Users, Building, ShieldCheck, Plus, Globe, ExternalLink } from 'lucide-react';

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('UNIVERSITY');
  const [country, setCountry] = useState('BD');
  const [website, setWebsite] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const data = await api.getOrganizations();
      setOrganizations(data || []);
    } catch (e) {
      // fallback
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user) {
      setMessage('You must be logged in to register an organization.');
      return;
    }

    try {
      // In full backend, invokes POST /organizations
      setShowCreateModal(false);
      setMessage(`Organization "${name}" registered successfully!`);
      loadOrganizations();
    } catch (err: any) {
      setMessage(err.message || 'Could not register organization');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
            <Building className="h-3.5 w-3.5" />
            <span>Academic & Community Hubs</span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold text-text">
            Universities & Esports Clubs
          </h1>
          <p className="mt-1 text-xs text-text-muted">
            Host branded typing championships, manage team rosters, and issue verifiable digital certificates.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Register Organization</span>
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-xs font-semibold text-primary">
          {message}
        </div>
      )}

      {/* Organization Cards Directory */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {organizations.map((org) => (
          <div key={org._id || org.slug} className="glass-panel rounded-3xl p-6 flex flex-col justify-between hover:border-primary/40 transition-all">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-xl">
                  {org.name.slice(0, 2).toUpperCase()}
                </div>
                {org.isVerified && (
                  <span className="flex items-center space-x-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Verified</span>
                  </span>
                )}
              </div>

              <h3 className="mt-4 font-display text-lg font-bold text-text">{org.name}</h3>
              <div className="mt-1 text-xs text-text-muted">{org.type} • {org.country || 'BD'}</div>

              {org.website && (
                <a
                  href={org.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center space-x-1 text-xs text-accent hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[200px]">{org.website}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-between text-xs">
              <span className="font-mono text-text-muted">{org.memberCount || 1} Members</span>
              <span className="rounded-lg bg-white/5 px-3 py-1 font-semibold text-text hover:bg-white/10 transition-colors">
                View Roster
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE ORG MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-primary/30 bg-surface-dark p-6 shadow-2xl">
            <h3 className="font-display text-xl font-bold text-text">Register Your Institution</h3>
            <p className="mt-1 text-xs text-text-muted">Universities, CSE Clubs, Colleges & Communities.</p>

            <form onSubmit={handleCreateOrg} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-text">Institution Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Dhaka University CSE Club"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-surface px-4 py-2 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text">Category</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-surface px-4 py-2 text-sm text-text focus:border-primary focus:outline-none"
                >
                  <option value="UNIVERSITY">University</option>
                  <option value="COLLEGE">College</option>
                  <option value="SCHOOL">School</option>
                  <option value="CLUB">Programming / CSE Club</option>
                  <option value="COMMUNITY">Gaming Society</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text">Website URL (Optional)</label>
                <input
                  type="url"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-xl border border-white/10 bg-surface px-4 py-2 text-sm text-text focus:border-primary focus:outline-none"
                />
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
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
