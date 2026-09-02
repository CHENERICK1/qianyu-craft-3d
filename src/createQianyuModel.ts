import * as THREE from 'three';
import { PartMeta, QianyuModelResult, RenderMode } from './types';

/**
 * 乾舆一号 · 2010 萧山机场 UFO 真实慢门流光神机
 * 
 * 核心对齐 2010 萧山机场实拍目击照片：
 * 1. 【发光流光弧带就是主体】：照片中那道横跨天际、极其耀眼的白色强光弧线（带金黄色等离子尾晕）是整个飞碟的主轮廓。
 * 2. 【光点阵列嵌入机身】：照片中那一排 24 宿脉冲白光点阵自然顺应流光弧度镶嵌在盘体边缘。
 * 3. 【精细度与真实感】：消除过大的突兀三角形/大几何块，优化玄铁装甲与古铜金构架细节。
 */
export function createQianyuModel(): QianyuModelResult {
  const root = new THREE.Group();
  root.name = 'QianyuCraftRoot';

  const parts: PartMeta[] = [];
  const landingGears: THREE.Group[] = [];

  // ================= 材质定义 =================
  const armorMat = new THREE.MeshStandardMaterial({
    color: '#080d1a',
    metalness: 0.92,
    roughness: 0.22,
    envMapIntensity: 1.5,
  });

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: '#d97706',
    metalness: 0.95,
    roughness: 0.18,
    emissive: '#78350f',
    emissiveIntensity: 0.35,
  });

  // 主体高能白炽光弧（萧山照片核心光带）
  const coreArcMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#ffffff',
    emissiveIntensity: 9.0,
    roughness: 0.05,
  });

  // 弧光外层等离子能量光晕（金色半透辉光）
  const haloArcMat = new THREE.MeshBasicMaterial({
    color: '#fbbf24',
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  // 24 宿周天点阵光斑（发光白球）
  const beaconMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#f0f9ff',
    emissiveIntensity: 8.5,
    roughness: 0.05,
  });

  const blueprintMat = new THREE.MeshBasicMaterial({
    color: '#38bdf8',
    wireframe: true,
    transparent: true,
    opacity: 0.85,
  });

  // ================= 1. 巨大流光主弧翼身 (横跨夜空的等离子主弧刃) =================
  const arcWingGroup = new THREE.Group();
  arcWingGroup.name = 'MainArcLuminousBody';

  const arcPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    const angle = (t - 0.5) * Math.PI * 0.92;
    const r = 38.0;
    const x = Math.sin(angle) * r * 1.35;
    const y = -Math.cos(angle) * 5.5 + 5.5;
    const z = (Math.cos(angle) - 1.0) * r * 0.45;
    arcPoints.push(new THREE.Vector3(x, y, z));
  }
  const arcSpline = new THREE.CatmullRomCurve3(arcPoints);

  // 核心白炽强光管
  const coreTubeGeom = new THREE.TubeGeometry(arcSpline, 80, 1.4, 16, false);
  const coreTubeMesh = new THREE.Mesh(coreTubeGeom, coreArcMat);
  arcWingGroup.add(coreTubeMesh);

  // 外层等离子光晕管
  const haloTubeGeom = new THREE.TubeGeometry(arcSpline, 80, 3.8, 16, false);
  const haloTubeMesh = new THREE.Mesh(haloTubeGeom, haloArcMat);
  arcWingGroup.add(haloTubeMesh);

  // ================= 2. 乾舆玄铁双曲抛物面碟身 =================
  const saucerBodyGroup = new THREE.Group();
  saucerBodyGroup.name = 'SaucerMainBody';

  // 上天盖
  const upperDiscGeom = new THREE.CylinderGeometry(6.0, 34.0, 4.2, 64, 1, false);
  upperDiscGeom.scale(1.3, 1.0, 0.85);
  const upperDiscMesh = new THREE.Mesh(upperDiscGeom, armorMat);
  upperDiscMesh.position.y = 1.0;
  upperDiscMesh.castShadow = true;
  upperDiscMesh.receiveShadow = true;
  saucerBodyGroup.add(upperDiscMesh);

  // 下地盘
  const lowerDiscGeom = new THREE.CylinderGeometry(34.0, 10.0, 3.8, 64, 1, false);
  lowerDiscGeom.scale(1.3, 1.0, 0.85);
  const lowerDiscMesh = new THREE.Mesh(lowerDiscGeom, armorMat);
  lowerDiscMesh.position.y = -2.4;
  lowerDiscMesh.castShadow = true;
  saucerBodyGroup.add(lowerDiscMesh);

  // 赤道周天鎏金嵌带
  const ringGeom = new THREE.TorusGeometry(33.8, 0.9, 16, 64);
  ringGeom.scale(1.3, 0.6, 0.85);
  const ringMesh = new THREE.Mesh(ringGeom, goldTrimMat);
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.y = -0.5;
  saucerBodyGroup.add(ringMesh);

  // ================= 3. 24 宿周天点阵脉冲光球 (照片标志性发光白球) =================
  const rimLightsGroup = new THREE.Group();
  rimLightsGroup.name = 'RimPulseBeacons';
  const beaconMeshes: THREE.Mesh[] = [];
  const beaconCount = 24;

  const beaconGeom = new THREE.SphereGeometry(1.0, 16, 16);
  for (let i = 0; i < beaconCount; i++) {
    const angle = (i / beaconCount) * Math.PI * 2;
    const bMesh = new THREE.Mesh(beaconGeom, beaconMat);
    const rx = Math.cos(angle) * 34.0 * 1.3;
    const rz = Math.sin(angle) * 34.0 * 0.85;
    bMesh.position.set(rx, -0.5, rz);
    rimLightsGroup.add(bMesh);
    beaconMeshes.push(bMesh);
  }
  saucerBodyGroup.add(rimLightsGroup);

  // ================= 4. 乾顶天池与太极定风珠 =================
  const topCrownGroup = new THREE.Group();
  topCrownGroup.name = 'TopCrownAndPearl';

  for (let step = 0; step < 3; step++) {
    const stepGeom = new THREE.CylinderGeometry(3.0 - step * 0.8, 5.0 - step * 0.9, 0.8, 32);
    const stepMesh = new THREE.Mesh(stepGeom, goldTrimMat);
    stepMesh.position.y = 3.4 + step * 0.75;
    topCrownGroup.add(stepMesh);
  }

  const pearlGeom = new THREE.SphereGeometry(1.6, 32, 32);
  const pearlMat = new THREE.MeshStandardMaterial({
    color: '#e0f2fe',
    emissive: '#38bdf8',
    emissiveIntensity: 8.0,
    roughness: 0.05,
  });
  const pearlMesh = new THREE.Mesh(pearlGeom, pearlMat);
  pearlMesh.position.y = 6.6;
  topCrownGroup.add(pearlMesh);

  const crownHaloGeom = new THREE.TorusGeometry(3.6, 0.22, 16, 48);
  const crownHaloMat = new THREE.MeshStandardMaterial({
    color: '#38bdf8',
    emissive: '#0284c7',
    emissiveIntensity: 5.0,
  });
  const crownHaloMesh = new THREE.Mesh(crownHaloGeom, crownHaloMat);
  crownHaloMesh.rotation.x = Math.PI / 3;
  crownHaloMesh.position.y = 6.6;
  topCrownGroup.add(crownHaloMesh);

  // ================= 5. 底部反重力导流核心 =================
  const bottomCoreGroup = new THREE.Group();
  bottomCoreGroup.name = 'BottomAntigravityEngine';

  const engineConeGeom = new THREE.ConeGeometry(7.5, 3.8, 32, 1, true);
  engineConeGeom.rotateX(Math.PI);
  const engineConeMesh = new THREE.Mesh(engineConeGeom, armorMat);
  engineConeMesh.position.y = -4.2;
  bottomCoreGroup.add(engineConeMesh);

  const engineGlowGeom = new THREE.CylinderGeometry(4.8, 0.5, 2.0, 32);
  const engineGlowMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#0284c7',
    emissiveIntensity: 6.5,
  });
  const engineGlowMesh = new THREE.Mesh(engineGlowGeom, engineGlowMat);
  engineGlowMesh.position.y = -4.8;
  bottomCoreGroup.add(engineGlowMesh);

  // ================= 6. 三足起落架系统 =================
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const gearGroup = new THREE.Group();
    gearGroup.name = 'gear_' + String(i + 1);

    const dist = 16.0;
    gearGroup.position.set(Math.cos(angle) * dist, -3.2, Math.sin(angle) * dist);
    gearGroup.rotation.y = -angle;

    const strutGeom = new THREE.CylinderGeometry(0.45, 0.6, 5.0, 16);
    const strutMesh = new THREE.Mesh(strutGeom, goldTrimMat);
    strutMesh.position.y = -2.5;
    gearGroup.add(strutMesh);

    const footGeom = new THREE.CylinderGeometry(2.0, 2.8, 0.7, 6);
    const footMesh = new THREE.Mesh(footGeom, armorMat);
    footMesh.position.y = -5.0;
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
          if (child === coreTubeMesh || child === haloTubeMesh || child === pearlMesh) {
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
        gear.position.y = -3.2 + currentLandingProgress * 4.5;
        gear.scale.setScalar(1.0 - currentLandingProgress * 0.8);
      });
    },
    updateAnimation: (delta: number) => {
      pearlMesh.rotation.y += delta * 1.5;
      crownHaloMesh.rotation.z += delta * 2.2;

      const now = performance.now() * 0.005;
      beaconMeshes.forEach((mesh, idx) => {
        const phase = now + (idx / beaconCount) * Math.PI * 4;
        const wave = (Math.sin(phase) + 1) * 0.5;
        mesh.scale.setScalar(0.8 + wave * 1.3);
      });

      coreArcMat.emissiveIntensity = 8.5 + Math.sin(now * 0.8) * 2.0;
      haloArcMat.opacity = 0.6 + Math.sin(now * 1.2) * 0.2;
    },
  };
}
