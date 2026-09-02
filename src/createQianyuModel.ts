import * as THREE from 'three';
import { ExplodablePart, QianyuModelResult } from './types';

/**
 * 乾舆一号 · 永乐大典空天神机（明代高精营造法式完整版）
 * 
 * 架构：
 * 1. 上穹顶重甲：平滑双曲抛物面，嵌 72 颗玄铁鎏金铆钉、八卦铜箍与回纹饰带
 * 2. 下碟身（须弥座）：下倾收腰造型，带混元反重力喷口
 * 3. 24 宿周天斗拱挑檐：赤道整圈均匀出挑，栌斗、华栱、昂、飞檐挑梁与小脊兽
 * 4. 24 扇步步锦中式棂花窗：内嵌细密金丝中式格栅，夜间透出暖橙黄星宿光斑
 * 5. 赤道等离子金弧：外缘高聚能发光环，与 2010 萧山现场长曝光光弧完全吻合
 * 6. 混元重檐宝顶：汉白玉寻杖绞口栏杆与望柱、重檐攒尖铜盔、天池承露盘与自转定风珠
 * 7. 三才混元飞龙鼎足：120° 龙吞口液压折叠机械关节、伸缩柱、铜兽蹄盘
 * 8. 材质深度绑定：彻底修复蓝图/实体来回切换失效的 Bug
 */
