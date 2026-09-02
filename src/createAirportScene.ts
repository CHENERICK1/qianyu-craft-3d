import * as THREE from 'three';

/**
 * 萧山国际机场 2010-07-07 目击现场 1:1 深度真实光影、云层与地景环境
 * 针对性重构：
 * 1. 夜空真实云层着色：多层程序化夜云粒子 + 航站楼地表暖光向上散射晕染（Amber & Deep Blue Haze）
 * 2. 萧山机场远景地平线（严格对应原图下部 18% 区域）：
 *    - 细长航站楼发光幕墙（一层金黄玻璃大厅 + 二层橙红流线屋檐轮廓光带）
 *    - 楼顶密集点状射灯、停机坪泛光灯排
 * 3. 左侧高耸管制塔台：细长塔身 + 顶部指挥舱发光 + 红色航空障碍频闪灯
 * 4. 前景机场铁丝网与地面暗色剪影
 */
export function createAirportScene(): THREE.Group {
  const airportGroup = new THREE.Group();
  airportGroup.name = 'XiaoshanAirportDetailedScene';

  // ===== 1. 夜空云层与低空散射（Night Cloud Haze） =====
  const cloudCount = 260;
  const cloudGeom = new THREE.BufferGeometry();
  const cloudPositions: number[] = [];
  const cloudColors: number[] = [];

  const skyDeep = new THREE.Color('#03060c');
  const citySpill = new THREE.Color('#28180c'); // 航站楼与城市光污染向上反射的暖褐色夜云

  for (let i = 0; i < cloudCount; i++) {
    const x = (Math.random() - 0.5) * 800;
    const y = -10 + Math.random() * 95;
    const z = -140 - Math.random() * 200;
    cloudPositions.push(x, y, z);

    // 靠近地面处受地表暖光漫射明显，高空为深暗夜云
    const factor = THREE.MathUtils.clamp((45 - y) / 60, 0, 1);
    const col = skyDeep.clone().lerp(citySpill, factor * 0.88);
    cloudColors.push(col.r, col.g, col.b);
  }

  cloudGeom.setAttribute('position', new THREE.Float32BufferAttribute(cloudPositions, 3));
  cloudGeom.setAttribute('color', new THREE.Float32BufferAttribute(cloudColors, 3));

  const cloudMat = new THREE.PointsMaterial({
    size: 95,
    vertexColors: true,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  airportGroup.add(new THREE.Points(cloudGeom, cloudMat));

  // ===== 2. 远景地平线漫射暖光带（消除生硬黑界线） =====
  const hazeGeom = new THREE.PlaneGeometry(900, 40);
  const hazeMat = new THREE.MeshBasicMaterial({
    color: '#854d0e',
    transparent: true,
    opacity: 0.26,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const hazeMesh = new THREE.Mesh(hazeGeom, hazeMat);
  hazeMesh.position.set(0, -6, -260);
  airportGroup.add(hazeMesh);

  // ===== 3. 大地地坪 (y = -20) =====
  const groundGeom = new THREE.PlaneGeometry(4000, 4000);
  const groundMat = new THREE.MeshStandardMaterial({
    color: '#010204',
    roughness: 0.99,
    metalness: 0.01,
  });
  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -20;
  airportGroup.add(ground);

  // ===== 4. 远景航站楼灯光条带 (y=-20, z=-260) =====
  const terminalGroup = new THREE.Group();
  terminalGroup.position.set(30, -20, -260);

  // 航站楼暗色建筑主体
  const terminalBody = new THREE.Mesh(
    new THREE.BoxGeometry(260, 6.0, 25),
    new THREE.MeshStandardMaterial({ color: '#04070d', roughness: 0.9 })
  );
  terminalBody.position.y = 3.0;
  terminalGroup.add(terminalBody);

  // 航站楼一层发光大厅（金黄幕墙）
  const glassBottom = new THREE.Mesh(
    new THREE.BoxGeometry(250, 2.2, 0.5),
    new THREE.MeshBasicMaterial({ color: '#fbbf24' })
  );
  glassBottom.position.set(0, 1.5, 12.8);
  terminalGroup.add(glassBottom);

  // 航站楼二层橙红屋檐轮廓光带（原图特征红细线）
  const roofLights = new THREE.Mesh(
    new THREE.BoxGeometry(258, 0.9, 0.5),
    new THREE.MeshBasicMaterial({ color: '#ea580c' })
  );
  roofLights.position.set(0, 5.2, 12.8);
  terminalGroup.add(roofLights);

  // 航站楼顶部密集点状射灯
  const topSpotGeom = new THREE.BufferGeometry();
  const topSpotPos: number[] = [];
  for (let x = -120; x <= 120; x += 3.2) {
    topSpotPos.push(x, 6.5, 13.0);
  }
  topSpotGeom.setAttribute('position', new THREE.Float32BufferAttribute(topSpotPos, 3));
  const topSpotMat = new THREE.PointsMaterial({
    color: '#fef08a',
    size: 2.2,
    transparent: true,
  });
  terminalGroup.add(new THREE.Points(topSpotGeom, topSpotMat));

  // 停机坪与滑行道散点灯群
  const apronLightsGeom = new THREE.BufferGeometry();
  const apronPos: number[] = [];
  for (let x = 135; x <= 450; x += 14) {
    apronPos.push(x, 1.6, (Math.random() - 0.5) * 30);
  }
  for (let x = -400; x <= -135; x += 16) {
    apronPos.push(x, 1.4, (Math.random() - 0.5) * 30);
  }
  apronLightsGeom.setAttribute('position', new THREE.Float32BufferAttribute(apronPos, 3));
  const apronMat = new THREE.PointsMaterial({
    color: '#f8fafc',
    size: 1.8,
    transparent: true,
  });
  terminalGroup.add(new THREE.Points(apronLightsGeom, apronMat));

  airportGroup.add(terminalGroup);

  // ===== 5. 左侧高耸管制指挥塔台 (x=-100, y=-20, z=-250) =====
  const towerGroup = new THREE.Group();
  towerGroup.position.set(-100, -20, -250);

  const towerShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.6, 26, 16),
    new THREE.MeshBasicMaterial({ color: '#070b14' })
  );
  towerShaft.position.y = 13;
  towerGroup.add(towerShaft);

  const towerCab = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 1.6, 3.2, 16),
    new THREE.MeshBasicMaterial({ color: '#fef08a' })
  );
  towerCab.position.y = 27.5;
  towerGroup.add(towerCab);

  const towerBeacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 8, 8),
    new THREE.MeshBasicMaterial({ color: '#ef4444' })
  );
  towerBeacon.position.y = 30.2;
  towerGroup.add(towerBeacon);

  airportGroup.add(towerGroup);

  // ===== 6. 前景铁丝隔离网剪影 =====
  const fenceGroup = new THREE.Group();
  fenceGroup.position.set(0, -20, -35);
  const postGeom = new THREE.CylinderGeometry(0.08, 0.08, 4.0, 6);
  const postMat = new THREE.MeshBasicMaterial({ color: '#020305' });
  for (let x = -120; x <= 120; x += 10) {
    const post = new THREE.Mesh(postGeom, postMat);
    post.position.set(x, 2.0, 0);
    fenceGroup.add(post);
  }
  const railGeom = new THREE.BoxGeometry(240, 0.08, 0.08);
  const rail1 = new THREE.Mesh(railGeom, postMat);
  rail1.position.y = 1.6;
  fenceGroup.add(rail1);
  const rail2 = new THREE.Mesh(railGeom, postMat);
  rail2.position.y = 3.6;
  fenceGroup.add(rail2);
  airportGroup.add(fenceGroup);

  return airportGroup;
}
