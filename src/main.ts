import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createQianyuModel } from './createQianyuModel';

// ===== 渲染器 =====
const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#030814');
scene.fog = new THREE.FogExp2('#030814', 0.0004);

// ===== 相机：侧面观察，让碟形剖面清晰可见 =====
// 关键：camera y ≈ 飞碟 y，水平距离拉远，视角略仰，这样能看到碟形侧面轮廓
// 飞碟放在 y=0，相机在 y=-2（略低于飞碟赤道），z=55，能看到侧面碟形
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(-30, -2, 55);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI * 0.95;
controls.minDistance = 2;
controls.maxDistance = 500;
controls.target.set(0, 4, 0);
controls.update();

// ===== 光照 =====
const ambientLight = new THREE.AmbientLight('#ffffff', 0.6);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight('#c8d8ff', 2.2);
moonLight.position.set(30, 40, 20);
scene.add(moonLight);

// 从左前方补光，凸显穹顶体积感
const fillLight = new THREE.DirectionalLight('#fbbf24', 1.5);
fillLight.position.set(-25, 15, 30);
scene.add(fillLight);

// 飞碟底部引擎蓝光
const ufoGlow = new THREE.PointLight('#38bdf8', 4.0, 80);
ufoGlow.position.set(0, -3, 0);
scene.add(ufoGlow);

// ===== 乾舆飞碟 =====
// 飞碟放大 1.8 倍，让碟形在画面中占据足够分量
const qianyu = createQianyuModel();
qianyu.root.position.set(0, 0, 0);
qianyu.root.rotation.set(0.0, -0.3, 0.14);
qianyu.root.scale.setScalar(1.8);
scene.add(qianyu.root);
qianyu.setLandingGearProgress(1.0);

// ===== 萧山机场夜景（地面在 y=-12，地平线在画面下方）=====
const airportGroup = new THREE.Group();

// 1. 黑色地坪
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(3000, 3000),
  new THREE.MeshStandardMaterial({ color: '#010205', roughness: 1.0 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -12;
airportGroup.add(ground);

// 2. 地平线灯光：改成分段式，对应原图断续灯光效果
// 航站楼主体（中心段）
const terminal = new THREE.Mesh(
  new THREE.BoxGeometry(200, 2.5, 2),
  new THREE.MeshBasicMaterial({ color: '#f59e0b' })
);
terminal.position.set(-40, -11.5, -100);
airportGroup.add(terminal);

// 航站楼右翼
const terminalR = new THREE.Mesh(
  new THREE.BoxGeometry(120, 2.0, 2),
  new THREE.MeshBasicMaterial({ color: '#d97706' })
);
terminalR.position.set(160, -11.8, -100);
airportGroup.add(terminalR);

// 廊桥亮带（顶层细条）
const terminal2 = new THREE.Mesh(
  new THREE.BoxGeometry(180, 0.8, 1),
  new THREE.MeshBasicMaterial({ color: '#fbbf24' })
);
terminal2.position.set(-40, -9.5, -100);
airportGroup.add(terminal2);

// 3. 左侧塔台
const towerBody = new THREE.Mesh(
  new THREE.CylinderGeometry(0.7, 1.0, 22, 8),
  new THREE.MeshBasicMaterial({ color: '#1e2d40' })
);
towerBody.position.set(-160, -2, -100);
airportGroup.add(towerBody);

const towerTopLight = new THREE.Mesh(
  new THREE.SphereGeometry(1.5, 8, 8),
  new THREE.MeshBasicMaterial({ color: '#fef08a' })
);
towerTopLight.position.set(-160, 8, -100);
airportGroup.add(towerTopLight);

// 4. 地平线散点暖灯
const ptGeom = new THREE.SphereGeometry(0.35, 6, 6);
const ptMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });
for (let i = 0; i < 70; i++) {
  const pt = new THREE.Mesh(ptGeom, ptMat);
  pt.position.set(
    (Math.random() - 0.5) * 450,
    -11.5,
    -70 - Math.random() * 90
  );
  airportGroup.add(pt);
}

// 5. 跑道绿色导航灯
const greenGeom = new THREE.SphereGeometry(0.25, 6, 6);
const greenMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
for (let z = -8; z >= -120; z -= 25) {
  [-70, 70].forEach((x) => {
    const g = new THREE.Mesh(greenGeom, greenMat);
    g.position.set(x, -11.8, z);
    airportGroup.add(g);
  });
}

scene.add(airportGroup);

// ===== 展台辅助网格 =====
const gridHelper = new THREE.GridHelper(40, 20, '#d4af37', '#1e293b');
gridHelper.position.y = -5.5;
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
  scene.background = new THREE.Color('#030814');
  scene.fog = new THREE.FogExp2('#030814', 0.0004);

  camera.position.set(-30, -2, 55);
  controls.target.set(0, 4, 0);
  qianyu.root.position.set(0, 0, 0);
  qianyu.root.rotation.set(0.0, -0.3, 0.14);
  qianyu.root.scale.setScalar(1.8);
  ufoGlow.position.set(0, -3, 0);
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

  camera.position.set(18, 6, 25);
  controls.target.set(0, 1.5, 0);
  qianyu.root.position.set(0, 0, 0);
  qianyu.root.rotation.set(0, 0, 0);
  qianyu.root.scale.setScalar(1.0);
  ufoGlow.position.set(0, -3, 0);
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
    p.mesh.position.copy(
      isExploded ? p.originPos.clone().add(p.explodeDir.clone().multiplyScalar(5)) : p.originPos
    );
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
    // 悬浮漂移（在 y=0 附近微幅上下）
    const floatY = Math.sin(time * 1.4) * 0.8;
    qianyu.root.position.y = floatY;
    ufoGlow.position.y = -3 + floatY;
    // 极微幅姿态抖动
    qianyu.root.rotation.z = 0.14 + Math.sin(time * 0.85) * 0.01;
  } else {
    qianyu.root.rotation.y += 0.005;
  }

  qianyu.updateAnimation(delta);
  renderer.render(scene, camera);
}

updateSceneUI('airport');
animate();
