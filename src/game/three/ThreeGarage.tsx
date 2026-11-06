'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { VehicleFactory, VehicleCustomizationConfig } from './VehicleFactory';
import { Palette, Sparkles, Sliders, ShieldCheck, Check, RotateCw, ZoomIn, ZoomOut, Flame } from 'lucide-react';

export interface GarageCarItem {
  id: string;
  name: string;
  category: string;
  description: string;
  topSpeedKmh: number;
  nitroColor: string;
  primaryColor: string;
  accentColor: string;
  unlockLevel: number;
}

interface ThreeGarageProps {
  car: GarageCarItem;
  initialCustomization?: VehicleCustomizationConfig;
  isUnlocked: boolean;
  isSelected: boolean;
  onSelectCar: (carId: string) => Promise<void>;
  onSaveCustomization: (carId: string, config: VehicleCustomizationConfig) => Promise<void>;
}

const PRESET_COLORS = [
  { name: 'Cyber Blue', hex: '#3B82F6' },
  { name: 'Neon Purple', hex: '#8B5CF6' },
  { name: 'Solar Gold', hex: '#F59E0B' },
  { name: 'Crimson Red', hex: '#DC2626' },
  { name: 'Cyan Pulse', hex: '#06B6D4' },
  { name: 'Emerald Volt', hex: '#10B981' },
  { name: 'Hot Pink', hex: '#EC4899' },
  { name: 'Midnight Black', hex: '#111827' },
  { name: 'Pure White', hex: '#F8FAFC' },
];

const FINISH_OPTIONS: Array<{ id: VehicleCustomizationConfig['finish']; name: string }> = [
  { id: 'metallic', name: 'Metallic' },
  { id: 'gloss', name: 'High Gloss' },
  { id: 'matte', name: 'Matte' },
  { id: 'chrome', name: 'Mirror Chrome' },
  { id: 'iridescent', name: 'Iridescent' },
];

const SPOILER_OPTIONS: Array<{ id: VehicleCustomizationConfig['spoiler']; name: string }> = [
  { id: 'none', name: 'Clean (None)' },
  { id: 'sport', name: 'Sport Lip' },
  { id: 'gt_wing', name: 'GT Carbon Wing' },
  { id: 'cyber_spoiler', name: 'Cyber Split' },
];

const RIM_COLORS = [
  { name: 'Titanium Silver', hex: '#E2E8F0' },
  { name: 'Gloss Black', hex: '#0F172A' },
  { name: 'Burnished Gold', hex: '#F59E0B' },
  { name: 'Neon Cyan', hex: '#00F0FF' },
  { name: 'Crimson Red', hex: '#EF4444' },
];

