'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { VehicleFactory } from './VehicleFactory';
import { TrackFactory, TrackTheme } from './TrackFactory';
import RacingCanvas, { RacerVisualState } from '../RacingCanvas';
import {
  Camera,
  Eye,
  Video,
  Sparkles,
  Layers,
  Flag,
  Flame,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface ThreeArenaProps {
  racers: RacerVisualState[];
  trackLength?: number;
  raceStarted?: boolean;
  countdown?: number | null;
  trackTheme?: TrackTheme;
  cameraMode?: 'chase' | 'hood' | 'orbit';
  spectatingUserId?: string;
  onFinishCinematic?: () => void;
}

export default function ThreeArena({
  racers,
  trackLength = 240,
  raceStarted = false,
  countdown = null,
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
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>('high');

  // Mutable refs to solve React stale-closure in 60fps Three.js requestAnimationFrame loop
  const racersRef = useRef<RacerVisualState[]>(racers);
  racersRef.current = racers;

  const raceStartedRef = useRef<boolean>(raceStarted);
  raceStartedRef.current = raceStarted;

  const countdownRef = useRef<number | null>(countdown);
  countdownRef.current = countdown;

  const cameraModeRef = useRef<'chase' | 'hood' | 'orbit'>(cameraMode);
  cameraModeRef.current = cameraMode;

  const spectatingIdRef = useRef<string | null>(activeSpectatingId);
  spectatingIdRef.current = activeSpectatingId;

  // Overtake notification state
  const prevRankRef = useRef<number | null>(null);
  const [overtakeNotice, setOvertakeNotice] = useState<string | null>(null);

  // References for Three.js lifecycle
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const trackGroupRef = useRef<THREE.Group | null>(null);
  const carMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const racerPositionsRef = useRef<Map<string, { currentZ: number; currentX: number }>>(new Map());
  const speedLinesMeshRef = useRef<THREE.LineSegments | null>(null);
  const finishedTriggeredRef = useRef<boolean>(false);

  // Detect WebGL support
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

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 440;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#060913');
    scene.fog = new THREE.FogExp2('#060913', 0.009);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 550);
    camera.position.set(0, 3, -8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: graphicsQuality !== 'low',
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(graphicsQuality === 'high' ? Math.min(window.devicePixelRatio, 2) : 1);
    renderer.shadowMap.enabled = graphicsQuality === 'high';
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Studio & Track Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(10, 24, 10);
    scene.add(sunLight);

    const cyanNeon = new THREE.DirectionalLight(0x06b6d4, 0.85);
    cyanNeon.position.set(-15, 10, 20);
    scene.add(cyanNeon);

    const purpleNeon = new THREE.DirectionalLight(0x8b5cf6, 0.85);
    purpleNeon.position.set(15, 10, 20);
    scene.add(purpleNeon);

    // Build Track Mesh with Multi-Row Grid, Cyber Grid, Distance Signs & Finish Arch
    const numLanes = racersRef.current.length <= 4 ? 4 : racersRef.current.length <= 12 ? 6 : racersRef.current.length <= 40 ? 8 : 10;
    const track = TrackFactory.createTrack({
      theme: selectedTheme,
      trackLength,
      numLanes,
    });
    scene.add(track);
    trackGroupRef.current = track;

    // Optical Speed Streaks System (High-Velocity Forward Motion)
    const streakCount = graphicsQuality === 'low' ? 0 : graphicsQuality === 'medium' ? 140 : 280;
    let streakGeometry: THREE.BufferGeometry | null = null;
    let streakMat: THREE.LineBasicMaterial | null = null;

    if (streakCount > 0) {
      streakGeometry = new THREE.BufferGeometry();
      const streakPositions = new Float32Array(streakCount * 6);
      const streakColors = new Float32Array(streakCount * 6);

      for (let i = 0; i < streakCount; i++) {
        const x = (Math.random() - 0.5) * 24;
        const y = 0.4 + Math.random() * 5.5;
        const z = Math.random() * 120;
        const len = 1.8 + Math.random() * 4.0;

        streakPositions[i * 6 + 0] = x;
        streakPositions[i * 6 + 1] = y;
        streakPositions[i * 6 + 2] = z;
        streakPositions[i * 6 + 3] = x;
        streakPositions[i * 6 + 4] = y;
        streakPositions[i * 6 + 5] = z + len;

        const isCyan = Math.random() > 0.35;
        const color = isCyan ? new THREE.Color(0x00f0ff) : new THREE.Color(0x8b5cf6);
        streakColors[i * 6 + 0] = color.r;
        streakColors[i * 6 + 1] = color.g;
        streakColors[i * 6 + 2] = color.b;
        streakColors[i * 6 + 3] = color.r * 0.25;
        streakColors[i * 6 + 4] = color.g * 0.25;
        streakColors[i * 6 + 5] = color.b * 0.25;
      }

      streakGeometry.setAttribute('position', new THREE.BufferAttribute(streakPositions, 3));
      streakGeometry.setAttribute('color', new THREE.BufferAttribute(streakColors, 3));

      streakMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const speedLines = new THREE.LineSegments(streakGeometry, streakMat);
      scene.add(speedLines);
      speedLinesMeshRef.current = speedLines;
    }

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(0.1, clock.getDelta());
      const elapsedTime = clock.getElapsedTime();

      // Read mutable refs for real-time live data
      const currentRacers = racersRef.current;
      const isRacing = raceStartedRef.current;
      const activeCountdown = countdownRef.current;
      const currentCamMode = cameraModeRef.current;
      const spectatingId = spectatingIdRef.current;

      // Find current focus racer (either spectated racer or authenticated player)
      const targetRacer =
        currentRacers.find((r) => r.userId === spectatingId) ||
        currentRacers.find((r) => r.isCurrentPlayer) ||
        currentRacers[0];

      let targetPos = new THREE.Vector3(0, 0, 0);

      // Dynamic starting lights feedback on gantry
      if (trackGroupRef.current && trackGroupRef.current.userData.startLights) {
        const lights = trackGroupRef.current.userData.startLights as THREE.Mesh[];
        if (lights && lights.length === 3) {
          if (activeCountdown === 3) {
            (lights[0].material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
            (lights[1].material as THREE.MeshBasicMaterial).color.setHex(0x1e293b);
            (lights[2].material as THREE.MeshBasicMaterial).color.setHex(0x1e293b);
          } else if (activeCountdown === 2) {
            (lights[0].material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
            (lights[1].material as THREE.MeshBasicMaterial).color.setHex(0xf59e0b);
            (lights[2].material as THREE.MeshBasicMaterial).color.setHex(0x1e293b);
          } else if (activeCountdown === 1) {
            (lights[0].material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
            (lights[1].material as THREE.MeshBasicMaterial).color.setHex(0xf59e0b);
            (lights[2].material as THREE.MeshBasicMaterial).color.setHex(0x22c55e);
          } else if (isRacing) {
            const flash = Math.sin(elapsedTime * 12) > 0 ? 0x22c55e : 0x10b981;
            lights.forEach((l) => (l.material as THREE.MeshBasicMaterial).color.setHex(flash));
          }
        }
      }

      // Clean up removed racer meshes
      const currentIds = new Set(currentRacers.map((r) => r.userId));
      for (const [id, mesh] of carMeshesRef.current.entries()) {
        if (!currentIds.has(id)) {
          scene.remove(mesh);
          carMeshesRef.current.delete(id);
          racerPositionsRef.current.delete(id);
        }
      }

      // Smoothly interpolate racer vehicle meshes along track and multi-row grid
      currentRacers.forEach((racer, index) => {
        let carGroup = carMeshesRef.current.get(racer.userId);
        if (!carGroup) {
          carGroup = VehicleFactory.createVehicle(racer.carId);
          scene.add(carGroup);
          carMeshesRef.current.set(racer.userId, carGroup);
          VehicleFactory.attachPlayerIdentity(
            carGroup,
            !!racer.isCurrentPlayer,
            racer.username,
            racer.rankPosition,
          );
        }

        // Keep identity synchronized in case props update
        if (carGroup.userData.isCurrentPlayer !== !!racer.isCurrentPlayer) {
          VehicleFactory.attachPlayerIdentity(
            carGroup,
            !!racer.isCurrentPlayer,
            racer.username,
            racer.rankPosition,
          );
        }

        const gridPos = TrackFactory.getGridPosition(
          index,
          currentRacers.length,
          trackLength,
          racer.progressPercent,
        );

        let currentPos = racerPositionsRef.current.get(racer.userId);
        if (!currentPos) {
          currentPos = { currentZ: gridPos.z, currentX: gridPos.x };
          racerPositionsRef.current.set(racer.userId, currentPos);
        }

        // Fast, responsive position lerp
        const distanceDelta = (gridPos.z - currentPos.currentZ) * 0.22;
        const lateralDelta = (gridPos.x - currentPos.currentX) * 0.15;
        currentPos.currentZ += distanceDelta;
        currentPos.currentX += lateralDelta;

        carGroup.position.set(currentPos.currentX, 0, currentPos.currentZ);

        // Steering angle & Chassis roll on turn
        VehicleFactory.setSteeringAngle(carGroup, THREE.MathUtils.clamp(-lateralDelta * 2.5, -0.35, 0.35));
        carGroup.rotation.z = THREE.MathUtils.clamp(-lateralDelta * 0.8, -0.15, 0.15);

        // Continuous wheel rotation strictly proportional to km/h speed + suspension pitch
        const accel = distanceDelta * 80;
        VehicleFactory.updateVehicleDynamics(carGroup, racer.speed, accel, delta, elapsedTime);

        // Player identity animation: bobbing chevron & pulsing aura
        VehicleFactory.updatePlayerIdentity(carGroup, elapsedTime);

        // Nitro exhaust flare
        VehicleFactory.setVehicleNitro(carGroup, racer.nitroActive, racer.nitroActive ? 1.5 : 0);

        if (racer.userId === targetRacer?.userId) {
          targetPos.set(currentPos.currentX, 0.4, currentPos.currentZ);
        }
      });

      // Update Optical Speed Streaks (Streaming past camera at vehicle speed)
      if (streakGeometry && streakMat && streakCount > 0) {
        const speedKmh = targetRacer?.speed || 20;
        const isNitro = targetRacer?.nitroActive || false;
        const speedFactor = Math.min(1.8, speedKmh / 90);

        // Fade in streaks when driving forward
        streakMat.opacity = THREE.MathUtils.lerp(
          streakMat.opacity,
          isRacing && speedKmh > 22 ? (isNitro ? 0.95 : Math.min(0.8, speedFactor * 0.7)) : 0,
          0.1,
        );

        const posAttr = streakGeometry.attributes.position;
        const posArr = posAttr.array as Float32Array;
        const streakSpeed = Math.max(25, speedKmh * 1.1) * delta;

        for (let i = 0; i < streakCount; i++) {
          posArr[i * 6 + 2] -= streakSpeed;
          posArr[i * 6 + 5] -= streakSpeed;

          // If passed behind camera, recycle ahead down track
          if (posArr[i * 6 + 5] < camera.position.z - 6) {
            const newX = targetPos.x + (Math.random() - 0.5) * 20;
            const newY = 0.4 + Math.random() * 4.8;
            const newZ = targetPos.z + 50 + Math.random() * 50;
            const len = (isNitro ? 5.0 : 2.0) + Math.random() * 3.5;

            posArr[i * 6 + 0] = newX;
            posArr[i * 6 + 1] = newY;
            posArr[i * 6 + 2] = newZ;
            posArr[i * 6 + 3] = newX;
            posArr[i * 6 + 4] = newY;
            posArr[i * 6 + 5] = newZ + len;
          }
        }
        posAttr.needsUpdate = true;
      }

      // Update Camera based on mode & speed acceleration response
      if (camera) {
        const speed = targetRacer?.speed || 20;
        const isNitro = targetRacer?.nitroActive || false;
        const speedRatio = Math.min(1.6, speed / 100);

        if (currentCamMode === 'hood') {
          camera.position.set(targetPos.x, targetPos.y + 0.85, targetPos.z + 0.7);
          camera.lookAt(targetPos.x, targetPos.y + 0.85, targetPos.z + 50);

          const targetFov = isNitro ? 74 : 55 + speedRatio * 11;
          camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.08);
          camera.updateProjectionMatrix();
        } else if (currentCamMode === 'orbit') {
          const orbitAngle = Date.now() * 0.001;
          camera.position.set(
            targetPos.x + Math.sin(orbitAngle) * 8.5,
            targetPos.y + 3.6,
            targetPos.z + Math.cos(orbitAngle) * 8.5,
          );
          camera.lookAt(targetPos.x, targetPos.y + 0.6, targetPos.z);
        } else {
          // 'chase' mode with speed-lag spring and visceral throttle response
          const chaseDistance = 6.4 + speedRatio * 1.6;
          const chaseHeight = 2.45 + speedRatio * 0.35;

          const idealCamX = targetPos.x * 0.85;
          const idealCamY = targetPos.y + chaseHeight;
          const idealCamZ = targetPos.z - chaseDistance;

          // Smooth elastic follow
          camera.position.x += (idealCamX - camera.position.x) * 0.12;
          camera.position.y += (idealCamY - camera.position.y) * 0.12;
          camera.position.z += (idealCamZ - camera.position.z) * 0.16;

          // High-speed & Nitro Camera Vibration/Shake
          if (speed > 55 || isNitro) {
            const shakeMag = (isNitro ? 0.055 : 0.016) * Math.min(1.5, speed / 80);
            camera.position.x += (Math.random() - 0.5) * shakeMag;
            camera.position.y += (Math.random() - 0.5) * shakeMag;
          }

          camera.lookAt(targetPos.x, targetPos.y + 0.65, targetPos.z + 16);

          // Dynamic FOV expansion: 54 at idle up to 68 at high speed, 76 during Nitro!
          const targetFov = 54 + Math.min(16, speedRatio * 14) + (isNitro ? 8 : 0);
          camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.08);
          camera.updateProjectionMatrix();
        }

        // Keep directional sunlight centered near car
        sunLight.position.set(targetPos.x + 10, 24, targetPos.z + 10);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Auto-Responsive ResizeObserver for container resizing
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0 && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h, false);
        }
      }
    });

    if (mountRef.current) {
      resizeObserver.observe(mountRef.current);
    }

    const handleWindowResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight || 440;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleWindowResize);
      resizeObserver.disconnect();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      carMeshesRef.current.clear();
      racerPositionsRef.current.clear();
      if (speedLinesMeshRef.current) {
        speedLinesMeshRef.current.geometry.dispose();
      }
    };
  }, [webGlAvailable, useFallback2D, selectedTheme, trackLength, graphicsQuality]);

  // Reset finish celebration on new race
  useEffect(() => {
    if (racers.every((r) => r.progressPercent === 0)) {
      finishedTriggeredRef.current = false;
      prevRankRef.current = null;
      setOvertakeNotice(null);
    }
  }, [racers]);

  // Check for finish line victory celebration
  useEffect(() => {
    const me = racers.find((r) => r.isCurrentPlayer);
    if (me && me.finished && !finishedTriggeredRef.current) {
      finishedTriggeredRef.current = true;
      confetti({
        particleCount: 150,
        spread: 85,
        origin: { y: 0.6 },
      });
      if (onFinishCinematic) onFinishCinematic();
    }
  }, [racers, onFinishCinematic]);

  const currentPlayer = racers.find((r) => r.isCurrentPlayer);

  // Monitor overtake feedback
  useEffect(() => {
    if (!currentPlayer || !raceStarted) return;
    const currentRank = currentPlayer.rankPosition || 1;
    if (prevRankRef.current !== null && currentRank < prevRankRef.current) {
      const diff = prevRankRef.current - currentRank;
      setOvertakeNotice(`▲ OVERTAKE! +${diff} POS (#${currentRank})`);
      const timer = setTimeout(() => setOvertakeNotice(null), 2500);
      return () => clearTimeout(timer);
    }
    prevRankRef.current = currentRank;
  }, [currentPlayer?.rankPosition, raceStarted]);

  // Sorted racers for mini-leaderboard
  const sortedRacers = useMemo(() => {
    return [...racers].sort((a, b) => (a.rankPosition || 999) - (b.rankPosition || 999));
  }, [racers]);

  const topRacers = sortedRacers.slice(0, 8);
  const playerInTop = currentPlayer && topRacers.some((r) => r.userId === currentPlayer.userId);
  const displayRacers = playerInTop || !currentPlayer ? topRacers : [...topRacers, currentPlayer];

  // Visual Speedometer needle angle & color state
  const speed = currentPlayer?.speed || 20;
  const isNitro = currentPlayer?.nitroActive || false;
  const speedClamped = Math.min(220, Math.max(0, speed));
  const speedPercentage = Math.min(100, Math.round((speedClamped / 200) * 100));

  const speedState = useMemo(() => {
    if (isNitro) return { label: 'HYPER NITRO', color: 'text-amber-400', border: 'border-amber-400/60', bg: 'bg-amber-500/20' };
    if (speed >= 100) return { label: 'TOP VELOCITY', color: 'text-fuchsia-400', border: 'border-fuchsia-400/60', bg: 'bg-fuchsia-500/20' };
    if (speed >= 60) return { label: 'FAST ACCEL', color: 'text-accent', border: 'border-accent/60', bg: 'bg-accent/20' };
    if (speed >= 30) return { label: 'CRUISING', color: 'text-emerald-400', border: 'border-emerald-400/60', bg: 'bg-emerald-500/20' };
    return { label: 'IDLE / REV', color: 'text-text-muted', border: 'border-white/10', bg: 'bg-white/5' };
  }, [speed, isNitro]);

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

  return (
    <div className="relative w-full rounded-2xl border border-white/10 bg-surface/90 overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col select-none">
      {/* 3D Arena Responsive Control Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 px-3 sm:px-4 py-2 bg-background/90 backdrop-blur-md gap-2 z-10">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-mono font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            <span className="text-[11px] sm:text-xs">3D Esports Arena</span>
          </div>

          <div className="hidden xs:flex items-center space-x-1.5 sm:space-x-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-primary/20 border border-primary/40 font-bold text-accent text-[11px]">
              {racers.length} Cars
            </span>
            {currentPlayer && (
              <span className="font-bold text-white text-[11px] sm:text-xs">
                #{currentPlayer.rankPosition} of {racers.length}
              </span>
            )}
          </div>
        </div>

        {/* View Controls & Graphics Quality */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Graphics Quality Toggle */}
          <div className="hidden lg:flex items-center p-0.5 rounded-lg bg-surface-dark border border-white/5 text-[11px] font-mono">
            {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
              <button
                key={q}
                onClick={() => setGraphicsQuality(q)}
                className={`px-2 py-0.5 rounded capitalize transition ${
                  graphicsQuality === q
                    ? 'bg-primary text-white font-bold'
                    : 'text-text-muted hover:text-white'
                }`}
                title={`Graphics Quality: ${q}`}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Camera Selector */}
          <div className="flex items-center p-0.5 rounded-xl bg-surface-dark border border-white/5 text-xs font-medium">
            <button
              onClick={() => setCameraMode('chase')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                cameraMode === 'chase' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-white'
              }`}
              title="Chase Third-Person Camera"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chase</span>
            </button>
            <button
              onClick={() => setCameraMode('hood')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                cameraMode === 'hood' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-white'
              }`}
              title="Hood First-Person Camera"
            >
              <Video className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hood</span>
            </button>
            <button
              onClick={() => setCameraMode('orbit')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
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
            className="px-2 py-1 rounded-xl bg-surface-dark border border-white/10 text-xs font-medium text-white focus:outline-none focus:border-accent max-w-[120px] sm:max-w-none"
          >
            <option value="neon_city">Neon City</option>
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

      {/* Top Track Minimap Progress Bar */}
      <div className="relative px-3 sm:px-6 py-2 bg-background/95 border-b border-white/10 z-10">
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono font-bold text-text-muted mb-1">
          <span className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>START</span>
          </span>
          <span className="text-white font-black">
            {currentPlayer ? `${Math.round(currentPlayer.progressPercent)}% COMPLETED` : 'CIRCUIT PROGRESS'}
          </span>
          <span className="flex items-center space-x-1 text-emerald-400">
            <Flag className="w-3.5 h-3.5" />
            <span>FINISH 🏁</span>
          </span>
        </div>

        {/* Track Line with Moving Cars */}
        <div className="relative w-full h-3 sm:h-3.5 rounded-full bg-surface-dark border border-white/10 overflow-visible">
          {/* Progress fill for current player */}
          {currentPlayer && (
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary opacity-60 transition-all duration-150"
              style={{ width: `${Math.max(2, Math.min(100, currentPlayer.progressPercent))}%` }}
            />
          )}

          {/* Opponent Car Pips */}
          {racers.map((r) => {
            if (r.isCurrentPlayer) return null;
            return (
              <div
                key={r.userId}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-400 border border-slate-700 shadow transition-all duration-150"
                style={{ left: `${Math.max(1, Math.min(98, r.progressPercent))}%` }}
                title={`${r.username}: ${Math.round(r.progressPercent)}%`}
              />
            );
          })}

          {/* Current Player Car Marker on Track */}
          {currentPlayer && (
            <div
              className="absolute top-1/2 -translate-y-1/2 -ml-2.5 sm:-ml-3 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-accent border-2 border-white shadow-lg shadow-accent/80 flex items-center justify-center font-bold text-[8px] sm:text-[9px] text-black transition-all duration-150 z-20"
              style={{ left: `${Math.max(2, Math.min(98, currentPlayer.progressPercent))}%` }}
              title="You"
            >
              YOU
            </div>
          )}
        </div>
      </div>

      {/* 3D WebGL Canvas Fluid Responsive Viewport */}
      <div className="relative w-full h-[320px] xs:h-[360px] sm:h-[420px] md:h-[460px] lg:h-[500px]">
        <div ref={mountRef} className="w-full h-full select-none" />

        {/* Overtake Feedback Banner */}
        {overtakeNotice && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1.5 rounded-xl bg-emerald-500/90 border border-emerald-300 text-black font-mono font-black text-xs shadow-2xl backdrop-blur-md animate-bounce z-20">
            {overtakeNotice}
          </div>
        )}

        {/* Embedded Professional Speedometer HUD (Responsive Bottom-Right) */}
        {currentPlayer && (
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 p-2.5 sm:p-3 rounded-2xl bg-background/85 border border-white/10 backdrop-blur-xl shadow-2xl flex items-center space-x-2.5 sm:space-x-3.5 z-20 font-mono">
            {/* Speedometer Radial Gauge */}
            <div className="relative w-13 h-13 sm:w-16 sm:h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/10"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={isNitro ? 'text-amber-400' : speed >= 80 ? 'text-fuchsia-400' : 'text-accent'}
                  strokeDasharray={`${speedPercentage}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-lg sm:text-xl font-black text-white leading-none">
                  {Math.round(speed)}
                </span>
                <span className="text-[7px] sm:text-[8px] font-bold uppercase text-text-muted">km/h</span>
              </div>
            </div>

            {/* Telemetry Readouts */}
            <div className="flex flex-col space-y-1">
              <div className={`px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-bold border uppercase tracking-wider ${speedState.bg} ${speedState.border} ${speedState.color}`}>
                {speedState.label}
              </div>

              <div className="flex items-center space-x-1 sm:space-x-2 text-xs">
                <span className="text-text-muted text-[10px] sm:text-xs">Pos:</span>
                <span className="font-bold text-white text-[11px] sm:text-xs">#{currentPlayer.rankPosition}</span>
                <span className="text-text-muted text-[10px] sm:text-xs">/</span>
                <span className="text-text-muted text-[10px] sm:text-xs">{racers.length}</span>
              </div>

              {isNitro && (
                <div className="flex items-center space-x-1 text-[9px] sm:text-[10px] font-black text-amber-400 animate-pulse">
                  <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                  <span>NITRO ACTIVE</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Camera Mode Badge (Top-Left inside arena) */}
        <div className="absolute top-3 left-3 sm:left-4 px-2 sm:px-2.5 py-1 rounded-lg bg-background/80 border border-white/10 text-[9px] sm:text-[10px] font-mono text-text-muted backdrop-blur-md z-10 flex items-center space-x-1.5">
          <Camera className="w-3 h-3 text-accent" />
          <span className="uppercase font-bold text-white">{cameraMode} CAMERA</span>
        </div>
      </div>

      {/* Dynamic Racer Leaderboard Strip on Bottom */}
      <div className="border-t border-white/10 px-3 sm:px-4 py-2 bg-background/90 backdrop-blur-md flex items-center space-x-2 sm:space-x-3 overflow-x-auto text-xs font-mono scrollbar-thin">
        <span className="text-[10px] sm:text-[11px] font-bold text-text-muted uppercase shrink-0">
          Grid ({racers.length}):
        </span>
        {displayRacers.map((r, i) => (
          <button
            key={r.userId}
            onClick={() => setActiveSpectatingId(r.userId)}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-2.5 py-1 rounded-lg border transition shrink-0 ${
              r.isCurrentPlayer
                ? 'bg-primary/25 border-accent text-white font-bold ring-1 ring-accent/60 shadow-lg shadow-primary/30'
                : activeSpectatingId === r.userId
                ? 'bg-accent/20 border-accent/50 text-accent font-bold'
                : 'bg-surface-dark border-white/5 text-text-muted hover:border-white/20'
            }`}
          >
            <span className={r.isCurrentPlayer ? 'text-accent font-black' : 'text-text-muted'}>
              #{r.rankPosition || i + 1}
            </span>
            <span className="truncate max-w-[80px] sm:max-w-[100px] flex items-center space-x-1">
              <span>{r.username}</span>
              {r.isCurrentPlayer && <span className="text-[8px] sm:text-[9px] px-1 rounded bg-accent text-black font-black">YOU</span>}
            </span>
            <span className="text-text-dim text-[9px] sm:text-[10px]">{Math.round(r.progressPercent)}%</span>
            {r.nitroActive && <Sparkles className="w-3 h-3 text-amber-400 animate-bounce" />}
          </button>
        ))}
        {racers.length > displayRacers.length && (
          <span className="text-text-muted text-[10px] shrink-0">
            +{racers.length - displayRacers.length} more in grid
          </span>
        )}
      </div>
    </div>
  );
}
