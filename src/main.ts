import * as THREE from 'three';
import { createQianyuModel } from './createQianyuModel';

// ================= 1. 场景、相机与渲染器初始化 =================
const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0d1117');

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(16, 8, 20);

// ================= 2. 光照系统 =================
const ambientLight = new THREE.AmbientLight('#ffffff', 0.6);
scene.add(ambientLight);

// 主聚光灯 (前上方金暖色)
const mainLight = new THREE.DirectionalLight('#fff2d6', 2.2);
mainLight.position.set(12, 18, 14);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 50;
mainLight.shadow.camera.left = -12;
mainLight.shadow.camera.right = 12;
mainLight.shadow.camera.top = 12;
mainLight.shadow.camera.bottom = -12;
scene.add(mainLight);

// 侧向幽蓝轮廓光 (冷暖对比)
const rimLight = new THREE.DirectionalLight('#38bdf8', 1.8);
rimLight.position.set(-15, 6, -15);
scene.add(rimLight);

// 底部发光补光
const bottomLight = new THREE.PointLight('#f59e0b', 2.0, 15);
bottomLight.position.set(0, -3, 0);
scene.add(bottomLight);

// 接触阴影地面
const groundGeom = new THREE.PlaneGeometry(60, 60);
const groundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
const groundMesh = new THREE.Mesh(groundGeom, groundMat);
groundMesh.rotation.x = -Math.PI * 0.5;
groundMesh.position.y = -3.5;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// 辅助网格 (工程底标)
const gridHelper = new THREE.GridHelper(30, 30, '#d4af37', '#1f2937');
gridHelper.position.y = -3.49;
scene.add(gridHelper);

// ================= 3. 加载乾舆 3D 模型 =================
const qianyu = createQianyuModel();
scene.add(qianyu.root);

// ================= 4. 简易鼠标视角旋转 (轻量无额外依赖) =================
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let spherical = { radius: 24, theta: 0.8, phi: 1.1 };

function updateCameraPosition() {
  spherical.phi = Math.max(0.1, Math.min(Math.PI * 0.48, spherical.phi));
  camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
  camera.position.y = spherical.radius * Math.cos(spherical.phi);
  camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
  camera.lookAt(0, 0.5, 0);
}
updateCameraPosition();

window.addEventListener('mousedown', (e) => {
  if ((e.target as HTMLElement).tagName === 'BUTTON') return;
  isDragging = true;
  previousMousePosition = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const deltaX = e.clientX - previousMousePosition.x;
  const deltaY = e.clientY - previousMousePosition.y;

  spherical.theta -= deltaX * 0.006;
  spherical.phi -= deltaY * 0.006;
  updateCameraPosition();

  previousMousePosition = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mouseup', () => { isDragging = false; });

window.addEventListener('wheel', (e) => {
  spherical.radius = Math.max(8, Math.min(45, spherical.radius + e.deltaY * 0.02));
  updateCameraPosition();
});

// ================= 5. 交互控制台状态绑定 =================
let currentRenderMode: 'bronze' | 'blueprint' = 'bronze';
let isGearFolded = false;
let isExploded = false;

const btnRenderMode = document.getElementById('btn-render-mode')!;
const btnLandingGear = document.getElementById('btn-landing-gear')!;
const btnExplode = document.getElementById('btn-explode')!;
const btnResetView = document.getElementById('btn-reset-view')!;

btnRenderMode.addEventListener('click', () => {
  currentRenderMode = (currentRenderMode === 'bronze') ? 'blueprint' : 'bronze';
  qianyu.setRenderMode(currentRenderMode);
  if (currentRenderMode === 'blueprint') {
    scene.background = new THREE.Color('#e8dfcb'); // 仿古宣纸色
    gridHelper.material = new THREE.LineBasicMaterial({ color: '#8c7d6b' });
  } else {
    scene.background = new THREE.Color('#0d1117'); // 深邃玄铁暗色
    gridHelper.material = new THREE.LineBasicMaterial({ color: '#1f2937' });
  }
});

btnLandingGear.addEventListener('click', () => {
  isGearFolded = !isGearFolded;
  btnLandingGear.classList.toggle('active', isGearFolded);
  btnLandingGear.innerText = isGearFolded ? '⚙ 鼎足已收折 (飞行状态)' : '⚙ 鼎足已展开 (着陆状态)';
});

btnExplode.addEventListener('click', () => {
  isExploded = !isExploded;
  btnExplode.classList.toggle('active', isExploded);
});

btnResetView.addEventListener('click', () => {
  spherical = { radius: 24, theta: 0.8, phi: 1.1 };
  updateCameraPosition();
});

// ================= 6. 渲染主循环与平滑补间 =================
const clock = new THREE.Clock();
let currentGearProgress = 0;
let currentExplodeProgress = 0;

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // 1. 起落架收放平滑插值
  const targetGearProgress = isGearFolded ? 1 : 0;
  currentGearProgress += (targetGearProgress - currentGearProgress) * 0.08;
  qianyu.setLandingGearProgress(currentGearProgress);

  // 2. 零件爆炸平滑插值
  const targetExplodeProgress = isExploded ? 1 : 0;
  currentExplodeProgress += (targetExplodeProgress - currentExplodeProgress) * 0.08;
  qianyu.parts.forEach((part) => {
    const offset = part.explodeDir.clone().multiplyScalar(currentExplodeProgress * 3.5);
    part.mesh.position.copy(part.originPos).add(offset);
  });

  // 3. 模型微动与自转
  qianyu.updateAnimation(delta);

  // 4. 自动慢速自转（非拖拽时）
  if (!isDragging && !isExploded) {
    spherical.theta += delta * 0.15;
    updateCameraPosition();
  }

  renderer.render(scene, camera);
}

animate();

// 窗口尺寸自适应
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
