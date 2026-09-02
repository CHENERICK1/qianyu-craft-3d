import * as THREE from 'three';
import { PartMeta, QianyuModelResult, RenderMode } from './types';

/**
 * 乾舆一号 · 严格按蓝图图纸比例建模
 * 
 * 蓝图关键尺寸（已目测图纸比例）：
 * - 整体直径 15m（半径 7.5m）
 * - 总高 5m：上穹顶约 3m + 下碟身约 2m
 * - 上穹顶：中央顶点高，向外平缓弧降至赤道（典型"帽形"）
 * - 赤道最宽处：直径 15m，高度约 0 基准
 * - 下碟身：从赤道 15m 向内收缩至底部约 3m，形成下圆台
 * - 24 扇星宿窗：沿赤道均布，嵌入玄铁甲壳
 * - 顶部宝顶：高约 1.2m，小圆台+球珠
 * - 三才鼎足：底部 120° 分布，斜向外展，高 2.3m
 */
export function createQianyuModel(): QianyuModelResult {
  const root = new THREE.Group();
  root.name = 'QianyuCraft';

  const parts: PartMeta[] = [];
  const landingGears: THREE.Group[] = [];

  // ===== 材质 =====
  const armorMat = new THREE.MeshStandardMaterial({
    color: '#2d3d55',   // 稍亮的深蓝灰钢铁色，夜光下可见层次
    metalness: 0.88,
    roughness: 0.28,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: '#d97706',
    metalness: 0.92,
    roughness: 0.22,
    emissive: '#7c2d12',
    emissiveIntensity: 0.2,
  });
  const windowMat = new THREE.MeshStandardMaterial({
    color: '#fef9c3',
    emissive: '#fde047',
    emissiveIntensity: 5.0,
    roughness: 0.05,
  });
  const pearlMat = new THREE.MeshStandardMaterial({
    color: '#e0f2fe',
    emissive: '#38bdf8',
    emissiveIntensity: 6.0,
    roughness: 0.04,
  });
  const engineMat = new THREE.MeshStandardMaterial({
    color: '#f0f9ff',
    emissive: '#0ea5e9',
    emissiveIntensity: 5.0,
    roughness: 0.08,
  });
  const blueprintMat = new THREE.MeshBasicMaterial({
    color: '#38bdf8',
    wireframe: true,
    transparent: true,
    opacity: 0.85,
  });

  // ===== 主体盘面 =====
  const saucerGroup = new THREE.Group();
  saucerGroup.name = 'SaucerMainBody';

  // 上穹顶：用 LatheGeometry 精确还原蓝图"帽形"剖面
  // 点位从顶部(r=0, y=3.0)到赤道(r=7.5, y=0)，带中间鼓出
  const domePoints: THREE.Vector2[] = [
    new THREE.Vector2(0,    3.0),
    new THREE.Vector2(1.2,  2.85),
    new THREE.Vector2(2.6,  2.5),
    new THREE.Vector2(4.2,  2.0),
    new THREE.Vector2(5.6,  1.35),
    new THREE.Vector2(6.6,  0.7),
    new THREE.Vector2(7.3,  0.25),
    new THREE.Vector2(7.5,  0.0),
  ];
  const domeGeom = new THREE.LatheGeometry(domePoints, 64);
  const domeMesh = new THREE.Mesh(domeGeom, armorMat);
  domeMesh.castShadow = true;
  saucerGroup.add(domeMesh);

  // 下碟身：从赤道(r=7.5, y=0)向内收至底盘(r=2.5, y=-2.0)
  const hullPoints: THREE.Vector2[] = [
    new THREE.Vector2(7.5,   0.0),
    new THREE.Vector2(7.2,  -0.35),
    new THREE.Vector2(6.5,  -0.85),
    new THREE.Vector2(5.2,  -1.35),
    new THREE.Vector2(3.8,  -1.75),
    new THREE.Vector2(2.5,  -2.0),
  ];
  const hullGeom = new THREE.LatheGeometry(hullPoints, 64);
  const hullMesh = new THREE.Mesh(hullGeom, armorMat);
  hullMesh.castShadow = true;
  saucerGroup.add(hullMesh);

  // 赤道鎏金环带
  const equatorRingGeom = new THREE.TorusGeometry(7.5, 0.12, 16, 64);
  const equatorRingMesh = new THREE.Mesh(equatorRingGeom, goldMat);
  equatorRingMesh.rotation.x = Math.PI / 2;
  equatorRingMesh.position.y = 0;
  saucerGroup.add(equatorRingMesh);

  // 赤道内圈装饰金环
  const innerRingGeom = new THREE.TorusGeometry(6.8, 0.07, 12, 64);
  const innerRingMesh = new THREE.Mesh(innerRingGeom, goldMat);
  innerRingMesh.rotation.x = Math.PI / 2;
  innerRingMesh.position.y = 0.55;
  saucerGroup.add(innerRingMesh);

  // 24 宿周天棂花星宿窗 (在赤道凸缘上均布)
  const windowCount = 24;
  const windowMeshes: THREE.Mesh[] = [];
  const winGeom = new THREE.BoxGeometry(0.65, 0.3, 0.2);
  for (let i = 0; i < windowCount; i++) {
    const ang = (i / windowCount) * Math.PI * 2;
    const wm = new THREE.Mesh(winGeom, windowMat);
    wm.position.set(Math.sin(ang) * 7.38, -0.05, Math.cos(ang) * 7.38);
    wm.rotation.y = ang;
    saucerGroup.add(wm);
    windowMeshes.push(wm);
  }

  // ===== 顶部宝顶（蓝图顶部小亭/天池定风珠）=====
  const crownGroup = new THREE.Group();
  crownGroup.name = 'TopCrownAndPearl';

  // 宝顶底座圆台
  const crownBase1 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 0.4, 32), goldMat);
  crownBase1.position.y = 3.2;
  crownGroup.add(crownBase1);

  const crownBase2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 0.35, 32), goldMat);
  crownBase2.position.y = 3.57;
  crownGroup.add(crownBase2);

  // 细颈连杆
  const crownNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.45, 16), goldMat);
  crownNeck.position.y = 3.9;
  crownGroup.add(crownNeck);

  // 定风宝珠
  const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.52, 32, 32), pearlMat);
  pearl.position.y = 4.4;
  crownGroup.add(pearl);

  // 混元光环（斜置）
  const haloGeom = new THREE.TorusGeometry(1.05, 0.055, 16, 48);
  const haloMesh = new THREE.Mesh(haloGeom, pearlMat);
  haloMesh.rotation.x = Math.PI / 3.2;
  haloMesh.position.y = 4.4;
  crownGroup.add(haloMesh);

  // ===== 底部反重力导流核心 =====
  const engineGroup = new THREE.Group();
  engineGroup.name = 'BottomAntigravityEngine';

  const engineRimGeom = new THREE.CylinderGeometry(2.5, 1.8, 0.3, 32);
  const engineRimMesh = new THREE.Mesh(engineRimGeom, goldMat);
  engineRimMesh.position.y = -2.0;
  engineGroup.add(engineRimMesh);

  const engineNozzleGeom = new THREE.CylinderGeometry(1.7, 0.5, 0.55, 32);
  const engineNozzleMesh = new THREE.Mesh(engineNozzleGeom, engineMat);
  engineNozzleMesh.position.y = -2.5;
  engineGroup.add(engineNozzleMesh);

  // ===== 三才鼎足起落架（120°分布，斜撑外展）=====
  for (let i = 0; i < 3; i++) {
    const baseAngle = (i / 3) * Math.PI * 2;
    const gear = new THREE.Group();
    gear.name = 'gear_' + String(i + 1);

    // 安装点在下碟身腰部 r≈4.5
    gear.position.set(Math.sin(baseAngle) * 4.5, -1.5, Math.cos(baseAngle) * 4.5);
    gear.rotation.y = baseAngle;

    // 液压斜撑主柱（向外下方倾斜）
    const strutGeom = new THREE.CylinderGeometry(0.1, 0.14, 2.8, 12);
    const strut = new THREE.Mesh(strutGeom, goldMat);
    strut.rotation.x = 0.45;
    strut.position.set(0, -1.2, 0.8);
    gear.add(strut);

    // 液压缸体
    const cylGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.9, 12);
    const cyl = new THREE.Mesh(cylGeom, armorMat);
    cyl.rotation.x = 0.45;
    cyl.position.set(0, -0.85, 0.55);
    gear.add(cyl);

    // 落地六边足盘
    const padGeom = new THREE.CylinderGeometry(0.5, 0.65, 0.15, 6);
    const pad = new THREE.Mesh(padGeom, armorMat);
    pad.position.set(0, -2.4, 1.55);
    gear.add(pad);

    landingGears.push(gear);
    saucerGroup.add(gear);
  }

  root.add(saucerGroup);
  root.add(crownGroup);
  root.add(engineGroup);

  // parts（用于爆炸分拆）
  parts.push({
    name: 'TopCrownAndPearl',
    mesh: crownGroup,
    originPos: crownGroup.position.clone(),
    explodeDir: new THREE.Vector3(0, 1, 0),
  });
  parts.push({
    name: 'SaucerMainBody',
    mesh: saucerGroup,
    originPos: saucerGroup.position.clone(),
    explodeDir: new THREE.Vector3(0, 0, 0),
  });
  parts.push({
    name: 'BottomAntigravityEngine',
    mesh: engineGroup,
    originPos: engineGroup.position.clone(),
    explodeDir: new THREE.Vector3(0, -1, 0),
  });

  return {
    root,
    parts,
    setRenderMode: (mode: RenderMode) => {
      const isBP = mode === 'blueprint';
      root.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // 保持发光件不变
          if (child === pearl || child === engineNozzleMesh || windowMeshes.includes(child)) return;
          child.material = isBP ? blueprintMat : (child.userData.orig || child.material);
          if (!child.userData.orig) child.userData.orig = child.material;
        }
      });
    },
    setLandingGearProgress: (progress: number) => {
      const p = THREE.MathUtils.clamp(progress, 0, 1);
      landingGears.forEach((gear) => {
        // 收起时向上旋转并缩进
        gear.rotation.x = -p * 1.1;
        gear.position.y = -1.5 + p * 1.0;
        gear.scale.setScalar(1.0 - p * 0.45);
      });
    },
    updateAnimation: (delta: number) => {
      pearl.rotation.y += delta * 1.8;
      haloMesh.rotation.z += delta * 2.4;

      const now = performance.now() * 0.004;
      windowMeshes.forEach((m, i) => {
        const pulse = (Math.sin(now + (i / windowCount) * Math.PI * 4) + 1) * 0.5;
        (m.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.5 + pulse * 5.0;
      });
    },
  };
}
