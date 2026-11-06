'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { VehicleFactory } from './VehicleFactory';
import { TrackFactory, TrackTheme } from './TrackFactory';
import RacingCanvas, { RacerVisualState } from '../RacingCanvas';
import { Camera, Eye, Video, Sparkles, Layers, Sliders } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface ThreeArenaProps {
  racers: RacerVisualState[];
  trackLength?: number;
  raceStarted?: boolean;
  trackTheme?: TrackTheme;
  cameraMode?: 'chase' | 'hood' | 'orbit';
  spectatingUserId?: string;
  onFinishCinematic?: () => void;
}

export default function ThreeArena({
  racers,
  trackLength = 240,
  raceStarted = false,
  trackTheme = 'neon_city',
  cameraMode: initialCameraMode = 'chase',
  spectatingUserId,
  onFinishCinematic,
}: ThreeArenaProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webGlAvailable, setWebGlAvailable] = useState<boolean>(true);
  const [useFallback2D, setUseFallback2D] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'chase' | 'hood' | 'orbit'>(initialCameraMode);
  const [selectedTheme, setSelectedTheme] = useState<TrackTheme>(trackTheme);
  const [activeSpectatingId, setActiveSpectatingId] = useState<string | null>(spectatingUserId || null);

  // References for Three.js lifecycle
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const trackGroupRef = useRef<THREE.Group | null>(null);
  const carMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const racerPositionsRef = useRef<Map<string, { currentZ: number; currentX: number }>>(new Map());
  const finishedTriggeredRef = useRef<boolean>(false);

  // Detect WebGL
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      setWebGlAvailable(gl);
    } catch {
      setWebGlAvailable(false);
    }
  }, []);

  // Initialize Three.js Viewport
  useEffect(() => {
    if (!webGlAvailable || useFallback2D || !mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#080D19');
    scene.fog = new THREE.FogExp2('#080D19', 0.015);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 400);
    camera.position.set(0, 3, -8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Studio & Track Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
    sunLight.position.set(10, 20, 10);
    scene.add(sunLight);

    const cyanNeon = new THREE.DirectionalLight(0x06b6d4, 0.8);
    cyanNeon.position.set(-15, 8, 20);
    scene.add(cyanNeon);

    const purpleNeon = new THREE.DirectionalLight(0x8b5cf6, 0.8);
    purpleNeon.position.set(15, 8, 20);
    scene.add(purpleNeon);

    // Build Track Mesh
    const numLanes = racers.length <= 4 ? 4 : racers.length <= 12 ? 6 : racers.length <= 40 ? 8 : 10;
    const track = TrackFactory.createTrack({
      theme: selectedTheme,
      trackLength,
      numLanes,
    });
    scene.add(track);
    trackGroupRef.current = track;

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Find current focus racer (either spectated racer or current player)
      const targetRacer =
        racers.find((r) => r.userId === activeSpectatingId) ||
        racers.find((r) => r.isCurrentPlayer) ||
        racers[0];

      let targetPos = new THREE.Vector3(0, 0, 0);

      // Clean up removed racer meshes
      const currentIds = new Set(racers.map((r) => r.userId));
      for (const [id, mesh] of carMeshesRef.current.entries()) {
        if (!currentIds.has(id)) {
          scene.remove(mesh);
          carMeshesRef.current.delete(id);
          racerPositionsRef.current.delete(id);
        }
      }

      // Smoothly interpolate racer vehicle meshes along track and multi-row grid
      racers.forEach((racer, index) => {
        let carGroup = carMeshesRef.current.get(racer.userId);
        if (!carGroup) {
          carGroup = VehicleFactory.createVehicle(racer.carId);
          scene.add(carGroup);
          carMeshesRef.current.set(racer.userId, carGroup);
        }

        const gridPos = TrackFactory.getGridPosition(
          index,
          racers.length,
          trackLength,
          racer.progressPercent,
        );

        let currentPos = racerPositionsRef.current.get(racer.userId);
        if (!currentPos) {
          currentPos = { currentZ: gridPos.z, currentX: gridPos.x };
          racerPositionsRef.current.set(racer.userId, currentPos);
        }

        // Smooth position lerp
        const distanceDelta = (gridPos.z - currentPos.currentZ) * 0.12;
        currentPos.currentZ += distanceDelta;
        currentPos.currentX += (gridPos.x - currentPos.currentX) * 0.1;

        carGroup.position.set(currentPos.currentX, 0, currentPos.currentZ);

        // Spin wheels based on speed
        VehicleFactory.rotateWheels(carGroup, Math.max(distanceDelta, racer.speed * 0.003));

        // Nitro exhaust flare
        VehicleFactory.setVehicleNitro(carGroup, racer.nitroActive, racer.nitroActive ? 1.4 : 0);

        if (racer.userId === targetRacer?.userId) {
          targetPos.set(currentPos.currentX, 0.4, currentPos.currentZ);
        }
      });

      // Update Camera based on mode
      if (camera) {
        if (cameraMode === 'hood') {
          camera.position.set(targetPos.x, targetPos.y + 0.85, targetPos.z + 0.5);
          camera.lookAt(targetPos.x, targetPos.y + 0.85, targetPos.z + 50);
          camera.fov = targetRacer?.nitroActive ? 65 : 55;
          camera.updateProjectionMatrix();
        } else if (cameraMode === 'orbit') {
          const orbitAngle = Date.now() * 0.001;
          camera.position.set(
            targetPos.x + Math.sin(orbitAngle) * 8,
            targetPos.y + 3.5,
            targetPos.z + Math.cos(orbitAngle) * 8,
          );
          camera.lookAt(targetPos.x, targetPos.y + 0.5, targetPos.z);
        } else {
          // 'chase' mode
          const idealCamX = targetPos.x * 0.8;
          const idealCamY = targetPos.y + 2.5;
          const idealCamZ = targetPos.z - 6.2;

          camera.position.x += (idealCamX - camera.position.x) * 0.08;
          camera.position.y += (idealCamY - camera.position.y) * 0.08;
          camera.position.z += (idealCamZ - camera.position.z) * 0.1;

          camera.lookAt(targetPos.x, targetPos.y + 0.6, targetPos.z + 12);
          camera.fov = targetRacer?.nitroActive ? 68 : 55;
          camera.updateProjectionMatrix();
        }

        // Keep sunlight centered near active car
        sunLight.position.set(targetPos.x + 10, 20, targetPos.z + 10);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      carMeshesRef.current.clear();
      racerPositionsRef.current.clear();
    };
  }, [webGlAvailable, useFallback2D, selectedTheme, trackLength, Math.min(racers.length, 10)]);

  // Reset finish celebration on new race
  useEffect(() => {
    if (racers.every((r) => r.progressPercent === 0)) {
      finishedTriggeredRef.current = false;
    }
  }, [racers]);

  // Check for finish line victory celebration
  useEffect(() => {
    const me = racers.find((r) => r.isCurrentPlayer);
    if (me && me.finished && !finishedTriggeredRef.current) {
      finishedTriggeredRef.current = true;
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
      if (onFinishCinematic) onFinishCinematic();
    }
  }, [racers, onFinishCinematic]);

  // If WebGL is not available or user selected 2D mode, render 2D canvas fallback
  if (!webGlAvailable || useFallback2D) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-surface border border-white/10 text-xs">
          <span className="text-text-muted font-medium">Render Engine: 2D Canvas Fallback</span>
          {webGlAvailable && (
            <button
              onClick={() => setUseFallback2D(false)}
              className="px-3 py-1 rounded-lg bg-primary/20 text-primary border border-primary/40 font-bold hover:bg-primary hover:text-white transition"
            >
              Switch to 3D WebGL
            </button>
          )}
        </div>
        <RacingCanvas racers={racers} trackLength={trackLength * 4} raceStarted={raceStarted} />
      </div>
    );
  }

  const currentPlayer = racers.find((r) => r.isCurrentPlayer);

  // Filter racers for the bottom strip (top 8 + current player)
  const sortedRacers = [...racers].sort((a, b) => (a.rankPosition || 999) - (b.rankPosition || 999));
  const topRacers = sortedRacers.slice(0, 8);
  const playerInTop = currentPlayer && topRacers.some((r) => r.userId === currentPlayer.userId);
  const displayRacers = playerInTop || !currentPlayer ? topRacers : [...topRacers, currentPlayer];

  return (
    <div className="relative w-full rounded-2xl border border-white/10 bg-surface/90 overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col">
      {/* 3D Arena Control HUD Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-mono font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            <span>Three.js 3D Esports Arena</span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-primary/20 border border-primary/40 font-bold text-accent">
              Grid: {racers.length} Cars
            </span>
            {currentPlayer && (
              <>
                <span className="text-text-muted">| Rank:</span>
                <span className="font-bold text-white">#{currentPlayer.rankPosition} of {racers.length}</span>
                <span className="text-text-muted">| Speed:</span>
                <span className="font-bold text-accent">{currentPlayer.speed} km/h</span>
              </>
            )}
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center space-x-2">
          {/* Camera Selector */}
          <div className="flex items-center p-1 rounded-xl bg-surface-dark border border-white/5 text-xs font-medium">
            <button
              onClick={() => setCameraMode('chase')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                cameraMode === 'chase' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-white'
              }`}
              title="Chase Third-Person Camera"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chase</span>
            </button>
            <button
              onClick={() => setCameraMode('hood')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                cameraMode === 'hood' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-white'
              }`}
              title="Hood First-Person Camera"
            >
              <Video className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hood</span>
            </button>
            <button
              onClick={() => setCameraMode('orbit')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                cameraMode === 'orbit' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-white'
              }`}
              title="Spectator Orbit Camera"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Orbit</span>
            </button>
          </div>

          {/* Theme Selector */}
          <select
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value as TrackTheme)}
            className="px-2.5 py-1 rounded-xl bg-surface-dark border border-white/10 text-xs font-medium text-white focus:outline-none focus:border-accent"
          >
            <option value="neon_city">Neon City Circuit</option>
            <option value="cyber_highway">Cyber Highway</option>
            <option value="desert_dunes">Desert Dunes</option>
            <option value="mountain_peak">Mountain Peak</option>
          </select>

          {/* 2D Canvas Fallback Toggle */}
          <button
            onClick={() => setUseFallback2D(true)}
            className="p-1.5 rounded-xl bg-surface-dark border border-white/5 text-text-muted hover:text-white text-xs transition"
            title="Switch to 2D Canvas"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-[400px] select-none" />

      {/* Dynamic Racer Leaderboard Strip on Bottom */}
      <div className="border-t border-white/10 px-4 py-2 bg-background/80 backdrop-blur-md flex items-center space-x-3 overflow-x-auto text-xs font-mono">
        <span className="text-[11px] font-bold text-text-muted uppercase shrink-0">
          Leaderboard ({racers.length}):
        </span>
        {displayRacers.map((r, i) => (
          <button
            key={r.userId}
            onClick={() => setActiveSpectatingId(r.userId)}
            className={`flex items-center space-x-2 px-2.5 py-1 rounded-lg border transition shrink-0 ${
              r.isCurrentPlayer
                ? 'bg-primary/20 border-primary/50 text-white font-bold ring-1 ring-primary/40'
                : activeSpectatingId === r.userId
                ? 'bg-accent/20 border-accent/50 text-accent font-bold'
                : 'bg-surface-dark border-white/5 text-text-muted hover:border-white/20'
            }`}
          >
            <span className="text-accent font-bold">#{r.rankPosition || i + 1}</span>
            <span className="truncate max-w-[100px]">{r.username}</span>
            <span className="text-text-dim text-[10px]">{Math.round(r.progressPercent)}%</span>
            {r.nitroActive && <Sparkles className="w-3 h-3 text-warning animate-bounce" />}
          </button>
        ))}
        {racers.length > displayRacers.length && (
          <span className="text-text-muted text-[10px] shrink-0">
            +{racers.length - displayRacers.length} more in pack
          </span>
        )}
      </div>
    </div>
  );
}

