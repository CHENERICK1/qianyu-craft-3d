import * as THREE from 'three';
import { ExplodablePart, QianyuModelResult } from './types';

export function createQianyuModel(): QianyuModelResult {
  const root = new THREE.Group();
  root.name = 'QianyuRoot';

  const parts: ExplodablePart[] = [];
  const materialsToTrack: { mat: THREE.Material; origParams: any }[] = [];

  // ================= 1. 程序化生成中式纹理 =================
  function createProceduralTextures() {
    // A. 碟身玄铁青铜装甲贴图 (带环向同心刻度线与云雷纹)
    const armorCanvas = document.createElement('canvas');
    armorCanvas.width = 1024;
    armorCanvas.height = 1024;
    const aCtx = armorCanvas.getContext('2d')!;
    aCtx.fillStyle = '#222a35';
    aCtx.fillRect(0, 0, 1024, 1024);

    // 环向同心装甲接缝线
    aCtx.strokeStyle = '#0f141c';
    aCtx.lineWidth = 6;
    for (let y = 64; y < 1024; y += 128) {
      aCtx.beginPath();
      aCtx.moveTo(0, y);
      aCtx.lineTo(1024, y);
      aCtx.stroke();
    }

    // 经向八卦刻度线与描金云雷纹
    aCtx.strokeStyle = '#d4af37';
    aCtx.lineWidth = 3;
    aCtx.globalAlpha = 0.35;
    for (let x = 0; x < 1024; x += 128) {
      aCtx.beginPath();
      aCtx.moveTo(x, 0);
      aCtx.lineTo(x, 1024);
      aCtx.stroke();
      for (let y = 16; y < 1024; y += 128) {
        aCtx.strokeRect(x + 16, y + 16, 96, 96);
      }
    }
    aCtx.globalAlpha = 1.0;
    const armorTex = new THREE.CanvasTexture(armorCanvas);
    armorTex.wrapS = THREE.RepeatWrapping;
    armorTex.wrapT = THREE.RepeatWrapping;
    armorTex.repeat.set(6, 2);

    // B. 中式步步锦直棂花窗贴图
    const latticeCanvas = document.createElement('canvas');
    latticeCanvas.width = 256;
    latticeCanvas.height = 256;
    const lCtx = latticeCanvas.getContext('2d')!;
    lCtx.fillStyle = '#0a101d';
    lCtx.fillRect(0, 0, 256, 256);

    const grad = lCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, '#7dd3fc');
    grad.addColorStop(0.7, '#0284c7');
    grad.addColorStop(1, '#0369a1');
    lCtx.fillStyle = grad;
    lCtx.fillRect(12, 12, 232, 232);

    lCtx.strokeStyle = '#d4af37';
    lCtx.lineWidth = 10;
    lCtx.strokeRect(12, 12, 232, 232);

    lCtx.lineWidth = 5;
    for (let x = 32; x < 232; x += 32) {
      lCtx.beginPath();
      lCtx.moveTo(x, 12); lCtx.lineTo(x, 244);
      lCtx.stroke();
    }
    for (let y = 32; y < 232; y += 32) {
      lCtx.beginPath();
      lCtx.moveTo(12, y); lCtx.lineTo(244, y);
      lCtx.stroke();
    }

    const latticeTex = new THREE.CanvasTexture(latticeCanvas);

    return { armorTex, latticeTex };
  }

  const { armorTex, latticeTex } = createProceduralTextures();

  // ================= 2. PBR 材质系统 =================
  const bronzeHullMat = new THREE.MeshStandardMaterial({
    map: armorTex,
    color: new THREE.Color('#333f4d'),
    roughness: 0.38,
    metalness: 0.72,
    side: THREE.DoubleSide,
  });
  materialsToTrack.push({ mat: bronzeHullMat, origParams: { color: '#333f4d', roughness: 0.38, metalness: 0.72 } });

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e5c158'),
    roughness: 0.22,
    metalness: 0.92,
  });
  materialsToTrack.push({ mat: goldTrimMat, origParams: { color: '#e5c158', roughness: 0.22, metalness: 0.92 } });

  const latticeWindowMat = new THREE.MeshStandardMaterial({
    map: latticeTex,
    color: new THREE.Color('#ffffff'),
    emissive: new THREE.Color('#0284c7'),
    emissiveIntensity: 1.5,
    roughness: 0.15,
    metalness: 0.1,
  });
  materialsToTrack.push({ mat: latticeWindowMat, origParams: { color: '#ffffff', emissive: '#0284c7', emissiveIntensity: 1.5 } });

  const coreOrbMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#bae6fd'),
    emissive: new THREE.Color('#0284c7'),
    emissiveIntensity: 3.5,
    roughness: 0.05,
    metalness: 0.1,
  });
  materialsToTrack.push({ mat: coreOrbMat, origParams: { color: '#bae6fd', emissive: '#0284c7', emissiveIntensity: 3.5 } });

  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#151b23'),
    roughness: 0.45,
    metalness: 0.85,
  });
  materialsToTrack.push({ mat: darkSteelMat, origParams: { color: '#151b23', roughness: 0.45, metalness: 0.85 } });

  function registerPart(obj: THREE.Object3D, explodeDir: THREE.Vector3, name: string, desc: string) {
    obj.userData = { name, desc };
    parts.push({
      mesh: obj,
      originPos: obj.position.clone(),
      explodeDir: explodeDir.clone().normalize(),
      name,
      desc,
    });
  }

  // ================= 3. 乾元主盘体 (完全封闭的 15m 饱满双曲抛物面碟身) =================
  const hullGroup = new THREE.Group();
  hullGroup.name = 'MainHullGroup';

  // 严格从顶部天池 (r=0) 到最大腰线 (r=7.5)，再到底部喷口中心 (r=0)
  // 形成完全封闭实心的空天碟形流线壳体
  const hullPoints: THREE.Vector2[] = [
    new THREE.Vector2(0.001, 1.45),  // 顶心
    new THREE.Vector2(1.2, 1.40),
    new THREE.Vector2(2.8, 1.25),
    new THREE.Vector2(4.5, 0.95),
    new THREE.Vector2(6.0, 0.55),
    new THREE.Vector2(7.2, 0.15),
    new THREE.Vector2(7.5, -0.05),  // 最大外径 (R=7.5m, 直径15m)
    new THREE.Vector2(7.2, -0.35),
    new THREE.Vector2(6.0, -0.75),
    new THREE.Vector2(4.5, -1.15),
    new THREE.Vector2(2.8, -1.45),
    new THREE.Vector2(1.2, -1.60),
    new THREE.Vector2(0.001, -1.65), // 底部中心封闭
  ];

  const hullGeom = new THREE.LatheGeometry(hullPoints, 64);
  hullGeom.computeVertexNormals();
  const hullMesh = new THREE.Mesh(hullGeom, bronzeHullMat);
  hullMesh.castShadow = true;
  hullMesh.receiveShadow = true;
  hullGroup.add(hullMesh);

  // 碟身赤金腰线重甲包边 (紧扣在 R=7.5, Y=-0.05 处)
  const rimGeom = new THREE.TorusGeometry(7.5, 0.14, 16, 96);
  rimGeom.rotateX(Math.PI * 0.5);
  const rimMesh = new THREE.Mesh(rimGeom, goldTrimMat);
  rimMesh.position.y = -0.05;
  hullGroup.add(rimMesh);

  // 碟盘上表面八卦放射状加强筋 (沿真实曲面弧线紧贴)
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const curvePoints: THREE.Vector3[] = [
      new THREE.Vector3(Math.cos(angle) * 1.8, 1.35, Math.sin(angle) * 1.8),
      new THREE.Vector3(Math.cos(angle) * 3.5, 1.15, Math.sin(angle) * 3.5),
      new THREE.Vector3(Math.cos(angle) * 5.2, 0.75, Math.sin(angle) * 5.2),
      new THREE.Vector3(Math.cos(angle) * 6.8, 0.25, Math.sin(angle) * 6.8),
      new THREE.Vector3(Math.cos(angle) * 7.45, -0.02, Math.sin(angle) * 7.45),
    ];
    const spline = new THREE.CatmullRomCurve3(curvePoints);
    const ribMesh = new THREE.Mesh(new THREE.TubeGeometry(spline, 24, 0.05, 8, false), goldTrimMat);
    hullGroup.add(ribMesh);
  }

  // ================= 4. 周天星宿舷窗 (内嵌深雕在碟身上表面 R=5.8m 处，与曲面切线严格贴合) =================
  const numWindows = 24;
  const winR = 5.85;
  const winY = 0.58;
  const winTilt = 0.26; // 贴合该半径处的曲面下倾角

  for (let w = 0; w < numWindows; w++) {
    const wAngle = (w / numWindows) * Math.PI * 2;
    const winGroup = new THREE.Group();
    winGroup.position.set(Math.cos(wAngle) * winR, winY, Math.sin(wAngle) * winR);
    winGroup.rotation.y = -wAngle + Math.PI * 0.5;
    winGroup.rotation.x = -winTilt; // 贴合曲面！

    // 深雕内嵌窗体 (宽1.4m, 高0.45m)
    const winGeom = new THREE.BoxGeometry(1.4, 0.42, 0.08);
    const winMesh = new THREE.Mesh(winGeom, latticeWindowMat);
    winGroup.add(winMesh);

    // 赤金窗框
    const frameGeom = new THREE.BoxGeometry(1.5, 0.50, 0.04);
    const frameMesh = new THREE.Mesh(frameGeom, goldTrimMat);
    frameMesh.position.z = -0.03;
    winGroup.add(frameMesh);

    hullGroup.add(winGroup);
  }

  root.add(hullGroup);
  registerPart(hullGroup, new THREE.Vector3(0, 0.1, 0), '乾元双曲流线重甲盘体', '直径15米饱满封闭式双曲面玄铁装甲盘身，内嵌周天24星宿步步锦棂花舷窗与八卦导流棱');

  // ================= 5. 天圆天象穹顶 (天坛祈年殿三层收分天枢顶 + 定风珠) =================
  const domeGroup = new THREE.Group();
  domeGroup.name = 'CelestialDomeGroup';
  domeGroup.position.set(0, 1.45, 0);

  // 一层承重基座重檐环
  const dBase = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 0.35, 32), goldTrimMat);
  dBase.position.y = 0.18;
  domeGroup.add(dBase);

  // 二层琉璃穹隆
  const dDome = new THREE.Mesh(new THREE.SphereGeometry(1.6, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.45), bronzeHullMat);
  dDome.position.y = 0.32;
  domeGroup.add(dDome);

  // 三层宝顶承盘
  const dPeak = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.75, 0.4, 24), goldTrimMat);
  dPeak.position.y = 1.35;
  domeGroup.add(dPeak);

  // 混元太极定风珠 / 反重力核心
  const orbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.48, 32, 32), coreOrbMat);
  orbMesh.position.y = 1.85;
  domeGroup.add(orbMesh);

  root.add(domeGroup);
  registerPart(domeGroup, new THREE.Vector3(0, 1, 0), '天象天枢穹顶', '三层祈年殿收分式天圆穹顶，顶心嵌有混元太极定风珠反重力核心');

  // ================= 6. 底部地火动力喷射环 =================
  const thrusterGroup = new THREE.Group();
  thrusterGroup.name = 'ThrusterGroup';
  thrusterGroup.position.set(0, -1.65, 0);

  const ringCore = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.3, 16, 48), goldTrimMat);
  ringCore.rotation.x = Math.PI * 0.5;
  thrusterGroup.add(ringCore);

  const flameCore = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 0.6, 0.6, 32, 1, true), coreOrbMat);
  flameCore.position.y = -0.2;
  thrusterGroup.add(flameCore);

  root.add(thrusterGroup);
  registerPart(thrusterGroup, new THREE.Vector3(0, -1, 0), '混元地火动力环', '底部中心多级离子地火喷射动力环，雕刻回纹控流导板');

  // ================= 7. 三足鼎立起落架 (高2.3m，120°分布，三才金刚鼎足) =================
  const landingGearGroup = new THREE.Group();
  landingGearGroup.name = 'LandingGearGroup';

  const gearUnits: THREE.Group[] = [];

  for (let g = 0; g < 3; g++) {
    const gAngle = (g / 3) * Math.PI * 2;
    const gearUnit = new THREE.Group();
    gearUnit.name = `GearUnit_${g + 1}`;

    const anchorR = 4.5;
    const anchorY = -1.15;
    gearUnit.position.set(Math.cos(gAngle) * anchorR, anchorY, Math.sin(gAngle) * anchorR);
    gearUnit.rotation.y = -gAngle + Math.PI * 0.5;

    // A. 青铜饕餮轴承法兰套筒
    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.35, 16), goldTrimMat);
    socket.rotation.z = Math.PI * 0.5;
    gearUnit.add(socket);

    // B. 液压主支撑臂 (高约 2.3m)
    const legArmGroup = new THREE.Group();
    legArmGroup.name = 'LegArmGroup';

    const upperPiston = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.20, 1.2, 16), darkSteelMat);
    upperPiston.position.y = -0.6;
    legArmGroup.add(upperPiston);

    const lowerPiston = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.1, 16), goldTrimMat);
    lowerPiston.position.y = -1.35;
    legArmGroup.add(lowerPiston);

    // C. 三爪金刚接地鼎足
    const footPad = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.68, 0.22, 6), darkSteelMat);
    footPad.position.y = -2.0;
    legArmGroup.add(footPad);

    // 鼎足三个咬地金刚爪
    for (let c = 0; c < 3; c++) {
      const cAngle = (c / 3) * Math.PI * 2;
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 4), goldTrimMat);
      claw.rotation.z = Math.PI * 0.75;
      claw.rotation.y = cAngle;
      claw.position.set(Math.cos(cAngle) * 0.5, -2.1, Math.sin(cAngle) * 0.5);
      legArmGroup.add(claw);
    }

    gearUnit.add(legArmGroup);
    gearUnits.push(gearUnit);
    landingGearGroup.add(gearUnit);
  }

  root.add(landingGearGroup);
  registerPart(landingGearGroup, new THREE.Vector3(0, -0.8, 0), '三才金刚鼎立起落架', '高2.3米三足鼎立重载起落架，配饕餮纹转轴与金刚三爪液压减震足');

  // ================= 8. 动画与控制逻辑 =================
  let currentGearProgress = 0;

  function setLandingGearProgress(progress: number) {
    currentGearProgress = Math.max(0, Math.min(1, progress));
    gearUnits.forEach((gu) => {
      const legArm = gu.getObjectByName('LegArmGroup');
      if (legArm) {
        legArm.rotation.x = -currentGearProgress * (Math.PI * 0.45);
        legArm.position.y = currentGearProgress * 0.8;
      }
    });
  }

  function updateAnimation(delta: number) {
    if (orbMesh) {
      orbMesh.rotation.y += delta * 1.2;
    }
    if (flameCore) {
      flameCore.rotation.y -= delta * 0.8;
    }
  }

  // ================= 9. 双模式渲染材质切换 =================
  function setRenderMode(mode: 'bronze' | 'blueprint') {
    if (mode === 'blueprint') {
      materialsToTrack.forEach(({ mat }) => {
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.wireframe = true;
          mat.color.set('#000000');
          mat.emissive.set('#1e293b');
        }
      });
    } else {
      materialsToTrack.forEach(({ mat, origParams }) => {
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.wireframe = false;
          mat.color.set(origParams.color);
          if (origParams.emissive) {
            mat.emissive.set(origParams.emissive);
            mat.emissiveIntensity = origParams.emissiveIntensity || 0;
          } else {
            mat.emissive.set('#000000');
          }
          mat.roughness = origParams.roughness || 0.38;
          mat.metalness = origParams.metalness || 0.72;
        }
      });
    }
  }

  return {
    root,
    parts,
    landingGearGroup,
    updateAnimation,
    setLandingGearProgress,
    setRenderMode,
  };
}
