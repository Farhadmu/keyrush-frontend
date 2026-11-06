import * as THREE from 'three';

export interface VehicleCustomizationConfig {
  paintColor?: string;
  finish?: 'gloss' | 'matte' | 'metallic' | 'chrome' | 'iridescent';
  rimStyle?: 'standard' | 'aeroblade' | 'cybermesh' | 'carbon_deep';
  rimColor?: string;
  spoiler?: 'none' | 'sport' | 'gt_wing' | 'cyber_spoiler';
  underglow?: boolean;
  underglowColor?: string;
  nitroFlameColor?: string;
}

export interface VehicleUserData {
  carId: string;
  wheels: THREE.Mesh[];
  frontWheels: THREE.Mesh[];
  bodyMaterials: THREE.MeshStandardMaterial[];
  rimMaterials: THREE.MeshStandardMaterial[];
  spoilerGroup: THREE.Group;
  underglowLight: THREE.PointLight;
  underglowPlane: THREE.Mesh;
  nitroFlames: THREE.Mesh[];
  headlights: THREE.Mesh[];
  taillights: THREE.Mesh[];
  chassis?: THREE.Group;
  indicatorGroup?: THREE.Group;
  groundAura?: THREE.Mesh;
  chevronMesh?: THREE.Mesh;
  billboardSprite?: THREE.Sprite;
  isCurrentPlayer?: boolean;
}

