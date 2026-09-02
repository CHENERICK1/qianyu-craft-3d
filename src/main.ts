import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createQianyuModel } from './createQianyuModel';

// ===== 渲染器 =====
const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#020409');
scene.fog = new THREE.FogExp2('#020409', 0.003);

// ===== 相机：模拟实拍视角 =====
// 原图：站在跑道边（低位），抬头仰望，飞碟在画面上方 2/3 处掠过
// 相机 y = -5（低于地面），仰角望向 y=20 的飞碟
const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(-22, -5, 60);

// ===== OrbitControls =====
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI * 0.95;
controls.minDistance = 2;
controls.maxDistance = 600;
controls.target.set(0, 18, 0);
controls.update();

// ===== 光照 =====
const ambientLight = new THREE.AmbientLight('#ffffff', 0.55);
scene.add(ambientLight);

// 月光主灯（斜 45° 从右上照向飞碟）
const moonLight = new THREE.DirectionalLight('#b0c8ff', 2.0);
moonLight.position.set(30, 50, 20);
scene.add(moonLight);

// 侧补光（左前方，凸显穹顶层次）
const rimLight = new THREE.SpotLight('#fbbf24', 4.5, 180, Math.PI * 0.20);
rimLight.position.set(-35, 38, 35);
rimLight.target.position.set(0, 18, 0);
scene.add(rimLight);
scene.add(rimLight.target);

// 飞碟自发光点光（蓝白色，向下照亮机腹与地面）
const ufoGlow = new THREE.PointLight('#38bdf8', 6.0, 100);
ufoGlow.position.set(0, 16, 0);
scene.add(ufoGlow);

// ===== 乾舆飞碟模型 =====
const qianyu = createQianyuModel();
// 位置：夜空高位，偏右，对应原图飞碟在画面右上区域
qianyu.root.position.set(5, 20, -5);
// 姿态：轻微向右前方倾斜飞行，保持碟形清晰可辨
qianyu.root.rotation.set(0.05, -0.30, 0.08);
qianyu.root.scale.setScalar(1.6);
scene.add(qianyu.root);
qianyu.setLandingGearProgress(1.0);

// ===== 萧山机场夜景 (严格对照实拍原图) =====
// 原图特征：
//   - 画面下 1/3：极暗地面
//   - 地平线处：一条橙黄色连续灯光带（航站楼/廊桥背光）
//   - 左侧：细塔（机场塔台）顶有指示灯
//   - 散布橙黄暖光点（机坪/停车场）
//   - 全画面极暗，只有这些点光和地平线亮带
const airportGroup = new THREE.Group();

// 1. 黑色地坪
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(3000, 3000),
  new THREE.MeshStandardMaterial({ color: '#010205', roughness: 1.0 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -9;
airportGroup.add(ground);

// 2. 地平线橙黄灯光带（航站楼）
// 距相机约 180m，高度 -8.5（接近地平线但在相机仰视范围内）
const terminalGeom = new THREE.BoxGeometry(420, 2.5, 3);
const terminalMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });
const terminal = new THREE.Mesh(terminalGeom, terminalMat);
terminal.position.set(0, -8.5, -180);
airportGroup.add(terminal);

// 航站楼上方第二条细亮带（廊桥内透光）
const terminal2 = new THREE.Mesh(
  new THREE.BoxGeometry(380, 0.8, 2),
  new THREE.MeshBasicMaterial({ color: '#fbbf24' })
);
terminal2.position.set(0, -6.5, -180);
airportGroup.add(terminal2);

// 3. 左侧机场塔台（对应原图左侧细高塔）
const towerBody = new THREE.Mesh(
  new THREE.CylinderGeometry(0.7, 1.0, 20, 8),
  new THREE.MeshBasicMaterial({ color: '#1e2d40' })
);
towerBody.position.set(-170, -0.5, -180);
airportGroup.add(towerBody);

// 塔台顶部指示灯球
const towerLight = new THREE.Mesh(
  new THREE.SphereGeometry(1.2, 8, 8),
  new THREE.MeshBasicMaterial({ color: '#fef08a' })
);
towerLight.position.set(-170, 10, -180);
airportGroup.add(towerLight);

// 4. 地平线散点暖光（机坪/机场周边灯）
const ptGeom = new THREE.SphereGeometry(0.35, 6, 6);
const ptMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });
for (let i = 0; i < 60; i++) {
  const pt = new THREE.Mesh(ptGeom, ptMat);
  pt.position.set(
    (Math.random() - 0.5) * 420,
    -8.6,
    -140 - Math.random() * 100
  );
  airportGroup.add(pt);
}

// 5. 跑道边绿色导航灯（对应原图地面零星绿点）
const greenGeom = new THREE.SphereGeometry(0.25, 6, 6);
const greenMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
for (let z = -30; z >= -180; z -= 35) {
  [-75, 75].forEach((x) => {
    const g = new THREE.Mesh(greenGeom, greenMat);
    g.position.set(x, -8.8, z);
    airportGroup.add(g);
  });
}

