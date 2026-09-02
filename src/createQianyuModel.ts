import * as THREE from 'three';
import { PartMeta, QianyuModelResult, RenderMode } from './types';

export function createQianyuModel(): QianyuModelResult {
  const root = new THREE.Group();
  root.name = 'QianyuCraftRoot';

  const parts: PartMeta[] = [];
  const landingGears: THREE.Group[] = [];

  // 材质
  const bronzeArmorMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    metalness: 0.85,
    roughness: 0.25,
  });

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: '#eab308',
    metalness: 0.9,
    roughness: 0.2,
    emissive: '#713f12',
    emissiveIntensity: 0.3,
  });

  // 核心发光体：超长曝光白炽等离子流光机身主弧刃 (萧山 UFO 照片主体光弧)
  const arcGlowMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#fef08a',
    emissiveIntensity: 6.5,
    roughness: 0.1,
  });

  const plasmaHaloMat = new THREE.MeshBasicMaterial({
    color: '#fbbf24',
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  const blueprintMat = new THREE.MeshBasicMaterial({
    color: '#38bdf8',
    wireframe: true,
    transparent: true,
    opacity: 0.85,
  });

  // 2.1 巨大弧形流光机身主刃 (长达 80 米跨度，与照片中横贯夜空的发光弧完全一致)
  const arcWingGroup = new THREE.Group();
  arcWingGroup.name = 'MainArcLuminousBody';

  const arcPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const angle = (t - 0.5) * Math.PI * 0.92;
    const r = 32.0;
    const x = Math.sin(angle) * r * 1.4;
    const y = -Math.cos(angle) * 4.5 + 4.5;
    const z = (Math.cos(angle) - 1.0) * r * 0.5;
    arcPoints.push(new THREE.Vector3(x, y, z));
  }
  const arcSpline = new THREE.CatmullRomCurve3(arcPoints);

  const arcTubeGeom = new THREE.TubeGeometry(arcSpline, 64, 1.8, 16, false);
  const arcTubeMesh = new THREE.Mesh(arcTubeGeom, arcGlowMat);
  arcTubeMesh.castShadow = true;
  arcWingGroup.add(arcTubeMesh);

  const plasmaTubeGeom = new THREE.TubeGeometry(arcSpline, 64, 4.2, 16, false);
  const plasmaTubeMesh = new THREE.Mesh(plasmaTubeGeom, plasmaHaloMat);
  arcWingGroup.add(plasmaTubeMesh);

  // 2.2 乾元双曲抛物面碟身
  const saucerBodyGroup = new THREE.Group();
  saucerBodyGroup.name = 'SaucerMainBody';

  const upperDiscGeom = new THREE.CylinderGeometry(6.0, 28.0, 4.5, 48, 1, false);
  upperDiscGeom.scale(1.3, 1.0, 0.85);
  const upperDiscMesh = new THREE.Mesh(upperDiscGeom, bronzeArmorMat);
  upperDiscMesh.position.y = 1.2;
  upperDiscMesh.castShadow = true;
  upperDiscMesh.receiveShadow = true;
  saucerBodyGroup.add(upperDiscMesh);

  const lowerDiscGeom = new THREE.CylinderGeometry(28.0, 9.0, 4.0, 48, 1, false);
  lowerDiscGeom.scale(1.3, 1.0, 0.85);
  const lowerDiscMesh = new THREE.Mesh(lowerDiscGeom, bronzeArmorMat);
  lowerDiscMesh.position.y = -2.5;
  lowerDiscMesh.castShadow = true;
  saucerBodyGroup.add(lowerDiscMesh);

  const equatorRingGeom = new THREE.TorusGeometry(27.8, 1.1, 16, 64);
  equatorRingGeom.scale(1.3, 0.6, 0.85);
  const equatorRingMesh = new THREE.Mesh(equatorRingGeom, goldTrimMat);
  equatorRingMesh.rotation.x = Math.PI / 2;
  equatorRingMesh.position.y = -0.5;
  saucerBodyGroup.add(equatorRingMesh);

  // 2.3 24 宿周天点阵脉冲光斑 (照片中那一串标志亮点)
  const rimLightsGroup = new THREE.Group();
  rimLightsGroup.name = 'RimPulseBeacons';
  const beaconMeshes: THREE.Mesh[] = [];
  const beaconCount = 24;

  const beaconSphereGeom = new THREE.SphereGeometry(0.85, 16, 16);
  for (let i = 0; i < beaconCount; i++) {
    const angle = (i / beaconCount) * Math.PI * 2;
    const isGua = i % 3 === 0;
    const mat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: isGua ? '#38bdf8' : '#fbbf24',
      emissiveIntensity: isGua ? 8.5 : 5.5,
      roughness: 0.1,
    });
    const bMesh = new THREE.Mesh(beaconSphereGeom, mat);
    const rx = Math.cos(angle) * 28.0 * 1.3;
    const rz = Math.sin(angle) * 28.0 * 0.85;
    bMesh.position.set(rx, -0.5, rz);
    rimLightsGroup.add(bMesh);
    beaconMeshes.push(bMesh);
  }
  saucerBodyGroup.add(rimLightsGroup);

  // 2.4 乾顶天池与太极定风珠
  const topCrownGroup = new THREE.Group();
  topCrownGroup.name = 'TopCrownAndPearl';

  for (let step = 0; step < 3; step++) {
    const stepGeom = new THREE.CylinderGeometry(3.0 - step * 0.8, 5.0 - step * 0.9, 0.9, 32);
    const stepMesh = new THREE.Mesh(stepGeom, goldTrimMat);
    stepMesh.position.y = 3.6 + step * 0.85;
    topCrownGroup.add(stepMesh);
  }

  const pearlGeom = new THREE.SphereGeometry(1.6, 32, 32);
  const pearlMat = new THREE.MeshStandardMaterial({
    color: '#e0f2fe',
    emissive: '#38bdf8',
    emissiveIntensity: 7.0,
    roughness: 0.05,
  });
  const pearlMesh = new THREE.Mesh(pearlGeom, pearlMat);
  pearlMesh.position.y = 7.0;
  topCrownGroup.add(pearlMesh);

  const crownHaloGeom = new THREE.TorusGeometry(3.6, 0.25, 16, 48);
  const crownHaloMat = new THREE.MeshStandardMaterial({
    color: '#38bdf8',
    emissive: '#0284c7',
    emissiveIntensity: 4.5,
  });
  const crownHaloMesh = new THREE.Mesh(crownHaloGeom, crownHaloMat);
  crownHaloMesh.rotation.x = Math.PI / 3;
  crownHaloMesh.position.y = 7.0;
  topCrownGroup.add(crownHaloMesh);

  // 2.5 底部反重力导流核心
  const bottomCoreGroup = new THREE.Group();
  bottomCoreGroup.name = 'BottomAntigravityEngine';

  const engineConeGeom = new THREE.ConeGeometry(7.0, 4.5, 32, 1, true);
  engineConeGeom.rotateX(Math.PI);
  const engineConeMesh = new THREE.Mesh(engineConeGeom, bronzeArmorMat);
  engineConeMesh.position.y = -4.5;
  bottomCoreGroup.add(engineConeMesh);

  const engineGlowGeom = new THREE.CylinderGeometry(5.0, 0.5, 2.5, 32);
  const engineGlowMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#0284c7',
    emissiveIntensity: 6.0,
  });
  const engineGlowMesh = new THREE.Mesh(engineGlowGeom, engineGlowMat);
  engineGlowMesh.position.y = -5.2;
  bottomCoreGroup.add(engineGlowMesh);

  // 2.6 三足起落架系统
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const gearGroup = new THREE.Group();
    gearGroup.name = LandingGear_;

    const dist = 16.0;
    gearGroup.position.set(Math.cos(angle) * dist, -3.5, Math.sin(angle) * dist);
    gearGroup.rotation.y = -angle;

    const strutGeom = new THREE.CylinderGeometry(0.5, 0.65, 5.5, 16);
    const strutMesh = new THREE.Mesh(strutGeom, goldTrimMat);
    strutMesh.position.y = -2.75;
    gearGroup.add(strutMesh);

    const footGeom = new THREE.CylinderGeometry(2.2, 3.0, 0.8, 6);
    const footMesh = new THREE.Mesh(footGeom, bronzeArmorMat);
    footMesh.position.y = -5.6;
    gearGroup.add(footMesh);

    landingGears.push(gearGroup);
    saucerBodyGroup.add(gearGroup);
  }

  root.add(arcWingGroup);
  root.add(saucerBodyGroup);
  root.add(topCrownGroup);
  root.add(bottomCoreGroup);

  parts.push({
    name: 'MainArcLuminousBody',
    mesh: arcWingGroup,
    originPos: arcWingGroup.position.clone(),
    explodeDir: new THREE.Vector3(0, 0.8, 1.2).normalize(),
  });
  parts.push({
    name: 'TopCrownAndPearl',
    mesh: topCrownGroup,
    originPos: topCrownGroup.position.clone(),
    explodeDir: new THREE.Vector3(0, 1, 0),
  });
  parts.push({
    name: 'SaucerMainBody',
    mesh: saucerBodyGroup,
    originPos: saucerBodyGroup.position.clone(),
    explodeDir: new THREE.Vector3(0, 0, 0),
  });
  parts.push({
    name: 'BottomAntigravityEngine',
    mesh: bottomCoreGroup,
    originPos: bottomCoreGroup.position.clone(),
    explodeDir: new THREE.Vector3(0, -1, 0),
  });

  let currentLandingProgress = 0.0;

  return {
    root,
    parts,
    setRenderMode: (mode: RenderMode) => {
      const isBP = mode === 'blueprint';
      root.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child === arcTubeMesh || child === plasmaTubeMesh || child === pearlMesh) {
            return;
          }
          child.material = isBP ? blueprintMat : child.userData.originMat || child.material;
          if (!child.userData.originMat) {
            child.userData.originMat = child.material;
          }
        }
      });
    },
    setLandingGearProgress: (progress: number) => {
      currentLandingProgress = THREE.MathUtils.clamp(progress, 0, 1);
      landingGears.forEach((gear) => {
        gear.position.y = -3.5 + currentLandingProgress * 5.0;
        gear.scale.setScalar(1.0 - currentLandingProgress * 0.8);
      });
    },
    updateAnimation: (delta: number) => {
      pearlMesh.rotation.y += delta * 1.5;
      crownHaloMesh.rotation.z += delta * 2.2;

      const now = performance.now() * 0.006;
      beaconMeshes.forEach((mesh, idx) => {
        const phase = now + (idx / beaconCount) * Math.PI * 4;
        const wave = (Math.sin(phase) + 1) * 0.5;
        mesh.scale.setScalar(0.7 + wave * 1.6);
        const m = mesh.material as THREE.MeshStandardMaterial;
        m.emissiveIntensity = 2.5 + wave * 6.5;
      });

      arcGlowMat.emissiveIntensity = 5.5 + Math.sin(now * 0.8) * 1.8;
      plasmaHaloMat.opacity = 0.6 + Math.sin(now * 1.2) * 0.25;
    },
  };
}
