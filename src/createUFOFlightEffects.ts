import * as THREE from 'three';

export interface UFOFlightEffectsResult {
  group: THREE.Group;
  update: (time: number) => void;
}

export function createUFOFlightEffects(): UFOFlightEffectsResult {
  const group = new THREE.Group();
  group.name = 'UFOFlightEffects';

  // 1. 萧山夜空主曝光强光弧线 (还原照片中划破夜空的金色/亮白粗光轨)
  const curvePoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const x = -160 + t * 320;
    const y = 35 + Math.sin(t * Math.PI * 0.95) * 45 + (1 - t) * 15;
    const z = -140 + Math.cos(t * Math.PI * 0.8) * 80;
    curvePoints.push(new THREE.Vector3(x, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(curvePoints);
  const tubeGeom = new THREE.TubeGeometry(curve, 100, 1.8, 12, false);
  const tubeMat = new THREE.MeshStandardMaterial({
    color: '#fef08a',
    emissive: '#f59e0b',
    emissiveIntensity: 3.5,
    roughness: 0.1,
    transparent: true,
    opacity: 0.92,
  });
  const lightTrail = new THREE.Mesh(tubeGeom, tubeMat);
  group.add(lightTrail);

  // 2. 次级光轨虚线与频闪光斑点阵 (照片下方排成一串的间断光点)
  const pulseCount = 36;
  const pulseGeom = new THREE.BufferGeometry();
  const pulsePositions: number[] = [];
  const pulseColors: number[] = [];
  const baseColor = new THREE.Color('#fef08a');
  const accentColor = new THREE.Color('#38bdf8');

  for (let i = 0; i < pulseCount; i++) {
    const t = i / pulseCount;
    const pt = curve.getPoint(t);
    // 稍微在主光轨下方偏移
    pulsePositions.push(pt.x + 3, pt.y - 6, pt.z + 5);
    const col = i % 2 === 0 ? baseColor : accentColor;
    pulseColors.push(col.r, col.g, col.b);
  }

  pulseGeom.setAttribute('position', new THREE.Float32BufferAttribute(pulsePositions, 3));
  pulseGeom.setAttribute('color', new THREE.Float32BufferAttribute(pulseColors, 3));

  const pulseMat = new THREE.PointsMaterial({
    size: 6.0,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });
  const pulsePoints = new THREE.Points(pulseGeom, pulseMat);
  group.add(pulsePoints);

  // 3. 动态光晕与扫描脉冲光圈
  const haloGeom = new THREE.RingGeometry(10, 18, 32);
  const haloMat = new THREE.MeshBasicMaterial({
    color: '#fbbf24',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
  });
  const haloMesh = new THREE.Mesh(haloGeom, haloMat);
  haloMesh.position.set(0, 50, -60);
  haloMesh.rotation.x = Math.PI * 0.5;
  group.add(haloMesh);

  return {
    group,
    update: (time: number) => {
      // 脉冲光斑闪烁动画
      pulseMat.size = 5.0 + Math.sin(time * 8) * 2.5;
      tubeMat.emissiveIntensity = 3.0 + Math.sin(time * 3) * 1.0;
      haloMesh.scale.setScalar(1.0 + Math.sin(time * 2) * 0.2);
    },
  };
}
