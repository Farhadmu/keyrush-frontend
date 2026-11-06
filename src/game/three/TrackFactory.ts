import * as THREE from 'three';

export type TrackTheme = 'neon_city' | 'cyber_highway' | 'desert_dunes' | 'mountain_peak';

export interface TrackConfig {
  theme?: TrackTheme;
  trackLength?: number; // total units along Z
  numLanes?: number; // 4 to 10 lanes
  numRacers?: number; // 1 to 100 racers
}

export class TrackFactory {
  // Calibrated lane width: 2.8m allows cars (width 1.65m) to have over 1.15m of side room
  static readonly LANE_WIDTH = 2.8;

  static getLaneX(laneIndex: number, numLanes: number = 10): number {
    const totalWidth = numLanes * this.LANE_WIDTH;
    const startX = -totalWidth / 2 + this.LANE_WIDTH / 2;
    return startX + laneIndex * this.LANE_WIDTH;
  }

  static getZFromProgress(progressPercent: number, trackLength: number = 250): number {
    const clamped = Math.max(0, Math.min(100, progressPercent));
    return (clamped / 100) * trackLength;
  }

  /**
   * Calculates grid coordinates for 1 to 100 cars:
   * - Exactly 10 cars per row (Row 0: 0..9, Row 1: 10..19, ..., Row 9: 90..99).
   * - Sequential registration / seed ordering.
   * - Each row is staggered 4.5m behind the previous row.
   * - All cars are strictly kept within the side barriers with zero clipping.
   */
  static getGridPosition(
    index: number,
    numRacers: number,
    trackLength: number = 250,
    progressPercent: number = 0,
  ): { x: number; z: number; laneIndex: number; rowIndex: number } {
    const numLanes = Math.min(10, Math.max(4, numRacers <= 10 ? numRacers : 10));
    const laneIndex = index % numLanes;
    const rowIndex = Math.floor(index / numLanes);
    const laneX = this.getLaneX(laneIndex, numLanes);

    // Row 0 starts at -2.0m, each subsequent row staggered 4.5m behind
    const startZ = -2.0 - rowIndex * 4.5;
    const totalDistance = trackLength - startZ;
    const clampedProgress = Math.max(0, Math.min(100, progressPercent)) / 100;
    const currentZ = startZ + clampedProgress * totalDistance;

    return { x: laneX, z: currentZ, laneIndex, rowIndex };
  }

