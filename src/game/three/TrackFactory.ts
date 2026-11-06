import * as THREE from 'three';

export type TrackTheme = 'neon_city' | 'cyber_highway' | 'desert_dunes' | 'mountain_peak';

export interface TrackConfig {
  theme?: TrackTheme;
  trackLength?: number; // total units along Z
  numLanes?: number; // 2 to 7 lanes
}

export class TrackFactory {
  static readonly LANE_WIDTH = 2.4;

  static getLaneX(laneIndex: number, numLanes: number = 7): number {
    const totalWidth = numLanes * this.LANE_WIDTH;
    const startX = -totalWidth / 2 + this.LANE_WIDTH / 2;
    return startX + laneIndex * this.LANE_WIDTH;
  }

  static getZFromProgress(progressPercent: number, trackLength: number = 250): number {
    const clamped = Math.max(0, Math.min(100, progressPercent));
    return (clamped / 100) * trackLength;
  }

  static getGridPosition(
    index: number,
    numRacers: number,
    trackLength: number = 250,
    progressPercent: number = 0,
  ): { x: number; z: number; laneIndex: number; rowIndex: number } {
    const numLanes = numRacers <= 4 ? 4 : numRacers <= 12 ? 6 : numRacers <= 40 ? 8 : 10;
    const laneIndex = index % numLanes;
    const rowIndex = Math.floor(index / numLanes);
    const laneX = this.getLaneX(laneIndex, numLanes);

    // Each row is staggered 4.5 meters behind the start line
    const startZ = -rowIndex * 4.5;
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
    return texture;
  }

  static updateTrackMotion(trackGroup: THREE.Group, travelDistance: number) {
    if (!trackGroup || !trackGroup.userData) return;
    const roadTexture = trackGroup.userData.roadTexture as THREE.CanvasTexture;
    if (roadTexture) {
      // Scroll texture backward with travel distance
      roadTexture.offset.y = -(travelDistance / 6) % 1.0;
    }
  }

