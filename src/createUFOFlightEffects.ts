import * as THREE from 'three';

export interface UFOEnhancedEffectsResult {
  group: THREE.Group;
  update: (time: number) => void;
}

export function createUFOEnhancedEffects(qianyuRoot: THREE.Group): UFOEnhancedEffectsResult {
  const group = new THREE.Group();
  group.name = 'UFOEnhancedEffects';

  // 1. 照片中贯穿天际的【超长曝光弧形强光轨迹】（亮黄白高光带）
  const curvePoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    const x = -200 + t * 400;
    const y = 25 + Math.sin(t * Math.PI * 0.9) * 55 + (1 - t) * 20;
    const z = -180 + Math.cos(t * Math.PI * 0.75) * 110;
    curvePoints.push(new THREE.Vector3(x, y, z));
  }

  const mainCurve = new THREE.CatmullRomCurve3(curvePoints);
  
  // 核心白炽强光管
  const coreTubeGeom = new THREE.TubeGeometry(mainCurve, 120, 1.2, 12, false);
  const coreTubeMat = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.95,
  });
  const coreTrail = new THREE.Mesh(coreTubeGeom, coreTubeMat);
  group.add(coreTrail);

  // 外层金黄色电离等离子光晕
  const outerTubeGeom = new THREE.TubeGeometry(mainCurve, 120, 3.8, 12, false);
  const outerTubeMat = new THREE.MeshStandardMaterial({
    color: '#fbbf24',
    emissive: '#f59e0b',
    emissiveIntensity: 3.5,
    roughness: 0.2,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
  });
  const outerTrail = new THREE.Mesh(outerTubeGeom, outerTubeMat);
  group.add(outerTrail);

  // 2. 乾舆盘体边缘【24 宿周天外缘点阵光斑系统】（原图中那串标志性点状光斑与飞碟轮廓一体化）
  const rimLightsGroup = new THREE.Group();
  rimLightsGroup.name = 'QianyuRimPulseLights';
  const rimCount = 24;
  const rimMeshes: THREE.Mesh[] = [];
  const rimRadius = 7.6; // 紧贴 15m 直径乾舆边缘外圈

  const sphereGeom = new THREE.SphereGeometry(0.35, 16, 16);
  for (let i = 0; i < rimCount; i++) {
    const angle = (i / rimCount) * Math.PI * 2;
    const isMajor = i % 3 === 0; // 八卦主方位
    const mat = new THREE.MeshStandardMaterial({
      color: isMajor ? '#ffffff' : '#fde047',
      emissive: isMajor ? '#38bdf8' : '#eab308',
      emissiveIntensity: isMajor ? 5.0 : 3.5,
      roughness: 0.1,
    });
    const m = new THREE.Mesh(sphereGeom, mat);
    m.position.set(Math.cos(angle) * rimRadius, 0, Math.sin(angle) * rimRadius);
    rimLightsGroup.add(m);
    rimMeshes.push(m);
  }

  // 将边缘光斑直接挂载到乾舆模型根节点上，随着飞碟姿态与运动一体化！
  qianyuRoot.add(rimLightsGroup);

  // 3. 萧山夜空大气积雨云层与高空逆光体积雾
  const cloudsGroup = new THREE.Group();
  cloudsGroup.name = 'NightCloudVolumes';
  const cloudCount = 28;
  const cloudGeom = new THREE.DodecahedronGeometry(25, 1);
  const cloudMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    emissive: '#1e293b',
    emissiveIntensity: 0.3,
    roughness: 0.95,
    metalness: 0.05,
    transparent: true,
    opacity: 0.45,
  });

  for (let i = 0; i < cloudCount; i++) {
    const cloud = new THREE.Mesh(cloudGeom, cloudMat);
    const angle = (i / cloudCount) * Math.PI * 2;
    const dist = 120 + Math.random() * 200;
    cloud.position.set(
      Math.cos(angle) * dist,
      60 + Math.random() * 45,
      Math.sin(angle) * dist - 80
    );
    cloud.scale.set(
      1.5 + Math.random() * 2.0,
      0.6 + Math.random() * 0.8,
      1.5 + Math.random() * 2.0
    );
    cloud.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    cloudsGroup.add(cloud);
  }
  group.add(cloudsGroup);

  return {
    group,
    update: (time: number) => {
      // 1. 轨迹光辉呼吸
      outerTubeMat.emissiveIntensity = 3.0 + Math.sin(time * 3) * 1.2;
      
      // 2. 乾舆盘体 24 宿光斑依次顺时针脉冲频闪（营造类似照片中快门曝光捕获的脉冲点斑）
      rimMeshes.forEach((mesh, idx) => {
        const phase = time * 6 + (idx / rimCount) * Math.PI * 4;
        const pulse = (Math.sin(phase) + 1) * 0.5; // 0 ~ 1
        mesh.scale.setScalar(0.7 + pulse * 1.5);
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 2.0 + pulse * 6.0;
      });

      // 3. 云层极微速游走
      cloudsGroup.rotation.y = time * 0.005;
    },
  };
}