  static createRoadTexture(): THREE.CanvasTexture | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Deep dark asphalt base
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, 512, 512);

    // Fine asphalt texture grain & grit
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const c = Math.floor(25 + Math.random() * 30);
      ctx.fillStyle = `rgb(${c},${c + 4},${c + 12})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    // High-contrast alternating rumble kerbs on edges
    for (let y = 0; y < 512; y += 32) {
      // Left rumble kerb
      ctx.fillStyle = (y / 32) % 2 === 0 ? '#00F0FF' : '#0F172A';
      ctx.fillRect(0, y, 22, 28);
      // Right rumble kerb
      ctx.fillStyle = (y / 32) % 2 === 0 ? '#8B5CF6' : '#0F172A';
      ctx.fillRect(490, y, 22, 28);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 16;
    return texture;
  }

  // --- High-Resolution Finish Signboard Canvas Texture ---
  static createFinishSignTexture(): THREE.CanvasTexture | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // High-tech dark gradient background with cyber cyan/green border
    const grad = ctx.createLinearGradient(0, 0, 1024, 0);
    grad.addColorStop(0, '#022c22');
    grad.addColorStop(0.5, '#052e16');
    grad.addColorStop(1, '#022c22');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 256);

    // Top & Bottom Racing Checkered Bands
    const sqSize = 16;
    for (let x = 0; x < 1024; x += sqSize) {
      for (let y = 0; y < 32; y += sqSize) {
        ctx.fillStyle = ((x / sqSize) + (y / sqSize)) % 2 === 0 ? '#ffffff' : '#000000';
        ctx.fillRect(x, y, sqSize, sqSize);
        ctx.fillRect(x, 256 - 32 + y, sqSize, sqSize);
      }
    }

    // Neon Glowing Borders
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 32, 1016, 192);

    // Text: FINISH LINE
    ctx.font = '900 68px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('🏁  FINISH LINE  🏁', 512, 100);

    // Subtitle: KEYRUSH GLOBAL ESPORTS
    ctx.font = '800 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('★ KEYRUSH GLOBAL ESPORTS ★', 512, 172);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 16;
    return tex;
  }

  // --- Checkered Finish Line Ground Decal Texture ---
  static createCheckeredFinishTexture(): THREE.CanvasTexture | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const cols = 16;
    const rows = 8;
    const cellW = 512 / cols;
    const cellH = 256 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#0a0f1d';
        ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 16;
    return tex;
  }

  // --- Distance Signboard Canvas Texture (150m, 100m, 50m, 25m) ---
  static createDistanceSignTexture(text: string, subtitle?: string): THREE.CanvasTexture | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 160);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 506, 154);

    ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 256, 65);

    if (subtitle) {
      ctx.font = '800 20px monospace';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(subtitle, 256, 120);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 16;
    return tex;
  }

  static createTrack(config: TrackConfig = {}): THREE.Group {
    const root = new THREE.Group();
    root.name = 'track_environment';

    const theme = config.theme || 'neon_city';
    const length = config.trackLength || 250;
    const numRacers = config.numRacers || 100;

    // 10 cars per row rule: numLanes is between 4 and 10
    const numLanes = Math.min(10, Math.max(4, numRacers <= 10 ? numRacers : 10));
    // Dynamic road width: road expands to perfectly accommodate lanes with 2.0m shoulder on each side
    const roadWidth = numLanes * this.LANE_WIDTH + 4.0;

    // Up to 10 rows for 100 cars (Row 0 to Row 9)
    const totalRows = Math.ceil(numRacers / numLanes);
    const gridBack = Math.max(75, totalRows * 4.5 + 35); // Extended tarmac behind start line
    const totalRoadLength = length + gridBack + 60;
    const roadCenterZ = (length - gridBack + 60) / 2;

    // 0. Massive Cyber Ground Grid Floor (Underneath & Expanding Outwards)
    const gridFloor = new THREE.GridHelper(totalRoadLength * 1.5, 80, 0x00f0ff, 0x1e1b4b);
    gridFloor.position.set(0, -0.06, roadCenterZ);
    root.add(gridFloor);

    // Dark side ground terrain
    [-roadWidth / 2 - 70, roadWidth / 2 + 70].forEach((sideX) => {
      const terrainGeom = new THREE.PlaneGeometry(140, totalRoadLength);
      terrainGeom.rotateX(-Math.PI / 2);
      const terrainMat = new THREE.MeshStandardMaterial({
        color: 0x060913,
        roughness: 0.95,
        metalness: 0.1,
      });
      const terrain = new THREE.Mesh(terrainGeom, terrainMat);
      terrain.position.set(sideX, -0.04, roadCenterZ);
      root.add(terrain);
    });

    // 1. Asphalt Road Surface (Dynamically sized to roadWidth)
    const roadGeom = new THREE.PlaneGeometry(roadWidth, totalRoadLength, 1, 32);
    roadGeom.rotateX(-Math.PI / 2);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f1d,
      roughness: 0.85,
      metalness: 0.15,
    });

    const roadTexture = this.createRoadTexture();
    if (roadTexture) {
      roadTexture.repeat.set(1, totalRoadLength / 6);
      roadMat.map = roadTexture;
      root.userData.roadTexture = roadTexture;
    }

    const road = new THREE.Mesh(roadGeom, roadMat);
    road.position.set(0, 0, roadCenterZ);
    root.add(road);

    // 2. White Edge Shoulders
    [-roadWidth / 2 + 0.2, roadWidth / 2 - 0.2].forEach((x) => {
      const edgeGeom = new THREE.PlaneGeometry(0.2, totalRoadLength);
      edgeGeom.rotateX(-Math.PI / 2);
      const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const edge = new THREE.Mesh(edgeGeom, edgeMat);
      edge.position.set(x, 0.01, roadCenterZ);
      root.add(edge);
    });

    // 3. Dashed Lane Dividers for all lanes
    for (let lane = 1; lane < numLanes; lane++) {
      const x = -roadWidth / 2 + 2.0 + lane * this.LANE_WIDTH;
      const startD = -Math.floor(gridBack / 5);
      const endD = Math.floor((length + 50) / 5);
      for (let d = startD; d < endD; d++) {
        const dashGeom = new THREE.PlaneGeometry(0.14, 2.6);
        dashGeom.rotateX(-Math.PI / 2);
        const dashMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
        const dash = new THREE.Mesh(dashGeom, dashMat);
        dash.position.set(x, 0.01, d * 5);
        root.add(dash);
      }
    }

    // 4. Starting Grid Markings (Boxes on tarmac for all rows up to 100 cars)
    for (let row = 0; row < totalRows; row++) {
      const rowZ = -2.0 - row * 4.5;
      for (let lane = 0; lane < numLanes; lane++) {
        const slot = row * numLanes + lane + 1;
        if (slot > numRacers) break;

        const laneX = this.getLaneX(lane, numLanes);
        // Grid Box Outline
        const boxGeom = new THREE.PlaneGeometry(2.0, 3.6);
        boxGeom.rotateX(-Math.PI / 2);
        const boxMat = new THREE.MeshBasicMaterial({
          color: slot <= 10 ? 0x00f0ff : 0x38bdf8,
          wireframe: true,
          transparent: true,
          opacity: 0.75,
        });
        const box = new THREE.Mesh(boxGeom, boxMat);
        box.position.set(laneX, 0.015, rowZ);
        root.add(box);

        // Front start mark for each slot
        const markGeom = new THREE.PlaneGeometry(2.0, 0.18);
        markGeom.rotateX(-Math.PI / 2);
        const markMat = new THREE.MeshBasicMaterial({ color: slot <= 10 ? 0x00f0ff : 0x38bdf8 });
        const mark = new THREE.Mesh(markGeom, markMat);
        mark.position.set(laneX, 0.018, rowZ + 1.8);
        root.add(mark);
      }
    }

    // 5. Guardrails & Curbs with Neon LED Strips (Containment boundaries)
    const curbHeight = 0.42;
    [-roadWidth / 2 - 0.25, roadWidth / 2 + 0.25].forEach((xPos, idx) => {
      // Solid Barrier Wall
      const wallGeom = new THREE.BoxGeometry(0.5, curbHeight, totalRoadLength);
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.5,
        metalness: 0.7,
      });
      const wall = new THREE.Mesh(wallGeom, wallMat);
      wall.position.set(xPos, curbHeight / 2, roadCenterZ);
      root.add(wall);

      // Neon LED strip on top of guardrail
      const stripColor = idx === 0 ? 0x00f0ff : 0x8b5cf6;
      const stripGeom = new THREE.BoxGeometry(0.09, 0.09, totalRoadLength);
      const stripMat = new THREE.MeshBasicMaterial({ color: stripColor });
      const strip = new THREE.Mesh(stripGeom, stripMat);
      strip.position.set(xPos + (idx === 0 ? 0.22 : -0.22), curbHeight, roadCenterZ);
      root.add(strip);
    });

    // 6. Start Line & Starting Lights Gantry (Dynamically spans roadWidth)
    this.buildStartGantry(root, roadWidth);

    // 7. Finish Line & High-Impact Esports Arch (Dynamically spans roadWidth)
    this.buildFinishArch(root, roadWidth, length);

    // 8. Roadside Neon Light Pillars (every 12 meters along the entire track)
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.8 });
    const cyanLightMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const purpleLightMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6 });

    const pillarStartZ = -gridBack - 10;
    const pillarEndZ = length + 40;

    for (let pz = pillarStartZ; pz < pillarEndZ; pz += 12) {
      [-roadWidth / 2 - 1.4, roadWidth / 2 + 1.4].forEach((xPos, idx) => {
        const postGeom = new THREE.CylinderGeometry(0.12, 0.16, 3.8, 8);
        const post = new THREE.Mesh(postGeom, pillarMat);
        post.position.set(xPos, 1.9, pz);
        root.add(post);

        const capGeom = new THREE.SphereGeometry(0.24, 10, 10);
        const cap = new THREE.Mesh(capGeom, idx === 0 ? cyanLightMat : purpleLightMat);
        cap.position.set(xPos, 3.8, pz);
        root.add(cap);
      });
    }

    // 9. Overhead Distance Gantries along the Track (Approaching the Finish Line)
    const milestones = [
      { dist: 150, text: '🏁 150M TO FINISH', sub: 'MAINTAIN SPEED' },
      { dist: 100, text: '🏁 100M TO FINISH', sub: 'MAXIMUM ACCEL' },
      { dist: 50, text: '⚡ 50M TO FINISH', sub: 'FINAL SPRINT' },
      { dist: 25, text: '🔥 25M FINAL STRETCH', sub: 'ALL NITRO' },
    ];

    milestones.forEach((m) => {
      const signZ = length - m.dist;
      if (signZ > 20) {
        this.buildDistanceGantry(root, roadWidth, signZ, m.text, m.sub);
      }
    });

    // 10. Scenery Environment Props based on theme
    switch (theme) {
      case 'cyber_highway':
        this.buildCyberHighwayEnvironment(root, length, roadWidth, gridBack);
        break;
      case 'desert_dunes':
        this.buildDesertEnvironment(root, length, roadWidth, gridBack);
        break;
      case 'mountain_peak':
        this.buildMountainEnvironment(root, length, roadWidth, gridBack);
        break;
      case 'neon_city':
      default:
        this.buildNeonCityEnvironment(root, length, roadWidth, gridBack);
        break;
    }

    return root;
  }

  // --- Distance Gantry Builder ---
  private static buildDistanceGantry(
    root: THREE.Group,
    roadWidth: number,
    zPos: number,
    text: string,
    subText?: string,
  ) {
    const gantry = new THREE.Group();
    gantry.position.set(0, 0, zPos);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 });

    // Side pillars
    [-roadWidth / 2 - 1.4, roadWidth / 2 + 1.4].forEach((x) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 5.4, 10), metalMat);
      pillar.position.set(x, 2.7, 0);
      gantry.add(pillar);
    });

    // Overhead truss beam
    const truss = new THREE.Mesh(new THREE.BoxGeometry(roadWidth + 3.2, 0.45, 0.45), metalMat);
    truss.position.set(0, 5.2, 0);
    gantry.add(truss);

    // Distance Signboard Canvas Mesh
    const signTex = this.createDistanceSignTexture(text, subText);
    if (signTex) {
      const signGeom = new THREE.PlaneGeometry(Math.min(roadWidth * 0.75, 16), 2.4);
      const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
      const signMesh = new THREE.Mesh(signGeom, signMat);
      signMesh.position.set(0, 5.2, -0.24);
      gantry.add(signMesh);
    }

    root.add(gantry);
  }

  // --- Start Gantry Builder ---
  private static buildStartGantry(root: THREE.Group, roadWidth: number) {
    const gantry = new THREE.Group();
    gantry.position.set(0, 0, 0);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.8 });

    // Side pillars
    [-roadWidth / 2 - 1.4, roadWidth / 2 + 1.4].forEach((x) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 5.2, 12), metalMat);
      pillar.position.set(x, 2.6, 0);
      gantry.add(pillar);
    });

    // Overhead truss beam
    const beam = new THREE.Mesh(new THREE.BoxGeometry(roadWidth + 3.2, 0.5, 0.5), metalMat);
    beam.position.set(0, 5.0, 0);
    gantry.add(beam);

    // Starting Countdown Lights (Red, Amber, Green)
    const startLights: THREE.Mesh[] = [];
    [-1.8, 0, 1.8].forEach((xOffset, idx) => {
      const lightBox = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.48, 0.28), metalMat);
      lightBox.position.set(xOffset, 4.4, 0);
      gantry.add(lightBox);

      const colors = [0xef4444, 0xf59e0b, 0x22c55e];
      const lensMat = new THREE.MeshBasicMaterial({ color: colors[idx] });
      const lens = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 14), lensMat);
      lens.position.set(xOffset, 4.4, 0.14);
      gantry.add(lens);
      startLights.push(lens);
    });

    root.userData.startLights = startLights;

    // Start Line on asphalt
    const lineGeom = new THREE.PlaneGeometry(roadWidth, 0.85);
    lineGeom.rotateX(-Math.PI / 2);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const line = new THREE.Mesh(lineGeom, lineMat);
    line.position.set(0, 0.02, 0);
    gantry.add(line);

    root.add(gantry);
  }

  // --- High-Impact Esports Finish Line & Arch Builder ---
  private static buildFinishArch(root: THREE.Group, roadWidth: number, length: number) {
    const arch = new THREE.Group();
    arch.position.set(0, 0, length);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.9 });
    const towerH = 7.5;

    // 1. Dual Heavy Grand Truss Towers
    [-roadWidth / 2 - 1.8, roadWidth / 2 + 1.8].forEach((x, idx) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, towerH, 16), metalMat);
      pillar.position.set(x, towerH / 2, 0);
      arch.add(pillar);

      // Tower cross-braces
      const braceGeom = new THREE.BoxGeometry(0.14, 0.14, 1.6);
      const brace = new THREE.Mesh(braceGeom, metalMat);
      brace.position.set(x, towerH * 0.75, 0);
      arch.add(brace);

      // Flashing Tower Beacon
      const beaconGeom = new THREE.SphereGeometry(0.4, 12, 12);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0x22c55e : 0x00f0ff,
      });
      const beacon = new THREE.Mesh(beaconGeom, beaconMat);
      beacon.position.set(x, towerH + 0.3, 0);
      arch.add(beacon);

      // Sky-Piercing Victory Laser Beams (Visible from afar across the track)
      const laserGeom = new THREE.CylinderGeometry(0.4, 1.0, 75, 16);
      const laserMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0x22c55e : 0x00f0ff,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const laser = new THREE.Mesh(laserGeom, laserMat);
      laser.position.set(x, 37.5, 0);
      arch.add(laser);
    });

    // 2. Overhead Truss Bridge (Dynamically spans roadWidth)
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(roadWidth + 4.5, 1.2, 0.9), metalMat);
    bridge.position.set(0, 5.8, 0);
    arch.add(bridge);

    // 3. Huge Glowing "FINISH LINE" Canvas Signboard (Facing oncoming racers)
    const finishTex = this.createFinishSignTexture();
    if (finishTex) {
      const boardWidth = Math.min(roadWidth * 0.88, 18);
      const boardGeom = new THREE.PlaneGeometry(boardWidth, 2.8);
      const boardMat = new THREE.MeshBasicMaterial({
        map: finishTex,
        side: THREE.DoubleSide,
      });

      // Front-facing sign
      const boardFront = new THREE.Mesh(boardGeom, boardMat);
      boardFront.position.set(0, 5.8, -0.48);
      arch.add(boardFront);

      // Back-facing sign (for after crossing)
      const boardBack = new THREE.Mesh(boardGeom, boardMat);
      boardBack.position.set(0, 5.8, 0.48);
      boardBack.rotateY(Math.PI);
      arch.add(boardBack);
    }

    // 4. Genuine Black & White Racing Checkered Ground Decal
    const checkeredTex = this.createCheckeredFinishTexture();
    const checkeredGeom = new THREE.PlaneGeometry(roadWidth, 4.5);
    checkeredGeom.rotateX(-Math.PI / 2);
    const checkeredMat = new THREE.MeshBasicMaterial({
      map: checkeredTex || undefined,
      color: checkeredTex ? 0xffffff : 0x22c55e,
    });
    const checkered = new THREE.Mesh(checkeredGeom, checkeredMat);
    checkered.position.set(0, 0.025, 0);
    arch.add(checkered);

    // 5. High-intensity Victory Floodlights shining down onto finish line
    const victoryLight1 = new THREE.PointLight(0x22c55e, 6, 28);
    victoryLight1.position.set(-roadWidth / 4, 5.2, 0);
    const victoryLight2 = new THREE.PointLight(0x00f0ff, 6, 28);
    victoryLight2.position.set(roadWidth / 4, 5.2, 0);
    arch.add(victoryLight1, victoryLight2);

    root.add(arch);
  }

  // --- Neon City Environment ---
  private static buildNeonCityEnvironment(
    root: THREE.Group,
    length: number,
    roadWidth: number,
    gridBack: number = 75,
  ) {
    const buildingColors = [0x0f172a, 0x1e1b4b, 0x022c22, 0x18181b, 0x111827];
    const neonAccents = [0x00f0ff, 0x8b5cf6, 0xec4899, 0xf59e0b, 0x10b981];

    const offset = roadWidth / 2 + 5;
    const startZ = -gridBack - 10;
    const endZ = length + 50;

    for (let z = startZ; z < endZ; z += 18) {
      // Left skyscraper
      const hL = 16 + Math.random() * 26;
      const wL = 6 + Math.random() * 4;
      const bGeomL = new THREE.BoxGeometry(wL, hL, 14);
      const bMatL = new THREE.MeshStandardMaterial({
        color: buildingColors[Math.abs(Math.floor(z / 18)) % buildingColors.length],
        roughness: 0.3,
        metalness: 0.7,
      });
      const buildingL = new THREE.Mesh(bGeomL, bMatL);
      buildingL.position.set(-offset - wL / 2, hL / 2, z);
      root.add(buildingL);

      // Neon window grid on building
      const winGeom = new THREE.PlaneGeometry(0.4, hL * 0.8);
      const winMat = new THREE.MeshBasicMaterial({
        color: neonAccents[Math.abs(Math.floor(z / 18)) % neonAccents.length],
      });
      const win = new THREE.Mesh(winGeom, winMat);
      win.position.set(-offset + 0.1, hL / 2, z);
      win.rotateY(Math.PI / 2);
      root.add(win);

      // Right skyscraper
      const hR = 18 + Math.random() * 24;
      const wR = 7 + Math.random() * 3;
      const buildingR = new THREE.Mesh(new THREE.BoxGeometry(wR, hR, 14), bMatL);
      buildingR.position.set(offset + wR / 2, hR / 2, z);
      root.add(buildingR);

      // Street Lamps along road
      const lampPillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 4.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 }),
      );
      lampPillar.position.set(-roadWidth / 2 - 0.9, 2.1, z);
      root.add(lampPillar);

      const lampHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff }),
      );
      lampHead.position.set(-roadWidth / 2 - 0.5, 4.2, z);
      root.add(lampHead);
    }
  }

  // --- Cyber Highway Environment ---
  private static buildCyberHighwayEnvironment(
    root: THREE.Group,
    length: number,
    roadWidth: number,
    gridBack: number = 75,
  ) {
    const gridHelper = new THREE.GridHelper(length * 1.5, 40, 0x8b5cf6, 0x1e1b4b);
    gridHelper.position.set(0, -6, length / 2);
    root.add(gridHelper);

    const startZ = -gridBack;
    const endZ = length + 30;
    for (let z = startZ; z < endZ; z += 25) {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1.2, 6.0, 12),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6, metalness: 0.4 }),
      );
      pillar.position.set(0, -3.0, z);
      root.add(pillar);
    }
  }

  // --- Desert Dunes Environment ---
  private static buildDesertEnvironment(
    root: THREE.Group,
    length: number,
    roadWidth: number,
    gridBack: number = 75,
  ) {
    const sandMat = new THREE.MeshStandardMaterial({ color: 0x1a120b, roughness: 0.95 });
    const startZ = -gridBack;
    const endZ = length + 30;
    for (let z = startZ; z < endZ; z += 30) {
      [-roadWidth / 2 - 12, roadWidth / 2 + 12].forEach((xPos) => {
        const duneGeom = new THREE.SphereGeometry(14, 12, 8);
        duneGeom.scale(1.2, 0.4, 1.5);
        const dune = new THREE.Mesh(duneGeom, sandMat);
        dune.position.set(xPos, 0, z);
        root.add(dune);
      });
    }
  }

  // --- Mountain Peak Environment ---
  private static buildMountainEnvironment(
    root: THREE.Group,
    length: number,
    roadWidth: number,
    gridBack: number = 75,
  ) {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });

    const startZ = -gridBack;
    const endZ = length + 30;
    for (let z = startZ; z < endZ; z += 35) {
      const h = 20 + Math.random() * 15;
      const coneGeom = new THREE.ConeGeometry(15, h, 6);
      const mountain = new THREE.Mesh(coneGeom, rockMat);
      mountain.position.set(-roadWidth / 2 - 16, h / 2 - 2, z);
      root.add(mountain);

      // Snow cap
      const snowGeom = new THREE.ConeGeometry(5, 6, 6);
      const cap = new THREE.Mesh(snowGeom, snowMat);
      cap.position.set(-roadWidth / 2 - 16, h - 3, z);
      root.add(cap);
    }
  }
}