export class VehicleFactory {
  /**
   * Builds and returns a fully customized 3D vehicle group for the specified carId.
   */
  static createVehicle(
    carId: string = 'car_cyber_phantom',
    config: VehicleCustomizationConfig = {},
  ): THREE.Group {
    const root = new THREE.Group();
    root.name = `vehicle_${carId}`;

    const bodyMaterials: THREE.MeshStandardMaterial[] = [];
    const rimMaterials: THREE.MeshStandardMaterial[] = [];
    const wheels: THREE.Mesh[] = [];
    const frontWheels: THREE.Mesh[] = [];
    const nitroFlames: THREE.Mesh[] = [];
    const headlights: THREE.Mesh[] = [];
    const taillights: THREE.Mesh[] = [];

    // 1. Determine finish parameters
    const finishParams = this.getFinishParams(config.finish || 'metallic');
    const paintColor = new THREE.Color(config.paintColor || this.getDefaultCarColor(carId));

    const mainBodyMat = new THREE.MeshStandardMaterial({
      color: paintColor,
      roughness: finishParams.roughness,
      metalness: finishParams.metalness,
    });
    bodyMaterials.push(mainBodyMat);

    const secondaryMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1E293B'),
      roughness: 0.4,
      metalness: 0.6,
    });

    const carbonMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0F172A'),
      roughness: 0.3,
      metalness: 0.7,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#020617'),
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85,
    });

    // 2. Build Car Specific Chassis
    const chassis = new THREE.Group();
    chassis.name = 'chassis';

    switch (carId) {
      case 'car_neon_viper':
        this.buildNeonViperChassis(chassis, mainBodyMat, secondaryMat, carbonMat, glassMat);
        break;
      case 'car_solaris_drift':
        this.buildSolarisDriftChassis(chassis, mainBodyMat, secondaryMat, carbonMat, glassMat);
        break;
      case 'car_crimson_fury':
        this.buildCrimsonFuryChassis(chassis, mainBodyMat, secondaryMat, carbonMat, glassMat);
        break;
      case 'car_titan_apex':
        this.buildTitanApexChassis(chassis, mainBodyMat, secondaryMat, carbonMat, glassMat);
        break;
      case 'car_apex_valkyrie':
        this.buildApexValkyrieChassis(chassis, mainBodyMat, secondaryMat, carbonMat, glassMat);
        break;
      case 'car_vortex_gt':
        this.buildVortexGtChassis(chassis, mainBodyMat, secondaryMat, carbonMat, glassMat);
        break;
      case 'car_cyber_phantom':
      default:
        this.buildCyberPhantomChassis(chassis, mainBodyMat, secondaryMat, carbonMat, glassMat);
        break;
    }
    root.add(chassis);

    // 3. Headlights & Taillights
    const headMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });

    // Front headlights
    const hlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.15), headMat);
    hlLeft.position.set(-0.65, 0.42, 1.85);
    const hlRight = hlLeft.clone();
    hlRight.position.x = 0.65;
    root.add(hlLeft, hlRight);
    headlights.push(hlLeft, hlRight);

    // Rear taillights
    const tlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.12), tailMat);
    tlLeft.position.set(-0.65, 0.48, -1.85);
    const tlRight = tlLeft.clone();
    tlRight.position.x = 0.65;
    root.add(tlLeft, tlRight);
    taillights.push(tlLeft, tlRight);

    // 4. Wheels & Rims
    const rimColor = new THREE.Color(config.rimColor || '#E2E8F0');
    const rimMat = new THREE.MeshStandardMaterial({
      color: rimColor,
      roughness: 0.2,
      metalness: 0.85,
    });
    rimMaterials.push(rimMat);

    const wheelPositions = [
      { x: -0.9, y: 0.32, z: 1.25, isFront: true },  // Front Left
      { x: 0.9, y: 0.32, z: 1.25, isFront: true },   // Front Right
      { x: -0.9, y: 0.35, z: -1.25, isFront: false }, // Rear Left
      { x: 0.9, y: 0.35, z: -1.25, isFront: false },  // Rear Right
    ];

    wheelPositions.forEach((pos, idx) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(pos.x, pos.y, pos.z);

      // Rubber Tire
      const tireRadius = pos.isFront ? 0.32 : 0.35;
      const tireGeom = new THREE.CylinderGeometry(tireRadius, tireRadius, 0.28, 24);
      tireGeom.rotateZ(Math.PI / 2);
      const tireMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.9,
        metalness: 0.1,
      });
      const tireMesh = new THREE.Mesh(tireGeom, tireMat);
      wheelGroup.add(tireMesh);

      // Rim
      const rimGeom = new THREE.CylinderGeometry(tireRadius * 0.65, tireRadius * 0.65, 0.3, 16);
      rimGeom.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeom, rimMat);
      wheelGroup.add(rimMesh);

      // Wheel spoke details
      const spokeGeom = new THREE.BoxGeometry(0.32, tireRadius * 1.1, 0.05);
      spokeGeom.rotateZ(Math.PI / 2);
      const spoke = new THREE.Mesh(spokeGeom, rimMat);
      wheelGroup.add(spoke);

      root.add(wheelGroup);
      wheels.push(wheelGroup as unknown as THREE.Mesh);
      if (pos.isFront) frontWheels.push(wheelGroup as unknown as THREE.Mesh);
    });

    // 5. Spoilers
    const spoilerGroup = new THREE.Group();
    spoilerGroup.name = 'spoiler_group';
    this.buildSpoiler(spoilerGroup, config.spoiler || 'gt_wing', carbonMat, mainBodyMat);
    root.add(spoilerGroup);

    // 6. Underglow Neon
    const underglowColor = new THREE.Color(config.underglowColor || '#00F0FF');
    const underglowLight = new THREE.PointLight(underglowColor, config.underglow ? 3.5 : 0, 4);
    underglowLight.position.set(0, 0.1, 0);
    root.add(underglowLight);

    const underglowPlaneGeom = new THREE.PlaneGeometry(1.6, 3.2);
    underglowPlaneGeom.rotateX(-Math.PI / 2);
    const underglowPlaneMat = new THREE.MeshBasicMaterial({
      color: underglowColor,
      transparent: true,
      opacity: config.underglow ? 0.45 : 0,
      blending: THREE.AdditiveBlending,
    });
    const underglowPlane = new THREE.Mesh(underglowPlaneGeom, underglowPlaneMat);
    underglowPlane.position.set(0, 0.04, 0);
    root.add(underglowPlane);

    // 7. Nitro Thrusters & Exhaust Flames
    const nitroColor = new THREE.Color(config.nitroFlameColor || '#00F0FF');
    const flameMat = new THREE.MeshBasicMaterial({
      color: nitroColor,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });

    [-0.3, 0.3].forEach((xPos) => {
      const exhaustPipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.09, 0.25, 12),
        carbonMat,
      );
      exhaustPipe.rotateX(Math.PI / 2);
      exhaustPipe.position.set(xPos, 0.36, -1.9);
      root.add(exhaustPipe);

      const flameGeom = new THREE.ConeGeometry(0.12, 0.7, 12);
      flameGeom.rotateX(-Math.PI / 2);
      const flame = new THREE.Mesh(flameGeom, flameMat);
      flame.position.set(xPos, 0.36, -2.3);
      flame.scale.set(0.001, 0.001, 0.001);
      root.add(flame);
      nitroFlames.push(flame);
    });

    // Store references in root userData for dynamic updates
    const userData: VehicleUserData = {
      carId,
      wheels,
      frontWheels,
      bodyMaterials,
      rimMaterials,
      spoilerGroup,
      underglowLight,
      underglowPlane,
      nitroFlames,
      headlights,
      taillights,
      chassis,
    };
    root.userData = userData;

    return root;
  }

  // --- Chassis Builders for the 7 Vehicle Classes ---

  private static buildCyberPhantomChassis(
    group: THREE.Group,
    mainMat: THREE.Material,
    secMat: THREE.Material,
    carbMat: THREE.Material,
    glassMat: THREE.Material,
  ) {
    // Main fuselage
    const bodyGeom = new THREE.BoxGeometry(1.6, 0.38, 3.8);
    const body = new THREE.Mesh(bodyGeom, mainMat);
    body.position.set(0, 0.38, 0);
    group.add(body);

    // Tapered nose
    const noseGeom = new THREE.ConeGeometry(0.78, 1.1, 4);
    noseGeom.rotateX(Math.PI / 2);
    noseGeom.rotateY(Math.PI / 4);
    const nose = new THREE.Mesh(noseGeom, mainMat);
    nose.position.set(0, 0.34, 1.95);
    group.add(nose);

    // Aerodynamic cockpit cabin
    const cabinGeom = new THREE.BoxGeometry(1.15, 0.36, 1.8);
    const cabin = new THREE.Mesh(cabinGeom, glassMat);
    cabin.position.set(0, 0.68, -0.15);
    group.add(cabin);

    // Side splitters
    const splitterL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 2.6), carbMat);
    splitterL.position.set(-0.85, 0.18, 0);
    const splitterR = splitterL.clone();
    splitterR.position.x = 0.85;
    group.add(splitterL, splitterR);
  }

  private static buildNeonViperChassis(
    group: THREE.Group,
    mainMat: THREE.Material,
    secMat: THREE.Material,
    carbMat: THREE.Material,
    glassMat: THREE.Material,
  ) {
    // Aggressive supercar body
    const bodyGeom = new THREE.BoxGeometry(1.65, 0.35, 3.9);
    const body = new THREE.Mesh(bodyGeom, mainMat);
    body.position.set(0, 0.36, 0);
    group.add(body);

    // Deep front aero splitter
    const splitterGeom = new THREE.BoxGeometry(1.7, 0.06, 0.5);
    const splitter = new THREE.Mesh(splitterGeom, carbMat);
    splitter.position.set(0, 0.16, 2.0);
    group.add(splitter);

    // Low bubble cockpit
    const cabinGeom = new THREE.SphereGeometry(0.72, 16, 12);
    cabinGeom.scale(1.2, 0.5, 1.8);
    const cabin = new THREE.Mesh(cabinGeom, glassMat);
    cabin.position.set(0, 0.58, -0.1);
    group.add(cabin);

    // Twin side intakes
    const intakeL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.8), carbMat);
    intakeL.position.set(-0.82, 0.38, -0.4);
    const intakeR = intakeL.clone();
    intakeR.position.x = 0.82;
    group.add(intakeL, intakeR);
  }

  private static buildSolarisDriftChassis(
    group: THREE.Group,
    mainMat: THREE.Material,
    secMat: THREE.Material,
    carbMat: THREE.Material,
    glassMat: THREE.Material,
  ) {
    // Widebody drift stance
    const bodyGeom = new THREE.BoxGeometry(1.7, 0.42, 3.7);
    const body = new THREE.Mesh(bodyGeom, mainMat);
    body.position.set(0, 0.4, 0);
    group.add(body);

    // Flared wheel arches
    const archGeom = new THREE.BoxGeometry(0.14, 0.34, 0.9);
    const archFL = new THREE.Mesh(archGeom, secMat);
    archFL.position.set(-0.88, 0.4, 1.25);
    const archFR = archFL.clone();
    archFR.position.x = 0.88;
    const archRL = archFL.clone();
    archRL.position.z = -1.25;
    const archRR = archFR.clone();
    archRR.position.z = -1.25;
    group.add(archFL, archFR, archRL, archRR);

    // Coupe cabin
    const cabinGeom = new THREE.BoxGeometry(1.2, 0.4, 1.7);
    const cabin = new THREE.Mesh(cabinGeom, glassMat);
    cabin.position.set(0, 0.72, -0.2);
    group.add(cabin);
  }

  private static buildCrimsonFuryChassis(
    group: THREE.Group,
    mainMat: THREE.Material,
    secMat: THREE.Material,
    carbMat: THREE.Material,
    glassMat: THREE.Material,
  ) {
    // GT Racing track beast
    const bodyGeom = new THREE.BoxGeometry(1.68, 0.36, 4.0);
    const body = new THREE.Mesh(bodyGeom, mainMat);
    body.position.set(0, 0.36, 0);
    group.add(body);

    // Dual front dive planes / canards
    const canardGeom = new THREE.BoxGeometry(0.3, 0.04, 0.2);
    const canardL = new THREE.Mesh(canardGeom, carbMat);
    canardL.position.set(-0.85, 0.32, 1.8);
    canardL.rotateZ(-0.2);
    const canardR = canardL.clone();
    canardR.position.x = 0.85;
    canardR.rotateZ(0.4);
    group.add(canardL, canardR);

    // Roof air scoop
    const scoopGeom = new THREE.BoxGeometry(0.3, 0.15, 0.6);
    const scoop = new THREE.Mesh(scoopGeom, carbMat);
    scoop.position.set(0, 0.85, -0.3);
    group.add(scoop);

    // Low GT cabin
    const cabinGeom = new THREE.BoxGeometry(1.15, 0.36, 1.85);
    const cabin = new THREE.Mesh(cabinGeom, glassMat);
    cabin.position.set(0, 0.65, -0.15);
    group.add(cabin);
  }

  private static buildTitanApexChassis(
    group: THREE.Group,
    mainMat: THREE.Material,
    secMat: THREE.Material,
    carbMat: THREE.Material,
    glassMat: THREE.Material,
  ) {
    // Electric prototype - smooth seamless aero body
    const bodyGeom = new THREE.CylinderGeometry(0.8, 0.84, 3.8, 16);
    bodyGeom.rotateX(Math.PI / 2);
    bodyGeom.scale(1.0, 0.45, 1.0);
    const body = new THREE.Mesh(bodyGeom, mainMat);
    body.position.set(0, 0.38, 0);
    group.add(body);

    // Front horizontal cyber light strip
    const lightStrip = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.06, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4 }),
    );
    lightStrip.position.set(0, 0.36, 1.9);
    group.add(lightStrip);

    // Streamlined teardrop canopy
    const canopyGeom = new THREE.SphereGeometry(0.68, 16, 12);
    canopyGeom.scale(1.1, 0.48, 2.0);
    const canopy = new THREE.Mesh(canopyGeom, glassMat);
    canopy.position.set(0, 0.62, -0.1);
    group.add(canopy);
  }

  private static buildApexValkyrieChassis(
    group: THREE.Group,
    mainMat: THREE.Material,
    secMat: THREE.Material,
    carbMat: THREE.Material,
    glassMat: THREE.Material,
  ) {
    // Le Mans futuristic prototype with central fin
    const bodyGeom = new THREE.BoxGeometry(1.65, 0.32, 4.1);
    const body = new THREE.Mesh(bodyGeom, mainMat);
    body.position.set(0, 0.35, 0);
    group.add(body);

    // Central Shark Fin
    const finGeom = new THREE.BoxGeometry(0.06, 0.45, 1.6);
    const fin = new THREE.Mesh(finGeom, carbMat);
    fin.position.set(0, 0.72, -0.8);
    group.add(fin);

    // Cockpit bubble
    const cockpitGeom = new THREE.SphereGeometry(0.65, 16, 12);
    cockpitGeom.scale(1.0, 0.55, 1.6);
    const cockpit = new THREE.Mesh(cockpitGeom, glassMat);
    cockpit.position.set(0, 0.6, 0.1);
    group.add(cockpit);
  }

  private static buildVortexGtChassis(
    group: THREE.Group,
    mainMat: THREE.Material,
    secMat: THREE.Material,
    carbMat: THREE.Material,
    glassMat: THREE.Material,
  ) {
    // Esports Special Edition - High downforce & competition accents
    const bodyGeom = new THREE.BoxGeometry(1.68, 0.38, 3.95);
    const body = new THREE.Mesh(bodyGeom, mainMat);
    body.position.set(0, 0.38, 0);
    group.add(body);

    // Dual racing stripe down center
    const stripeGeom = new THREE.BoxGeometry(0.25, 0.02, 3.96);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.8,
    });
    const stripe = new THREE.Mesh(stripeGeom, stripeMat);
    stripe.position.set(0, 0.58, 0);
    group.add(stripe);

    // Sleek cockpit
    const cabinGeom = new THREE.BoxGeometry(1.18, 0.36, 1.8);
    const cabin = new THREE.Mesh(cabinGeom, glassMat);
    cabin.position.set(0, 0.68, -0.15);
    group.add(cabin);
  }

  // --- Spoiler Builder ---

  private static buildSpoiler(
    group: THREE.Group,
    spoilerType: string,
    carbMat: THREE.Material,
    bodyMat: THREE.Material,
  ) {
    // Clear existing
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    if (spoilerType === 'none') return;

    if (spoilerType === 'sport') {
      const lipGeom = new THREE.BoxGeometry(1.4, 0.08, 0.25);
      const lip = new THREE.Mesh(lipGeom, carbMat);
      lip.position.set(0, 0.65, -1.8);
      lip.rotateX(0.2);
      group.add(lip);
    } else if (spoilerType === 'gt_wing') {
      // Struts
      const strutGeom = new THREE.BoxGeometry(0.06, 0.38, 0.1);
      const strutL = new THREE.Mesh(strutGeom, carbMat);
      strutL.position.set(-0.45, 0.72, -1.75);
      const strutR = strutL.clone();
      strutR.position.x = 0.45;
      group.add(strutL, strutR);

      // Wing Plane
      const wingGeom = new THREE.BoxGeometry(1.6, 0.05, 0.35);
      const wing = new THREE.Mesh(wingGeom, carbMat);
      wing.position.set(0, 0.92, -1.75);
      wing.rotateX(0.12);
      group.add(wing);

      // Endplates
      const epGeom = new THREE.BoxGeometry(0.04, 0.2, 0.38);
      const epL = new THREE.Mesh(epGeom, carbMat);
      epL.position.set(-0.8, 0.92, -1.75);
      const epR = epL.clone();
      epR.position.x = 0.8;
      group.add(epL, epR);
    } else if (spoilerType === 'cyber_spoiler') {
      // Split futuristic cyber wing
      const wingGeom = new THREE.BoxGeometry(0.7, 0.06, 0.3);
      const wingL = new THREE.Mesh(wingGeom, carbMat);
      wingL.position.set(-0.5, 0.85, -1.78);
      wingL.rotateZ(-0.15);
      const wingR = new THREE.Mesh(wingGeom, carbMat);
      wingR.position.set(0.5, 0.85, -1.78);
      wingR.rotateZ(0.15);
      group.add(wingL, wingR);
    }
  }

  // --- Helpers & Dynamic Update Methods ---

  static updateVehicleCustomization(group: THREE.Group, config: VehicleCustomizationConfig) {
    const userData = group.userData as VehicleUserData;
    if (!userData) return;

    // 1. Paint Color & Finish
    if (config.paintColor || config.finish) {
      const finishParams = this.getFinishParams(config.finish || 'metallic');
      userData.bodyMaterials.forEach((mat) => {
        if (config.paintColor) mat.color.set(config.paintColor);
        mat.roughness = finishParams.roughness;
        mat.metalness = finishParams.metalness;
        mat.needsUpdate = true;
      });
    }

    // 2. Rim Color
    if (config.rimColor) {
      userData.rimMaterials.forEach((mat) => {
        mat.color.set(config.rimColor!);
        mat.needsUpdate = true;
      });
    }

    // 3. Spoiler
    if (config.spoiler) {
      const carbMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.3,
        metalness: 0.7,
      });
      this.buildSpoiler(userData.spoilerGroup, config.spoiler, carbMat, userData.bodyMaterials[0]);
    }

    // 4. Underglow
    if (config.underglow !== undefined || config.underglowColor) {
      const active = config.underglow ?? false;
      const color = new THREE.Color(config.underglowColor || '#00F0FF');
      userData.underglowLight.color = color;
      userData.underglowLight.intensity = active ? 3.5 : 0;
      (userData.underglowPlane.material as THREE.MeshBasicMaterial).color = color;
      (userData.underglowPlane.material as THREE.MeshBasicMaterial).opacity = active ? 0.45 : 0;
    }

    // 5. Nitro Flame Color
    if (config.nitroFlameColor) {
      const nColor = new THREE.Color(config.nitroFlameColor);
      userData.nitroFlames.forEach((flame) => {
        (flame.material as THREE.MeshBasicMaterial).color = nColor;
      });
    }
  }

  static setVehicleNitro(group: THREE.Group, active: boolean, flameScale: number = 1.0) {
    const userData = group.userData as VehicleUserData;
    if (!userData || !userData.nitroFlames) return;

    userData.nitroFlames.forEach((flame) => {
      const mat = flame.material as THREE.MeshBasicMaterial;
      mat.opacity = active ? 0.85 : 0;
      const s = active ? flameScale : 0.001;
      flame.scale.set(s, s, s * 1.5);
    });
  }

  static rotateWheels(group: THREE.Group, distanceDelta: number) {
    const userData = group.userData as VehicleUserData;
    if (!userData || !userData.wheels) return;
    const rotationAngle = distanceDelta * 1.8;
    userData.wheels.forEach((wheel) => {
      wheel.rotation.x += rotationAngle;
    });
  }

  static setSteeringAngle(group: THREE.Group, angleRad: number) {
    const userData = group.userData as VehicleUserData;
    if (!userData || !userData.frontWheels) return;
    userData.frontWheels.forEach((wheel) => {
      wheel.rotation.y = angleRad;
    });
  }

  static createBillboardTexture(
    text: string,
    isCurrentPlayer: boolean,
    rankText: string = '',
  ): THREE.Texture {
    if (typeof document === 'undefined') {
      return new THREE.Texture();
    }
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.clearRect(0, 0, 256, 128);

    if (isCurrentPlayer) {
      // High-visibility cyan neon YOU pill
      ctx.fillStyle = 'rgba(8, 13, 25, 0.9)';
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 4;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(16, 20, 224, 76, 16);
      } else {
        ctx.rect(16, 20, 224, 76);
      }
      ctx.fill();
      ctx.stroke();

      // Outer glow for "YOU"
      ctx.shadowColor = '#00F0FF';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#00F0FF';
      ctx.font = 'bold 26px monospace, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('▼ YOU ▼', 128, 44);

      // Username subtext
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(text.slice(0, 14), 128, 74);
    } else {
      // Subtle opponent tag
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(32, 36, 192, 54, 12);
      } else {
        ctx.rect(32, 36, 192, 54);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 18px monospace, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = rankText ? `${rankText} ${text.slice(0, 10)}` : text.slice(0, 12);
      ctx.fillText(label, 128, 63);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  static attachPlayerIdentity(
    root: THREE.Group,
    isCurrentPlayer: boolean,
    username: string,
    rankPosition: number = 1,
  ) {
    const ud = root.userData as VehicleUserData;
    if (!ud) return;

    // Remove existing indicator if present
    if (ud.indicatorGroup) {
      root.remove(ud.indicatorGroup);
      ud.indicatorGroup = undefined;
    }
    if (ud.groundAura) {
      root.remove(ud.groundAura);
      ud.groundAura = undefined;
    }

    ud.isCurrentPlayer = isCurrentPlayer;

    // 1. Emissive Car Body Accent for Player
    if (ud.bodyMaterials && ud.bodyMaterials.length > 0) {
      ud.bodyMaterials.forEach((mat) => {
        if (isCurrentPlayer) {
          mat.emissive = new THREE.Color(0x00d8ff);
          mat.emissiveIntensity = 0.35;
        } else {
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0;
        }
      });
    }

    // 2. Ground Aura (for Current Player ONLY)
    if (isCurrentPlayer) {
      const auraGeom = new THREE.RingGeometry(1.15, 1.45, 32);
      auraGeom.rotateX(-Math.PI / 2);
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const groundAura = new THREE.Mesh(auraGeom, auraMat);
      groundAura.position.set(0, 0.03, 0);
      root.add(groundAura);
      ud.groundAura = groundAura;
    }

    // 3. Overhead Floating Tag & Chevron Indicator
    const indicatorGroup = new THREE.Group();
    indicatorGroup.name = 'player_indicator';

    if (isCurrentPlayer) {
      // Downward-pointing glowing chevron arrow
      const chevronGeom = new THREE.ConeGeometry(0.22, 0.45, 4);
      chevronGeom.rotateX(Math.PI); // Point downwards
      const chevronMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.9,
      });
      const chevron = new THREE.Mesh(chevronGeom, chevronMat);
      chevron.position.set(0, 1.6, 0);
      indicatorGroup.add(chevron);
      ud.chevronMesh = chevron;
    }

    // Overhead Billboard Sprite
    const texture = this.createBillboardTexture(
      username,
      isCurrentPlayer,
      rankPosition ? `#${rankPosition}` : '',
    );
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(0, isCurrentPlayer ? 2.3 : 1.7, 0);
    sprite.scale.set(isCurrentPlayer ? 2.4 : 1.8, isCurrentPlayer ? 1.2 : 0.9, 1);
    indicatorGroup.add(sprite);
    ud.billboardSprite = sprite;

    root.add(indicatorGroup);
    ud.indicatorGroup = indicatorGroup;
  }

  static updatePlayerIdentity(root: THREE.Group, time: number) {
    const ud = root.userData as VehicleUserData;
    if (!ud) return;

    if (ud.isCurrentPlayer) {
      // Bob chevron up and down
      if (ud.chevronMesh) {
        ud.chevronMesh.position.y = 1.6 + Math.sin(time * 6) * 0.1;
        ud.chevronMesh.rotation.y = time * 2.5;
      }
      // Pulse ground aura
      if (ud.groundAura) {
        const pulse = 1.0 + Math.sin(time * 5) * 0.08;
        ud.groundAura.scale.set(pulse, 1, pulse);
        (ud.groundAura.material as THREE.MeshBasicMaterial).opacity = 0.65 + Math.sin(time * 5) * 0.2;
      }
    }
  }

  static updateVehicleDynamics(
    group: THREE.Group,
    speedKmh: number,
    acceleration: number,
    delta: number,
    time: number,
  ) {
    const ud = group.userData as VehicleUserData;
    if (!ud) return;

    // 1. Continuous wheel rotation strictly proportional to actual km/h
    if (ud.wheels && ud.wheels.length > 0) {
      const rotSpeed = (speedKmh / 3.6 / 0.35) * delta;
      ud.wheels.forEach((w) => {
        w.rotation.x += rotSpeed;
      });
    }

    // 2. Chassis Pitch & Engine Vibration
    if (ud.chassis) {
      const targetPitch = THREE.MathUtils.clamp(acceleration * 0.003, -0.05, 0.05);
      ud.chassis.rotation.x = THREE.MathUtils.lerp(ud.chassis.rotation.x, targetPitch, 0.15);

      const rumbleFreq = 20 + speedKmh * 0.5;
      const rumbleAmp = speedKmh > 5 ? 0.004 : 0.001;
      ud.chassis.position.y = Math.sin(time * rumbleFreq) * rumbleAmp;
    }
  }

  private static getFinishParams(finish: string) {
    switch (finish) {
      case 'gloss':
        return { roughness: 0.15, metalness: 0.2 };
      case 'matte':
        return { roughness: 0.85, metalness: 0.05 };
      case 'chrome':
        return { roughness: 0.04, metalness: 0.98 };
      case 'iridescent':
        return { roughness: 0.25, metalness: 0.65 };
      case 'metallic':
      default:
        return { roughness: 0.28, metalness: 0.85 };
    }
  }

  private static getDefaultCarColor(carId: string): string {
    const map: Record<string, string> = {
      car_cyber_phantom: '#3B82F6',
      car_neon_viper: '#8B5CF6',
      car_solaris_drift: '#F59E0B',
      car_crimson_fury: '#DC2626',
      car_titan_apex: '#0EA5E9',
      car_apex_valkyrie: '#059669',
      car_vortex_gt: '#DB2777',
    };
    return map[carId] || '#3B82F6';
  }
}

