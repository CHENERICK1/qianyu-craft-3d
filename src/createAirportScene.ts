import * as THREE from 'three';

export function createAirportScene(): THREE.Group {
  const airportGroup = new THREE.Group();
  airportGroup.name = 'XiaoshanAirportGroup';

  // 1. 夜间停机坪与地面网格 (深邃冷黑夜色地面)
  const groundGeom = new THREE.PlaneGeometry(800, 800, 16, 16);
  const groundMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#07090e'),
    roughness: 0.9,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.rotation.x = -Math.PI * 0.5;
  ground.position.y = -0.1;
  ground.receiveShadow = true;
  airportGroup.add(ground);

  // 跑道沥青路面
  const runwayGeom = new THREE.PlaneGeometry(60, 600);
  const runwayMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#0f131a'),
    roughness: 0.8,
  });
  const runway = new THREE.Mesh(runwayGeom, runwayMat);
  runway.rotation.x = -Math.PI * 0.5;
  runway.position.set(40, 0.05, 0);
  airportGroup.add(runway);

  // 跑道中线虚线与边灯
  const runwayEdgeLightGeom = new THREE.SphereGeometry(0.3, 8, 8);
  const whiteLightMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const redLightMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });

  for (let z = -280; z <= 280; z += 20) {
    const leftLight = new THREE.Mesh(runwayEdgeLightGeom, whiteLightMat);
    leftLight.position.set(10, 0.4, z);
    airportGroup.add(leftLight);

    const rightLight = new THREE.Mesh(runwayEdgeLightGeom, whiteLightMat);
    rightLight.position.set(70, 0.4, z);
    airportGroup.add(rightLight);
  }

  // 2. 杭州萧山机场横向长条主航站楼 (具有大面积温暖橙黄通透玻璃幕墙与波浪顶)
  const terminalGroup = new THREE.Group();
  terminalGroup.name = 'TerminalBuilding';
  terminalGroup.position.set(-60, 0, -180);

  // 主楼基座与主体 (长 240m, 高 20m, 进深 50m)
  const terminalBodyGeom = new THREE.BoxGeometry(240, 20, 50);
  const terminalMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1a1e28'),
    roughness: 0.6,
  });
  const terminalBody = new THREE.Mesh(terminalBodyGeom, terminalMat);
  terminalBody.position.y = 10;
  terminalGroup.add(terminalBody);

  // 航站楼正面大面积发光玻璃幕墙 (散发密集的温暖橙黄灯光)
  const glassFacadeGeom = new THREE.PlaneGeometry(236, 16);
  const glassFacadeMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#f59e0b'),
    transparent: true,
    opacity: 0.95,
  });
  const frontFacade = new THREE.Mesh(glassFacadeGeom, glassFacadeMat);
  frontFacade.position.set(0, 10, 25.1);
  terminalGroup.add(frontFacade);

  // 航站楼顶部波浪式流线羽翼屋顶 (白色反光顶盖)
  const roofGeom = new THREE.BoxGeometry(250, 2.5, 60);
  const roofMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#334155'),
    roughness: 0.3,
  });
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.position.y = 21;
  terminalGroup.add(roof);

  // 航站楼廊桥/指廊与登机口
  for (let b = -100; b <= 100; b += 40) {
    const bridgeGeom = new THREE.BoxGeometry(12, 6, 25);
    const bridge = new THREE.Mesh(bridgeGeom, terminalMat);
    bridge.position.set(b, 5, 37.5);
    terminalGroup.add(bridge);

    const bridgeLight = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), glassFacadeMat);
    bridgeLight.position.set(b, 5, 50.1);
    terminalGroup.add(bridgeLight);
  }

  airportGroup.add(terminalGroup);

  // 3. 管制塔台 (立于主航站楼左侧，高耸独立结构，高约 65m)
  const towerGroup = new THREE.Group();
  towerGroup.name = 'ControlTower';
  towerGroup.position.set(-210, 0, -180);

  const towerStem = new THREE.Mesh(
    new THREE.CylinderGeometry(4.5, 7, 52, 16),
    new THREE.MeshStandardMaterial({ color: '#27303f', roughness: 0.5 })
  );
  towerStem.position.y = 26;
  towerGroup.add(towerStem);

  const cabGeom = new THREE.CylinderGeometry(9, 7.5, 9, 24);
  const cabMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#0284c7'),
    emissive: new THREE.Color('#0ea5e9'),
    emissiveIntensity: 1.2,
    roughness: 0.1,
  });
  const cab = new THREE.Mesh(cabGeom, cabMat);
  cab.position.y = 56.5;
  towerGroup.add(cab);

  const domeGeom = new THREE.SphereGeometry(4.5, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const dome = new THREE.Mesh(domeGeom, new THREE.MeshStandardMaterial({ color: '#e2e8f0' }));
  dome.position.y = 61;
  towerGroup.add(dome);

  const beaconLight = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), redLightMat);
  beaconLight.position.y = 66;
  towerGroup.add(beaconLight);

  airportGroup.add(towerGroup);

  return airportGroup;
}
