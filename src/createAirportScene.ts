import * as THREE from 'three';

export function createAirportScene(): THREE.Group {
  const airportGroup = new THREE.Group();
  airportGroup.name = 'XiaoshanAirportGroup';

  // 1. 地表大地 (暗色沥青/草坪地坪，带真实反射)
  const groundGeom = new THREE.PlaneGeometry(1200, 1200, 32, 32);
  const groundMat = new THREE.MeshStandardMaterial({
    color: '#0a0d12',
    roughness: 0.85,
    metalness: 0.15,
  });
  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.rotation.x = -Math.PI * 0.5;
  ground.position.y = -0.5;
  ground.receiveShadow = true;
  airportGroup.add(ground);

  // 2. 主飞行跑道 (长条形沥青道面，长 600m x 宽 36m)
  const runwayGeom = new THREE.PlaneGeometry(600, 36);
  const runwayMat = new THREE.MeshStandardMaterial({
    color: '#151922',
    roughness: 0.6,
    metalness: 0.2,
  });
  const runway = new THREE.Mesh(runwayGeom, runwayMat);
  runway.rotation.x = -Math.PI * 0.5;
  runway.position.set(0, -0.4, 40);
  runway.receiveShadow = true;
  airportGroup.add(runway);

  // 跑道中心白线标线
  const centerlineGeom = new THREE.PlaneGeometry(560, 1.2);
  const centerlineMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });
  const centerline = new THREE.Mesh(centerlineGeom, centerlineMat);
  centerline.rotation.x = -Math.PI * 0.5;
  centerline.position.set(0, -0.38, 40);
  airportGroup.add(centerline);

  // 跑道两侧绿色进近与边缘指示灯
  const runwayLightGeom = new THREE.BufferGeometry();
  const runwayLightPositions: number[] = [];
  for (let x = -280; x <= 280; x += 20) {
    runwayLightPositions.push(x, 0.2, 22);
    runwayLightPositions.push(x, 0.2, 58);
  }
  runwayLightGeom.setAttribute('position', new THREE.Float32BufferAttribute(runwayLightPositions, 3));
  const runwayLightMat = new THREE.PointsMaterial({
    color: '#10b981',
    size: 3.0,
    transparent: true,
    opacity: 0.9,
  });
  const runwayLights = new THREE.Points(runwayLightGeom, runwayLightMat);
  airportGroup.add(runwayLights);

  // 3. 杭州萧山机场大型航站楼群 (横向宽达 240m 的现代化波浪形玻璃幕墙航站楼)
  const terminalGroup = new THREE.Group();
  terminalGroup.position.set(0, 0, -60);

  // 航站楼主体底座
  const terminalBodyGeom = new THREE.BoxGeometry(240, 18, 50);
  const terminalBodyMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.4,
    metalness: 0.5,
  });
  const terminalBody = new THREE.Mesh(terminalBodyGeom, terminalBodyMat);
  terminalBody.position.y = 9;
  terminalBody.castShadow = true;
  terminalBody.receiveShadow = true;
  terminalGroup.add(terminalBody);

  // 正面大面积暖黄色通透玻璃幕墙 (照片中发出密集橙黄暖光的航站楼大厅)
  const glassFrontGeom = new THREE.PlaneGeometry(236, 14);
  const glassFrontMat = new THREE.MeshStandardMaterial({
    color: '#fbbf24',
    emissive: '#d97706',
    emissiveIntensity: 2.2,
    roughness: 0.1,
    metalness: 0.8,
  });
  const glassFront = new THREE.Mesh(glassFrontGeom, glassFrontMat);
  glassFront.position.set(0, 9, 25.1);
  terminalGroup.add(glassFront);

  // 航站楼流线型波浪白色雨棚顶盖 (萧山机场标志性羽翼流线造型)
  const roofGeom = new THREE.BoxGeometry(250, 2.5, 60);
  const roofMat = new THREE.MeshStandardMaterial({
    color: '#f1f5f9',
    roughness: 0.3,
    metalness: 0.4,
  });
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.position.y = 19;
  roof.castShadow = true;
  terminalGroup.add(roof);

  // 航站楼顶“杭州 XIAOSHAN”发光字
  const signGeom = new THREE.BoxGeometry(36, 3.5, 1.0);
  const signMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });
  const sign = new THREE.Mesh(signGeom, signMat);
  sign.position.set(0, 22, 10);
  terminalGroup.add(sign);

  // 登机指廊桥梁 (左右延伸指廊)
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    const bridgeGeom = new THREE.BoxGeometry(8, 6, 25);
    const bridgeMat = new THREE.MeshStandardMaterial({ color: '#334155' });
    const bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
    bridge.position.set(i * 35, 6, 32);
    terminalGroup.add(bridge);
  }

  airportGroup.add(terminalGroup);

  // 4. 管制指挥塔台 (照片左侧高耸的现代化圆柱形独立塔台)
  const towerGroup = new THREE.Group();
  towerGroup.position.set(-110, 0, -40);

  // 塔身 (下粗上细的圆台高塔，高 65m)
  const towerShaftGeom = new THREE.CylinderGeometry(4.5, 7.5, 55, 32);
  const towerShaftMat = new THREE.MeshStandardMaterial({
    color: '#475569',
    roughness: 0.5,
    metalness: 0.3,
  });
  const towerShaft = new THREE.Mesh(towerShaftGeom, towerShaftMat);
  towerShaft.position.y = 27.5;
  towerShaft.castShadow = true;
  towerGroup.add(towerShaft);

  // 塔台指挥舱 (上部悬挑全景发光指挥层)
  const cabGeom = new THREE.CylinderGeometry(9, 6, 8, 32);
  const cabMat = new THREE.MeshStandardMaterial({
    color: '#fef08a',
    emissive: '#eab308',
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });
  const cab = new THREE.Mesh(cabGeom, cabMat);
  cab.position.y = 58;
  towerGroup.add(cab);

  // 塔台顶部白色球形雷达天线罩
  const domeGeom = new THREE.SphereGeometry(4, 24, 24);
  const domeMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.2,
  });
  const dome = new THREE.Mesh(domeGeom, domeMat);
  dome.position.y = 65;
  towerGroup.add(dome);

  // 塔台顶部红色航空障碍灯
  const beaconGeom = new THREE.SphereGeometry(0.8, 12, 12);
  const beaconMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });
  const beacon = new THREE.Mesh(beaconGeom, beaconMat);
  beacon.position.y = 69.5;
  towerGroup.add(beacon);

  airportGroup.add(towerGroup);

  return airportGroup;
}
