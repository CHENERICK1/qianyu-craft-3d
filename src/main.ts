import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createQianyuModel } from './createQianyuModel';
import { createAirportScene } from './createAirportScene';

// ===== 渲染器 =====
const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#03050a');
scene.fog = new THREE.FogExp2('#03050a', 0.00035);

// ===== 相机：1:1 萧山现场广角长焦仰拍视角 =====
const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 4000);
camera.position.set(0, 0, 180);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI * 0.95;
controls.minDistance = 2;
controls.maxDistance = 800;
controls.target.set(0, 20, -50);
controls.update();

// ===== 光照 =====
const ambientLight = new THREE.AmbientLight('#ffffff', 0.35);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight('#94a3b8', 1.6);
moonLight.position.set(50, 120, 50);
scene.add(moonLight);

// 飞碟自发光光晕
const ufoGlow = new THREE.PointLight('#38bdf8', 4.0, 140);
ufoGlow.position.set(-6, 52, -60);
scene.add(ufoGlow);

// ===== 乾舆飞碟模型 =====
const qianyu = createQianyuModel();
scene.add(qianyu.root);

// ===== 萧山机场高精度地景（含夜空云雾与地表泛光） =====
const airportGroup = createAirportScene();
scene.add(airportGroup);

// ===== 展台辅助网格 =====
const gridHelper = new THREE.GridHelper(40, 20, '#d4af37', '#1e293b');
gridHelper.position.y = -5.5;
gridHelper.visible = false;
scene.add(gridHelper);

// ===== 交互与场景模式 =====
let currentSceneMode: 'airport' | 'exhibition' = 'airport';
let isBlueprintMode = false;
let isLandingGearRetracted = true;
let isExploded = false;

function setAirportView() {
  airportGroup.visible = true;
  gridHelper.visible = false;
  scene.background = new THREE.Color('#03050a');
  scene.fog = new THREE.FogExp2('#03050a', 0.00035);

  // 1. 相机在地面仰拍夜空：
  camera.position.set(0, 0, 180);
  controls.target.set(0, 20, -50);

  // 2. 乾舆神机 1:1 掠天透视姿态（极扁刃形掠射光带）：
  // pitch = 0.32 (视线完全切入碟盘赤道侧边缘，将圆形碟面在镜头中投影为极细长的水平飞掠轨迹)
  // yaw = -0.72 (斜向右上方划过夜空)
  // roll = -0.16 (呈现与 2010 萧山现场完全一致的倾角：左侧回头圆弧、右侧贯穿夜空的等离子主光带与下排步步锦星宿窗光斑)
  qianyu.root.position.set(-2, 54, -60);
  qianyu.root.rotation.set(0.32, -0.72, -0.16);
  qianyu.root.scale.setScalar(5.2);
  ufoGlow.position.set(-2, 50, -60);
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
    const floatY = Math.sin(time * 1.0) * 0.35;
    qianyu.root.position.y = 54 + floatY;
    ufoGlow.position.y = 50 + floatY;
  } else {
    qianyu.root.rotation.y += 0.005;
  }

  qianyu.updateAnimation(delta);
  renderer.render(scene, camera);
}

updateSceneUI('airport');
animate();
