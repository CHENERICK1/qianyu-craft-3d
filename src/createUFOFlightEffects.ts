import * as THREE from 'three';

export interface UFOEffectResult {
  group: THREE.Group;
  update: (time: number) => void;
}

export function createUFOFlightEffects(): UFOEffectResult {
  const group = new THREE.Group();
  group.name = 'UFOFlightEffects';

  // 1. 超亮弧形曝光主光轨 (还原慢速快门长曝光留下的明亮白黄弧光带)
  const curvePoints: THREE.Vector3[] = [];
  const numSteps = 40;
  for (let i = 0; i <= numSteps; i++) {
    const t = i / numSteps;
    const x = -140 + t * 260;
    const y = 85 - Math.sin(t * Math.PI) * 25 + Math.cos(t * Math.PI * 0.5) * 15;
    const z = -120 + t * 40;
    curvePoints.push(new THREE.Vector3(x, y, z));
  }
  const flightCurve = new THREE.CatmullRomCurve3(curvePoints);

  // 主光轨
  const tubeGeom = new THREE.TubeGeometry(flightCurve, 64, 1.8, 12, false);
  const trailMat = new THREE.MeshBasicMaterial({
    color: '#fffbeb',
    transparent: true,
    opacity: 0.9,
  });
  const mainTrail = new THREE.Mesh(tubeGeom, trailMat);
  group.add(mainTrail);

  // 外层发光暖橙晕染管
  const outerTubeGeom = new THREE.TubeGeometry(flightCurve, 64, 4.2, 12, false);
  const outerTrailMat = new THREE.MeshBasicMaterial({
    color: '#f59e0b',
    transparent: true,
    opacity: 0.35,
  });
  const outerTrail = new THREE.Mesh(outerTubeGeom, outerTrailMat);
  group.add(outerTrail);

  // 2. 次要频闪断续点状光斑
  const dotPointsGroup = new THREE.Group();
  const dotGeom = new THREE.SphereGeometry(1.2, 8, 8);
  const dotMatWhite = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const dotMatGold = new THREE.MeshBasicMaterial({ color: '#fbbf24' });

  for (let i = 0; i < 20; i++) {
    const t = i / 20;
    const pt = flightCurve.getPoint(t);
    const dot = new THREE.Mesh(dotGeom, i % 2 === 0 ? dotMatWhite : dotMatGold);
    dot.position.set(pt.x, pt.y - 6.5, pt.z + 5);
    dotPointsGroup.add(dot);
  }
  group.add(dotPointsGroup);

  function update(time: number) {
    const pulse = Math.sin(time * 3) * 0.15;
    trailMat.opacity = 0.85 + pulse;
    outerTrailMat.opacity = 0.35 + pulse * 0.8;
  }

  return {
    group,
    update,
  };
}
