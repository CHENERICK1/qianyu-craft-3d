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
// 极低雾浓度，只做远景消隐，不遮挡地平线灯光
scene.fog = new THREE.FogExp2('#020409', 0.0005);

// ===== 相机：大仰角仰望夜空 =====
// 复现实拍原图视角：站在跑道边低位，大仰角看飞碟掠过
const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(-25, -8, 55);

// ===== OrbitControls =====
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI * 0.95;
controls.minDistance = 2;
controls.maxDistance = 600;
controls.target.set(0, 22, 0);  // 目标高位，确保大仰角
controls.update();

// ===== 光照 =====
const ambientLight = new THREE.AmbientLight('#ffffff', 0.55);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight('#b0c8ff', 2.0);
moonLight.position.set(30, 50, 20);
scene.add(moonLight);

const rimLight = new THREE.SpotLight('#fbbf24', 5.0, 200, Math.PI * 0.18);
rimLight.position.set(-35, 42, 35);
rimLight.target.position.set(4, 20, -5);
scene.add(rimLight);
scene.add(rimLight.target);

const ufoGlow = new THREE.PointLight('#38bdf8', 5.0, 100);
ufoGlow.position.set(4, 20, -5);
scene.add(ufoGlow);

// ===== 乾舆飞碟 =====
const qianyu = createQianyuModel();
qianyu.root.position.set(4, 22, -5);
qianyu.root.rotation.set(0.05, -0.25, 0.09);
qianyu.root.scale.setScalar(1.8);
scene.add(qianyu.root);
qianyu.setLandingGearProgress(1.0);

// ===== 萧山机场夜景 =====
const airportGroup = new THREE.Group();

// 1. 黑色地坪
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(3000, 3000),
  new THREE.MeshStandardMaterial({ color: '#010205', roughness: 1.0 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -9;
airportGroup.add(ground);

// 2. 地平线橙黄灯光带（z=-100，确保在视野内可见）
const terminal = new THREE.Mesh(
  new THREE.BoxGeometry(500, 3.5, 3),
  new THREE.MeshBasicMaterial({ color: '#f59e0b' })
);
terminal.position.set(0, -8.8, -100);
airportGroup.add(terminal);

const terminal2 = new THREE.Mesh(
  new THREE.BoxGeometry(440, 1.0, 2),
  new THREE.MeshBasicMaterial({ color: '#fbbf24' })
);
terminal2.position.set(0, -6.8, -100);
airportGroup.add(terminal2);

// 3. 左侧塔台
const towerBody = new THREE.Mesh(
  new THREE.CylinderGeometry(0.7, 1.0, 22, 8),
  new THREE.MeshBasicMaterial({ color: '#1e2d40' })
);
towerBody.position.set(-160, -0.5, -100);
airportGroup.add(towerBody);

const towerTopLight = new THREE.Mesh(
  new THREE.SphereGeometry(1.5, 8, 8),
  new THREE.MeshBasicMaterial({ color: '#fef08a' })
);
towerTopLight.position.set(-160, 11, -100);
airportGroup.add(towerTopLight);

// 4. 散点暖光灯
const ptGeom = new THREE.SphereGeometry(0.35, 6, 6);
const ptMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });
for (let i = 0; i < 60; i++) {
  const pt = new THREE.Mesh(ptGeom, ptMat);
  pt.position.set(
    (Math.random() - 0.5) * 420,
    -8.6,
    -60 - Math.random() * 80
  );
  airportGroup.add(pt);
}

// 5. 跑道绿色导航灯
const greenGeom = new THREE.SphereGeometry(0.25, 6, 6);
const greenMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
for (let z = -10; z >= -100; z -= 28) {
  [-72, 72].forEach((x) => {
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
  scene.fog = new THREE.FogExp2('#020409', 0.0005);

  camera.position.set(-25, -8, 55);
  controls.target.set(0, 22, 0);
  qianyu.root.position.set(4, 22, -5);
  qianyu.root.rotation.set(0.05, -0.25, 0.09);
  qianyu.root.scale.setScalar(1.8);
  ufoGlow.position.set(4, 20, -5);
  rimLight.target.position.set(4, 20, -5);
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
    const floatY = Math.sin(time * 1.4) * 0.9;
    qianyu.root.position.y = 22 + floatY;
    ufoGlow.position.y = 20 + floatY;
    qianyu.root.rotation.z = 0.09 + Math.sin(time * 0.85) * 0.012;
  } else {
    qianyu.root.rotation.y += 0.005;
  }

  qianyu.updateAnimation(delta);
  renderer.render(scene, camera);
}

updateSceneUI('airport');
animate();