  static createTrack(config: TrackConfig = {}): THREE.Group {
    const root = new THREE.Group();
    root.name = 'track_environment';

    const theme = config.theme || 'neon_city';
    const length = config.trackLength || 250;
    const numLanes = Math.max(3, Math.min(10, config.numLanes || 6));
    const roadWidth = numLanes * this.LANE_WIDTH + 1.2;

    const gridBack = 65; // Extended tarmac behind start line for multi-row grids
    const totalRoadLength = length + gridBack + 40;
    const roadCenterZ = (length - gridBack + 40) / 2;

    // 1. Asphalt Road Surface with Dynamic Scrolling Texture
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
    [-roadWidth / 2 + 0.15, roadWidth / 2 - 0.15].forEach((x) => {
      const edgeGeom = new THREE.PlaneGeometry(0.18, totalRoadLength);
      edgeGeom.rotateX(-Math.PI / 2);
      const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const edge = new THREE.Mesh(edgeGeom, edgeMat);
      edge.position.set(x, 0.01, roadCenterZ);
      root.add(edge);
    });

    // 3. Dashed Lane Dividers
    for (let lane = 1; lane < numLanes; lane++) {
      const x = -roadWidth / 2 + 0.6 + lane * this.LANE_WIDTH;
      const startD = -Math.floor(gridBack / 6);
      const endD = Math.floor((length + 30) / 6);
      for (let d = startD; d < endD; d++) {
        const dashGeom = new THREE.PlaneGeometry(0.12, 2.5);
        dashGeom.rotateX(-Math.PI / 2);
        const dashMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
        const dash = new THREE.Mesh(dashGeom, dashMat);
        dash.position.set(x, 0.01, d * 6);
        root.add(dash);
      }
    }

    // 4. Starting Grid Markings (Boxes on the tarmac behind the start line)
    const maxGridRows = 12;
    for (let row = 0; row < maxGridRows; row++) {
      const rowZ = -row * 4.5;
      for (let lane = 0; lane < numLanes; lane++) {
        const laneX = this.getLaneX(lane, numLanes);
        // Grid Box Outline
        const boxGeom = new THREE.PlaneGeometry(1.6, 3.2);
        boxGeom.rotateX(-Math.PI / 2);
        const boxMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          wireframe: true,
          transparent: true,
          opacity: 0.6,
        });
        const box = new THREE.Mesh(boxGeom, boxMat);
        box.position.set(laneX, 0.015, rowZ);
        root.add(box);
      }
    }

    // 5. Guardrails & Curbs
    const curbHeight = 0.35;
    [-roadWidth / 2 - 0.25, roadWidth / 2 + 0.25].forEach((xPos, idx) => {
      // Barrier Wall
      const wallGeom = new THREE.BoxGeometry(0.4, curbHeight, totalRoadLength);
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
      const stripGeom = new THREE.BoxGeometry(0.08, 0.08, totalRoadLength);
      const stripMat = new THREE.MeshBasicMaterial({ color: stripColor });
      const strip = new THREE.Mesh(stripGeom, stripMat);
      strip.position.set(xPos + (idx === 0 ? 0.2 : -0.2), curbHeight, roadCenterZ);
      root.add(strip);
    });

    // 6. Start Line & Starting Lights Gantry
    this.buildStartGantry(root, roadWidth);

    // 7. Finish Line & Arch
    this.buildFinishArch(root, roadWidth, length);

    // 8. Roadside Neon Light Pillars (every 16 meters along the track)
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.8 });
    const cyanLightMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const purpleLightMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6 });

    const pillarStartZ = -gridBack;
    const pillarEndZ = length + 20;

    for (let pz = pillarStartZ; pz < pillarEndZ; pz += 16) {
      [-roadWidth / 2 - 1.2, roadWidth / 2 + 1.2].forEach((xPos, idx) => {
        const postGeom = new THREE.CylinderGeometry(0.12, 0.15, 3.8, 8);
        const post = new THREE.Mesh(postGeom, pillarMat);
        post.position.set(xPos, 1.9, pz);
        root.add(post);

        const capGeom = new THREE.SphereGeometry(0.2, 10, 10);
        const cap = new THREE.Mesh(capGeom, idx === 0 ? cyanLightMat : purpleLightMat);
        cap.position.set(xPos, 3.8, pz);
        root.add(cap);
      });
    }

    // 9. Overhead Holographic Speed Arches (every 50 meters along the track)
    for (let archZ = 50; archZ < length - 25; archZ += 50) {
      const archGroup = new THREE.Group();
      archGroup.position.set(0, 0, archZ);

      // Overhead beam
      const truss = new THREE.Mesh(
        new THREE.BoxGeometry(roadWidth + 3.0, 0.4, 0.4),
        pillarMat,
      );
      truss.position.set(0, 4.6, 0);
      archGroup.add(truss);

      // Support pillars
      [-roadWidth / 2 - 1.2, roadWidth / 2 + 1.2].forEach((xPos) => {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 4.6, 10), pillarMat);
        p.position.set(xPos, 2.3, 0);
        archGroup.add(p);
      });

      // Holographic glowing chevron band
      const chevronBand = new THREE.Mesh(
        new THREE.BoxGeometry(roadWidth * 0.7, 0.25, 0.08),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 }),
      );
      chevronBand.position.set(0, 4.4, 0.2);
      archGroup.add(chevronBand);

      root.add(archGroup);
    }

    // 10. Scenery Environment Props based on theme
    switch (theme) {
      case 'cyber_highway':
        this.buildCyberHighwayEnvironment(root, length, roadWidth);
        break;
      case 'desert_dunes':
        this.buildDesertEnvironment(root, length, roadWidth);
        break;
      case 'mountain_peak':
        this.buildMountainEnvironment(root, length, roadWidth);
        break;
      case 'neon_city':
      default:
        this.buildNeonCityEnvironment(root, length, roadWidth);
        break;
    }

    return root;
  }

  // --- Start Gantry Builder ---
  private static buildStartGantry(root: THREE.Group, roadWidth: number) {
    const gantry = new THREE.Group();
    gantry.position.set(0, 0, 0);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.8 });

    // Side pillars
    [-roadWidth / 2 - 1.0, roadWidth / 2 + 1.0].forEach((x) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 4.5, 12), metalMat);
      pillar.position.set(x, 2.25, 0);
      gantry.add(pillar);
    });

    // Overhead truss beam
    const beam = new THREE.Mesh(new THREE.BoxGeometry(roadWidth + 2.5, 0.4, 0.4), metalMat);
    beam.position.set(0, 4.3, 0);
    gantry.add(beam);

    // Starting Countdown Lights (Red, Amber, Green)
    [-1.2, 0, 1.2].forEach((xOffset, idx) => {
      const lightBox = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.2), metalMat);
      lightBox.position.set(xOffset, 3.8, 0);
      gantry.add(lightBox);

      const colors = [0xef4444, 0xf59e0b, 0x22c55e];
      const lens = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 12),
        new THREE.MeshBasicMaterial({ color: colors[idx] }),
      );
      lens.position.set(xOffset, 3.8, 0.1);
      gantry.add(lens);
    });

    // Start Line on asphalt
    const lineGeom = new THREE.PlaneGeometry(roadWidth, 0.6);
    lineGeom.rotateX(-Math.PI / 2);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const line = new THREE.Mesh(lineGeom, lineMat);
    line.position.set(0, 0.02, 0);
    gantry.add(line);

    root.add(gantry);
  }

  // --- Finish Arch Builder ---
  private static buildFinishArch(root: THREE.Group, roadWidth: number, length: number) {
    const arch = new THREE.Group();
    arch.position.set(0, 0, length);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.9 });

    // Side pillars
    [-roadWidth / 2 - 1.2, roadWidth / 2 + 1.2].forEach((x) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 5.2, 16), metalMat);
      pillar.position.set(x, 2.6, 0);
      arch.add(pillar);
    });

    // Overhead Bridge Arch
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(roadWidth + 3.0, 0.8, 0.6), metalMat);
    bridge.position.set(0, 5.0, 0);
    arch.add(bridge);

    // Glowing "FINISH" Board
    const boardMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const board = new THREE.Mesh(new THREE.BoxGeometry(roadWidth * 0.7, 0.5, 0.1), boardMat);
    board.position.set(0, 5.0, -0.35);
    arch.add(board);

    // Finish Checkered Pattern Ground
    const checkeredGeom = new THREE.PlaneGeometry(roadWidth, 1.2, 16, 2);
    checkeredGeom.rotateX(-Math.PI / 2);
    const checkeredMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const checkered = new THREE.Mesh(checkeredGeom, checkeredMat);
    checkered.position.set(0, 0.02, 0);
    arch.add(checkered);

    // Overhead Victory Beacons (Cyan/Green spotlights)
    const victoryLight1 = new THREE.PointLight(0x22c55e, 4, 15);
    victoryLight1.position.set(-roadWidth / 4, 4.5, 0);
    const victoryLight2 = new THREE.PointLight(0x00f0ff, 4, 15);
    victoryLight2.position.set(roadWidth / 4, 4.5, 0);
    arch.add(victoryLight1, victoryLight2);

    root.add(arch);
  }

  // --- Neon City Environment ---
  private static buildNeonCityEnvironment(root: THREE.Group, length: number, roadWidth: number) {
    const buildingColors = [0x0f172a, 0x1e1b4b, 0x022c22, 0x18181b];
    const neonAccents = [0x00f0ff, 0x8b5cf6, 0xec4899, 0xf59e0b];

    const offset = roadWidth / 2 + 5;
    const numBuildings = Math.floor(length / 20);

    for (let i = 0; i < numBuildings; i++) {
      const z = i * 20 + 10;

      // Left skyscraper
      const hL = 15 + Math.random() * 25;
      const wL = 6 + Math.random() * 4;
      const bGeomL = new THREE.BoxGeometry(wL, hL, 12);
      const bMatL = new THREE.MeshStandardMaterial({
        color: buildingColors[i % buildingColors.length],
        roughness: 0.3,
        metalness: 0.7,
      });
      const buildingL = new THREE.Mesh(bGeomL, bMatL);
      buildingL.position.set(-offset - wL / 2, hL / 2, z);
      root.add(buildingL);

      // Neon window grid on building
      const winGeom = new THREE.PlaneGeometry(0.4, hL * 0.8);
      const winMat = new THREE.MeshBasicMaterial({ color: neonAccents[i % neonAccents.length] });
      const win = new THREE.Mesh(winGeom, winMat);
      win.position.set(-offset + 0.1, hL / 2, z);
      win.rotateY(Math.PI / 2);
      root.add(win);

      // Right skyscraper
      const hR = 18 + Math.random() * 22;
      const wR = 7 + Math.random() * 3;
      const buildingR = new THREE.Mesh(new THREE.BoxGeometry(wR, hR, 14), bMatL);
      buildingR.position.set(offset + wR / 2, hR / 2, z);
      root.add(buildingR);

      // Street Lamps along road
      const lampPillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 4.0, 8),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 }),
      );
      lampPillar.position.set(-roadWidth / 2 - 0.8, 2.0, z);
      root.add(lampPillar);

      const lampHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff }),
      );
      lampHead.position.set(-roadWidth / 2 - 0.4, 4.0, z);
      root.add(lampHead);
    }
  }

  // --- Cyber Highway Environment ---
  private static buildCyberHighwayEnvironment(root: THREE.Group, length: number, roadWidth: number) {
    // Floor grid under elevated highway
    const gridHelper = new THREE.GridHelper(length * 1.5, 40, 0x8b5cf6, 0x1e1b4b);
    gridHelper.position.set(0, -6, length / 2);
    root.add(gridHelper);

    // Highway support pillars underneath
    const numPillars = Math.floor(length / 25);
    for (let i = 0; i < numPillars; i++) {
      const z = i * 25 + 12;
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1.2, 6.0, 12),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6, metalness: 0.4 }),
      );
      pillar.position.set(0, -3.0, z);
      root.add(pillar);
    }
  }

  // --- Desert Dunes Environment ---
  private static buildDesertEnvironment(root: THREE.Group, length: number, roadWidth: number) {
    const sandMat = new THREE.MeshStandardMaterial({ color: 0x1a120b, roughness: 0.95 });
    const numDunes = Math.floor(length / 30);

    for (let i = 0; i < numDunes; i++) {
      const z = i * 30 + 15;
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
  private static buildMountainEnvironment(root: THREE.Group, length: number, roadWidth: number) {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });

    const numPeaks = Math.floor(length / 35);
    for (let i = 0; i < numPeaks; i++) {
      const z = i * 35 + 18;
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

