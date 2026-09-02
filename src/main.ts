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
// 极淡远雾，接近黑暗天际
scene.fog = new THREE.FogExp2('#020409', 0.0008);

// ===== 相机：地面仰望夜空 =====
// 复现实拍角度：相机在地面高度(y≈0)，向上仰望悬浮在高空的飞碟
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(-20, 2, 90);   // 地面低位，偏左

// ===== OrbitControls =====
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI * 0.92;  // 允许仰望
controls.minDistance = 3;
controls.maxDistance = 800;
controls.target.set(0, 30, 0);   // 注视目标：高空飞碟位置
controls.update();

// ===== 光照 =====
const ambientLight = new THREE.AmbientLight('#ffffff', 0.5);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight('#b0c8ff', 1.8);
moonLight.position.set(40, 60, 30);
scene.add(moonLight);

// 飞碟自身向下投射的高能蓝白点光源（照亮附近云气）
const ufoGlow = new THREE.PointLight('#38bdf8', 6.0, 80);
ufoGlow.position.set(0, 28, 0);
scene.add(ufoGlow);

// ===== 乾舆飞碟模型 =====
const qianyu = createQianyuModel();
// 悬停高空，对应实拍的夜空高位
qianyu.root.position.set(0, 30, 0);
// 轻微倾斜，模拟实拍的飞行姿态
qianyu.root.rotation.set(0.15, -0.3, 0.18);
scene.add(qianyu.root);
qianyu.setLandingGearProgress(1.0);  // 起落架收起

// ===== 场景：萧山机场极暗夜景（对照实拍原图）=====
// 原图：画面下方仅有远处地平线的一排橙黄灯光，其余全黑
const airportGroup = new THREE.Group();

// 1. 大地黑色地坪
const groundGeom = new THREE.PlaneGeometry(4000, 4000);
const groundMat = new THREE.MeshStandardMaterial({
  color: '#010205',
  roughness: 1.0,
  metalness: 0.0,
});
const ground = new THREE.Mesh(groundGeom, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -8;
airportGroup.add(ground);

// 2. 远景萧山机场航站楼：仅为极暗地平线上的橙黄灯光带（距相机 900m）
// 高度接近地平线，只露出一条细灯光
const terminalLightGeom = new THREE.BoxGeometry(500, 2, 1);
const terminalLightMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });
const terminalLight = new THREE.Mesh(terminalLightGeom, terminalLightMat);
terminalLight.position.set(0, -7, -900);
airportGroup.add(terminalLight);

// 3. 左侧塔台指示灯（实拍图左侧有细高的塔台）
const towerBodyGeom = new THREE.CylinderGeometry(0.8, 1.2, 25, 8);
const towerBodyMat = new THREE.MeshBasicMaterial({ color: '#1e293b' });
const towerBody = new THREE.Mesh(towerBodyGeom, towerBodyMat);
towerBody.position.set(-200, 4.5, -900);
airportGroup.add(towerBody);

const towerLightGeom = new THREE.SphereGeometry(1.5, 8, 8);
const towerLightMat = new THREE.MeshBasicMaterial({ color: '#fbbf24' });
const towerLightMesh = new THREE.Mesh(towerLightGeom, towerLightMat);
towerLightMesh.position.set(-200, 18, -900);
airportGroup.add(towerLightMesh);

// 4. 地平线散点灯（机场周边的分散点光灯，仅在远处地平线区域）
const ptGeom = new THREE.SphereGeometry(0.4, 6, 6);
const ptMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });
for (let i = 0; i < 80; i++) {
  const pt = new THREE.Mesh(ptGeom, ptMat);
  const px = (Math.random() - 0.5) * 600;
  const pz = -800 - Math.random() * 300;
  pt.position.set(px, -7.2, pz);
  airportGroup.add(pt);
}

// 5. 少量跑道边灯（绿色，极暗，靠近地平线）
const greenPtGeom = new THREE.SphereGeometry(0.3, 6, 6);
const greenPtMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
for (let z = -200; z >= -800; z -= 60) {
  const gl = new THREE.Mesh(greenPtGeom, greenPtMat);
  gl.position.set(-90, -7.5, z);
  airportGroup.add(gl);
  const gr = new THREE.Mesh(greenPtGeom, greenPtMat);
  gr.position.set(90, -7.5, z);
  airportGroup.add(gr);
}

scene.add(airportGroup);

// ===== 展台模式辅助网格 =====
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
  scene.fog = new THREE.FogExp2('#020409', 0.0008);

  camera.position.set(-20, 2, 90);
  controls.target.set(0, 30, 0);
  qianyu.root.position.set(0, 30, 0);
  qianyu.root.rotation.set(0.15, -0.3, 0.18);
  qianyu.root.scale.setScalar(1.0);
  ufoGlow.position.set(0, 28, 0);
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

  camera.position.set(18, 10, 25);
  controls.target.set(0, 2, 0);
  qianyu.root.position.set(0, 3, 0);
  qianyu.root.rotation.set(0, 0, 0);
  qianyu.root.scale.setScalar(1.0);
  ufoGlow.position.set(0, 3, 0);
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
  if (mode === 'airport') {
    setAirportView();
  } else {
    setExhibitionView();
  }
  controls.update();
}

const btnSceneToggle = document.getElementById('btn-scene-toggle');
const btnRenderMode = document.getElementById('btn-render-mode');
const btnLandingGear = document.getElementById('btn-landing-gear');
const btnExplode = document.getElementById('btn-explode');
const btnResetView = document.getElementById('btn-reset-view');

btnSceneToggle?.addEventListener('click', () => {
  updateSceneUI(currentSceneMode === 'airport' ? 'exhibition' : 'airport');
});

btnRenderMode?.addEventListener('click', () => {
  isBlueprintMode = !isBlueprintMode;
  qianyu.setRenderMode(isBlueprintMode ? 'blueprint' : 'bronze');
  btnRenderMode.classList.toggle('active', isBlueprintMode);
});

btnLandingGear?.addEventListener('click', () => {
  isLandingGearRetracted = !isLandingGearRetracted;
  qianyu.setLandingGearProgress(isLandingGearRetracted ? 1.0 : 0.0);
  btnLandingGear.classList.toggle('active', isLandingGearRetracted);
});

btnExplode?.addEventListener('click', () => {
  isExploded = !isExploded;
  qianyu.parts.forEach((p) => {
    const target = isExploded
      ? p.originPos.clone().add(p.explodeDir.clone().multiplyScalar(5))
      : p.originPos;
    p.mesh.position.copy(target);
  });
  btnExplode.classList.toggle('active', isExploded);
});

btnResetView?.addEventListener('click', () => {
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
    // 缓慢悬浮漂移
    qianyu.root.position.y = 30 + Math.sin(time * 1.4) * 1.2;
    ufoGlow.position.y = 28 + Math.sin(time * 1.4) * 1.2;
    // 微幅姿态摇晃
    qianyu.root.rotation.z = 0.18 + Math.sin(time * 0.9) * 0.025;
  } else {
    qianyu.root.rotation.y += 0.005;
  }

  qianyu.updateAnimation(delta);
  renderer.render(scene, camera);
}

updateSceneUI('airport');
animate();
