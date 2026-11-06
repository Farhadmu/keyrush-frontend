'use client';

import React, { useState, useEffect } from 'react';
import { api, getCurrentUser } from '../../../lib/api';
import { Car, Save, CheckCircle2, User, Globe, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [cars, setCars] = useState<any[]>([]);
  const [selectedCar, setSelectedCar] = useState('car_cyber_phantom');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('BD');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cur = getCurrentUser();
    if (!cur) {
      window.location.href = '/login';
      return;
    }

    Promise.all([
      api.getMyDashboard(),
      api.getCars().catch(() => []),
    ]).then(([data, carList]) => {
      setUser(data.user);
      setProfile(data.profile);
      setCars(carList || []);
      setSelectedCar(data.profile?.selectedCarId || 'car_cyber_phantom');
      setDisplayName(data.profile?.displayName || cur.username);
      setBio(data.profile?.bio || '');
      setCountry(data.user?.country || 'BD');
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');

    try {
      await api.updateProfile({
        displayName,
        bio,
        country,
        selectedCarId: selectedCar,
      });
      setSavedMsg('Profile updated successfully!');
      setTimeout(() => setSavedMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectCar = async (carId: string) => {
    setSelectedCar(carId);
    try {
      await api.updateCar(carId);
    } catch (err) {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-black font-display text-text">Player Profile & Garage</h1>
          <p className="text-xs text-text-muted">Customize your competitive identity and select your racing machine.</p>
        </div>

        {savedMsg && (
          <div className="flex items-center space-x-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            <CheckCircle2 className="h-4 w-4" />
            <span>{savedMsg}</span>
          </div>
        )}

        {/* Garage Car Selection */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
          <div className="flex items-center space-x-2">
            <Car className="h-5 w-5 text-accent" />
            <h2 className="text-base font-bold text-text">Vehicle Hangar</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {cars.map((car) => {
              const isSelected = selectedCar === car.id;
              const isLocked = (profile?.level || 1) < (car.unlockLevel || 1);

              return (
                <div
                  key={car.id}
                  onClick={() => !isLocked && handleSelectCar(car.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col items-center text-center space-y-3 ${
                    isSelected
                      ? 'border-accent bg-accent/10 shadow-lg shadow-accent/20'
                      : isLocked
                      ? 'border-white/5 bg-surface/30 opacity-60 cursor-not-allowed'
                      : 'border-white/5 bg-surface/60 hover:border-white/20'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-accent text-[9px] font-black text-black">
                      EQUIPPED
                    </span>
                  )}
                  {isLocked && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono text-text-muted">
                      UNLOCK LVL {car.unlockLevel}
                    </span>
                  )}
                  <img
                    src={`/assets/cars/${car.id}.svg`}
                    alt={car.name}
                    className="w-24 h-auto my-2"
                  />
                  <div>
                    <div className="text-xs font-bold text-text">{car.name}</div>
                    <div className="text-[10px] text-text-muted font-mono">{car.topSpeedKmh} KM/H • {car.category}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Profile Settings Form */}
        <form onSubmit={handleSave} className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-text">Account Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-white/10 text-text text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Country / Region</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-white/10 text-text text-sm focus:outline-none focus:border-primary"
              >
                <option value="BD">Bangladesh (BD)</option>
                <option value="US">United States (US)</option>
                <option value="GB">United Kingdom (GB)</option>
                <option value="IN">India (IN)</option>
                <option value="CA">Canada (CA)</option>
                <option value="SG">Singapore (SG)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-text-muted mb-1">Bio / Status</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your competitive typing goals or preferred keyboard setup..."
                className="w-full px-3 py-2 rounded-lg bg-surface border border-white/10 text-text text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs shadow-lg shadow-primary/25 hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

