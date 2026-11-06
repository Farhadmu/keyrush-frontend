'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, getCurrentUser, UserSession } from '../../lib/api';
import ThreeGarage, { GarageCarItem } from '../../game/three/ThreeGarage';
import { VehicleCustomizationConfig } from '../../game/three/VehicleFactory';
import {
  Car,
  Lock,
  CheckCircle,
  Trophy,
  Zap,
  Shield,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Flame,
} from 'lucide-react';

export default function GaragePage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [cars, setCars] = useState<GarageCarItem[]>([]);
  const [unlockedCars, setUnlockedCars] = useState<string[]>(['car_cyber_phantom']);
  const [selectedCarId, setSelectedCarId] = useState<string>('car_cyber_phantom');
  const [activeViewingCarId, setActiveViewingCarId] = useState<string>('car_cyber_phantom');
  const [customizations, setCustomizations] = useState<Record<string, VehicleCustomizationConfig>>({});
  const [userStats, setUserStats] = useState({
    level: 1,
    xp: 0,
    eloRating: 1000,
    eloTier: 'BRONZE',
  });

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    loadGarageData();
  }, []);

  const loadGarageData = async () => {
    try {
      setLoading(true);
      const [carsData, garageData] = await Promise.all([
        api.getCars(),
        api.getMyGarage().catch(() => null),
      ]);

      if (carsData && Array.isArray(carsData)) {
        setCars(carsData);
      }

      if (garageData) {
        setSelectedCarId(garageData.selectedCarId || 'car_cyber_phantom');
        setActiveViewingCarId(garageData.selectedCarId || 'car_cyber_phantom');
        setUnlockedCars(garageData.unlockedCars || ['car_cyber_phantom']);
        setCustomizations(garageData.customizations || {});
        setUserStats({
          level: garageData.level || 1,
          xp: garageData.xp || 0,
          eloRating: garageData.eloRating || 1000,
          eloTier: garageData.eloTier || 'BRONZE',
        });
      }
    } catch (err) {
      console.error('Failed to load garage:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCar = async (carId: string) => {
    await api.updateCar(carId);
    setSelectedCarId(carId);
  };

  const handleSaveCustomization = async (carId: string, config: VehicleCustomizationConfig) => {
    await api.saveCustomization(carId, config);
    setCustomizations((prev) => ({ ...prev, [carId]: config }));
  };

  const activeCar = cars.find((c) => c.id === activeViewingCarId) || cars[0];

  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      {/* Top Banner Navigation */}
      <div className="border-b border-white/10 bg-surface/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="font-display font-black text-xl tracking-wider text-white flex items-center space-x-2">
              <span className="text-primary font-mono">&gt;</span>
              <span>KEYRUSH<span className="text-accent">2.0</span></span>
            </Link>
            <span className="text-white/20">/</span>
            <div className="flex items-center space-x-2 text-sm font-semibold text-white">
              <Car className="w-4 h-4 text-accent" />
              <span>3D Vehicle Workshop</span>
            </div>
          </div>

          {/* User Progression Pills */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-surface-dark border border-white/5 text-xs">
              <Trophy className="w-3.5 h-3.5 text-warning" />
              <span className="text-text-muted">Rating:</span>
              <span className="font-mono font-bold text-white">{userStats.eloRating}</span>
              <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono text-[10px] font-bold">
                {userStats.eloTier}
              </span>
            </div>

            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-surface-dark border border-white/5 text-xs">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span className="text-text-muted">Level</span>
              <span className="font-mono font-bold text-accent">{userStats.level}</span>
            </div>

            <Link
              href="/multiplayer"
              className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition flex items-center space-x-1.5"
            >
              <span>Race</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Garage Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {loading ? (
          <div className="h-96 rounded-2xl border border-white/10 bg-surface/50 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-text-muted uppercase tracking-wider">Hydrating 3D Workshop Assets...</span>
          </div>
        ) : activeCar ? (
          <>
            {/* Interactive 3D Garage Showroom */}
            <ThreeGarage
              car={activeCar}
              initialCustomization={customizations[activeCar.id]}
              isUnlocked={unlockedCars.includes(activeCar.id)}
              isSelected={selectedCarId === activeCar.id}
              onSelectCar={handleSelectCar}
              onSaveCustomization={handleSaveCustomization}
            />

            {/* Vehicle Fleet Selector */}
            <div className="rounded-2xl border border-white/10 bg-surface/80 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-display font-bold text-white flex items-center space-x-2">
                    <Car className="w-4 h-4 text-accent" />
                    <span>Esports Vehicle Roster</span>
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Select a chassis to inspect, configure paint livery, and equip for live competition.
                  </p>
                </div>
                <div className="text-xs font-mono text-text-muted">
                  Unlocked: <span className="text-accent font-bold">{unlockedCars.length}</span> / {cars.length}
                </div>
              </div>

              {/* Vehicle Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {cars.map((c) => {
                  const unlocked = unlockedCars.includes(c.id);
                  const isEquipped = selectedCarId === c.id;
                  const isViewing = activeViewingCarId === c.id;

                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveViewingCarId(c.id)}
                      className={`relative p-4 rounded-xl border text-left transition flex flex-col justify-between overflow-hidden group ${
                        isViewing
                          ? 'border-accent bg-accent/10 shadow-lg ring-1 ring-accent/30'
                          : 'border-white/5 bg-surface-dark/70 hover:border-white/20'
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between w-full mb-3">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-text-muted uppercase">
                          {c.category}
                        </span>

                        {isEquipped ? (
                          <span className="flex items-center space-x-1 text-[10px] font-bold text-success bg-success/15 px-2 py-0.5 rounded-full border border-success/30">
                            <CheckCircle className="w-3 h-3" />
                            <span>EQUIPPED</span>
                          </span>
                        ) : !unlocked ? (
                          <span className="flex items-center space-x-1 text-[10px] font-bold text-warning bg-warning/15 px-2 py-0.5 rounded-full border border-warning/30">
                            <Lock className="w-3 h-3" />
                            <span>LVL {c.unlockLevel}</span>
                          </span>
                        ) : null}
                      </div>

                      {/* Car Name & Specs */}
                      <div>
                        <h4 className="font-display font-bold text-white text-sm group-hover:text-accent transition">
                          {c.name}
                        </h4>
                        <div className="flex items-center space-x-3 mt-2 text-[11px] font-mono text-text-muted">
                          <span>Top: {c.topSpeedKmh} km/h</span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.nitroColor }} />
                            <span>Nitro</span>
                          </span>
                        </div>
                      </div>

                      {/* Color Accent Bar */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
                        style={{ backgroundColor: c.primaryColor }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