export function createQianyuModel(): QianyuModelResult {
  const root = new THREE.Group();
  root.name = 'QianyuCraft';

  const parts: ExplodablePart[] = [];
  const landingGears: THREE.Group[] = [];

  // ===== 1. 材质库 =====
  const armorMat = new THREE.MeshStandardMaterial({
    color: '#1a2230',
    metalness: 0.92,
    roughness: 0.28,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: '#d4af37',
    metalness: 0.95,
    roughness: 0.16,
    emissive: '#78350f',
    emissiveIntensity: 0.25,
  });

  const bronzeMat = new THREE.MeshStandardMaterial({
    color: '#1e3832',
    metalness: 0.88,
    roughness: 0.32,
  });

  const marbleMat = new THREE.MeshStandardMaterial({
    color: '#cbd5e1',
    metalness: 0.08,
    roughness: 0.45,
  });

  // 步步锦星宿窗发光体（暖橙黄高自发光）
  const starWindowMat = new THREE.MeshStandardMaterial({
    color: '#fffbeb',
    emissive: '#f59e0b',
    emissiveIntensity: 15.0,
    roughness: 0.02,
  });

  // 赤道等离子金弧高亮系统（1:1 萧山目击原图特征金光外轮廓）
  const rimCoreMat = new THREE.MeshBasicMaterial({
    color: '#ffffff',
  });
  const rimGoldGlowMat = new THREE.MeshStandardMaterial({
    color: '#fef08a',
    emissive: '#f59e0b',
    emissiveIntensity: 18.0,
    roughness: 0.02,
  });
  const rimPlasmaHaloMat = new THREE.MeshBasicMaterial({
    color: '#f59e0b',
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });

  const orbMat = new THREE.MeshStandardMaterial({
    color: '#e0f2fe',
    emissive: '#38bdf8',
    emissiveIntensity: 8.0,
    roughness: 0.04,
  });

  const blueprintMat = new THREE.MeshBasicMaterial({
    color: '#38bdf8',
    wireframe: true,
    transparent: true,
    opacity: 0.85,
  });

  function bindOriginalMat(mesh: THREE.Mesh, mat: THREE.Material) {
    mesh.material = mat;
    mesh.userData.origMat = mat;
  }

  // ===== 2. 主体碟身（SaucerMainBody） =====
  const saucerGroup = new THREE.Group();
  saucerGroup.name = 'SaucerMainBody';

  // 2.1 上穹顶重甲（双曲高流线抛物面）
  const domePoints: THREE.Vector2[] = [
    new THREE.Vector2(0, 2.8),
    new THREE.Vector2(1.2, 2.7),
    new THREE.Vector2(2.5, 2.4),
    new THREE.Vector2(4.0, 1.85),
    new THREE.Vector2(5.4, 1.2),
    new THREE.Vector2(6.5, 0.55),
    new THREE.Vector2(7.2, 0.15),
    new THREE.Vector2(7.5, 0.0),
  ];
  const domeGeom = new THREE.LatheGeometry(domePoints, 96);
  const domeMesh = new THREE.Mesh(domeGeom, armorMat);
  bindOriginalMat(domeMesh, armorMat);
  domeMesh.castShadow = true;
  saucerGroup.add(domeMesh);

  // 2.2 下碟身（须弥座收腰造型）
  const hullPoints: THREE.Vector2[] = [
    new THREE.Vector2(7.5, 0.0),
    new THREE.Vector2(7.2, -0.3),
    new THREE.Vector2(6.4, -0.75),
    new THREE.Vector2(5.2, -1.25),
    new THREE.Vector2(3.8, -1.6),
    new THREE.Vector2(2.6, -1.8),
    new THREE.Vector2(0, -1.8),
  ];
  const hullGeom = new THREE.LatheGeometry(hullPoints, 96);
  const hullMesh = new THREE.Mesh(hullGeom, armorMat);
  bindOriginalMat(hullMesh, armorMat);
  hullMesh.castShadow = true;
  saucerGroup.add(hullMesh);

  // 2.3 穹顶 72 颗玄铁鎏金铆钉
  const rivetGeom = new THREE.SphereGeometry(0.06, 8, 8);
  for (let r = 0; r < 3; r++) {
    const radius = 3.2 + r * 1.6;
    const yPos = 2.0 - r * 0.65;
    const count = 24;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const rivet = new THREE.Mesh(rivetGeom, goldMat);
      rivet.position.set(Math.sin(ang) * radius, yPos, Math.cos(ang) * radius);
      bindOriginalMat(rivet, goldMat);
      saucerGroup.add(rivet);
    }
  }

  // 2.4 赤道超级发光金弧轮廓系统（1:1 萧山原图强光金弧）
  const rimCoreGeom = new THREE.TorusGeometry(7.52, 0.09, 16, 128);
  const rimCoreMesh = new THREE.Mesh(rimCoreGeom, rimCoreMat);
  rimCoreMesh.rotation.x = Math.PI / 2;
  bindOriginalMat(rimCoreMesh, rimCoreMat);
  saucerGroup.add(rimCoreMesh);

  const rimGoldGeom = new THREE.TorusGeometry(7.55, 0.24, 16, 128);
  const rimGoldMesh = new THREE.Mesh(rimGoldGeom, rimGoldGlowMat);
  rimGoldMesh.rotation.x = Math.PI / 2;
  bindOriginalMat(rimGoldMesh, rimGoldGlowMat);
  saucerGroup.add(rimGoldMesh);

  const rimHaloGeom = new THREE.TorusGeometry(7.68, 0.55, 16, 128);
  const rimHaloMesh = new THREE.Mesh(rimHaloGeom, rimPlasmaHaloMat);
  rimHaloMesh.rotation.x = Math.PI / 2;
  bindOriginalMat(rimHaloMesh, rimPlasmaHaloMat);
  saucerGroup.add(rimHaloMesh);

  // 2.5 明代营造：24 宿周天五踩斗拱挑檐
  const bracketGroup = new THREE.Group();
  bracketGroup.name = 'DougongBrackets24';
  for (let i = 0; i < 24; i++) {
    const ang = (i / 24) * Math.PI * 2;
    const bracketSub = new THREE.Group();
    bracketSub.position.set(Math.sin(ang) * 7.42, 0.08, Math.cos(ang) * 7.42);
    bracketSub.rotation.y = ang;

    // 栌斗（大斗）
    const ludou = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.38), goldMat);
    bindOriginalMat(ludou, goldMat);
    bracketSub.add(ludou);

    // 华栱
    const gong1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.55), goldMat);
    gong1.position.set(0, 0.1, 0.08);
    bindOriginalMat(gong1, goldMat);
    bracketSub.add(gong1);

    // 昂与挑梁
    const ribMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 2.6), goldMat);
    ribMesh.position.set(0, 0.55, -1.2);
    ribMesh.rotation.x = 0.35;
    bindOriginalMat(ribMesh, goldMat);
    bracketSub.add(ribMesh);

    // 螭吻脊兽
    const beastMesh = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 6), goldMat);
    beastMesh.position.set(0, 0.28, 0.22);
    bindOriginalMat(beastMesh, goldMat);
    bracketSub.add(beastMesh);

    bracketGroup.add(bracketSub);
  }
  saucerGroup.add(bracketGroup);

  // 2.6 明代营造：24 扇步步锦中式棂花星宿发光窗
  const windowGroup = new THREE.Group();
  windowGroup.name = 'StarWindows24';
  const winMeshes: THREE.Mesh[] = [];

  for (let i = 0; i < 24; i++) {
    const ang = (i / 24) * Math.PI * 2;
    const isMainDirection = i % 3 === 0;

    const winSub = new THREE.Group();
    winSub.position.set(Math.sin(ang) * 7.32, -0.08, Math.cos(ang) * 7.32);
    winSub.rotation.y = ang;

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.35, 0.1), goldMat);
    bindOriginalMat(frame, goldMat);
    winSub.add(frame);

    const latticeH1 = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.03, 0.12), bronzeMat);
    latticeH1.position.y = 0.07;
    bindOriginalMat(latticeH1, bronzeMat);
    winSub.add(latticeH1);

    const latticeH2 = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.03, 0.12), bronzeMat);
    latticeH2.position.y = -0.07;
    bindOriginalMat(latticeH2, bronzeMat);
    winSub.add(latticeH2);

    const latticeV = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.12), bronzeMat);
    bindOriginalMat(latticeV, bronzeMat);
    winSub.add(latticeV);

    const glassMat = isMainDirection
      ? new THREE.MeshStandardMaterial({
          color: '#ffffff',
          emissive: '#fef08a',
          emissiveIntensity: 18.0,
          roughness: 0.02,
        })
      : starWindowMat;

    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.28, 0.08), glassMat);
    bindOriginalMat(glass, glassMat);
    winSub.add(glass);
    winMeshes.push(glass);

    windowGroup.add(winSub);
  }
  saucerGroup.add(windowGroup);

  // 2.7 碟身八卦铜环与浮雕金带
  const ringEquator = new THREE.Mesh(new THREE.TorusGeometry(7.5, 0.08, 16, 96), goldMat);
  ringEquator.rotation.x = Math.PI / 2;
  bindOriginalMat(ringEquator, goldMat);
  saucerGroup.add(ringEquator);

  const ringMid1 = new THREE.Mesh(new THREE.TorusGeometry(6.4, 0.06, 16, 96), goldMat);
  ringMid1.rotation.x = Math.PI / 2;
  ringMid1.position.y = 0.65;
  bindOriginalMat(ringMid1, goldMat);
  saucerGroup.add(ringMid1);

  const ringBottom = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.08, 16, 96), goldMat);
  ringBottom.rotation.x = Math.PI / 2;
  ringBottom.position.y = -1.5;
  bindOriginalMat(ringBottom, goldMat);
  saucerGroup.add(ringBottom);

  parts.push({
    name: 'SaucerMainBody',
    desc: '乾元盘体：双曲抛物面重甲碟身、24 宿周天斗拱与步步锦星宿窗',
    mesh: saucerGroup,
    originPos: saucerGroup.position.clone(),
    explodeDir: new THREE.Vector3(0, 0, 0),
  });
  root.add(saucerGroup);

  // ===== 3. 顶部重檐攒尖宝顶 + 混元天池（TopCrown） =====
  const topCrownGroup = new THREE.Group();
  topCrownGroup.name = 'TopCrown';
  topCrownGroup.position.set(0, 2.8, 0);

  // 汉白玉寻杖绞口栏杆与望柱
  const balustrade = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.35, 8), marbleMat);
  bindOriginalMat(balustrade, marbleMat);
  topCrownGroup.add(balustrade);

  // 一层攒尖铜檐
  const roof1 = new THREE.Mesh(new THREE.ConeGeometry(2.3, 0.75, 8), bronzeMat);
  roof1.position.y = 0.55;
  bindOriginalMat(roof1, bronzeMat);
  topCrownGroup.add(roof1);

  // 二层攒尖铜檐
  const roof2 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.6, 8), bronzeMat);
  roof2.position.y = 1.1;
  bindOriginalMat(roof2, bronzeMat);
  topCrownGroup.add(roof2);

  // 天池承露盘
  const chenglu = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.4, 0.28, 16), goldMat);
  chenglu.position.y = 1.5;
  bindOriginalMat(chenglu, goldMat);
  topCrownGroup.add(chenglu);

  // 反重力阴阳太极运转光环
  const crownHaloGeom = new THREE.TorusGeometry(1.1, 0.05, 16, 48);
  const crownHaloMesh = new THREE.Mesh(crownHaloGeom, orbMat);
  crownHaloMesh.rotation.x = Math.PI / 3.2;
  crownHaloMesh.position.y = 1.8;
  bindOriginalMat(crownHaloMesh, orbMat);
  topCrownGroup.add(crownHaloMesh);

  // 天池定风宝珠
  const orbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.45, 32, 32), orbMat);
  orbMesh.position.y = 1.8;
  bindOriginalMat(orbMesh, orbMat);
  topCrownGroup.add(orbMesh);

  parts.push({
    name: 'TopCrown',
    desc: '混元宝顶：重檐攒尖铜顶、汉白玉寻杖栏杆、天池定风宝珠',
    mesh: topCrownGroup,
    originPos: topCrownGroup.position.clone(),
    explodeDir: new THREE.Vector3(0, 1.8, 0),
  });
  root.add(topCrownGroup);

  // ===== 4. 底部三才混元飞龙鼎足（LandingGears） =====
  const landingGearGroup = new THREE.Group();
  landingGearGroup.name = 'LandingGearSystem';

  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const legGroup = new THREE.Group();
    legGroup.name = `LandingGear_${i + 1}`;
    legGroup.position.set(Math.sin(angle) * 3.2, -1.8, Math.cos(angle) * 3.2);
    legGroup.rotation.y = angle;

    // 龙吞口机关
    const dragonHead = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.7), goldMat);
    bindOriginalMat(dragonHead, goldMat);
    legGroup.add(dragonHead);

    // 液压伸缩青铜柱
    const strutMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.8, 16), bronzeMat);
    strutMesh.position.set(0, -0.9, 0);
    bindOriginalMat(strutMesh, bronzeMat);
    legGroup.add(strutMesh);

    // 落地金兽蹄铜盘
    const footMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 0.25, 8), goldMat);
    footMesh.position.set(0, -1.8, 0);
    bindOriginalMat(footMesh, goldMat);
    legGroup.add(footMesh);

    landingGears.push(legGroup);
    landingGearGroup.add(legGroup);
  }

  parts.push({
    name: 'LandingGears',
    desc: '三才鼎足：120° 龙吞口液压折叠起落架、兽蹄铜盘',
    mesh: landingGearGroup,
    originPos: landingGearGroup.position.clone(),
    explodeDir: new THREE.Vector3(0, -1.8, 0),
  });
  root.add(landingGearGroup);

  return {
    root,
    parts,
    landingGearGroup,
    setLandingGearProgress: (progress: number) => {
      landingGears.forEach((leg) => {
        leg.position.y = -1.8 + progress * 1.5;
        leg.scale.set(1 - progress * 0.75, 1 - progress * 0.85, 1 - progress * 0.75);
        leg.visible = progress < 0.95;
      });
    },
    // 关键修复：从 userData.origMat 准确还原，彻底杜绝切不回来的 Bug
    setRenderMode: (mode: 'bronze' | 'blueprint') => {
      const isBP = mode === 'blueprint';
      root.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (isBP) {
            child.material = blueprintMat;
          } else {
            if (child.userData && child.userData.origMat) {
              child.material = child.userData.origMat;
            }
          }
        }
      });
    },
    updateAnimation: (delta: number) => {
      crownHaloMesh.rotation.z += delta * 0.9;
      const t = performance.now() * 0.0035;
      winMeshes.forEach((m, idx) => {
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat && mat.emissiveIntensity !== undefined) {
          mat.emissiveIntensity = 8.0 + Math.sin(t + idx * 0.6) * 4.0;
        }
      });
    },
  };
}