scene.add(airportGroup);

// ===== 展台辅助网格 =====
const gridHelper = new THREE.GridHelper(40, 20, '#d4af37', '#1e293b');
gridHelper.visible = false;
scene.add(gridHelper);

// ===== 交互状态 =====
let currentSceneMode: 'airport' | 'exhibition' = 'airport';
let isBlueprintMode = false;
let isLandingGearRetracted = true;
let isExploded = false;

function setAirportView() {
  airportGroup.visible = true;
  gridHelper.visible = false;
  scene.background = new THREE.Color('#020409');
  scene.fog = new THREE.FogExp2('#020409', 0.003);

  camera.position.set(-22, -5, 60);
  controls.target.set(0, 18, 0);
  qianyu.root.position.set(5, 20, -5);
  qianyu.root.rotation.set(0.05, -0.30, 0.08);
  qianyu.root.scale.setScalar(1.6);
  ufoGlow.position.set(5, 18, -5);
  rimLight.target.position.set(5, 18, -5);
  qianyu.setLandingGearProgress(1.0);

  const tag = document.getElementById('timestamp-tag');
  const title = document.getElementById('scene-title');
  const sub = document.getElementById('scene-subtitle');
  if (tag) tag.style.display = 'block';
  if (title) title.innerText = '2010 萧山机场 UFO 还原现场';
  if (sub) sub.innerText = '杭州萧山国际机场空中目击事件 · 乾舆神机夜空掠影模拟';
}

function setExhibitionView() {
  airportGroup.visible = false;
  gridHelper.visible = true;
  scene.background = new THREE.Color('#0d1117');
  scene.fog = null as any;

  camera.position.set(18, 10, 26);
  controls.target.set(0, 2, 0);
  qianyu.root.position.set(0, 3, 0);
  qianyu.root.rotation.set(0, 0, 0);
  qianyu.root.scale.setScalar(1.0);
  ufoGlow.position.set(0, 2, 0);
  rimLight.target.position.set(0, 3, 0);
  qianyu.setLandingGearProgress(0.0);

  const tag = document.getElementById('timestamp-tag');
  const title = document.getElementById('scene-title');
  const sub = document.getElementById('scene-subtitle');
  if (tag) tag.style.display = 'none';
  if (title) title.innerText = '乾舆一号 · 永乐营造飞舆展台';
  if (sub) sub.innerText = '永乐天工秘录 · 混元乾坤飞舆营构图谱';
}

function updateSceneUI(mode: 'airport' | 'exhibition') {
  currentSceneMode = mode;
  if (mode === 'airport') setAirportView();
  else setExhibitionView();
  controls.update();
}

// 按钮绑定
document.getElementById('btn-scene-toggle')?.addEventListener('click', () => {
  updateSceneUI(currentSceneMode === 'airport' ? 'exhibition' : 'airport');
});

document.getElementById('btn-render-mode')?.addEventListener('click', () => {
  isBlueprintMode = !isBlueprintMode;
  qianyu.setRenderMode(isBlueprintMode ? 'blueprint' : 'bronze');
  document.getElementById('btn-render-mode')?.classList.toggle('active', isBlueprintMode);
});

document.getElementById('btn-landing-gear')?.addEventListener('click', () => {
  isLandingGearRetracted = !isLandingGearRetracted;
  qianyu.setLandingGearProgress(isLandingGearRetracted ? 1.0 : 0.0);
  document.getElementById('btn-landing-gear')?.classList.toggle('active', isLandingGearRetracted);
});

document.getElementById('btn-explode')?.addEventListener('click', () => {
  isExploded = !isExploded;
  qianyu.parts.forEach((p) => {
    const target = isExploded
      ? p.originPos.clone().add(p.explodeDir.clone().multiplyScalar(5))
      : p.originPos;
    p.mesh.position.copy(target);
  });
  document.getElementById('btn-explode')?.classList.toggle('active', isExploded);
});

document.getElementById('btn-reset-view')?.addEventListener('click', () => {
  updateSceneUI(currentSceneMode);
});

// ===== 渲染循环 =====
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();
  controls.update();

  if (currentSceneMode === 'airport') {
    // 缓慢悬浮
    const floatY = Math.sin(time * 1.4) * 0.9;
    qianyu.root.position.y = 20 + floatY;
    ufoGlow.position.y = 18 + floatY;
    // 极微幅倾斜抖动
    qianyu.root.rotation.z = 0.08 + Math.sin(time * 0.85) * 0.012;
  } else {
    qianyu.root.rotation.y += 0.005;
  }

  qianyu.updateAnimation(delta);
  renderer.render(scene, camera);
}

updateSceneUI('airport');
animate();