export default function ThreeGarage({
  car,
  initialCustomization,
  isUnlocked,
  isSelected,
  onSelectCar,
  onSaveCustomization,
}: ThreeGarageProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webGlAvailable, setWebGlAvailable] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'paint' | 'spoiler' | 'rims' | 'neon'>('paint');
  const [saving, setSaving] = useState(false);
  const [equipping, setEquipping] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [nitroPreview, setNitroPreview] = useState<boolean>(false);

  // Customization state
  const [customization, setCustomization] = useState<VehicleCustomizationConfig>({
    paintColor: initialCustomization?.paintColor || car.primaryColor || '#3B82F6',
    finish: initialCustomization?.finish || 'metallic',
    spoiler: initialCustomization?.spoiler || 'gt_wing',
    rimStyle: initialCustomization?.rimStyle || 'standard',
    rimColor: initialCustomization?.rimColor || '#E2E8F0',
    underglow: initialCustomization?.underglow ?? true,
    underglowColor: initialCustomization?.underglowColor || car.nitroColor || '#00F0FF',
    nitroFlameColor: initialCustomization?.nitroFlameColor || car.nitroColor || '#00F0FF',
  });

  // Three.js instances ref
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const vehicleGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orbitRef = useRef<{ isDragging: boolean; prevX: number; prevY: number; theta: number; phi: number; radius: number }>({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    theta: 0.8,
    phi: 0.35,
    radius: 6.2,
  });

  // Update vehicle in scene whenever car or customization changes
  const rebuildVehicleMesh = useCallback(() => {
    if (!sceneRef.current) return;
    if (vehicleGroupRef.current) {
      sceneRef.current.remove(vehicleGroupRef.current);
    }
    const newMesh = VehicleFactory.createVehicle(car.id, customization);
    sceneRef.current.add(newMesh);
    vehicleGroupRef.current = newMesh;
  }, [car.id, customization]);

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      setWebGlAvailable(gl);
    } catch (e) {
      setWebGlAvailable(false);
    }
  }, []);

  // Initialize Three.js viewport
  useEffect(() => {
    if (!webGlAvailable || !mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 450;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#080D19');
    scene.fog = new THREE.FogExp2('#080D19', 0.04);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const cyanRim = new THREE.DirectionalLight(0x06b6d4, 1.2);
    cyanRim.position.set(-6, 4, -4);
    scene.add(cyanRim);

    const purpleRim = new THREE.DirectionalLight(0x8b5cf6, 1.0);
    purpleRim.position.set(4, 3, -6);
    scene.add(purpleRim);

    // Showroom Turntable Floor
    const floorGeom = new THREE.CylinderGeometry(4.2, 4.2, 0.15, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.set(0, -0.08, 0);
    scene.add(floor);

    // Glowing Neon Ring around floor
    const ringGeom = new THREE.TorusGeometry(4.25, 0.04, 16, 64);
    ringGeom.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.set(0, 0.01, 0);
    scene.add(ring);

    // Initial vehicle load
    const vehicleMesh = VehicleFactory.createVehicle(car.id, customization);
    scene.add(vehicleMesh);
    vehicleGroupRef.current = vehicleMesh;

    // Mouse/Touch Orbit Controls
    const orbit = orbitRef.current;

    const updateCameraPos = () => {
      const x = orbit.radius * Math.sin(orbit.theta) * Math.cos(orbit.phi);
      const y = orbit.radius * Math.sin(orbit.phi);
      const z = orbit.radius * Math.cos(orbit.theta) * Math.cos(orbit.phi);
      camera.position.set(x, Math.max(0.6, y), z);
      camera.lookAt(0, 0.5, 0);
    };
    updateCameraPos();

    const dom = renderer.domElement;

    const onMouseDown = (e: MouseEvent) => {
      orbit.isDragging = true;
      orbit.prevX = e.clientX;
      orbit.prevY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!orbit.isDragging) return;
      const dx = e.clientX - orbit.prevX;
      const dy = e.clientY - orbit.prevY;
      orbit.prevX = e.clientX;
      orbit.prevY = e.clientY;

      orbit.theta -= dx * 0.008;
      orbit.phi = Math.max(0.08, Math.min(Math.PI / 2.2, orbit.phi + dy * 0.008));
      updateCameraPos();
    };

    const onMouseUp = () => {
      orbit.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbit.radius = Math.max(3.8, Math.min(9.0, orbit.radius + e.deltaY * 0.005));
      updateCameraPos();
    };

    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Touch support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        orbit.isDragging = true;
        orbit.prevX = e.touches[0].clientX;
        orbit.prevY = e.touches[0].clientY;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (orbit.isDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - orbit.prevX;
        const dy = e.touches[0].clientY - orbit.prevY;
        orbit.prevX = e.touches[0].clientX;
        orbit.prevY = e.touches[0].clientY;
        orbit.theta -= dx * 0.01;
        orbit.phi = Math.max(0.08, Math.min(Math.PI / 2.2, orbit.phi + dy * 0.01));
        updateCameraPos();
      }
    };
    const onTouchEnd = () => {
      orbit.isDragging = false;
    };

    dom.addEventListener('touchstart', onTouchStart);
    dom.addEventListener('touchmove', onTouchMove);
    dom.addEventListener('touchend', onTouchEnd);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (autoRotate && !orbit.isDragging) {
        orbit.theta += 0.0035;
        updateCameraPos();
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [webGlAvailable]);

  // Sync vehicle whenever car ID changes
  useEffect(() => {
    rebuildVehicleMesh();
  }, [car.id, rebuildVehicleMesh]);

  // Real-time customization updates
  const handleUpdate = (updates: Partial<VehicleCustomizationConfig>) => {
    const updated = { ...customization, ...updates };
    setCustomization(updated);
    if (vehicleGroupRef.current) {
      VehicleFactory.updateVehicleCustomization(vehicleGroupRef.current, updated);
    }
  };

  // Nitro Preview Toggle
  const toggleNitro = () => {
    const nextState = !nitroPreview;
    setNitroPreview(nextState);
    if (vehicleGroupRef.current) {
      VehicleFactory.setVehicleNitro(vehicleGroupRef.current, nextState, 1.2);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setNotification(null);
    try {
      await onSaveCustomization(car.id, customization);
      setNotification('Customization saved successfully!');
      setTimeout(() => setNotification(null), 3500);
    } catch (e: any) {
      setNotification(`Failed to save: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = async () => {
    setEquipping(true);
    setNotification(null);
    try {
      await onSelectCar(car.id);
      setNotification(`${car.name} equipped as active vehicle!`);
      setTimeout(() => setNotification(null), 3500);
    } catch (e: any) {
      setNotification(`Failed to equip: ${e.message}`);
    } finally {
      setEquipping(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      {/* 3D Viewport Column */}
      <div className="relative flex-1 rounded-2xl border border-white/10 bg-surface/90 overflow-hidden shadow-2xl flex flex-col">
        {/* Top Status Overlay */}
        <div className="absolute top-4 left-4 z-10 flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
            <span className="text-xs font-mono font-bold tracking-wider text-accent uppercase">
              {webGlAvailable ? 'Three.js 3D WebGL Showroom' : '2D Canvas Fallback'}
            </span>
          </div>

          {isSelected && (
            <div className="flex items-center space-x-1.5 bg-success/20 border border-success/40 px-3 py-1.5 rounded-full text-xs font-semibold text-success">
              <Check className="w-3.5 h-3.5" />
              <span>EQUIPPED</span>
            </div>
          )}
        </div>

        {/* Camera Control Badges */}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-lg backdrop-blur-md border text-xs font-medium transition flex items-center space-x-1.5 ${
              autoRotate
                ? 'bg-primary/20 border-primary/40 text-primary'
                : 'bg-surface/80 border-white/10 text-text-muted hover:text-white'
            }`}
            title="Toggle Turntable Spin"
          >
            <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span>Spin</span>
          </button>

          <button
            onClick={toggleNitro}
            className={`p-2 rounded-lg backdrop-blur-md border text-xs font-medium transition flex items-center space-x-1.5 ${
              nitroPreview
                ? 'bg-accent/20 border-accent/40 text-accent ring-2 ring-accent/30'
                : 'bg-surface/80 border-white/10 text-text-muted hover:text-white'
            }`}
            title="Preview Nitro Thrusters"
          >
            <Flame className="w-4 h-4" />
            <span>Nitro</span>
          </button>
        </div>

        {/* 3D Canvas Mount or 2D Fallback */}
        {webGlAvailable ? (
          <div
            ref={mountRef}
            className="w-full h-[460px] cursor-grab active:cursor-grabbing select-none"
          />
        ) : (
          <div className="w-full h-[460px] flex flex-col items-center justify-center p-8 bg-surface-dark text-center">
            <div className="p-4 rounded-full bg-accent/10 border border-accent/20 text-accent mb-4">
              <ShieldCheck className="w-12 h-12" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">WebGL Acceleration Unavailable</h3>
            <p className="text-sm text-text-muted max-w-md mb-4">
              Your browser or graphics environment does not support WebGL. Displaying procedural vehicle preview in
              standard 2D mode. All gameplay mechanics and scoring remain fully functional.
            </p>
            <div
              className="w-48 h-24 rounded-xl border border-white/10 flex items-center justify-center font-display font-black text-xl"
              style={{ backgroundColor: customization.paintColor }}
            >
              {car.name}
            </div>
          </div>
        )}

        {/* Bottom Car Details & Esports Guarantee */}
        <div className="border-t border-white/10 p-5 bg-background/60 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-text-muted">
                {car.category}
              </span>
              <h2 className="text-xl font-display font-black text-white">{car.name}</h2>
            </div>
            <p className="text-xs text-text-muted mt-1 max-w-md">{car.description}</p>
          </div>

          <div className="flex items-center space-x-3">
            {isUnlocked ? (
              <>
                <button
                  onClick={handleSelect}
                  disabled={isSelected || equipping}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-lg ${
                    isSelected
                      ? 'bg-white/10 text-text-dim cursor-not-allowed border border-white/5'
                      : 'bg-gradient-to-r from-primary to-accent text-white hover:opacity-95 shadow-primary/20'
                  }`}
                >
                  {isSelected ? 'Equipped' : equipping ? 'Equipping...' : 'Equip Vehicle'}
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl bg-surface border border-white/15 text-white font-bold text-xs uppercase tracking-wider hover:border-accent hover:text-accent transition shadow-lg"
                >
                  {saving ? 'Saving...' : 'Save Style'}
                </button>
              </>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-warning text-xs font-bold uppercase tracking-wider">
                Unlocks at Level {car.unlockLevel}
              </div>
            )}
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-surface-light border border-accent/40 text-accent text-xs font-semibold shadow-xl backdrop-blur-md animate-fade-in flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      {/* Customization Control Panel Column */}
      <div className="w-full lg:w-96 rounded-2xl border border-white/10 bg-surface/90 p-5 shadow-2xl flex flex-col space-y-5">
        <div>
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-accent" />
            <span>Workshop Customizer</span>
          </h3>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-surface-dark border border-white/5 text-xs font-medium">
            <button
              onClick={() => setActiveTab('paint')}
              className={`py-2 rounded-lg transition ${
                activeTab === 'paint' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-white'
              }`}
            >
              Paint
            </button>
            <button
              onClick={() => setActiveTab('spoiler')}
              className={`py-2 rounded-lg transition ${
                activeTab === 'spoiler' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-white'
              }`}
            >
              Aero
            </button>
            <button
              onClick={() => setActiveTab('rims')}
              className={`py-2 rounded-lg transition ${
                activeTab === 'rims' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-white'
              }`}
            >
              Rims
            </button>
            <button
              onClick={() => setActiveTab('neon')}
              className={`py-2 rounded-lg transition ${
                activeTab === 'neon' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-white'
              }`}
            >
              Underglow
            </button>
          </div>
        </div>

        {/* Tab Content: Paint & Finish */}
        {activeTab === 'paint' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
                Body Finish
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FINISH_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleUpdate({ finish: f.id })}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium text-left transition ${
                      customization.finish === f.id
                        ? 'border-accent bg-accent/15 text-accent shadow-sm'
                        : 'border-white/5 bg-surface-dark text-text-muted hover:border-white/20'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
                Chassis Paint Color
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => handleUpdate({ paintColor: c.hex })}
                    className={`p-2 rounded-xl border flex items-center space-x-2 transition ${
                      customization.paintColor?.toLowerCase() === c.hex.toLowerCase()
                        ? 'border-accent ring-2 ring-accent/30 bg-white/5'
                        : 'border-white/5 bg-surface-dark hover:border-white/20'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-white/20 shadow-inner"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-[11px] font-medium text-text-muted truncate">{c.name}</span>
                  </button>
                ))}
              </div>

              {/* Custom Hex Input */}
              <div className="mt-3 flex items-center space-x-2">
                <input
                  type="color"
                  value={customization.paintColor || '#3B82F6'}
                  onChange={(e) => handleUpdate({ paintColor: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={customization.paintColor || '#3B82F6'}
                  onChange={(e) => handleUpdate({ paintColor: e.target.value })}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-surface-dark border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-accent"
                  placeholder="#Hex"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Aero & Spoilers */}
        {activeTab === 'spoiler' && (
          <div className="space-y-4 animate-fade-in">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block">
              Rear Aero Stabilizer
            </label>
            <div className="space-y-2">
              {SPOILER_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleUpdate({ spoiler: s.id })}
                  className={`w-full py-2.5 px-4 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
                    customization.spoiler === s.id
                      ? 'border-accent bg-accent/15 text-accent shadow-sm'
                      : 'border-white/5 bg-surface-dark text-text-muted hover:border-white/20'
                  }`}
                >
                  <span>{s.name}</span>
                  {customization.spoiler === s.id && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Rims */}
        {activeTab === 'rims' && (
          <div className="space-y-4 animate-fade-in">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block">
              Alloy Wheel Finish
            </label>
            <div className="space-y-2">
              {RIM_COLORS.map((r) => (
                <button
                  key={r.hex}
                  onClick={() => handleUpdate({ rimColor: r.hex })}
                  className={`w-full py-2.5 px-4 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
                    customization.rimColor === r.hex
                      ? 'border-accent bg-accent/15 text-accent shadow-sm'
                      : 'border-white/5 bg-surface-dark text-text-muted hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: r.hex }} />
                    <span>{r.name}</span>
                  </div>
                  {customization.rimColor === r.hex && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Underglow & Nitro */}
        {activeTab === 'neon' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-dark border border-white/5">
              <div>
                <span className="text-xs font-bold text-white block">Chassis Underglow Neon</span>
                <span className="text-[11px] text-text-muted">Illuminates the road beneath the vehicle</span>
              </div>
              <button
                onClick={() => handleUpdate({ underglow: !customization.underglow })}
                className={`w-12 h-6 rounded-full transition p-1 flex items-center ${
                  customization.underglow ? 'bg-accent justify-end' : 'bg-white/10 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>

            {customization.underglow && (
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
                  Neon Glow Color
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => handleUpdate({ underglowColor: c.hex })}
                      className={`p-2 rounded-xl border flex items-center space-x-2 transition ${
                        customization.underglowColor === c.hex
                          ? 'border-accent ring-2 ring-accent/30 bg-white/5'
                          : 'border-white/5 bg-surface-dark hover:border-white/20'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.hex }} />
                      <span className="text-[11px] font-medium text-text-muted truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Esports Competitive Guarantee Badge */}
        <div className="mt-auto p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-text-muted flex items-start space-x-2">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong className="text-white">Fair-Play Guaranteed:</strong> All vehicles share identical server-authoritative speed curves and physics normalization. Customizations are 100% cosmetic.
          </p>
        </div>
      </div>
    </div>
  );
}

